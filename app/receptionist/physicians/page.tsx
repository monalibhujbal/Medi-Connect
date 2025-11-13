"use client"

import { useEffect, useState } from "react"
import { ReceptionistNav } from "@/components/receptionist-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Stethoscope, Clock, Users, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getClassificationShortLabel, getClassificationColor } from "@/lib/physician-utils"

interface Physician {
  id: string
  name: string
  specialization: string
  classification?: "general" | "specialist" | "consultant" | "senior_consultant" | "super_specialist"
  licenseNumber?: string
  verified?: boolean
}

interface TimeSlot {
  date: string
  physician: {
    id: string
    name: string
    specialization: string
    licenseNumber: string
  }
  timeSlots: string[]
  startTime?: string
  endTime?: string
  slotDuration?: number
  updatedAt?: string // ✅ for "Last updated" tracking
}

export default function PhysiciansPage() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedPhysician, setExpandedPhysician] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<Record<string, TimeSlot | null>>({})
  const [loadingSchedule, setLoadingSchedule] = useState<Record<string, boolean>>({})
  const [physicians, setPhysicians] = useState<Physician[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Load user, physicians & appointments
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))
    fetchAllPhysicians()
    fetchAllAppointments()

    const onFocus = () => {
      fetchAllPhysicians()
      fetchAllAppointments()
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  const fetchAllPhysicians = async () => {
    try {
      const res = await fetch("/api/physicians", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch physicians")
      const data = await res.json()
      setPhysicians(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[Receptionist] fetch physicians:", error)
    }
  }

  const fetchAllAppointments = async () => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/appointments?t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[Receptionist] fetch appointments:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const filteredPhysicians = physicians.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.specialization || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.classification && getClassificationShortLabel(doc.classification).toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const computeStats = (physicianId: string) => {
    const physApts = appointments.filter((a: any) => a.physicianId === physicianId)
    const uniquePatients = Array.from(new Set(physApts.map((a: any) => a.patientId))).length
    const today = new Date().toISOString().split("T")[0]
    const todayAppointments = physApts.filter(
      (a: any) =>
        a.date === today && (a.status === "confirmed" || a.status === "pending")
    ).length
    return { totalPatients: uniquePatients, todayAppointments }
  }

  // ✅ FIXED URL: now correctly points to plural /api/physicians/schedule
  const handleViewSchedule = async (physicianId: string) => {
    if (expandedPhysician === physicianId) {
      setExpandedPhysician(null)
      return
    }

    setExpandedPhysician(physicianId)
    setLoadingSchedule((prev) => ({ ...prev, [physicianId]: true }))

    try {
      const response = await fetch(
        `/api/physicians/schedule?physicianId=${physicianId}&t=${Date.now()}`,
        { cache: "no-store" }
      )
      if (!response.ok) throw new Error("Failed to fetch updated schedule")

      const data = await response.json()
      let latestSchedule = null

      if (Array.isArray(data) && data.length > 0) {
        latestSchedule = data.sort(
          (a, b) =>
            new Date(b.updatedAt || b.date).getTime() -
            new Date(a.updatedAt || a.date).getTime()
        )[0]
      } else if (data && data.date) {
        latestSchedule = data
      }

      // ✅ Generate slots if not present
      if (latestSchedule && !latestSchedule.timeSlots) {
        const slots: string[] = []
        const [startH, startM] = latestSchedule.startTime.split(":").map(Number)
        const [endH, endM] = latestSchedule.endTime.split(":").map(Number)
        const start = startH * 60 + startM
        const end = endH * 60 + endM
        for (let t = start; t < end; t += latestSchedule.slotDuration) {
          const hour = Math.floor(t / 60)
          const min = t % 60
          slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`)
        }
        latestSchedule.timeSlots = slots
      }

      setSchedules((prev) => ({ ...prev, [physicianId]: latestSchedule }))
    } catch (error) {
      console.error("[Receptionist] Error fetching physician schedule:", error)
      setSchedules((prev) => ({ ...prev, [physicianId]: null }))
    } finally {
      setLoadingSchedule((prev) => ({ ...prev, [physicianId]: false }))
    }
  }

  const handleVerifyPhysician = async (physicianId: string) => {
    try {
      const res = await fetch("/api/physicians", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ physicianId, verified: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.message || "Failed to verify physician")
        return
      }
      alert("Physician verified successfully")
      fetchAllPhysicians()
    } catch (error) {
      console.error("verify error:", error)
      alert("Error verifying physician")
    }
  }

  const handleRejectPhysician = async (physicianId: string) => {
    if (!confirm("Are you sure you want to reject this physician?")) return
    try {
      await fetch("/api/physicians", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ physicianId, verified: false }),
      })
      setPhysicians((prev) => prev.filter((p) => p.id !== physicianId))
      alert("Physician rejected and removed.")
    } catch (error) {
      console.error("reject error:", error)
      alert("Error rejecting physician")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-gray-100 text-gray-800"
      default:
        return ""
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <ReceptionistNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold flex items-center gap-2">
              <Stethoscope className="w-8 h-8" />
              Physician Management
            </h1>

            <div className="flex gap-4 items-center">
              <Input
                type="text"
                placeholder="Search by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <Button
                variant="outline"
                onClick={() => {
                  fetchAllPhysicians()
                  fetchAllAppointments()
                }}
                disabled={refreshing}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredPhysicians.map((physician) => {
              const stats = computeStats(physician.id)
              const schedule = schedules[physician.id]
              return (
                <div key={physician.id} className="space-y-4">
                  <Card className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold">{physician.name}</h3>
                          {physician.classification && (
                            <Badge className={`text-xs ${getClassificationColor(physician.classification)}`}>
                              {getClassificationShortLabel(physician.classification)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{physician.specialization || "No specialization"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          License: {physician.licenseNumber || "N/A"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            physician.verified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {physician.verified ? "Verified" : "Pending Verification"}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor("available")}`}
                        >
                          available
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Total Patients
                        </p>
                        <p className="text-2xl font-bold">{stats.totalPatients}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Today's Appointments
                        </p>
                        <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {!physician.verified && (
                        <>
                          <Button
                            className="flex-1"
                            onClick={() => handleVerifyPhysician(physician.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleRejectPhysician(physician.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => handleViewSchedule(physician.id)}
                        disabled={loadingSchedule[physician.id]}
                      >
                        {expandedPhysician === physician.id ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Schedule
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            View Schedule
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>

                  {expandedPhysician === physician.id && schedule && (
                    <Card className="p-6 space-y-4 bg-blue-50">
                      <h3 className="font-semibold text-lg">Daily Schedule</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-medium">{schedule.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Available Time Slots
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {schedule.timeSlots?.slice(0, 8).map((slot) => (
                              <div
                                key={slot}
                                className="p-2 bg-white border border-blue-200 rounded text-center text-sm font-medium"
                              >
                                {slot}
                              </div>
                            ))}
                          </div>
                          {schedule.timeSlots?.length > 8 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              +{schedule.timeSlots.length - 8} more slots
                            </p>
                          )}
                        </div>
                        {schedule.updatedAt && (
                          <p className="text-xs text-muted-foreground">
                            Last updated:{" "}
                            {(() => {
                              const updatedAt = schedule.updatedAt
                              if (!updatedAt) return "Not updated yet"
                              const dateObj = new Date(updatedAt)
                              return isNaN(dateObj.getTime())
                                ? "Invalid date"
                                : dateObj.toLocaleString("en-IN", { hour12: true })
                            })()}
                          </p>
                        )}
                      </div>
                    </Card>
                  )}

                  {expandedPhysician === physician.id &&
                    !schedule &&
                    !loadingSchedule[physician.id] && (
                      <Card className="p-6 bg-yellow-50">
                        <p className="text-sm text-muted-foreground">
                          No schedule available for this physician
                        </p>
                      </Card>
                    )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
