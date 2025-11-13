// app/api/pharmacists/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"
import { getUserFromRequest, hasRole } from "@/lib/auth"

// GET /api/pharmacists — List all pharmacists
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization (receptionist or admin can list)
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Allow receptionist, physician, or pharmacist to list pharmacists
    if (!hasRole(user, ["receptionist", "physician", "pharmacist"])) {
      return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    const db = getDB()
    db.users = db.users || []

    // Filter pharmacists only
    const pharmacists = db.users.filter((u: any) => u.role === "pharmacist")

    return NextResponse.json(pharmacists)
  } catch (error) {
    console.error("GET /pharmacists error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// POST /api/pharmacists — Create new pharmacist
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only receptionist or admin can create pharmacists
    if (!hasRole(user, ["receptionist", "physician"])) {
      return NextResponse.json({ message: "Forbidden: Only staff can create pharmacists" }, { status: 403 })
    }

    const payload = await request.json()
    const { name, email, password, contact } = payload

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields: name, email, password" }, { status: 400 })
    }

    const db = getDB()
    db.users = db.users || []

    // Check if email already exists
    const existingUser = db.users.find((u: any) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Create pharmacist user
    const newPharmacist = {
      id: `pharm_${Date.now()}`,
      name,
      email,
      password, // In production, hash with bcrypt
      role: "pharmacist",
      contact: contact || "",
      createdAt: new Date().toISOString(),
    }

    updateDB((db) => {
      db.users.push(newPharmacist)
    })

    // Return pharmacist without password
    const { password: _, ...pharmacistWithoutPassword } = newPharmacist
    return NextResponse.json(pharmacistWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("POST /pharmacists error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

