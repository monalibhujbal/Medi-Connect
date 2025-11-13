"use client"

import { useEffect, useState } from "react"
import { PhysicianNav } from "@/components/physician-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, User, Save, Eye } from "lucide-react"
import Link from "next/link"

interface TimeSlot {
  time: string
  patientName?: string
  patientId?: string
  status: "available" | "booked" | "completed"
}

export default function PhysicianSchedulePage() {
  const [user, setUser] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [slotDuration, setSlotDuration] = useState(30)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
    }
  }, [])

  useEffect(() => {
    if (user) fetchSchedule()
  }, [selectedDate, user])

  // 🟢 Fetch schedule + booked patients for that date
  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/physicians/schedule?physicianId=${user.id}&date=${selectedDate}&t=${Date.now()}`,
        { cache: "no-store" }
      )

      if (res.status === 404) {
        setSlots([])
        setLoading(false)
        return
      }

      const data = await res.json()
      const schedule = Array.isArray(data) ? data[0] : data

      // Generate slots
      const generatedSlots: TimeSlot[] = []
      if (schedule && schedule.startTime && schedule.endTime && schedule.slotDuration) {
        const [startH, startM] = schedule.startTime.split(":").map(Number)
        const [endH, endM] = schedule.endTime.split(":").map(Number)
        const totalStart = startH * 60 + startM
        const totalEnd = endH * 60 + endM

        for (let t = totalStart; t < totalEnd; t += schedule.slotDuration) {
          const hour = Math.floor(t / 60)
          const min = t % 60
          const formatted = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`

          const bookedSlot = schedule.slots?.find(
            (s: any) => s.time === formatted && s.booked === true
          )

          generatedSlots.push({
            time: formatted,
            status: bookedSlot ? "booked" : "available",
            patientName: bookedSlot?.patientName || "",
            patientId: bookedSlot?.patientId || "",
          })
        }
      }

      // If booked patients exist, fetch their names from appointments DB
      const bookedRes = await fetch(`/api/appointments?t=${Date.now()}`, { cache: "no-store" })
      const allAppointments = await bookedRes.json()
      const todaysAppointments = allAppointments.filter(
        (a: any) => a.physicianId === user.id && a.date === selectedDate
      )

      const mergedSlots = generatedSlots.map((slot) => {
        const match = todaysAppointments.find((apt: any) => apt.time === slot.time)
        if (match) {
          return {
            ...slot,
            status: "booked",
            patientName: match.patientName,
            patientId: match.patientId,
          }
        }
        return slot
      })

      setSlots(mergedSlots)
    } catch (error) {
      console.error("Fetch schedule error:", error)
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  // 🟢 Save new or updated schedule
  const handleSaveSchedule = async () => {
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch("/api/physicians/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          physicianId: user.id,
          date: selectedDate,
          startTime,
          endTime,
          slotDuration: Number(slotDuration),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        alert("Schedule updated successfully.")
        fetchSchedule()
      } else {
        alert(data.message || "Failed to update schedule.")
      }
    } catch (error) {
      console.error("Save schedule error:", error)
      alert("Error updating schedule.")
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "available":
        return "bg-gray-100 text-gray-800"
      default:
        return ""
    }
  }

  if (!user || loading) return null

  return (
    <div className="min-h-screen bg-background">
      <PhysicianNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <h1 className="text-4xl font-bold">My Schedule</h1>

          {/* 🕒 Schedule Update Form */}
          <Card className="p-6 space-y-4 bg-accent/5 border-accent">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Update or Add Schedule
            </h2>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Slot Duration (minutes)</label>
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveSchedule}
              disabled={saving}
              className="mt-4 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Schedule"}
            </Button>
          </Card>

          {/* 🩺 Daily Slots with Booked Patients */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Daily Slots - {selectedDate}</h2>
            {slots.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No schedule available for this day.
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {slots.map((slot, idx) => (
                  <Card
                    key={idx}
                    className={`p-6 border-l-4 ${
                      slot.status === "booked"
                        ? "border-l-blue-500"
                        : slot.status === "completed"
                        ? "border-l-green-500"
                        : "border-l-gray-300"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <Clock className="w-5 h-5" />
                          {slot.time}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            slot.status
                          )}`}
                        >
                          {slot.status}
                        </span>
                      </div>

                      {slot.patientName ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            {slot.patientName}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/physician/patient-details/${slot.patientId}`}>
                              <Eye className="w-4 h-4 mr-1" /> View
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No patient booked.
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
