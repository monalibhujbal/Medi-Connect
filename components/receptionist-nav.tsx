"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Heart, LogOut, CreditCard, LayoutDashboard, Stethoscope } from "lucide-react"
import { useState, useEffect } from "react"

export function ReceptionistNav() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/auth/login")
  }

  if (!user) return null

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary">MediConnect</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/receptionist/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/receptionist/appointments">
            <Button variant="ghost" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Appointments
            </Button>
          </Link>
          <Link href="/receptionist/physicians">
            <Button variant="ghost" size="sm" className="gap-2">
              <Stethoscope className="w-4 h-4" />
              Physicians
            </Button>
          </Link>
          <Link href="/receptionist/payments">
            <Button variant="ghost" size="sm" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
