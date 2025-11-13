"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Heart, Calendar, Users, Stethoscope, Pill } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">MediConnect</span>
          </div>
          <div className="hidden md:flex gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 md:py-32 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">
            Healthcare <span className="text-primary">Appointment</span> Made Simple
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            MediConnect streamlines healthcare management with role-based access for patients, physicians,
            receptionists, and pharmacists
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 py-20">
          <Card className="p-8 text-center space-y-4 hover:shadow-lg transition-shadow">
            <Calendar className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold">Easy Booking</h3>
            <p className="text-muted-foreground">Schedule appointments 24/7 with flexible 15-30 minute slots</p>
          </Card>

          <Card className="p-8 text-center space-y-4 hover:shadow-lg transition-shadow">
            <Stethoscope className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold">Medical Records</h3>
            <p className="text-muted-foreground">Access prescriptions and EMR within 3 clicks with secure data</p>
          </Card>

          <Card className="p-8 text-center space-y-4 hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold">Smart Management</h3>
            <p className="text-muted-foreground">
              Receptionists manage schedules; physicians view daily slots efficiently
            </p>
          </Card>
        </div>

        {/* Role Selection */}
        <div className="py-20 space-y-8">
          <h2 className="text-3xl font-bold text-center">Choose Your Role</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/auth/signup?role=patient">
              <Card className="p-8 hover:shadow-lg transition-all cursor-pointer hover:border-primary">
                <div className="space-y-4">
                  <Calendar className="w-12 h-12 text-primary" />
                  <h3 className="text-2xl font-bold">Patient</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Book appointments</li>
                    <li>✓ Cancel appointments</li>
                    <li>✓ View prescriptions</li>
                    <li>✓ Access medical records</li>
                  </ul>
                </div>
              </Card>
            </Link>

            <Link href="/auth/signup?role=receptionist">
              <Card className="p-8 hover:shadow-lg transition-all cursor-pointer hover:border-primary">
                <div className="space-y-4">
                  <Users className="w-12 h-12 text-primary" />
                  <h3 className="text-2xl font-bold">Receptionist</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Manage appointments</li>
                    <li>✓ Confirm bookings</li>
                    <li>✓ Track schedules</li>
                    <li>✓ Monitor physician availability</li>
                  </ul>
                </div>
              </Card>
            </Link>

            <Link href="/auth/signup?role=physician">
              <Card className="p-8 hover:shadow-lg transition-all cursor-pointer hover:border-primary">
                <div className="space-y-4">
                  <Stethoscope className="w-12 h-12 text-primary" />
                  <h3 className="text-2xl font-bold">Physician</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ View daily schedule</li>
                    <li>✓ Access medical history</li>
                    <li>✓ Write prescriptions</li>
                    <li>✓ Manage availability</li>
                  </ul>
                </div>
              </Card>
            </Link>

            <Link href="/auth/signup?role=pharmacist">
              <Card className="p-8 hover:shadow-lg transition-all cursor-pointer hover:border-primary">
                <div className="space-y-4">
                  <Pill className="w-12 h-12 text-primary" />
                  <h3 className="text-2xl font-bold">Pharmacist</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ View prescriptions</li>
                    <li>✓ Manage availability</li>
                    <li>✓ Forward to pharmacy</li>
                    <li>✓ Track orders</li>
                  </ul>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
