import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"

// 🩵 GET — Fetch physician schedules (optionally filtered by date)
// Supports both receptionist and patient views
// For emergency appointments, all slots are shown as available
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const physicianId = searchParams.get("physicianId")
    const date = searchParams.get("date") // optional, for patient selection
    const isEmergency = searchParams.get("emergency") === "true" // Emergency appointment flag

    const db = getDB()
    db.schedules = db.schedules || []
    db.appointments = db.appointments || []

    // Filter by physician
    let schedules = db.schedules
    if (physicianId) {
      schedules = schedules.filter((sch: any) => sch.physicianId === physicianId)
    }
    // Filter by date (if patient requests)
    if (date) {
      schedules = schedules.filter((sch: any) => sch.date === date)
    }

    // If physician has not updated schedule for that date → no slots
    if (schedules.length === 0) {
      return NextResponse.json({ message: "No schedule available" }, { status: 404 })
    }

    // Map schedule → generate time slots & mark booked ones
    const formattedSchedules = schedules.map((schedule: any) => {
      const slots: { time: string; booked: boolean }[] = []
      if (schedule.startTime && schedule.endTime && schedule.slotDuration) {
        const [startH, startM] = schedule.startTime.split(":").map(Number)
        const [endH, endM] = schedule.endTime.split(":").map(Number)
        const totalStart = startH * 60 + startM
        const totalEnd = endH * 60 + endM

        for (let t = totalStart; t < totalEnd; t += schedule.slotDuration) {
          const hour = Math.floor(t / 60)
          const min = t % 60
          const formatted = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`

          // For emergency appointments, show all slots as available
          // Otherwise, check if this slot is already booked
          const isBooked = isEmergency
            ? false
            : db.appointments?.some(
                (apt: any) =>
                  apt.physicianId === schedule.physicianId &&
                  apt.date === schedule.date &&
                  apt.time === formatted &&
                  (apt.status === "pending" || apt.status === "confirmed")
              )

          slots.push({ time: formatted, booked: isBooked })
        }
      }
      return { ...schedule, slots }
    })

    return NextResponse.json(formattedSchedules)
  } catch (error) {
    console.error("GET /schedule error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// 🟢 POST — Create or update a schedule (for any date)
export async function POST(request: NextRequest) {
  try {
    const { physicianId, date, startTime, endTime, slotDuration } = await request.json()

    if (!physicianId || !date || !startTime || !endTime || !slotDuration) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    updateDB((db) => {
      if (!db.schedules) db.schedules = []

      const existing = db.schedules.find(
        (s: any) => s.physicianId === physicianId && s.date === date
      )

      if (existing) {
        existing.startTime = startTime
        existing.endTime = endTime
        existing.slotDuration = slotDuration
        existing.updatedAt = new Date().toISOString()
      } else {
        db.schedules.push({
          id: `sch_${Date.now()}`,
          physicianId,
          date,
          startTime,
          endTime,
          slotDuration,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    })

    return NextResponse.json({ message: "Schedule saved successfully" })
  } catch (error) {
    console.error("POST /schedule error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// 🟢 PUT — Update specific schedule fields (optional)
export async function PUT(request: NextRequest) {
  try {
    const { scheduleId, startTime, endTime, slotDuration } = await request.json()
    if (!scheduleId) {
      return NextResponse.json({ message: "Missing scheduleId" }, { status: 400 })
    }

    updateDB((db) => {
      const schedule = db.schedules.find((s: any) => s.id === scheduleId)
      if (schedule) {
        if (startTime) schedule.startTime = startTime
        if (endTime) schedule.endTime = endTime
        if (slotDuration) schedule.slotDuration = slotDuration
        schedule.updatedAt = new Date().toISOString()
      }
    })

    return NextResponse.json({ message: "Schedule updated successfully" })
  } catch (error) {
    console.error("PUT /schedule error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// 🟢 DELETE — Remove a schedule
export async function DELETE(request: NextRequest) {
  try {
    const { scheduleId } = await request.json()
    if (!scheduleId) {
      return NextResponse.json({ message: "Missing scheduleId" }, { status: 400 })
    }

    updateDB((db) => {
      db.schedules = db.schedules.filter((s: any) => s.id !== scheduleId)
    })

    return NextResponse.json({ message: "Schedule deleted successfully" })
  } catch (error) {
    console.error("DELETE /schedule error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
