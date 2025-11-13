"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default function PhysicianRegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [classification, setClassification] = useState("general")
  const [experience, setExperience] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !specialization || !licenseNumber) {
      alert("Please fill in all required fields (Name, Email, Specialization, License Number).")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/physicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, specialization, classification, experience, licenseNumber }),
      })

      if (res.ok) {
        alert("Registration submitted! Awaiting verification by receptionist.")
        router.push("/") // redirect to homepage or login
      } else {
        const data = await res.json()
        alert(data.message || "Error creating account.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full p-8 space-y-6 shadow-lg border border-border">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-center justify-center">
          <UserPlus className="w-6 h-6 text-primary" />
          Physician Registration
        </h1>

        <p className="text-sm text-muted-foreground text-center">
          Please fill out your details below. Your account will be activated after verification.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name *</label>
            <Input
              placeholder="Dr. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email *</label>
            <Input
              type="email"
              placeholder="doctor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Classification *</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
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
            <label className="text-sm font-medium">Specialization *</label>
            <Input
              placeholder="Cardiology, Dermatology, etc."
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Experience</label>
            <Input
              placeholder="5 years, 10 years..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Medical License Number *</label>
            <Input
              placeholder="e.g. MH12345"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Register"}
          </Button>
        </form>
      </Card>
    </main>
  )
}
