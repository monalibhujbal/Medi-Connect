// app/api/prescriptions/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"

// 💊 GET — Fetch prescriptions (by patientId, physicianId, or all)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const physicianId = searchParams.get("physicianId")
    const id = searchParams.get("id")

    const db = getDB()
    db.prescriptions = db.prescriptions || []

    let prescriptions = db.prescriptions

    if (id) {
      const record = prescriptions.find((p: any) => p.id === id)
      if (!record)
        return NextResponse.json({ message: "Prescription not found" }, { status: 404 })
      return NextResponse.json(record)
    }

    if (patientId)
      prescriptions = prescriptions.filter((p: any) => p.patientId === patientId)

    if (physicianId)
      prescriptions = prescriptions.filter((p: any) => p.issuedBy === physicianId)

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error("GET /prescriptions error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// 💊 POST — Add new prescription + Auto-add to medical history
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { patientId, patientName, medication, dosage, frequency, duration, issuedBy } = payload

    if (!patientId || !medication) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const today = new Date().toISOString().split("T")[0]

    const db = getDB()
    db.prescriptions = db.prescriptions || []

    // 🧠 Prevent duplicate prescriptions for same patient + same medication + same date
    const duplicate = db.prescriptions.find(
      (p: any) =>
        p.patientId === patientId &&
        p.medication === medication &&
        p.date === today
    )

    if (duplicate) {
      return NextResponse.json(
        { message: "Prescription already exists for today" },
        { status: 409 }
      )
    }

    // 💊 Create new prescription
    const newPrescription = {
      id: `pres_${Date.now()}`,
      patientId,
      patientName: patientName || "Unknown Patient",
      medication,
      dosage: dosage || "",
      frequency: frequency || "",
      duration: duration || "",
      issuedBy: issuedBy || null,
      date: today,
      status: "pending", // Initial status - pending pharmacist review
      createdAt: new Date().toISOString(),
    }

    // 🧩 Update DB
    updateDB((db) => {
      db.prescriptions = db.prescriptions || []
      db.prescriptions.push(newPrescription)

      // ✅ Ensure patient info updated
      db.patients = db.patients || []
      const patient = db.patients.find((p: any) => p.id === patientId)
      if (patient) {
        patient.lastVisit = today
        patient.updatedAt = new Date().toISOString()
      }

      // 🩺 Auto-add to medical history
      db.medicalHistory = db.medicalHistory || []
      db.medicalHistory.push({
        id: `mh_${Date.now()}`,
        patientId,
        patientName: patientName || "Unknown Patient",
        date: today,
        condition: "Prescription Issued",
        treatment: `${medication} (${dosage})`,
        notes: `Prescribed by ${issuedBy || "Physician"}`,
        createdAt: new Date().toISOString(),
      })
    })

    return NextResponse.json(newPrescription, { status: 201 })
  } catch (error) {
    console.error("POST /prescriptions error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
