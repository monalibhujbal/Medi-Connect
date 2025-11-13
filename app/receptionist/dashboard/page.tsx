"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { ReceptionistNav } from "@/components/receptionist-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Calendar, Users, CheckCircle, AlertCircle, UserCheck, Pill, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getClassificationShortLabel, getClassificationColor } from "@/lib/physician-utils"

interface Appointment {
  id: string
  patientName: string
  physicianName: string
  date: string
  time: string
  status: "pending" | "confirmed" | "cancelled"
}

interface Physician {
  id: string
  name: string
  specialization: string
  classification?: "general" | "specialist" | "consultant" | "senior_consultant" | "super_specialist"
  experience: string
  verified: boolean
}

interface Pharmacist {
  id: string
  name: string
  email: string
  contact?: string
  createdAt: string
}

export default function ReceptionistDashboard() {
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [physicians, setPhysicians] = useState<Physician[]>([])
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([])
  const [showCreatePharmacist, setShowCreatePharmacist] = useState(false)
  const [newPharmacist, setNewPharmacist] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
  })
  const [creating, setCreating] = useState(false)

  // ✅ Fetch receptionist data
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))
    fetchAppointments()
    fetchPhysicians()
    fetchPharmacists()
  }, [])

  // ✅ Fetch appointments
  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments", { cache: "no-store" })
      const data = await res.json()
      setAppointments(data)
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }

  // ✅ Fetch all physicians (verified + unverified)
  const fetchPhysicians = async () => {
    try {
      const res = await fetch("/api/physicians", { cache: "no-store" })
      const data = await res.json()
      setPhysicians(data)
    } catch (error) {
      console.error("Error fetching physicians:", error)
    }
  }

  // ✅ Confirm appointment
  const handleConfirmAppointment = async (id: string) => {
    try {
      await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, status: "confirmed" }),
      })
      fetchAppointments()
      alert("Appointment confirmed successfully!")
    } catch {
      alert("Error confirming appointment.")
    }
  }

  // ✅ Verify physician
  const handleVerifyPhysician = async (physicianId: string) => {
    try {
      await fetch("/api/physicians", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ physicianId, verified: true }),
      })
      alert("Physician verified successfully!")
      fetchPhysicians()
    } catch {
      alert("Error verifying physician.")
    }
  }

  // ✅ Fetch pharmacists
  const fetchPharmacists = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/pharmacists", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setPharmacists(data)
      }
    } catch (error) {
      console.error("Error fetching pharmacists:", error)
    }
  }

  // ✅ Create pharmacist
  const handleCreatePharmacist = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/pharmacists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPharmacist),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Failed to create pharmacist")
        return
      }

      alert("Pharmacist created successfully!")
      setShowCreatePharmacist(false)
      setNewPharmacist({ name: "", email: "", password: "", contact: "" })
      fetchPharmacists()
    } catch (error) {
      alert("Error creating pharmacist.")
    } finally {
      setCreating(false)
    }
  }

  if (!user) return null

  // ✅ Stats
  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
  }

  return (
    <div className="min-h-screen bg-background">
      <ReceptionistNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-10">
          {/* Welcome Card */}
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10">
            <h1 className="text-4xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Manage and track appointments and physician verifications
            </p>
          </Card>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Total Appointments</span>
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.total}</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Pending</span>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Confirmed</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold">{stats.confirmed}</p>
            </Card>

            <Link href="/receptionist/appointments">
              <Card className="p-6 space-y-2 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">View All</span>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">→</p>
              </Card>
            </Link>
          </div>

          {/* Pending Appointments */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Pending Appointment Confirmations</h2>
            <div className="space-y-3">
              {appointments.filter((apt) => apt.status === "pending").length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <p>No pending appointments at the moment.</p>
                </Card>
              ) : (
                appointments
                  .filter((apt) => apt.status === "pending")
                  .map((apt) => (
                    <Card key={apt.id} className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{apt.patientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Dr. {apt.physicianName} — {apt.date} at {apt.time}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleConfirmAppointment(apt.id)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </Button>
                    </Card>
                  ))
              )}
            </div>
          </div>

          {/* 🩺 Pending Physician Verifications */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" />
              Pending Physician Verifications
            </h2>

            <div className="space-y-3">
              {physicians.filter((p) => !p.verified).length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <p>No new physicians pending verification.</p>
                </Card>
              ) : (
                physicians
                  .filter((p) => !p.verified)
                  .map((p) => (
                    <Card key={p.id} className="p-6 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{p.name}</h3>
                          {p.classification && (
                            <Badge className={`text-xs ${getClassificationColor(p.classification)}`}>
                              {getClassificationShortLabel(p.classification)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {p.specialization || "No specialization"} — {p.experience}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleVerifyPhysician(p.id)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <UserCheck className="w-4 h-4" />
                        Verify
                      </Button>
                    </Card>
                  ))
              )}
            </div>
          </div>

          {/* 💊 Pharmacists Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Pill className="w-6 h-6 text-primary" />
                Pharmacists
              </h2>
              <Button onClick={() => setShowCreatePharmacist(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Pharmacist
              </Button>
            </div>

            <div className="space-y-3">
              {pharmacists.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <p>No pharmacists yet. Create one to get started.</p>
                </Card>
              ) : (
                pharmacists.map((pharmacist) => (
                  <Card key={pharmacist.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{pharmacist.name}</h3>
                        <p className="text-sm text-muted-foreground">{pharmacist.email}</p>
                        {pharmacist.contact && (
                          <p className="text-sm text-muted-foreground">Contact: {pharmacist.contact}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(pharmacist.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Pharmacist Dialog */}
      <Dialog open={showCreatePharmacist} onOpenChange={setShowCreatePharmacist}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Pharmacist</DialogTitle>
            <DialogDescription>Add a new pharmacist to the system</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePharmacist} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Pharmacist"
                value={newPharmacist.name}
                onChange={(e) => setNewPharmacist({ ...newPharmacist, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="pharmacist@example.com"
                value={newPharmacist.email}
                onChange={(e) => setNewPharmacist({ ...newPharmacist, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newPharmacist.password}
                onChange={(e) => setNewPharmacist({ ...newPharmacist, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                type="tel"
                placeholder="1234567890"
                value={newPharmacist.contact}
                onChange={(e) => setNewPharmacist({ ...newPharmacist, contact: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowCreatePharmacist(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Pharmacist"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
