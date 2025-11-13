// app/api/prescriptions/[id]/send-to-pharmacist/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"
import { getUserFromRequest, hasRole } from "@/lib/auth"

// POST /api/prescriptions/:id/send-to-pharmacist — Patient sends prescription to pharmacist
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id

    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only patients can send prescriptions to pharmacist
    if (!hasRole(user, ["patient"])) {
      return NextResponse.json({ message: "Forbidden: Only patients can send prescriptions" }, { status: 403 })
    }

    const db = getDB()
    db.prescriptions = db.prescriptions || []

    const prescription = db.prescriptions.find((p: any) => p.id === prescriptionId)
    if (!prescription) {
      return NextResponse.json({ message: "Prescription not found" }, { status: 404 })
    }

    // Verify prescription belongs to patient
    if (prescription.patientId !== user.id) {
      return NextResponse.json({ message: "Forbidden: Prescription does not belong to you" }, { status: 403 })
    }

    // Update prescription status
    updateDB((db) => {
      const presc = db.prescriptions.find((p: any) => p.id === prescriptionId)
      if (presc) {
        presc.status = "sent_to_pharmacist"
        presc.sentToPharmacistAt = new Date().toISOString()
        presc.updatedAt = new Date().toISOString()

        // Initialize audit array if not present
        if (!presc.audit) {
          presc.audit = []
        }

        // Add audit entry
        presc.audit.push({
          by: user.id,
          at: new Date().toISOString(),
          action: "Sent to pharmacist",
          notes: "Patient requested pharmacy service",
        })
      }

      // Notify pharmacist (create notification for all pharmacists or first available)
      db.notifications = db.notifications || []
      const pharmacists = db.users.filter((u: any) => u.role === "pharmacist")
      
      pharmacists.forEach((pharmacist: any) => {
        db.notifications.push({
          id: `notif_${Date.now()}_${pharmacist.id}`,
          userId: pharmacist.id,
          message: `New prescription from ${prescription.patientName || "Patient"} for ${prescription.medication} requires your attention.`,
          type: "prescription",
          read: false,
          createdAt: new Date(),
        })
      })
    })

    const updatedPrescription = getDB().prescriptions.find((p: any) => p.id === prescriptionId)

    return NextResponse.json({
      ...updatedPrescription,
      message: "Prescription sent to pharmacist successfully",
    })
  } catch (error) {
    console.error("POST /prescriptions/:id/send-to-pharmacist error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

