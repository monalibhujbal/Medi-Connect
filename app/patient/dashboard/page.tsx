"use client"

import { useEffect, useState } from "react"
import { PatientNav } from "@/components/patient-nav"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react"

interface Appointment {
  id: string
  physicianName: string
  date: string
  time: string
  type: string
  status: "confirmed" | "pending" | "completed" | "cancelled" | "rescheduled"
  paymentAmount: number
  followUpDate?: string | null
  refund?: {
    amount: number
    calculatedAt: string
  }
}

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const userData = localStorage.getItem("user")
      const user = userData ? JSON.parse(userData) : null
      if (!user) return

      const res = await fetch(`/api/appointments?patientId=${user.id}&t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      setAppointments(data)
    } catch (error) {
      console.log("[v0] Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const upcomingAppointments = appointments.filter(
    (a) =>
      a.status === "confirmed" ||
      a.status === "pending" ||
      a.status === "rescheduled"
  )

  const completedAppointments = appointments.filter(
    (a) => a.status === "completed"
  )

  // ✅ NEW — Refund appointments
  const refundAppointments = appointments.filter(
    (a: any) => a.status === "cancelled" && a.refund?.amount !== undefined
  )

  return (
    <div className="min-h-screen bg-background">
      <PatientNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Card */}
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Welcome back, {user.name}!</h1>
              <p className="text-lg text-muted-foreground">
                Manage your appointments and follow-ups easily.
              </p>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/patient/book-appointment">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Calendar className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Book Appointment</h3>
                <p className="text-muted-foreground">
                  Schedule a new appointment
                </p>
              </Card>
            </Link>

            <Link href="/patient/appointments">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <Clock className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">My Appointments</h3>
                <p className="text-muted-foreground">
                  {upcomingAppointments.length} upcoming appointments
                </p>
              </Card>
            </Link>

            <Link href="/patient/medical-records">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <AlertCircle className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Medical Records</h3>
                <p className="text-muted-foreground">
                  View EMR and prescriptions
                </p>
              </Card>
            </Link>
          </div>

          {/* Upcoming Appointments */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Upcoming Appointments</h2>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming appointments. Book one now!</p>
                </Card>
              ) : (
                upcomingAppointments.map((apt) => (
                  <Card
                    key={apt.id}
                    className="p-6 flex items-center justify-between"
                  >
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        {apt.physicianName}
                      </h3>
                      <div className="flex gap-4 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {apt.time}
                        </span>
                        <span>{apt.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Completed Appointments */}
          <div className="space-y-4 mt-12">
            <h2 className="text-2xl font-bold">Completed Appointments</h2>
            <div className="space-y-3">
              {completedAppointments.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No completed appointments yet.</p>
                </Card>
              ) : (
                completedAppointments.map((apt) => (
                  <Card
                    key={apt.id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">
                        {apt.physicianName}
                      </h3>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" /> {apt.date}
                        <Clock className="w-4 h-4" /> {apt.time}
                      </div>
                    </div>

                    <div className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {apt.followUpDate
                        ? `Follow-up on ${apt.followUpDate}`
                        : "No follow-up scheduled"}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* ⭐ NEW — Refund History Section */}
          {refundAppointments.length > 0 && (
            <div className="space-y-4 mt-12">
              <h2 className="text-2xl font-bold">Refund History</h2>

              <div className="space-y-4">
                {refundAppointments.map((apt) => (
                  <Card key={apt.id} className="p-6 border-l-4 border-l-green-600 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{apt.physicianName}</h3>
                        <div className="text-sm text-muted-foreground mt-1">
                          <p>Date: {apt.date}</p>
                          <p>Time: {apt.time}</p>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        Refund Processed
                      </span>
                    </div>

                    <div className="mt-4 text-sm space-y-1">
                      <p className="font-medium text-green-700">
                        Refund Amount: ₹{apt.refund?.amount}
                      </p>
                      <p className="text-muted-foreground">
                        Processed On: {apt.refund?.calculatedAt?.split("T")[0]}
                      </p>
                      <p className="text-muted-foreground text-sm italic">
                        Reason: {apt.refund?.amount === 0
                          ? "Cancelled after appointment start"
                          : apt.refund?.amount < apt.paymentAmount
                          ? "Cancelled within 2 hours (50% refund)"
                          : "Cancelled more than 2 hours before (Full refund)"}
                      </p>
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
