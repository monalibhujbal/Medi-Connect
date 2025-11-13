"use client"

import { useEffect, useState } from "react"
import { ReceptionistNav } from "@/components/receptionist-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, CheckCircle, AlertCircle, RotateCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface Appointment {
  id: string
  patientName: string
  patientId: string
  physicianName: string
  physicianId: string
  date: string
  time: string
  type: string
  status: "pending" | "confirmed" | "cancelled"
  paymentStatus: string
}

export default function ReceptionistAppointmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    fetchAppointments()

    const handleFocus = () => {
      fetchAppointments()
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/appointments?t=" + Date.now())
      const allAppointments = await res.json()
      setAppointments(allAppointments)
    } catch (error) {
      console.log("[v0] Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: id,
          action: "confirm",
        }),
      })
      fetchAppointments()
      alert("Appointment confirmed! Notification sent to patient.")
    } catch (error) {
      alert("Error confirming appointment")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: id,
          action: "reject",
        }),
      })
      fetchAppointments()
      alert("Appointment rejected. Patient will receive refund notification.")
    } catch (error) {
      alert("Error rejecting appointment")
    }
  }

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.physicianName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return ""
    }
  }

  if (!user) return null

  const pendingAppointments = filteredAppointments.filter((a) => a.status === "pending")
  const confirmedAppointments = filteredAppointments.filter((a) => a.status === "confirmed")

  return (
    <div className="min-h-screen bg-background">
      <ReceptionistNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold">Appointment Management</h1>
              <Button onClick={fetchAppointments} disabled={loading} className="gap-2 bg-transparent" variant="outline">
                <RotateCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Search by patient or physician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Pending Appointments - Awaiting Confirmation */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Pending Confirmation ({pendingAppointments.length})</h2>
            {pendingAppointments.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending appointments awaiting confirmation</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingAppointments.map((apt) => (
                  <Card key={apt.id} className="p-6 border-l-4 border-l-yellow-500">
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-5 gap-4 items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Patient</p>
                          <p className="font-semibold">{apt.patientName}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Physician</p>
                          <p className="font-semibold">{apt.physicianName}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{apt.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{apt.time}</span>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-semibold">{apt.type}</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm">
                        <p className="text-blue-900">
                          Payment received. Verify physician availability and confirm or reject this appointment.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="gap-2" onClick={() => handleConfirm(apt.id)}>
                          <CheckCircle className="w-4 h-4" />
                          Confirm Booking
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 bg-transparent"
                          onClick={() => handleReject(apt.id)}
                        >
                          <AlertCircle className="w-4 h-4" />
                          Physician Unavailable
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed Appointments */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Confirmed Appointments ({confirmedAppointments.length})</h2>
            {confirmedAppointments.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No confirmed appointments</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {confirmedAppointments.map((apt) => (
                  <Card key={apt.id} className="p-6 border-l-4 border-l-green-500 opacity-75">
                    <div className="grid md:grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Patient</p>
                        <p className="font-semibold">{apt.patientName}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Physician</p>
                        <p className="font-semibold">{apt.physicianName}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{apt.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{apt.time}</span>
                      </div>

                      <div className="flex justify-end">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {apt.status}
                        </span>
                      </div>
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
