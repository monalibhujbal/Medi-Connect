// app/api/patients/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    const db = getDB()
    db.patients = db.patients || []

    if (id) {
      const patient = db.patients.find((p: any) => p.id === id)
      if (!patient) return NextResponse.json({ message: "Patient not found" }, { status: 404 })
      return NextResponse.json(patient)
    }

    // return all
    return NextResponse.json(db.patients)
  } catch (error) {
    console.error("GET /patients error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const db = updateDB((db) => {
      if (!db.patients) db.patients = []
      // if id exists -> update, else create
      if (payload.id) {
        const idx = db.patients.findIndex((p: any) => p.id === payload.id)
        if (idx !== -1) {
          db.patients[idx] = { ...db.patients[idx], ...payload, updatedAt: new Date().toISOString() }
          return
        }
      }
      const newPatient = {
        id: payload.id || `pat_${Date.now()}`,
        name: payload.name || "Unknown",
        age: payload.age || 0,
        bloodType: payload.bloodType || "",
        allergies: payload.allergies || [],
        conditions: payload.conditions || [],
        lastVisit: payload.lastVisit || null,
        createdAt: new Date().toISOString(),
      }
      db.patients.push(newPatient)
    })

    // return the patient (find it)
    const patient = getDB().patients.slice(-1)[0]
    return NextResponse.json(patient)
  } catch (error) {
    console.error("POST /patients error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
