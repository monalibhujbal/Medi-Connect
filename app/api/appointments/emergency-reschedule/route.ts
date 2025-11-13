import { type NextRequest, NextResponse } from "next/server"
import { updateDB } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json()

    const db = updateDB((db) => {
      const emergencyAppointment = db.appointments.find((a: any) => a.id === appointmentId)
      if (!emergencyAppointment || emergencyAppointment.type !== "emergency") return

      const otherAppointments = db.appointments.filter(
        (a: any) =>
          a.physicianId === emergencyAppointment.physicianId &&
          a.date === emergencyAppointment.date &&
          a.id !== appointmentId &&
          a.status !== "cancelled",
      )

      // Reschedule all other appointments to next available slots
      otherAppointments.forEach((apt: any) => {
        apt.status = "rescheduled"

        // Create reschedule notification
        db.notifications.push({
          id: `notif_${Date.now()}`,
          userId: apt.patientId,
          message: `Your appointment with ${apt.physicianName} on ${apt.date} at ${apt.time} has been rescheduled due to an emergency booking. Please check available slots and reschedule.`,
          type: "reschedule" as const,
          read: false,
          createdAt: new Date(),
        })
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
