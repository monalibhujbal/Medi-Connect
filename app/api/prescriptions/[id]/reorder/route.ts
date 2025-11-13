// app/api/prescriptions/[id]/reorder/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"
import { getUserFromRequest, hasRole } from "@/lib/auth"

// POST /api/prescriptions/:id/reorder — Patient reorders a past prescription
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

    // Only patients can reorder
    if (!hasRole(user, ["patient"])) {
      return NextResponse.json({ message: "Forbidden: Only patients can reorder prescriptions" }, { status: 403 })
    }

    const db = getDB()
    db.prescriptions = db.prescriptions || []

    const originalPrescription = db.prescriptions.find((p: any) => p.id === prescriptionId)
    if (!originalPrescription) {
      return NextResponse.json({ message: "Prescription not found" }, { status: 404 })
    }

    // Verify prescription belongs to patient
    if (originalPrescription.patientId !== user.id) {
      return NextResponse.json({ message: "Forbidden: Prescription does not belong to you" }, { status: 403 })
    }

    // Create a new prescription based on the original (reorder)
    const reorderPrescription = {
      id: `pres_${Date.now()}`,
      patientId: originalPrescription.patientId,
      patientName: originalPrescription.patientName,
      medication: originalPrescription.medication,
      dosage: originalPrescription.dosage,
      frequency: originalPrescription.frequency,
      duration: originalPrescription.duration,
      issuedBy: originalPrescription.issuedBy,
      date: new Date().toISOString().split("T")[0],
      status: "sent_to_pharmacist", // Automatically send to pharmacist for reorder
      originalPrescriptionId: prescriptionId, // Track original prescription
      isReorder: true,
      sentToPharmacistAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    updateDB((db) => {
      db.prescriptions.push(reorderPrescription)

      // Add audit entry
      if (!reorderPrescription.audit) {
        reorderPrescription.audit = []
      }
      reorderPrescription.audit.push({
        by: user.id,
        at: new Date().toISOString(),
        action: "Reordered prescription",
        notes: `Reordered from prescription ${prescriptionId}`,
      })

      // Notify pharmacist
      db.notifications = db.notifications || []
      const pharmacists = db.users.filter((u: any) => u.role === "pharmacist")
      
      pharmacists.forEach((pharmacist: any) => {
        db.notifications.push({
          id: `notif_${Date.now()}_${pharmacist.id}_reorder`,
          userId: pharmacist.id,
          message: `Reorder request from ${originalPrescription.patientName || "Patient"} for ${originalPrescription.medication}.`,
          type: "prescription",
          read: false,
          createdAt: new Date(),
        })
      })
    })

    return NextResponse.json({
      ...reorderPrescription,
      message: "Prescription reordered and sent to pharmacist",
    }, { status: 201 })
  } catch (error) {
    console.error("POST /prescriptions/:id/reorder error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

