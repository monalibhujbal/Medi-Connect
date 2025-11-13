"use client"

import { useEffect, useState } from "react"
import { PhysicianNav } from "@/components/physician-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Calendar, Users, Clock, TrendingUp, User, Pill, FileText } from "lucide-react"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

interface ScheduleSlot {
  time: string
  booked: boolean
  patientName?: string
  patientId?: string
  prescriptions?: any[]
  medicalHistory?: any[]
  referredByPhysicianName?: string | null
}

export default function PhysicianDashboard() {
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [todayDate, setTodayDate] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [newPrescription, setNewPrescription] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      window.location.href = "/physician/login"
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    verifyPhysician(parsedUser.id)
    const today = new Date().toISOString().split("T")[0]
    setTodayDate(today)
    fetchDashboardData(parsedUser.id, today)

    const handleFocus = () => fetchDashboardData(parsedUser.id, today)
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const verifyPhysician = async (id: string) => {
    try {
      const res = await fetch("/api/physicians", { cache: "no-store" })
      const data = await res.json()
      const current = data.find((p: any) => p.id === id)

      if (!current) {
        alert("Physician account not found. Please contact admin.")
        localStorage.removeItem("user")
        window.location.href = "/physician/login"
        return
      }

      if (!current.verified) {
        alert("Your account is not yet verified by the receptionist.")
        localStorage.removeItem("user")
        window.location.href = "/physician/login"
      }
    } catch (error) {
      console.error("Verification error:", error)
    }
  }

  const fetchDashboardData = async (physicianId: string, date: string) => {
    setLoading(true)
    try {
      // Fetch all appointments for physician
      const aptRes = await fetch(`/api/appointments?physicianId=${physicianId}`, { cache: "no-store" })
      const allAppointments = await aptRes.json()

      const physicianAppointments = allAppointments.filter(
        (apt: any) =>
          apt.physicianId === physicianId &&
          (apt.status === "confirmed" || apt.status === "completed")
      )
      setAppointments(physicianAppointments)

      // Fetch today's schedule
      const schRes = await fetch(
        `/api/physicians/schedule?physicianId=${physicianId}&date=${date}&t=${Date.now()}`,
        { cache: "no-store" }
      )

      if (schRes.status === 404) {
        setScheduleSlots([])
        setLoading(false)
        return
      }

      const schData = await schRes.json()
      const schedule = Array.isArray(schData) ? schData[0] : schData

      // Merge schedule slots with today's booked patients
      const slots = await Promise.all(
        schedule.slots.map(async (slot: any) => {
          const bookedApt = physicianAppointments.find((a) => a.date === date && a.time === slot.time)

          if (bookedApt) {
            // Fetch prescriptions and medical history for each booked patient
            const [presRes, histRes] = await Promise.all([
              fetch(`/api/prescriptions?patientId=${bookedApt.patientId}`, { cache: "no-store" }),
              fetch(`/api/medical-history?patientId=${bookedApt.patientId}`, { cache: "no-store" }),
            ])

            const prescriptions = presRes.ok ? await presRes.json() : []
            const medicalHistory = histRes.ok ? await histRes.json() : []

            return {
              time: slot.time,
              booked: true,
              patientName: bookedApt.patientName,
              patientId: bookedApt.patientId,
              prescriptions,
              medicalHistory,
              referredByPhysicianName: bookedApt.referredByPhysicianName || null,
            }
          } else {
            return {
              time: slot.time,
              booked: false,
            }
          }
        })
      )

      setScheduleSlots(slots)
    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return alert("No patient selected")

    const { medication, dosage, frequency, duration } = newPrescription
    if (!medication || !dosage) {
      alert("Please fill all required fields")
      return
    }

    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          patientName: selectedPatient.patientName,
          medication,
          dosage,
          frequency,
          duration,
          issuedBy: user?.id,
        }),
      })

      if (!res.ok) throw new Error("Failed to add prescription")

      alert("Prescription added successfully")
      setNewPrescription({ medication: "", dosage: "", frequency: "", duration: "" })
      setShowPrescriptionForm(false)
      fetchDashboardData(user.id, todayDate)
    } catch (error) {
      console.error("Add prescription error:", error)
      alert("Error saving prescription.")
    }
  }

  if (!user) return null

  const stats = {
    today: appointments.filter((a) => a.date === todayDate).length,
    total: appointments.length,
    completed: appointments.filter((a) => a.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-background">
      <PhysicianNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10">
            <h1 className="text-4xl font-bold">Welcome back, Dr. {user.name.split(" ")[1]}!</h1>
            <p className="text-lg text-muted-foreground">
              Specialization: {user.specialization || "General Practice"}
            </p>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Today's Appointments</span>
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.today}</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Total Patients</span>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.total}</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Completed</span>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </Card>

            <Link href="/physician/schedule">
              <Card className="p-6 space-y-2 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">View Schedule</span>
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">→</p>
              </Card>
            </Link>
          </div>

          {/* Slot-wise Schedule with Patients */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Today's Schedule</h2>
            {loading ? (
              <Card className="p-6 text-center text-muted-foreground">Loading...</Card>
            ) : scheduleSlots.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No schedule found for today.
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {scheduleSlots.map((slot, idx) => (
                  <Card
                    key={idx}
                    className={`p-6 border-l-4 ${
                      slot.booked ? "border-l-blue-500" : "border-l-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <Clock className="w-5 h-5" />
                        {slot.time}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          slot.booked
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {slot.booked ? "Booked" : "Available"}
                      </span>
                    </div>

                    {slot.booked ? (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            {slot.patientName}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPatient(slot)}
                          >
                            View Details
                          </Button>
                        </div>

                        {/* Show referral info if patient was referred */}
                        {slot.referredByPhysicianName && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs">
                            <p className="text-blue-800 font-semibold">
                              Referred by: {slot.referredByPhysicianName}
                            </p>
                          </div>
                        )}

                        {/* Previous Prescriptions & Add New */}
                        {selectedPatient?.patientId === slot.patientId && (
                          <div className="border-t pt-3 space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Pill className="w-4 h-4 text-primary" /> Prescriptions
                            </h3>
                            {slot.prescriptions?.length ? (
                              slot.prescriptions.map((p, i) => (
                                <p key={i} className="text-sm text-muted-foreground">
                                  • {p.medication} ({p.dosage})
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No previous prescriptions.
                              </p>
                            )}

                            {showPrescriptionForm ? (
                              <form onSubmit={handleAddPrescription} className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Medication"
                                  value={newPrescription.medication}
                                  onChange={(e) =>
                                    setNewPrescription({ ...newPrescription, medication: e.target.value })
                                  }
                                  className="w-full border rounded-md px-2 py-1"
                                />
                                <input
                                  type="text"
                                  placeholder="Dosage"
                                  value={newPrescription.dosage}
                                  onChange={(e) =>
                                    setNewPrescription({ ...newPrescription, dosage: e.target.value })
                                  }
                                  className="w-full border rounded-md px-2 py-1"
                                />
                                <Button type="submit" size="sm" className="w-full">
                                  Save Prescription
                                </Button>
                              </form>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPrescriptionForm(true)}
                              >
                                Add Prescription
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground italic">
                        No patient booked.
                      </p>
                    )}
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
