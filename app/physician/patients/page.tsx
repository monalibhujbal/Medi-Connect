"use client"

import { useEffect, useState } from "react"
import { PhysicianNav } from "@/components/physician-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock, User, Calendar, FileText, CheckCircle, UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed"
  followUpDate?: string | null
}

export default function PhysicianPatientsPage() {
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0])
  const [followUpDates, setFollowUpDates] = useState<{ [key: string]: string }>({})
  const [physicians, setPhysicians] = useState<any[]>([])
  const [showReferDialog, setShowReferDialog] = useState<string | null>(null)
  const [selectedReferPhysician, setSelectedReferPhysician] = useState<string>("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      window.location.href = "/physician/login"
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchAppointments(parsedUser.id, selectedDate)
    fetchPhysicians(parsedUser.id) // Fetch all physicians except current one
  }, [selectedDate])

  const fetchAppointments = async (physicianId: string, date: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/appointments?physicianId=${physicianId}&t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()

      const todayAppointments = data.filter(
        (apt: any) =>
          apt.physicianId === physicianId &&
          apt.date === date &&
          (apt.status === "confirmed" || apt.status === "completed")
      )

      setAppointments(todayAppointments)
    } catch (error) {
      console.error("Error fetching patients:", error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPhysicians = async (currentPhysicianId: string) => {
    try {
      const res = await fetch("/api/physicians?verified=true", { cache: "no-store" })
      const data = await res.json()
      // Filter out current physician
      const otherPhysicians = data.filter((p: any) => p.id !== currentPhysicianId && p.verified)
      setPhysicians(otherPhysicians)
    } catch (error) {
      console.error("Error fetching physicians:", error)
    }
  }

  const handleMarkCompleted = async (appointmentId: string, referredToPhysicianId?: string) => {
    const followUpDate = followUpDates[appointmentId] || null
    try {
      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          status: "completed",
          followUpDate,
          referredToPhysicianId: referredToPhysicianId || null,
          referredByPhysicianId: referredToPhysicianId ? user.id : null,
          referredByPhysicianName: referredToPhysicianId ? user.name : null,
        }),
      })

      if (res.ok) {
        alert(referredToPhysicianId ? "✅ Appointment marked as completed and patient referred!" : "✅ Appointment marked as completed!")
        setShowReferDialog(null)
        setSelectedReferPhysician("")
        fetchAppointments(user.id, selectedDate)
      } else {
        alert("Failed to update appointment.")
      }
    } catch (error) {
      console.error("Error updating appointment:", error)
      alert("Server error.")
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <PhysicianNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">My Patients</h1>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          {loading ? (
            <Card className="p-6 text-center text-muted-foreground">Loading...</Card>
          ) : appointments.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No patients found for the selected date.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {appointments.map((apt) => (
                <Card key={apt.id} className="p-6 border-l-4 border-l-primary space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <User className="w-5 h-5" />
                      {apt.patientName}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        apt.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" /> {apt.time}
                    <Calendar className="w-4 h-4" /> {apt.date}
                  </div>

                  {/* ✅ Follow-up Date Input */}
                  {apt.status !== "completed" && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-muted-foreground">
                        Follow-up Date (optional):
                      </label>
                      <input
                        type="date"
                        value={followUpDates[apt.id] || ""}
                        onChange={(e) =>
                          setFollowUpDates((prev) => ({
                            ...prev,
                            [apt.id]: e.target.value,
                          }))
                        }
                        className="px-3 py-2 mt-1 border border-input rounded-md w-full bg-background"
                      />
                    </div>
                  )}

                  <div className="mt-4 flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/physician/patient-details/${apt.patientId}`}>
                        <FileText className="w-4 h-4 mr-1" />
                        View Records
                      </Link>
                    </Button>

                    {apt.status !== "completed" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkCompleted(apt.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Completed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowReferDialog(apt.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Refer
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-green-700 italic">
                        Follow-up:{" "}
                        {apt.followUpDate ? apt.followUpDate : "No follow-up set"}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Refer Dialog */}
      <Dialog open={showReferDialog !== null} onOpenChange={(open) => !open && setShowReferDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refer Patient to Another Physician</DialogTitle>
            <DialogDescription>
              Select a physician to refer this patient to. The patient will be notified and can book an appointment with the referred physician.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Physician</label>
              <select
                value={selectedReferPhysician}
                onChange={(e) => setSelectedReferPhysician(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-input rounded-md bg-background"
              >
                <option value="">-- Select Physician --</option>
                {physicians.map((physician) => (
                  <option key={physician.id} value={physician.id}>
                    {physician.name} - {physician.specialization || "General"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReferDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedReferPhysician && showReferDialog) {
                    handleMarkCompleted(showReferDialog, selectedReferPhysician)
                  } else {
                    alert("Please select a physician to refer to")
                  }
                }}
                disabled={!selectedReferPhysician}
              >
                Mark Completed & Refer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
