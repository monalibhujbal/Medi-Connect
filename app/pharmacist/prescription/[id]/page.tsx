"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PharmacistNav } from "@/components/pharmacist-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, XCircle, Truck, Clock, User, Pill, FileText } from "lucide-react"

interface Prescription {
  id: string
  patientId: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  date: string
  issuedBy?: string
  status?: "pending" | "available" | "unavailable" | "forwarded" | "dispensed"
  pharmacistId?: string
  pharmacyOrderId?: string
  availabilityNotes?: string
  audit?: Array<{
    by: string
    at: string
    action: string
    notes?: string
  }>
}

interface Patient {
  id: string
  name: string
  age?: number
  bloodType?: string
  allergies?: string[]
  conditions?: string[]
  address?: string
  phone?: string
}

interface Pharmacy {
  id: string
  name: string
  endpointUrl?: string
  supportedDeliveryHours?: string
}

export default function PrescriptionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [previousPrescriptions, setPreviousPrescriptions] = useState<Prescription[]>([])
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [showForwardDialog, setShowForwardDialog] = useState(false)
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false)
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("")
  const [notes, setNotes] = useState("")
  const [updating, setUpdating] = useState(false)

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
    fetchPrescriptionDetails()
    fetchPharmacies()
  }, [params.id])

  const fetchPrescriptionDetails = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/prescriptions?id=${params.id}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setPrescription(data)

        // Fetch patient details
        if (data.patientId) {
          const patientRes = await fetch(`/api/patients?id=${data.patientId}`, { cache: "no-store" })
          if (patientRes.ok) {
            const patientData = await patientRes.json()
            setPatient(patientData)
          }
        }

        // Fetch previous prescriptions
        const prevRes = await fetch(`/api/prescriptions?patientId=${data.patientId}`, { cache: "no-store" })
        if (prevRes.ok) {
          const prevData = await prevRes.json()
          setPreviousPrescriptions(prevData.filter((p: Prescription) => p.id !== data.id).slice(0, 5))
        }
      }
    } catch (error) {
      console.error("Error fetching prescription:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/pharmacies", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setPharmacies(data)
      }
    } catch (error) {
      console.error("Error fetching pharmacies:", error)
    }
  }

  const updatePrescriptionStatus = async (status: string, pharmacyId?: string) => {
    setUpdating(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/prescriptions/${params.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          pharmacistId: user.id,
          notes,
          pharmacyId,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setPrescription(updated)
        setShowForwardDialog(false)
        setShowUnavailableDialog(false)
        setNotes("")
        setSelectedPharmacyId("")
        // Refresh the page data
        fetchPrescriptionDetails()
      } else {
        const error = await res.json()
        alert(error.message || "Failed to update prescription status")
      }
    } catch (error) {
      console.error("Error updating prescription:", error)
      alert("Failed to update prescription status")
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkAvailable = () => {
    updatePrescriptionStatus("available")
  }

  const handleMarkUnavailable = () => {
    if (!notes.trim()) {
      alert("Please provide a reason for unavailability")
      return
    }
    updatePrescriptionStatus("unavailable")
  }

  const handleForward = () => {
    if (!selectedPharmacyId) {
      alert("Please select a pharmacy")
      return
    }
    updatePrescriptionStatus("forwarded", selectedPharmacyId)
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500">Available</Badge>
      case "unavailable":
        return <Badge className="bg-red-500">Unavailable</Badge>
      case "forwarded":
        return <Badge className="bg-blue-500">Forwarded</Badge>
      case "dispensed":
        return <Badge className="bg-gray-500">Dispensed</Badge>
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <PharmacistNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-muted-foreground">Loading prescription details...</p>
        </div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <PharmacistNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Prescription not found</p>
            <Button onClick={() => router.push("/pharmacist/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <PharmacistNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={() => router.push("/pharmacist/dashboard")} variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Prescription Details */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Prescription Details</h2>
                {getStatusBadge(prescription.status)}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Medication</Label>
                  <p className="text-lg font-semibold">{prescription.medication}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Dosage</Label>
                    <p>{prescription.dosage}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Frequency</Label>
                    <p>{prescription.frequency}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Duration</Label>
                    <p>{prescription.duration}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p>{new Date(prescription.date).toLocaleDateString()}</p>
                  </div>
                </div>

                {prescription.availabilityNotes && (
                  <div>
                    <Label className="text-muted-foreground">Availability Notes</Label>
                    <p className="text-sm">{prescription.availabilityNotes}</p>
                  </div>
                )}

                {prescription.pharmacyOrderId && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <Label className="font-semibold">Pharmacy Order</Label>
                    </div>
                    <p className="text-sm">Order ID: {prescription.pharmacyOrderId}</p>
                    <p className="text-sm text-muted-foreground">Delivery ETA: Within 24 hours</p>
                  </div>
                )}

                {/* Audit Trail */}
                {prescription.audit && prescription.audit.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Audit Trail</Label>
                    <div className="space-y-2">
                      {prescription.audit.map((entry, idx) => (
                        <div key={idx} className="text-sm p-2 bg-muted rounded">
                          <p>
                            <span className="font-medium">{entry.action}</span> by {entry.by} at{" "}
                            {new Date(entry.at).toLocaleString()}
                          </p>
                          {entry.notes && <p className="text-muted-foreground mt-1">{entry.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Previous Prescriptions */}
            {previousPrescriptions.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Previous Prescriptions</h3>
                <div className="space-y-3">
                  {previousPrescriptions.map((prev) => (
                    <div key={prev.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{prev.medication}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(prev.date).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(prev.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
              </h3>
              {patient ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{patient.name}</p>
                  </div>
                  {patient.age && (
                    <div>
                      <Label className="text-muted-foreground">Age</Label>
                      <p>{patient.age}</p>
                    </div>
                  )}
                  {patient.bloodType && (
                    <div>
                      <Label className="text-muted-foreground">Blood Type</Label>
                      <p>{patient.bloodType}</p>
                    </div>
                  )}
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Allergies</Label>
                      <p>{patient.allergies.join(", ")}</p>
                    </div>
                  )}
                  {patient.address && (
                    <div>
                      <Label className="text-muted-foreground">Address</Label>
                      <p>{patient.address}</p>
                    </div>
                  )}
                  {patient.phone && (
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p>{patient.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Patient information not available</p>
              )}
            </Card>

            {/* Actions */}
            {prescription.status === "pending" || prescription.status === "unavailable" ? (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button onClick={handleMarkAvailable} className="w-full gap-2" disabled={updating}>
                    <CheckCircle className="w-4 h-4" />
                    Mark Available
                  </Button>
                  <Button
                    onClick={() => setShowUnavailableDialog(true)}
                    variant="destructive"
                    className="w-full gap-2"
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4" />
                    Mark Unavailable
                  </Button>
                  <Button
                    onClick={() => setShowForwardDialog(true)}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={updating}
                  >
                    <Truck className="w-4 h-4" />
                    Forward to Pharmacy
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {/* Forward Dialog */}
      <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward to Pharmacy</DialogTitle>
            <DialogDescription>Select a pharmacy for home delivery</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Pharmacy</Label>
              <Select value={selectedPharmacyId} onValueChange={setSelectedPharmacyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pharmacy" />
                </SelectTrigger>
                <SelectContent>
                  {pharmacies.length > 0 ? (
                    pharmacies.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No pharmacies available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the order..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForwardDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleForward} disabled={updating || !selectedPharmacyId}>
                {updating ? "Forwarding..." : "Forward Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unavailable Dialog */}
      <Dialog open={showUnavailableDialog} onOpenChange={setShowUnavailableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Unavailable</DialogTitle>
            <DialogDescription>Please provide a reason for unavailability</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Out of stock, requires special order..."
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUnavailableDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkUnavailable} disabled={updating || !notes.trim()} variant="destructive">
                {updating ? "Updating..." : "Mark Unavailable"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

