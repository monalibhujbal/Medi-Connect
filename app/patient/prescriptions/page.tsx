"use client"

import { useEffect, useState } from "react"
import { PatientNav } from "@/components/patient-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Pill, Download, Calendar, ShoppingCart, RefreshCw, CheckCircle, XCircle, Truck } from "lucide-react"

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
  status?: "pending" | "sent_to_pharmacist" | "available" | "unavailable" | "forwarded" | "ordered" | "dispensed" | "completed"
  pharmacistId?: string
  pharmacyOrderId?: string
  availabilityNotes?: string
  paymentId?: string
  paymentStatus?: string
  deliveryDate?: string
  isReorder?: boolean
  originalPrescriptionId?: string
}

export default function PrescriptionsPage() {
  const [user, setUser] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchPrescriptions()

    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(() => {
      fetchPrescriptions()
    }, 5000)

    // Refresh on window focus
    const handleFocus = () => fetchPrescriptions()
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  const fetchPrescriptions = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/prescriptions?patientId=${user.id}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(data)
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendToPharmacist = async (prescriptionId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/prescriptions/${prescriptionId}/send-to-pharmacist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        alert("Prescription sent to pharmacist successfully!")
        fetchPrescriptions()
      } else {
        const error = await res.json()
        alert(error.message || "Failed to send prescription to pharmacist")
      }
    } catch (error) {
      console.error("Error sending to pharmacist:", error)
      alert("Failed to send prescription to pharmacist")
    }
  }

  const handleReorder = async (prescriptionId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/prescriptions/${prescriptionId}/reorder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        alert("Prescription reordered and sent to pharmacist!")
        fetchPrescriptions()
      } else {
        const error = await res.json()
        alert(error.message || "Failed to reorder prescription")
      }
    } catch (error) {
      console.error("Error reordering:", error)
      alert("Failed to reorder prescription")
    }
  }

  const handleOpenPaymentDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setShowPaymentDialog(true)
  }

  const handlePayment = async () => {
    if (!selectedPrescription || !paymentMethod) {
      alert("Please select a payment method")
      return
    }

    setProcessingPayment(true)
    try {
      const token = localStorage.getItem("token")
      // Calculate amount (mock calculation - in real app, this would come from pharmacy)
      const amount = 500 // Default amount, should be calculated based on medication

      const res = await fetch("/api/payments/medicine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prescriptionId: selectedPrescription.id,
          amount,
          paymentMethod,
          pharmacyOrderId: selectedPrescription.pharmacyOrderId,
        }),
      })

      if (res.ok) {
        alert("Payment successful! Your order will be delivered soon.")
        setShowPaymentDialog(false)
        setSelectedPrescription(null)
        setPaymentMethod("")
        fetchPrescriptions()
      } else {
        const error = await res.json()
        alert(error.message || "Payment failed")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Payment failed")
    } finally {
      setProcessingPayment(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "sent_to_pharmacist":
        return <Badge className="bg-blue-500">Sent to Pharmacist</Badge>
      case "available":
        return <Badge className="bg-green-500">Available</Badge>
      case "unavailable":
        return <Badge className="bg-red-500">Unavailable</Badge>
      case "forwarded":
        return <Badge className="bg-purple-500">Forwarded</Badge>
      case "ordered":
        return <Badge className="bg-indigo-500">Ordered</Badge>
      case "dispensed":
        return <Badge className="bg-gray-500">Dispensed</Badge>
      case "completed":
        return <Badge className="bg-gray-400">Completed</Badge>
      default:
        return <Badge className="bg-gray-300">Unknown</Badge>
    }
  }

  if (!user) return null

  // Separate active and past prescriptions
  const activePrescriptions = prescriptions.filter(
    (p) => !["completed", "dispensed"].includes(p.status || "")
  )
  const pastPrescriptions = prescriptions.filter(
    (p) => ["completed", "dispensed"].includes(p.status || "")
  )

  return (
    <div className="min-h-screen bg-background">
      <PatientNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold flex items-center gap-2">
                <Pill className="w-8 h-8" />
                Your Prescriptions
              </h1>
              <p className="text-muted-foreground">View and manage your active and past prescriptions</p>
            </div>
            <Button onClick={fetchPrescriptions} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading prescriptions...</p>
            </Card>
          ) : (
            <>
              {/* Active Prescriptions */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Active Prescriptions ({activePrescriptions.length})</h2>
                {activePrescriptions.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active prescriptions</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {activePrescriptions.map((prescription) => (
                      <Card key={prescription.id} className="p-6 border-l-4 border-l-primary">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold flex items-center gap-2">
                                {prescription.medication}
                                {prescription.isReorder && (
                                  <Badge variant="outline" className="text-xs">Reorder</Badge>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(prescription.date).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(prescription.status)}
                          </div>

                          <div className="grid md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Dosage</p>
                              <p className="font-semibold">{prescription.dosage}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Frequency</p>
                              <p className="font-semibold">{prescription.frequency}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Duration</p>
                              <p className="font-semibold">{prescription.duration}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Issued
                              </p>
                              <p className="font-semibold">{new Date(prescription.date).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {prescription.availabilityNotes && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium">Pharmacist Note: </span>
                                {prescription.availabilityNotes}
                              </p>
                            </div>
                          )}

                          {prescription.deliveryDate && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Truck className="w-4 h-4" />
                              <span>Expected Delivery: {new Date(prescription.deliveryDate).toLocaleDateString()}</span>
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {prescription.status === "pending" && (
                              <Button
                                onClick={() => handleSendToPharmacist(prescription.id)}
                                className="gap-2"
                                size="sm"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Send to Pharmacist
                              </Button>
                            )}

                            {prescription.status === "available" && (
                              <Button
                                onClick={() => handleOpenPaymentDialog(prescription)}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Order Now
                              </Button>
                            )}

                            {prescription.status === "sent_to_pharmacist" && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                Waiting for pharmacist response...
                              </div>
                            )}

                            {prescription.status === "ordered" && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                Order placed - Payment completed
                              </div>
                            )}

                            <Button variant="outline" size="sm" className="gap-2">
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Prescriptions */}
              {pastPrescriptions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Past Prescriptions ({pastPrescriptions.length})</h2>
                  <div className="space-y-3">
                    {pastPrescriptions.map((prescription) => (
                      <Card key={prescription.id} className="p-6 opacity-75">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{prescription.medication}</h3>
                            <p className="text-sm text-muted-foreground">
                              {prescription.dosage} - {new Date(prescription.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(prescription.status)}
                            <Button
                              onClick={() => handleReorder(prescription.id)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Reorder
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>Pay for your medicine order</DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedPrescription.medication}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPrescription.dosage} - {selectedPrescription.frequency}
                </p>
                <p className="text-lg font-bold mt-2">Amount: ₹500</p>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Net Banking">Net Banking</SelectItem>
                    <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePayment} disabled={processingPayment || !paymentMethod}>
                  {processingPayment ? "Processing..." : "Pay ₹500"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
