// app/api/pharmacy/webhook/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"

// POST /api/pharmacy/webhook — Receive updates from partner pharmacy
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { orderId, status, message } = payload

    if (!orderId || !status) {
      return NextResponse.json({ message: "Missing required fields: orderId, status" }, { status: 400 })
    }

    const validStatuses = ["created", "dispatched", "delivered", "failed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 })
    }

    const db = getDB()
    db.pharmacyOrders = db.pharmacyOrders || []
    db.prescriptions = db.prescriptions || []

    // Find order
    const order = db.pharmacyOrders.find((o: any) => o.id === orderId)
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Update order status
    updateDB((db) => {
      const ord = db.pharmacyOrders.find((o: any) => o.id === orderId)
      if (ord) {
        ord.status = status
        ord.updatedAt = new Date().toISOString()
        if (message) {
          ord.message = message
        }
      }

      // Update prescription if order is dispatched or delivered
      if (status === "dispatched" || status === "delivered") {
        const prescription = db.prescriptions.find((p: any) => p.id === ord.prescriptionId)
        if (prescription) {
          if (status === "dispatched") {
            prescription.status = "forwarded" // Keep as forwarded, but order is dispatched
          } else if (status === "delivered") {
            prescription.status = "dispensed"
          }

          // Add audit entry
          if (!prescription.audit) {
            prescription.audit = []
          }
          prescription.audit.push({
            by: "system",
            at: new Date().toISOString(),
            action: `Order ${status}`,
            notes: message || undefined,
          })

          // Notify patient
          db.notifications = db.notifications || []
          let notificationMessage = ""
          if (status === "dispatched") {
            notificationMessage = `Your prescription order (${orderId}) has been dispatched and is on its way.`
          } else if (status === "delivered") {
            notificationMessage = `Your prescription order (${orderId}) has been delivered.`
          }

          if (notificationMessage) {
            db.notifications.push({
              id: `notif_${Date.now()}`,
              userId: prescription.patientId,
              message: notificationMessage,
              type: "pharmacy",
              read: false,
              createdAt: new Date(),
            })
          }
        }
      }
    })

    return NextResponse.json({ message: "Webhook processed successfully" })
  } catch (error) {
    console.error("POST /pharmacy/webhook error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

