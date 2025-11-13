"use client"

import { useEffect, useState } from "react"
import { PhysicianNav } from "@/components/physician-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { User, Pill, Clock, Calendar, PlusCircle, FileText } from "lucide-react"

interface Prescription {
  id: string
  patientId: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  date: string
}

interface Appointment {
  id: string
  patientId: string
  patientName: string
  physicianId: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed"
}

export default function PhysicianPrescriptionsPage() {
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
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
    fetchData(parsedUser.id)
  }, [])

  const fetchData = async (physicianId: string) => {
    setLoading(true)
    try {
      // Fetch all physician appointments (patients who booked)
      const aptRes = await fetch(`/api/appointments?physicianId=${physicianId}`, { cache: "no-store" })
      const aptData = await aptRes.json()
      const confirmed = aptData.filter(
        (a: any) =>
          a.status === "confirmed" ||
          a.status === "completed"
      )
      setAppointments(confirmed)

      // Fetch prescriptions created by this physician
      const presRes = await fetch(`/api/prescriptions?physicianId=${physicianId}`, { cache: "no-store" })
      const presData = await presRes.json()
      setPrescriptions(Array.isArray(presData) ? presData : [])
    } catch (error) {
      console.error("Error fetching prescriptions:", error)
      setAppointments([])
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) {
      alert("Please select a patient first.")
      return
    }

    const { medication, dosage, frequency, duration } = newPrescription
    if (!medication || !dosage) {
      alert("Please fill in medication and dosage.")
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

      if (!res.ok) throw new Error("Failed to save prescription")

      alert("Prescription added successfully.")
      setNewPrescription({ medication: "", dosage: "", frequency: "", duration: "" })
      setSelectedPatient(null)
      fetchData(user.id)
    } catch (error) {
      console.error("Add prescription error:", error)
      alert("Could not save prescription.")
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <PhysicianNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Pill className="w-8 h-8" /> Prescriptions
          </h1>

          {loading ? (
            <Card className="p-6 text-center text-muted-foreground">Loading...</Card>
          ) : appointments.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No patients found. You’ll see patients here once appointments are confirmed.
            </Card>
          ) : (
            <div className="space-y-6">
              {appointments.map((apt) => {
                const patientPrescriptions = prescriptions.filter(
                  (p) => p.patientId === apt.patientId
                )

                return (
                  <Card key={apt.id} className="p-6 border-l-4 border-l-primary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <User className="w-5 h-5" />
                        {apt.patientName}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPatient(apt)}
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Add Prescription
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <Clock className="w-4 h-4" /> {apt.time}
                      <Calendar className="w-4 h-4" /> {apt.date}
                    </div>

                    {/* Previous Prescriptions */}
                    <div className="mt-4">
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <FileText className="w-4 h-4" /> Previous Prescriptions
                      </h3>
                      {patientPrescriptions.length > 0 ? (
                        <div className="space-y-2">
                          {patientPrescriptions.map((pres) => (
                            <div
                              key={pres.id}
                              className="border rounded-md p-3 text-sm bg-accent/5"
                            >
                              <p>
                                <span className="font-medium">{pres.medication}</span> —{" "}
                                {pres.dosage}, {pres.frequency} ({pres.duration})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Date: {pres.date}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No previous prescriptions.
                        </p>
                      )}
                    </div>

                    {/* Add Prescription Form */}
                    {selectedPatient?.patientId === apt.patientId && (
                      <div className="mt-4 border-t pt-3">
                        <form onSubmit={handleAddPrescription} className="space-y-3">
                          <div className="grid md:grid-cols-4 gap-3">
                            <input
                              type="text"
                              placeholder="Medication"
                              value={newPrescription.medication}
                              onChange={(e) =>
                                setNewPrescription({ ...newPrescription, medication: e.target.value })
                              }
                              className="px-3 py-2 border border-input rounded-md"
                              required
                            />
                            <input
                              type="text"
                              placeholder="Dosage"
                              value={newPrescription.dosage}
                              onChange={(e) =>
                                setNewPrescription({ ...newPrescription, dosage: e.target.value })
                              }
                              className="px-3 py-2 border border-input rounded-md"
                              required
                            />
                            <input
                              type="text"
                              placeholder="Frequency"
                              value={newPrescription.frequency}
                              onChange={(e) =>
                                setNewPrescription({ ...newPrescription, frequency: e.target.value })
                              }
                              className="px-3 py-2 border border-input rounded-md"
                            />
                            <input
                              type="text"
                              placeholder="Duration"
                              value={newPrescription.duration}
                              onChange={(e) =>
                                setNewPrescription({ ...newPrescription, duration: e.target.value })
                              }
                              className="px-3 py-2 border border-input rounded-md"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button type="submit" size="sm">
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPatient(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
