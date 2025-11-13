import { type NextRequest, NextResponse } from "next/server"
import { getDB, updateDB } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, licenseNumber, specialization, classification } = await request.json()

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const db = getDB()
    db.users = db.users || []

    // Check if user already exists
    if (db.users.some((u: any) => u.email === email)) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    const user = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, hash with bcrypt
      role,
      licenseNumber,
      specialization,
      classification: role === "physician" ? classification : undefined,
      createdAt: new Date().toISOString(),
    }

    updateDB((db) => {
      db.users.push(user)
    })

    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString("base64")

    return NextResponse.json({
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
