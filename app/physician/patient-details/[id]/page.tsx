"use client"

import { useEffect, useState } from "react"
import { PhysicianNav } from "@/components/physician-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  User,
  Heart,
  AlertCircle,
  FileText,
  Calendar,
  Pill,
  PlusCircle,
  UserPlus,
} from "lucide-react"
import Link from "next/link"

interface PatientRecord {
  id: string
  name: string
  age: number
  bloodType: string
  allergies: string[]
  conditions: string[]
  lastVisit: string | null
}

interface MedicalHistory {
  id: string
  date: string
  condition: string
  treatment: string
  notes: string
}

interface Prescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  date: string
  issuedBy?: string
}

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [newPrescription, setNewPrescription] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
  })
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")
  const [referralInfo, setReferralInfo] = useState<any>(null)
  const patientId = params.id

  // ✅ Load user + all data once
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      if (patientId) {
        fetchAllData(patientId)
        // Fetch referral info after user is set
        fetchReferralInfo(patientId, parsedUser.id)
      }
    } else if (patientId) {
      fetchAllData(patientId)
    }
  }, [patientId])

  const fetchAllData = async (id: string) => {
    setLoading(true)
    try {
      await Promise.all([fetchPatient(id), fetchMedicalHistory(id), fetchPrescriptions(id)])
    } catch (error) {
      console.error("Error loading patient data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch referral information
  const fetchReferralInfo = async (patientId: string, physicianId: string) => {
    try {
      const res = await fetch(`/api/appointments?patientId=${patientId}`, { cache: "no-store" })
      const appointments = await res.json()
      // Find the most recent appointment with this physician that has referral info
      const currentAppointment = appointments.find(
        (apt: any) =>
          apt.physicianId === physicianId &&
          apt.referredByPhysicianName &&
          (apt.status === "pending" || apt.status === "confirmed" || apt.status === "completed")
      )
      if (currentAppointment) {
        setReferralInfo({
          referredByPhysicianName: currentAppointment.referredByPhysicianName,
          referredByPhysicianId: currentAppointment.referredByPhysicianId,
          originalAppointmentId: currentAppointment.originalAppointmentId,
        })
      }
    } catch (error) {
      console.error("Error fetching referral info:", error)
    }
  }

  // 🩺 Fetch patient data (ensures accurate data from DB)
  const fetchPatient = async (id: string) => {
    try {
      const res = await fetch(`/api/patients?id=${id}`, { cache: "no-store" })
      if (!res.ok) {
        console.warn("⚠️ No patient record found for:", id)
        setPatient({
          id,
          name: "Unknown Patient",
          age: 0,
          bloodType: "N/A",
          allergies: [],
          conditions: [],
          lastVisit: null,
        })
        return
      }

      const data = await res.json()

      // 🧩 If minimal data (from appointment sync), fill sensible defaults
      setPatient({
        id: data.id,
        name: data.name || "Unnamed Patient",
        age: data.age || 0,
        bloodType: data.bloodType || "N/A",
        allergies: Array.isArray(data.allergies) ? data.allergies : [],
        conditions: Array.isArray(data.conditions) ? data.conditions : [],
        lastVisit: data.lastVisit || null,
      })
    } catch (err) {
      console.error("❌ Fetch patient error:", err)
      setPatient({
        id,
        name: "Unknown Patient",
        age: 0,
        bloodType: "N/A",
        allergies: [],
        conditions: [],
        lastVisit: null,
      })
    }
  }

  // 📋 Fetch medical history
  const fetchMedicalHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/medical-history?patientId=${id}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setMedicalHistory(Array.isArray(data) ? data : [])
      } else {
        setMedicalHistory([])
      }
    } catch (err) {
      console.error("Fetch medical history error:", err)
      setMedicalHistory([])
    }
  }

  // 💊 Fetch prescriptions
  const fetchPrescriptions = async (id: string) => {
    try {
      const res = await fetch(`/api/prescriptions?patientId=${id}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(Array.isArray(data) ? data : [])
      } else {
        setPrescriptions([])
      }
    } catch (err) {
      console.error("Fetch prescriptions error:", err)
      setPrescriptions([])
    }
  }

  // ➕ Add prescription
  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPrescription.medication || !newPrescription.dosage) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const payload = {
        patientId,
        patientName: patient?.name || "",
        medication: newPrescription.medication,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        duration: newPrescription.duration,
        issuedBy: user?.name || "Unknown Physician",
      }

      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to save prescription")

      const saved = await res.json()
      setPrescriptions((prev) => [saved, ...prev])
      setShowPrescriptionForm(false)
      setNewPrescription({ medication: "", dosage: "", frequency: "", duration: "" })
      setPatient((p) => (p ? { ...p, lastVisit: saved.date } : p))
      alert("Prescription added successfully")

      await fetchPrescriptions(patientId)
    } catch (error) {
      console.error("Add prescription error:", error)
      alert("Error while saving prescription.")
    }
  }

  // 🌀 Loading + error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading patient records...
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        ❌ Could not load patient data.
      </div>
    )
  }

  // ✅ Render patient profile
  return (
    <div className="min-h-screen bg-background">
      <PhysicianNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <Link href="/physician/patients">
            <Button variant="outline" className="gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Back to Patients
            </Button>
          </Link>

          {/* Header */}
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10">
            <h1 className="text-4xl font-bold flex items-center gap-2 mb-4">
              <User className="w-8 h-8" /> {patient.name}
            </h1>

            {/* Referral Information */}
            {referralInfo && referralInfo.referredByPhysicianName && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Referred by: {referralInfo.referredByPhysicianName}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Age</p>
                <p className="font-semibold">{patient.age || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Blood Type</p>
                <p className="font-semibold">{patient.bloodType || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Visit</p>
                <p className="font-semibold">{patient.lastVisit || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-semibold text-green-600">Active</p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              {(patient.allergies?.length > 0 || patient.conditions?.length > 0) ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {patient.allergies?.length > 0 && (
                    <Card className="p-6 border-l-4 border-l-destructive bg-destructive/5">
                      <AlertCircle className="w-6 h-6 text-destructive mb-2" />
                      <h3 className="font-semibold text-lg">Allergies</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {patient.allergies.map((a, i) => (
                          <span key={i} className="px-3 py-1 bg-destructive/20 text-destructive rounded-full text-sm">
                            {a}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}
                  {patient.conditions?.length > 0 && (
                    <Card className="p-6 border-l-4 border-l-accent bg-accent/5">
                      <Heart className="w-6 h-6 text-accent mb-2" />
                      <h3 className="font-semibold text-lg">Chronic Conditions</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {patient.conditions.map((c, i) => (
                          <span key={i} className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
                            {c}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="p-6 text-center text-muted-foreground">
                  No known allergies or chronic conditions.
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6" /> Medical History
              </h2>
              {medicalHistory.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  No medical history available.
                </Card>
              ) : (
                medicalHistory.map((record) => (
                  <Card key={record.id} className="p-6 border-l-4 border-l-primary">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {record.date}
                        </p>
                        <h3 className="font-semibold text-lg mt-2">{record.condition}</h3>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Treatment</p>
                        <p className="font-medium">{record.treatment}</p>
                        <p className="text-sm mt-2 text-muted-foreground">Notes: {record.notes}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Prescriptions Tab */}
            <TabsContent value="prescriptions">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Pill className="w-6 h-6" /> Prescriptions
                  </h2>
                  <Button onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {showPrescriptionForm ? "Cancel" : "Add"}
                  </Button>
                </div>

                {showPrescriptionForm && (
                  <Card className="p-6 bg-accent/5">
                    <form onSubmit={handleAddPrescription} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
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
                      <Button type="submit" className="w-full">
                        Save Prescription
                      </Button>
                    </form>
                  </Card>
                )}

                {prescriptions.length === 0 ? (
                  <Card className="p-6 text-center text-muted-foreground">
                    No prescriptions found.
                  </Card>
                ) : (
                  prescriptions.map((p) => (
                    <Card key={p.id} className="p-6 border-l-4 border-l-green-500">
                      <div className="grid md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Medication</p>
                          <p className="font-semibold">{p.medication}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Dosage</p>
                          <p className="font-semibold">{p.dosage}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Frequency</p>
                          <p className="font-semibold">{p.frequency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-semibold">{p.duration}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Issued</p>
                          <p className="font-semibold">{p.date}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
