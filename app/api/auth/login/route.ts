import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const db = getDB()
    db.users = db.users || []

    const user = db.users.find((u: any) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString("base64")

    return NextResponse.json({
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
