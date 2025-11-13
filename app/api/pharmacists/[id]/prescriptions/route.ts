// app/api/pharmacists/[id]/prescriptions/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { getUserFromRequest, hasRole } from "@/lib/auth"

// GET /api/pharmacists/:id/prescriptions?status=pending|available|forwarded|unavailable
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pharmacistId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      console.error("[Pharmacist API] No user found in request")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Authorization: Allow pharmacists, receptionists, and physicians to view prescriptions
    // Any pharmacist can view all prescriptions (not just their own)
    if (!hasRole(user, ["pharmacist", "receptionist", "physician"])) {
      console.error(`[Pharmacist API] Forbidden: user role=${user.role}`)
      return NextResponse.json({ message: "Forbidden: Only pharmacists, receptionists, and physicians can view prescriptions" }, { status: 403 })
    }

    // Verify pharmacist exists (if pharmacistId is provided)
    const db = getDB()
    if (pharmacistId) {
      const pharmacist = db.users.find((u: any) => u.id === pharmacistId && u.role === "pharmacist")
      // Don't fail if pharmacist not found - allow viewing anyway if user is pharmacist/receptionist/physician
      if (!pharmacist && user.role === "pharmacist" && user.id !== pharmacistId) {
        console.warn(`[Pharmacist API] Pharmacist ${pharmacistId} not found, but allowing access for user ${user.id}`)
      }
    }

    db.prescriptions = db.prescriptions || []
    db.patients = db.patients || []
    db.users = db.users || []

    // Get prescriptions filtered by status
    // Default: show pending prescriptions (not yet processed by any pharmacist)
    let prescriptions = db.prescriptions || []

    // Debug: Log all prescriptions before filtering
    console.log(`[Pharmacist API] Total prescriptions in DB: ${prescriptions.length}`)
    console.log(`[Pharmacist API] Prescription statuses:`, prescriptions.map((p: any) => ({ id: p.id, status: p.status, medication: p.medication })))

    // Filter prescriptions based on status
    if (status === "pending") {
      // Pending: includes both "pending" and "sent_to_pharmacist" statuses
      // Show all prescriptions that haven't been processed yet
      prescriptions = prescriptions.filter(
        (p: any) => 
          p.status === "pending" || 
          p.status === "sent_to_pharmacist" ||
          !p.status || 
          p.status === undefined // Also include prescriptions without status (legacy)
      )
    } else if (status === "sent_to_pharmacist") {
      // Show only prescriptions sent by patients
      prescriptions = prescriptions.filter((p: any) => p.status === "sent_to_pharmacist")
    } else {
      // Other statuses: filter by exact status match
      prescriptions = prescriptions.filter((p: any) => p.status === status)
    }

    // Debug log
    console.log(`[Pharmacist API] Filter: ${status}, Found ${prescriptions.length} prescriptions after filtering`)

    // Enrich with patient and physician info
    const enrichedPrescriptions = prescriptions.map((prescription: any) => {
      const patient = db.patients.find((p: any) => p.id === prescription.patientId)
      const physician = db.users.find((u: any) => u.id === prescription.issuedBy)

      return {
        ...prescription,
        patient: patient
          ? {
              id: patient.id,
              name: patient.name || prescription.patientName,
              age: patient.age,
              bloodType: patient.bloodType,
              allergies: patient.allergies || [],
            }
          : {
              id: prescription.patientId,
              name: prescription.patientName || "Unknown",
            },
        physician: physician
          ? {
              id: physician.id,
              name: physician.name,
              specialization: physician.specialization,
            }
          : null,
      }
    })

    return NextResponse.json(enrichedPrescriptions)
  } catch (error) {
    console.error("GET /pharmacists/:id/prescriptions error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

