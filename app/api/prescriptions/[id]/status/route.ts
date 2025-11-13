// app/api/prescriptions/[id]/status/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"
import { getUserFromRequest, hasRole } from "@/lib/auth"
import { createPharmacyOrder } from "@/lib/pharmacy-integration"

// PUT /api/prescriptions/:id/status — Update prescription status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id

    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only pharmacist can update prescription status
    if (!hasRole(user, ["pharmacist"])) {
      return NextResponse.json({ message: "Forbidden: Only pharmacists can update prescription status" }, { status: 403 })
    }

    const payload = await request.json()
    const { status, notes, pharmacyId } = payload

    if (!status) {
      return NextResponse.json({ message: "Missing required field: status" }, { status: 400 })
    }

    const validStatuses = ["pending", "available", "unavailable", "forwarded", "dispensed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 })
    }

    const db = getDB()
    db.prescriptions = db.prescriptions || []
    db.patients = db.patients || []
    db.pharmacies = db.pharmacies || []
    db.pharmacyOrders = db.pharmacyOrders || []

    const prescription = db.prescriptions.find((p: any) => p.id === prescriptionId)
    if (!prescription) {
      return NextResponse.json({ message: "Prescription not found" }, { status: 404 })
    }

    const patient = db.patients.find((p: any) => p.id === prescription.patientId)

    // Update prescription with new status
    let pharmacyOrderId: string | null = null
    let orderEta: string | null = null

    // If forwarding to pharmacy, create order
    if (status === "forwarded") {
      if (!pharmacyId) {
        return NextResponse.json({ message: "pharmacyId required when forwarding" }, { status: 400 })
      }

      const pharmacy = db.pharmacies.find((p: any) => p.id === pharmacyId)
      if (!pharmacy) {
        return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 })
      }

      // Create pharmacy order
      try {
        const orderResponse = await createPharmacyOrder({
          prescriptionId,
          pharmacyId,
          patient: {
            name: patient?.name || prescription.patientName || "Unknown",
            address: patient?.address || "Address not provided",
            phone: patient?.phone || "Phone not provided",
          },
          items: [
            {
              name: prescription.medication,
              quantity: parseInt(prescription.dosage) || 1,
            },
          ],
        })

        pharmacyOrderId = orderResponse.orderId
        orderEta = orderResponse.eta

        // Store pharmacy order in DB
        updateDB((db) => {
          db.pharmacyOrders = db.pharmacyOrders || []
          db.pharmacyOrders.push({
            id: orderResponse.orderId,
            prescriptionId,
            pharmacyId,
            status: orderResponse.status,
            eta: orderResponse.eta,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        })
      } catch (error: any) {
        console.error("Pharmacy order creation failed:", error)
        return NextResponse.json(
          { message: `Failed to create pharmacy order: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Update prescription
    updateDB((db) => {
      const presc = db.prescriptions.find((p: any) => p.id === prescriptionId)
      if (presc) {
        presc.status = status
        presc.pharmacistId = user.id
        presc.availabilityNotes = notes || null
        presc.pharmacyOrderId = pharmacyOrderId || presc.pharmacyOrderId || null
        presc.updatedAt = new Date().toISOString()

        // Initialize audit array if not present
        if (!presc.audit) {
          presc.audit = []
        }

        // Add audit entry
        presc.audit.push({
          by: user.id,
          at: new Date().toISOString(),
          action: `Status changed to ${status}`,
          notes: notes || undefined,
        })
      }
    })

    // Create notification for patient
    const updatedPrescription = getDB().prescriptions.find((p: any) => p.id === prescriptionId)
    let notificationMessage = ""

    if (status === "available") {
      // Calculate delivery date (24 hours from now)
      const deliveryDate = new Date()
      deliveryDate.setHours(deliveryDate.getHours() + 24)
      
      // Update prescription with delivery date
      updateDB((db) => {
        const presc = db.prescriptions.find((p: any) => p.id === prescriptionId)
        if (presc) {
          presc.deliveryDate = deliveryDate.toISOString()
        }
      })

      notificationMessage = `Your prescription for ${prescription.medication} is now available! Expected delivery: ${deliveryDate.toLocaleDateString()}. You can now place your order.`
    } else if (status === "unavailable") {
      notificationMessage = `Your prescription for ${prescription.medication} is currently unavailable. ${notes || "Please contact the pharmacy for more information."}`
    } else if (status === "forwarded") {
      const etaDate = orderEta ? new Date(orderEta).toLocaleString() : "within 24 hours"
      notificationMessage = `Your prescription for ${prescription.medication} is being prepared for home delivery. Delivery ETA: ${etaDate}.`
    } else if (status === "dispensed") {
      notificationMessage = `Your prescription for ${prescription.medication} has been dispensed.`
    }

    if (notificationMessage) {
      updateDB((db) => {
        db.notifications = db.notifications || []
        db.notifications.push({
          id: `notif_${Date.now()}`,
          userId: prescription.patientId,
          message: notificationMessage,
          type: status === "forwarded" ? "pharmacy" : "prescription",
          read: false,
          createdAt: new Date(),
        })
      })
    }

    return NextResponse.json({
      ...updatedPrescription,
      orderEta: orderEta || undefined,
    })
  } catch (error) {
    console.error("PUT /prescriptions/:id/status error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

