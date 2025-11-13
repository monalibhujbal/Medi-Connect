"use client"

import { useEffect, useState } from "react"
import { PatientNav } from "@/components/patient-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, AlertCircle, Activity } from "lucide-react"

interface MedicalRecord {
  id: string
  date: string
  type: string
  physician: string
  diagnosis: string
  treatment: string
  notes: string
}

interface VitalSigns {
  date: string
  bloodPressure: string
  heartRate: number
  temperature: number
  weight: number
}

export default function MedicalRecordsPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"emr" | "vitals" | "allergies">("emr")

  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([
    {
      id: "1",
      date: "2025-01-15",
      type: "Consultation",
      physician: "Dr. Jane Smith",
      diagnosis: "Hypertension",
      treatment: "Prescribed Lisinopril 10mg daily",
      notes: "Patient shows symptoms of elevated blood pressure. Lifestyle changes recommended.",
    },
    {
      id: "2",
      date: "2025-01-10",
      type: "Blood Work",
      physician: "Lab Technician",
      diagnosis: "Type 2 Diabetes",
      treatment: "Fasting glucose elevated, Metformin recommended",
      notes: "Blood glucose level: 150 mg/dL. Referred to endocrinologist.",
    },
    {
      id: "3",
      date: "2024-12-20",
      type: "General Checkup",
      physician: "Dr. John Doe",
      diagnosis: "Routine examination",
      treatment: "No acute conditions found",
      notes: "All vital signs normal. Patient in good health.",
    },
  ])

  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([
    {
      date: "2025-01-15",
      bloodPressure: "140/90",
      heartRate: 72,
      temperature: 98.6,
      weight: 75,
    },
    {
      date: "2025-01-08",
      bloodPressure: "138/88",
      heartRate: 70,
      temperature: 98.4,
      weight: 75.5,
    },
    {
      date: "2024-12-20",
      bloodPressure: "135/85",
      heartRate: 68,
      temperature: 98.2,
      weight: 76,
    },
  ])

  const [allergies, setAllergies] = useState(["Penicillin", "Shellfish"])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <PatientNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Medical Records
            </h1>
            <p className="text-muted-foreground">View your complete electronic medical record (EMR)</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            <Button
              variant={activeTab === "emr" ? "default" : "ghost"}
              onClick={() => setActiveTab("emr")}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              EMR History
            </Button>
            <Button
              variant={activeTab === "vitals" ? "default" : "ghost"}
              onClick={() => setActiveTab("vitals")}
              className="gap-2"
            >
              <Activity className="w-4 h-4" />
              Vital Signs
            </Button>
            <Button
              variant={activeTab === "allergies" ? "default" : "ghost"}
              onClick={() => setActiveTab("allergies")}
              className="gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Allergies
            </Button>
          </div>

          {/* EMR History */}
          {activeTab === "emr" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Electronic Medical Records</h2>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Export All Records
                </Button>
              </div>

              <div className="space-y-4">
                {medicalRecords.map((record) => (
                  <Card key={record.id} className="p-6 border-l-4 border-l-primary">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">{record.date}</span>
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                              {record.type}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold">Dr. {record.physician}</h3>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Diagnosis</p>
                          <p className="text-base">{record.diagnosis}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Treatment</p>
                          <p className="text-base">{record.treatment}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Clinical Notes</p>
                        <p className="text-base leading-relaxed">{record.notes}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Vital Signs */}
          {activeTab === "vitals" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Vital Signs History</h2>
              <div className="space-y-3">
                {vitalSigns.map((vital, idx) => (
                  <Card key={idx} className="p-6">
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-muted-foreground">Date: {vital.date}</p>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 bg-primary/5 rounded-lg">
                          <p className="text-sm text-muted-foreground">Blood Pressure</p>
                          <p className="text-2xl font-bold text-primary">{vital.bloodPressure}</p>
                          <p className="text-xs text-muted-foreground mt-1">mmHg</p>
                        </div>
                        <div className="p-4 bg-accent/5 rounded-lg">
                          <p className="text-sm text-muted-foreground">Heart Rate</p>
                          <p className="text-2xl font-bold text-accent">{vital.heartRate}</p>
                          <p className="text-xs text-muted-foreground mt-1">bpm</p>
                        </div>
                        <div className="p-4 bg-secondary/5 rounded-lg">
                          <p className="text-sm text-muted-foreground">Temperature</p>
                          <p className="text-2xl font-bold">{vital.temperature}</p>
                          <p className="text-xs text-muted-foreground mt-1">°F</p>
                        </div>
                        <div className="p-4 bg-green-100 rounded-lg">
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="text-2xl font-bold">{vital.weight}</p>
                          <p className="text-xs text-muted-foreground mt-1">kg</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Allergies */}
          {activeTab === "allergies" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Allergies & Alerts
              </h2>

              {allergies.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No known allergies recorded</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {allergies.map((allergy, idx) => (
                    <Card key={idx} className="p-6 border-l-4 border-l-destructive bg-destructive/5">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-lg">Allergy Alert</h3>
                          <p className="text-destructive font-medium">{allergy}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
