"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Heart } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState("patient")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    specialization: "",
    classification: "general",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const roleParam = searchParams.get("role")
    if (roleParam && ["patient", "physician", "receptionist", "pharmacist"].includes(roleParam)) {
      setRole(roleParam)
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (role === "physician" && !formData.licenseNumber) {
      setError("License number is required for physicians")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role,
          licenseNumber: role === "physician" ? formData.licenseNumber : undefined,
          specialization: role === "physician" ? formData.specialization : undefined,
          classification: role === "physician" ? formData.classification : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Signup failed")
        return
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.push(`/${role}/dashboard`)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Heart className="w-6 h-6 text-primary" />
          <span className="text-2xl font-bold text-primary">MediConnect</span>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Join as a {role}</p>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="patient">Patient</option>
              <option value="physician">Physician</option>
              <option value="receptionist">Receptionist</option>
              <option value="pharmacist">Pharmacist</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {role === "physician" && (
            <>
              <div>
                <label className="text-sm font-medium">License Number</label>
                <Input
                  type="text"
                  name="licenseNumber"
                  placeholder="MD123456"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Classification *</label>
                <select
                  name="classification"
                  value={formData.classification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="general">General Practitioner</option>
                  <option value="specialist">Specialist</option>
                  <option value="consultant">Consultant</option>
                  <option value="senior_consultant">Senior Consultant</option>
                  <option value="super_specialist">Super Specialist</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Specialization</label>
                <Input
                  type="text"
                  name="specialization"
                  placeholder="e.g., Cardiology"
                  value={formData.specialization}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  )
}
