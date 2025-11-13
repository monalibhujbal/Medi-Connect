import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const db = getDB()
    const userNotifications = db.notifications.filter((n: any) => n.userId === userId)

    return NextResponse.json(userNotifications)
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
