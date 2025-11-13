// app/api/pharmacy/orders/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"
import { getUserFromRequest, hasRole } from "@/lib/auth"
import { createPharmacyOrder } from "@/lib/pharmacy-integration"

// POST /api/pharmacy/orders — Create pharmacy order (internal route)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only pharmacist or system can create orders
    if (!hasRole(user, ["pharmacist"])) {
      return NextResponse.json({ message: "Forbidden: Only pharmacists can create orders" }, { status: 403 })
    }

    const payload = await request.json()
    const { prescriptionId, pharmacyId, patient, items } = payload

    if (!prescriptionId || !pharmacyId || !patient || !items) {
      return NextResponse.json(
        { message: "Missing required fields: prescriptionId, pharmacyId, patient, items" },
        { status: 400 }
      )
    }

    const db = getDB()
    db.pharmacies = db.pharmacies || []

    // Verify pharmacy exists
    const pharmacy = db.pharmacies.find((p: any) => p.id === pharmacyId)
    if (!pharmacy) {
      return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 })
    }

    // Create order with partner pharmacy (mock)
    const orderResponse = await createPharmacyOrder({
      prescriptionId,
      pharmacyId,
      patient,
      items,
    })

    // Store order in DB
    updateDB((db) => {
      db.pharmacyOrders = db.pharmacyOrders || []
      db.pharmacyOrders.push({
        id: orderResponse.orderId,
        prescriptionId,
        pharmacyId,
        status: orderResponse.status,
        eta: orderResponse.eta,
        patient,
        items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })

    return NextResponse.json(
      {
        orderId: orderResponse.orderId,
        status: orderResponse.status,
        eta: orderResponse.eta,
        message: orderResponse.message,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("POST /pharmacy/orders error:", error)
    return NextResponse.json(
      { message: `Failed to create pharmacy order: ${error.message}` },
      { status: 500 }
    )
  }
}

