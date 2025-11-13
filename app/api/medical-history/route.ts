import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"

// 🩺 Get all or specific patient’s medical history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    const db = getDB()
    db.medicalHistory = db.medicalHistory || []

    let result = db.medicalHistory
    if (patientId) {
      result = result.filter((h: any) => h.patientId === patientId)
    }

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("GET /medical-history error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// 🩹 Add new medical record
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    if (!payload.patientId || !payload.condition) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 })
    }

    const newRecord = {
      id: `mh_${Date.now()}`,
      patientId: payload.patientId,
      patientName: payload.patientName || "Unknown",
      date: payload.date || new Date().toISOString().split("T")[0],
      condition: payload.condition || "Consultation / Visit",
      treatment: payload.treatment || "",
      notes: payload.notes || "",
      createdAt: new Date().toISOString(),
    }

    updateDB((db) => {
      if (!db.medicalHistory) db.medicalHistory = []
      db.medicalHistory.push(newRecord)
    })

    return NextResponse.json(newRecord)
  } catch (error) {
    console.error("POST /medical-history error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
