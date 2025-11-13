import { type NextRequest, NextResponse } from "next/server"
import { updateDB } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json()

    const db = updateDB((db) => {
      const appointment = db.appointments.find((a: any) => a.id === appointmentId)
      if (!appointment) return

      const appointmentTime = new Date(`${appointment.date}T${appointment.time}`)
      const currentTime = new Date()
      const hoursUntilAppointment = (appointmentTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)

      let refundAmount = 0
      let refundReason = ""

      if (hoursUntilAppointment >= 2) {
        // Full refund if cancelled 2+ hours before
        refundAmount = appointment.paymentAmount
        refundReason = "Full refund (cancelled 2+ hours before appointment)"
      } else if (hoursUntilAppointment > 0) {
        // 50% refund if cancelled within 2 hours
        refundAmount = appointment.paymentAmount * 0.5
        refundReason = "50% refund (cancelled within 2 hours)"
      } else {
        refundAmount = 0
        refundReason = "No refund (appointment already passed)"
      }

      appointment.status = "cancelled"
      appointment.refundAmount = refundAmount
      appointment.refund = {
        amount: refundAmount,
        calculatedAt: new Date().toISOString(),
      }

      // Update corresponding payment status to "refunded" if refund amount > 0
      if (appointment.paymentId && refundAmount > 0) {
        const payment = db.payments?.find((p: any) => p.id === appointment.paymentId)
        if (payment) {
          payment.status = "refunded"
          payment.refund = {
            amount: refundAmount,
            timestamp: new Date().toISOString(),
            reason: refundReason,
          }
        }
      }

      // Create notification
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: appointment.patientId,
        message: `Your appointment cancelled. ${refundReason}: ₹${refundAmount}`,
        type: "cancellation" as const,
        read: false,
        createdAt: new Date(),
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
