// Authentication helper functions
import { type NextRequest } from "next/server"
import { getDB } from "./db"

/**
 * Extract user from request headers (token-based auth)
 * Returns user object if authenticated, null otherwise
 */
export function getUserFromRequest(request: NextRequest): any | null {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.headers.get("x-token")

    if (!token) {
      // Try to get from cookie or query param (for testing)
      const url = new URL(request.url)
      const tokenParam = url.searchParams.get("token")
      if (tokenParam) {
        const decoded = JSON.parse(Buffer.from(tokenParam, "base64").toString())
        const db = getDB()
        const user = db.users.find((u: any) => u.id === decoded.userId)
        return user || null
      }
      return null
    }

    const decoded = JSON.parse(Buffer.from(token, "base64").toString())
    const db = getDB()
    const user = db.users.find((u: any) => u.id === decoded.userId)
    return user || null
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: any, requiredRole: string | string[]): boolean {
  if (!user) return false
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role)
  }
  return user.role === requiredRole
}

