"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

export default function PhysicianLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      alert("Please enter your registered email.")
      return
    }

    setLoading(true)
    try {
      // Fetch verified physicians from DB
      const res = await fetch("/api/physicians?verified=true", { cache: "no-store" })
      const data = await res.json()

      const physician = data.find((p: any) => p.email === email)

      if (!physician) {
        alert("No verified physician found with this email. Please wait for verification or register.")
        setLoading(false)
        return
      }

      // Save user info in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: physician.id,
          name: physician.name,
          email: physician.email,
          specialization: physician.specialization,
          role: "physician",
        })
      )

      router.push("/physician/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      alert("Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full p-8 space-y-6 shadow-lg border border-border">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <LogIn className="w-6 h-6 text-primary" />
          Physician Login
        </h1>

        <p className="text-sm text-muted-foreground text-center">
          Enter your registered email to access your dashboard.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="doctor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          New here?{" "}
          <a href="/physician/register" className="text-primary hover:underline">
            Register as a Physician
          </a>
        </p>
      </Card>
    </main>
  )
}
