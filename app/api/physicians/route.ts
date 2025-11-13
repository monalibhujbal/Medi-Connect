import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"

// ✅ GET all physicians or only verified ones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const verifiedOnly = searchParams.get("verified") === "true"

    const db = getDB()
    if (!db.physicians) db.physicians = []
    if (!db.users) db.users = []

    // Get physicians from both physicians table and users table
    let physicians = [...db.physicians]

    // Also include physicians from users table (from signup)
    const physicianUsers = db.users.filter((u: any) => u.role === "physician")
    physicianUsers.forEach((user: any) => {
      // Check if already in physicians array
      const exists = physicians.find((p: any) => p.id === user.id || p.email === user.email)
      if (!exists) {
        // Add to physicians array with classification
        physicians.push({
          id: user.id,
          name: user.name,
          email: user.email,
          specialization: user.specialization || "",
          classification: user.classification || "general",
          licenseNumber: user.licenseNumber || "N/A",
          experience: "Not provided",
          verified: true, // Assume verified if in users table
          createdAt: user.createdAt,
        })
      } else {
        // Update existing physician with classification from user if missing
        if (user.classification && !exists.classification) {
          exists.classification = user.classification
        }
      }
    })

    if (verifiedOnly) {
      physicians = physicians.filter((p: any) => p.verified)
    }

    return NextResponse.json(physicians)
  } catch (error) {
    console.error("GET /physicians error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// ✅ Register new physician (pending verification)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const db = updateDB((db) => {
      if (!db.physicians) db.physicians = []

      const newPhysician = {
        id: `phy_${Date.now()}`,
        name: data.name,
        email: data.email,
        specialization: data.specialization,
        classification: data.classification || "general",
        experience: data.experience || "Not provided",
        licenseNumber: data.licenseNumber || "N/A",
        verified: false, // 🟡 pending verification
        createdAt: new Date().toISOString(),
      }

      db.physicians.push(newPhysician)
    })

    const newPhysician = db.physicians[db.physicians.length - 1]
    return NextResponse.json(newPhysician)
  } catch (error) {
    console.error("POST /physicians error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// ✅ Receptionist verifies physician
export async function PUT(request: NextRequest) {
  try {
    const { physicianId, verified } = await request.json()

    const db = updateDB((db) => {
      const physician = db.physicians.find((p: any) => p.id === physicianId)
      if (physician) {
        physician.verified = verified
        physician.verifiedAt = new Date().toISOString()
      }
    })

    return NextResponse.json({ message: "Physician verification updated successfully" })
  } catch (error) {
    console.error("PUT /physicians error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
