// app/api/payments/medicine/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"
import { getUserFromRequest, hasRole } from "@/lib/auth"

// POST /api/payments/medicine — Process payment for medicine order
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only patients can pay for medicines
    if (!hasRole(user, ["patient"])) {
      return NextResponse.json({ message: "Forbidden: Only patients can order medicines" }, { status: 403 })
    }

    const payload = await request.json()
    const { prescriptionId, amount, paymentMethod, pharmacyOrderId } = payload

    if (!prescriptionId || !amount || !paymentMethod) {
      return NextResponse.json(
        { message: "Missing required fields: prescriptionId, amount, paymentMethod" },
        { status: 400 }
      )
    }

    const db = getDB()
    db.prescriptions = db.prescriptions || []
    db.payments = db.payments || []

    const prescription = db.prescriptions.find((p: any) => p.id === prescriptionId)
    if (!prescription) {
      return NextResponse.json({ message: "Prescription not found" }, { status: 404 })
    }

    // Verify prescription belongs to patient
    if (prescription.patientId !== user.id) {
      return NextResponse.json({ message: "Forbidden: Prescription does not belong to you" }, { status: 403 })
    }

    // Create payment record
    const payment = {
      id: `pay_med_${Date.now()}`,
      prescriptionId,
      pharmacyOrderId: pharmacyOrderId || null,
      patientId: user.id,
      patientName: user.name,
      amount: parseFloat(amount),
      status: "completed",
      paymentMethod,
      transactionId: `TXN_MED_${Date.now()}`,
      type: "medicine",
      createdAt: new Date().toISOString(),
    }

    updateDB((db) => {
      db.payments.push(payment)

      // Update prescription status to "ordered" or "paid"
      const presc = db.prescriptions.find((p: any) => p.id === prescriptionId)
      if (presc) {
        presc.paymentId = payment.id
        presc.paymentStatus = "completed"
        presc.status = presc.status === "available" ? "ordered" : presc.status
        presc.orderedAt = new Date().toISOString()
        presc.updatedAt = new Date().toISOString()

        // Add audit entry
        if (!presc.audit) {
          presc.audit = []
        }
        presc.audit.push({
          by: user.id,
          at: new Date().toISOString(),
          action: "Payment completed",
          notes: `Payment of ₹${amount} via ${paymentMethod}`,
        })
      }

      // Notify patient
      db.notifications = db.notifications || []
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: user.id,
        message: `Payment of ₹${amount} received for your medicine order. Your order will be delivered soon.`,
        type: "pharmacy",
        read: false,
        createdAt: new Date(),
      })
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("POST /payments/medicine error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// GET /api/payments/medicine — Get medicine payments for patient
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId") || user.id

    // Patients can only view their own payments
    if (patientId !== user.id && !hasRole(user, ["receptionist", "pharmacist"])) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const db = getDB()
    db.payments = db.payments || []

    const medicinePayments = db.payments.filter(
      (p: any) => p.type === "medicine" && p.patientId === patientId
    )

    return NextResponse.json(medicinePayments)
  } catch (error) {
    console.error("GET /payments/medicine error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

