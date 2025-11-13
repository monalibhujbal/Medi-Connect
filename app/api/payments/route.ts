import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"

// =========================================
// GET — Return all payment records
// =========================================
export async function GET(request: NextRequest) {
  try {
    const db = getDB()

    // Also attach appointment details so receptionist dashboard is accurate
    const enriched = db.payments.map((p: any) => {
      const apt = db.appointments.find((a: any) => a.id === p.appointmentId)
      return {
        ...p,
        appointmentStatus: apt?.status || "unknown",
        appointmentDate: apt?.date,
        appointmentTime: apt?.time,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error("GET /payments error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// =========================================
// POST — When patient books a NEW appointment
// =========================================
export async function POST(request: NextRequest) {
  try {
    const {
      appointmentId,
      patientId,
      patientName,
      physicianId,
      physicianName,
      amount,
      paymentMethod
    } = await request.json()

    const db = updateDB((db) => {
      const payment = {
        id: `pay_${Date.now()}`,
        appointmentId,
        patientId,
        patientName,
        physicianId,
        physicianName,
        amount,
        status: "completed",   // Paid successfully
        paymentMethod,
        transactionId: `TXN${Date.now()}`,
        createdAt: new Date(),
        refund: null, // refund info (if processed)
      }

      db.payments.push(payment)

      const appointment = db.appointments.find((a: any) => a.id === appointmentId)
      if (appointment) {
        appointment.paymentStatus = "completed"
        appointment.paymentId = payment.id
      }

      // Notify patient
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: patientId,
        message: `Payment of ₹${amount} received for your appointment with ${physicianName}.`,
        type: "booking",
        read: false,
        createdAt: new Date(),
      })
    })

    const payment = db.payments[db.payments.length - 1]
    return NextResponse.json(payment)
  } catch (error) {
    console.error("POST /payments error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// =====================================================
// PUT — CONFIRM / REJECT / REFUND / RESCHEDULE PAYMENT 
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const { paymentId, appointmentId, action } = await request.json()

    const db = updateDB((db) => {
      const payment = db.payments.find((p: any) => p.id === paymentId)
      const appointment = db.appointments.find((a: any) => a.id === appointmentId)

      if (!appointment) return

      // -----------------------------------------
      // CONFIRM (Receptionist approves appointment)
      // -----------------------------------------
      if (action === "confirm") {
        if (payment) payment.status = "completed"

        appointment.status = "confirmed"

        db.notifications.push({
          id: `notif_${Date.now()}`,
          userId: appointment.patientId,
          message: `Your appointment with ${appointment.physicianName} on ${appointment.date} at ${appointment.time} has been confirmed!`,
          type: "confirmation",
          read: false,
          createdAt: new Date(),
        })
      }

      // -----------------------------------------
      // REJECT PAYMENT (Receptionist manually rejects)
      // -----------------------------------------
      else if (action === "reject") {
        if (payment) payment.status = "failed"

        const refundAmount = appointment.paymentAmount
        appointment.status = "cancelled"

        db.notifications.push({
          id: `notif_${Date.now()}`,
          userId: appointment.patientId,
          message: `Your appointment has been cancelled. Full refund of ₹${refundAmount} will be processed.`,
          type: "refund",
          read: false,
          createdAt: new Date(),
        })
      }

      // -----------------------------------------
      // REFUND (Patient cancels appointment)
      // -----------------------------------------
      else if (action === "refund") {
        const refundAmount = appointment.paymentAmount

        if (payment) {
          payment.status = "refunded"
          payment.refund = {
            amount: refundAmount,
            timestamp: new Date().toISOString(),
            reason: "Cancelled by patient",
          }
        }

        appointment.status = "cancelled"
        appointment.refundAmount = refundAmount

        db.notifications.push({
          id: `notif_${Date.now()}`,
          userId: appointment.patientId,
          message: `Refund of ₹${refundAmount} has been processed for your cancelled appointment.`,
          type: "refund",
          read: false,
          createdAt: new Date(),
        })
      }

      // ------------------------------------------------------
      // SUPPORT RESCHEDULE → receptionist needs to confirm it
      // ------------------------------------------------------
      else if (action === "confirmReschedule") {
        appointment.status = "confirmed"

        db.notifications.push({
          id: `notif_${Date.now()}`,
          userId: appointment.patientId,
          message: `Your rescheduled appointment for ${appointment.date} at ${appointment.time} has been confirmed!`,
          type: "confirmation",
          read: false,
          createdAt: new Date(),
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PUT /payments error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
