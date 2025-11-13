"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, FileText, Heart, LogOut } from "lucide-react"

export function PatientNav() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-primary">MediConnect</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/patient/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Appointments
            </Button>
          </Link>
          <Link href="/patient/prescriptions">
            <Button variant="ghost" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Prescriptions
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
