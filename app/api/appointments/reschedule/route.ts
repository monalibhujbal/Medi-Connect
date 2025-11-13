import { NextRequest, NextResponse } from "next/server";
import { getDB, updateDB } from "@/lib/db";

// Helper: same as main appointments route
function parseDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;

  const [hoursStr, minutesStr] = timeStr.split(":");
  const [y, m, d] = dateStr.split("-").map(Number);

  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d, Number(hoursStr), Number(minutesStr), 0, 0);
}

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, newDate, newTime } = await request.json();

    if (!appointmentId || !newDate || !newTime) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDB();
    db.appointments ||= [];

    // 1️⃣ Fetch Old Appointment
    const oldApt = db.appointments.find((a: any) => a.id === appointmentId);
    if (!oldApt) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }

    const patientId = oldApt.patientId;
    const physicianId = oldApt.physicianId;

    // 2️⃣ Prevent conflict for physician
    const physicianConflict = db.appointments.find(
      (a: any) =>
        a.physicianId === physicianId &&
        a.date === newDate &&
        a.time === newTime &&
        (a.status === "pending" || a.status === "confirmed")
    );

    if (physicianConflict) {
      return NextResponse.json(
        { message: "This slot is already booked for this physician." },
        { status: 409 }
      );
    }

    // 3️⃣ Prevent patient's overlapping booking
    const requestedDt = parseDateTime(newDate, newTime);
    const bufferMinutes = 30;

    const overlapping = db.appointments.find((a: any) => {
      if (a.patientId !== patientId) return false;
      if (a.id === appointmentId) return false;
      if (a.status !== "pending" && a.status !== "confirmed") return false;
      if (a.date !== newDate) return false;

      const existingDt = parseDateTime(a.date, a.time);
      const diff = Math.abs(
        (existingDt.getTime() - requestedDt.getTime()) / (1000 * 60)
      );

      return diff < bufferMinutes;
    });

    if (overlapping) {
      return NextResponse.json(
        { message: "You already have an appointment overlapping this time." },
        { status: 409 }
      );
    }

    // 4️⃣ UPDATE OLD APPOINTMENT → rescheduled
    updateDB((db) => {
      const apt = db.appointments.find((a: any) => a.id === appointmentId);
      if (apt) {
        apt.status = "rescheduled";
        apt.updatedAt = new Date().toISOString();
      }
    });

    // 5️⃣ CREATE NEW APPOINTMENT → PENDING (requires receptionist confirmation)
    const newAppointment = {
      id: `apt_${Date.now()}`,
      patientId: oldApt.patientId,
      patientName: oldApt.patientName,
      physicianId: oldApt.physicianId,
      physicianName: oldApt.physicianName,
      date: newDate,
      time: newTime,
      type: oldApt.type,
      status: "pending",              // ⬅ key update
      paymentAmount: oldApt.paymentAmount,
      paymentStatus: "completed",
      rescheduleRequested: true,      // ⬅ mark as rescheduled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateDB((db) => {
      db.appointments.push(newAppointment);

      // Notification to patient
      db.notifications.push({
        id: `notif_${Date.now()}`,
        userId: patientId,
        message: `Your appointment has been rescheduled to ${newDate} at ${newTime}. Waiting for receptionist confirmation.`,
        type: "reschedule",
        read: false,
        createdAt: new Date(),
      });

      // Notification to receptionist
      db.notifications.push({
        id: `notif_${Date.now() + 2}`,
        userId: "reception",
        message: `A new rescheduled appointment requires confirmation for Dr. ${oldApt.physicianName}.`,
        type: "reschedule",
        read: false,
        createdAt: new Date(),
      });
    });

    return NextResponse.json({
      message: "Reschedule request submitted. Awaiting confirmation.",
      newAppointmentId: newAppointment.id,
    });
  } catch (error) {
    console.error("RESCHEDULE ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
