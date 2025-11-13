"use client"

import { useEffect, useState } from "react"
import { PharmacistNav } from "@/components/pharmacist-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Pill, RefreshCw, Eye, CheckCircle, XCircle, Truck, Clock } from "lucide-react"

interface Prescription {
  id: string
  patientId: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  date: string
  status?: "pending" | "sent_to_pharmacist" | "available" | "unavailable" | "forwarded" | "ordered" | "dispensed"
  pharmacistId?: string
  pharmacyOrderId?: string
  availabilityNotes?: string
  patient?: {
    id: string
    name: string
    age?: number
    bloodType?: string
    allergies?: string[]
  }
  physician?: {
    id: string
    name: string
    specialization?: string
  }
}

export default function PharmacistDashboard() {
  const [user, setUser] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("pending")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      window.location.href = "/auth/login"
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "pharmacist") {
      window.location.href = "/auth/login"
      return
    }

    setUser(parsedUser)
    fetchPrescriptions(parsedUser.id, filterStatus)
  }, [filterStatus])

  const fetchPrescriptions = async (pharmacistId: string, status: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found")
        return
      }

      const res = await fetch(`/api/pharmacists/${pharmacistId}/prescriptions?status=${status}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }))
        console.error("Failed to fetch prescriptions:", res.status, errorData)
        alert(`Error fetching prescriptions: ${errorData.message || "Unknown error"}`)
        return
      }

      const data = await res.json()
      console.log("Fetched prescriptions:", data) // Debug log
      setPrescriptions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching prescriptions:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Failed to fetch prescriptions"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (user) {
      fetchPrescriptions(user.id, filterStatus)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500">Available</Badge>
      case "unavailable":
        return <Badge className="bg-red-500">Unavailable</Badge>
      case "forwarded":
        return <Badge className="bg-blue-500">Forwarded</Badge>
      case "sent_to_pharmacist":
        return <Badge className="bg-purple-500">Patient Request</Badge>
      case "dispensed":
        return <Badge className="bg-gray-500">Dispensed</Badge>
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <PharmacistNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pharmacist Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage prescriptions and pharmacy orders</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["pending", "sent_to_pharmacist", "available", "forwarded", "unavailable", "dispensed"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status === "sent_to_pharmacist" ? "Patient Requests" : status}
            </Button>
          ))}
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading prescriptions...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <Card className="p-8 text-center">
            <Pill className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No prescriptions found for status: <strong>{filterStatus}</strong></p>
            <p className="text-sm text-muted-foreground">
              {filterStatus === "pending" 
                ? "Prescriptions will appear here when patients send them to the pharmacist or when physicians create new prescriptions."
                : "Try selecting a different status filter."}
            </p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4 gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{prescription.medication}</h3>
                      {getStatusBadge(prescription.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                      <div>
                        <span className="font-medium">Patient:</span> {prescription.patient?.name || prescription.patientName}
                      </div>
                      <div>
                        <span className="font-medium">Dosage:</span> {prescription.dosage}
                      </div>
                      <div>
                        <span className="font-medium">Frequency:</span> {prescription.frequency}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {prescription.duration}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(prescription.date).toLocaleDateString()}
                      </div>
                      {prescription.physician && (
                        <div>
                          <span className="font-medium">Physician:</span> {prescription.physician.name}
                        </div>
                      )}
                    </div>
                    {prescription.availabilityNotes && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Notes:</span> {prescription.availabilityNotes}
                      </p>
                    )}
                    {prescription.pharmacyOrderId && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Truck className="w-4 h-4" />
                        <span>Order ID: {prescription.pharmacyOrderId}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/pharmacist/prescription/${prescription.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

