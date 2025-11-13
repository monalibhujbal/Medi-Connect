// app/api/pharmacies/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"
import { getUserFromRequest, hasRole } from "@/lib/auth"

// GET /api/pharmacies — List all pharmacies
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only authenticated users can view pharmacies
    const db = getDB()
    db.pharmacies = db.pharmacies || []

    // If no pharmacies exist, seed some sample ones
    if (db.pharmacies.length === 0) {
      const samplePharmacies = [
        {
          id: "pharmacy_1",
          name: "MediCare Pharmacy",
          endpointUrl: "https://api.medicare-pharmacy.com/orders",
          apiKey: "mock_api_key_1",
          supportedDeliveryHours: "09:00-21:00",
          createdAt: new Date().toISOString(),
        },
        {
          id: "pharmacy_2",
          name: "HealthPlus Pharmacy",
          endpointUrl: "https://api.healthplus-pharmacy.com/orders",
          apiKey: "mock_api_key_2",
          supportedDeliveryHours: "08:00-20:00",
          createdAt: new Date().toISOString(),
        },
        {
          id: "pharmacy_3",
          name: "QuickMed Pharmacy",
          endpointUrl: "https://api.quickmed-pharmacy.com/orders",
          apiKey: "mock_api_key_3",
          supportedDeliveryHours: "10:00-22:00",
          createdAt: new Date().toISOString(),
        },
      ]

      updateDB((db) => {
        db.pharmacies = samplePharmacies
      })

      return NextResponse.json(samplePharmacies)
    }

    return NextResponse.json(db.pharmacies)
  } catch (error) {
    console.error("GET /pharmacies error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// POST /api/pharmacies — Create new pharmacy (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only receptionist or admin can create pharmacies
    if (!hasRole(user, ["receptionist", "physician"])) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const payload = await request.json()
    const { name, endpointUrl, apiKey, supportedDeliveryHours } = payload

    if (!name) {
      return NextResponse.json({ message: "Missing required field: name" }, { status: 400 })
    }

    const newPharmacy = {
      id: `pharmacy_${Date.now()}`,
      name,
      endpointUrl: endpointUrl || "",
      apiKey: apiKey || "",
      supportedDeliveryHours: supportedDeliveryHours || "09:00-21:00",
      createdAt: new Date().toISOString(),
    }

    updateDB((db) => {
      db.pharmacies = db.pharmacies || []
      db.pharmacies.push(newPharmacy)
    })

    return NextResponse.json(newPharmacy, { status: 201 })
  } catch (error) {
    console.error("POST /pharmacies error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

