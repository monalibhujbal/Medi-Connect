"use client"

import { useEffect, useState } from "react"
import { PatientNav } from "@/components/patient-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Trash2, RotateCw, AlertCircle, Hourglass, UserPlus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Appointment {
  id: string
  physicianName: string
  date: string
  time: string
  type: string
  status: "confirmed" | "pending" | "completed" | "cancelled" | "rescheduled"
  notes?: string
  paymentAmount: number
  createdAt?: string

  // Refund structure
  refund?: {
    amount: number
    currency?: string
    calculatedAt?: string
    policy?: string
  }

  // NEW → Required to detect reschedule confirmation pending
  reschedulePending?: boolean
  // Referral information
  referredToPhysicianId?: string
  referredByPhysicianName?: string
  referredAt?: string
}

export default function AppointmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))

    fetchAppointments()

    const navigationTrigger = sessionStorage.getItem("fromBooking")
    if (navigationTrigger === "true") {
      fetchAppointments()
      sessionStorage.removeItem("fromBooking")
    }

    const handleFocus = () => fetchAppointments()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const userData = localStorage.getItem("user")
      const user = userData ? JSON.parse(userData) : null
      if (!user) return

      const res = await fetch(
        `/api/appointments?patientId=${user.id}&_=${Date.now()}`,
        { cache: "no-store" }
      )

      const allAppointments: Appointment[] = await res.json()

      // Sort by newest first
      const sorted = allAppointments.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setAppointments(sorted)
    } catch (error) {
      console.error("[Fetch error]:", error)
    } finally {
      setLoading(false)
    }
  }

  // CANCEL LOGIC
  const handleCancelAppointment = async (id: string) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this appointment?\n\nRefund Policy:\n• Full refund if cancelled 2+ hours before.\n• 50% refund if within 2 hours."
    )

    if (!confirmCancel) return

    try {
      const res = await fetch("/api/appointments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: id,
          requestedBy: "patient",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Error cancelling appointment")
        return
      }

      alert(`Appointment cancelled.\nRefund: ₹${data.refund}`)
      fetchAppointments()
    } catch (error) {
      alert("Could not cancel the appointment. Try again.")
    }
  }

  if (!user) return null

  // STATUS COLORS
  const getStatusColor = (status: string, reschedulePending = false) => {
    if (reschedulePending) return "bg-yellow-100 text-yellow-800"

    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rescheduled":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return ""
    }
  }

  const upcomingAppointments = appointments.filter(
    (a) =>
      a.status === "confirmed" ||
      a.status === "pending" ||
      a.status === "rescheduled"
  )

  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  )

  return (
    <div className="min-h-screen bg-background">
      <PatientNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold">My Appointments</h1>

              <Button
                onClick={fetchAppointments}
                disabled={loading}
                className="gap-2 bg-transparent"
                variant="outline"
              >
                <RotateCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <Link href="/patient/book-appointment">
              <Button>Book New Appointment</Button>
            </Link>
          </div>

          {/* UPCOMING */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              Upcoming Appointments ({upcomingAppointments.length})
            </h2>

            {upcomingAppointments.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming appointments</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <Card key={apt.id} className="p-6 border-l-4 border-l-primary">
                    <div className="space-y-4">
                      {/* TOP */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {apt.physicianName}
                          </h3>

                          {/* NEW → Show pending message */}
                          {apt.status === "rescheduled" && apt.reschedulePending && (
                            <p className="text-yellow-700 flex items-center gap-1 text-sm mt-1">
                              <Hourglass className="w-4 h-4" />
                              Awaiting receptionist confirmation
                            </p>
                          )}

                          <p className="text-muted-foreground">{apt.type}</p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium 
                            ${getStatusColor(apt.status, apt.reschedulePending)}`}
                        >
                          {apt.reschedulePending
                            ? "Pending Confirmation"
                            : apt.status}
                        </span>
                      </div>

                      {/* DETAILS */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span>{apt.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          <span>{apt.time}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-primary" />
                          <span>₹{apt.paymentAmount}</span>
                        </div>
                      </div>

                      {/* Referral Notice */}
                      {apt.status === "completed" && apt.referredToPhysicianId && apt.referredByPhysicianName && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                          <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Referred by {apt.referredByPhysicianName}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            You have been referred to another physician. Book an appointment to continue your treatment.
                          </p>
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              router.push(
                                `/patient/book-appointment?referred=${apt.referredToPhysicianId}`
                              )
                            }
                          >
                            Book Appointment with Referred Physician
                          </Button>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex gap-2">
                        {/* RESCHEDULE BUTTON */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/patient/book-appointment?reschedule=${apt.id}`
                            )
                          }
                        >
                          Reschedule
                        </Button>

                        {/* CANCEL visible ALWAYS for pending/confirmed/rescheduled */}
                        {(apt.status === "pending" ||
                          apt.status === "confirmed" ||
                          apt.status === "rescheduled") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleCancelAppointment(apt.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancel & Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* PAST */}
          {pastAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Past Appointments ({pastAppointments.length})
              </h2>

              <div className="space-y-4">
                {pastAppointments.map((apt) => (
                  <Card key={apt.id} className="p-6 opacity-75">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{apt.physicianName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {apt.date} at {apt.time}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {apt.refund && (
                            <span className="text-sm font-medium text-green-600">
                              {apt.refund.amount > 0
                                ? `Refund: ₹${apt.refund.amount}`
                                : "Refund: Initiated"}
                            </span>
                          )}

                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              apt.status
                            )}`}
                          >
                            {apt.status}
                          </span>
                        </div>
                      </div>

                      {/* Referral Notice in Past Appointments */}
                      {apt.status === "completed" && apt.referredToPhysicianId && apt.referredByPhysicianName && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Referred by {apt.referredByPhysicianName}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            You were referred to another physician. Book an appointment to continue your treatment.
                          </p>
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              router.push(
                                `/patient/book-appointment?referred=${apt.referredToPhysicianId}`
                              )
                            }
                          >
                            Book Appointment with Referred Physician
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
