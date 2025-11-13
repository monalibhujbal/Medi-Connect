"use client"

import { useEffect, useState } from "react"
import { ReceptionistNav } from "@/components/receptionist-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Download, CheckCircle, AlertCircle, RotateCw, RefreshCw } from "lucide-react"

interface Payment {
  id: string
  appointmentId: string
  patientId: string
  patientName: string
  physicianId: string
  physicianName: string
  amount: number
  status: "pending" | "completed" | "failed" | "refunded"
  paymentMethod: string
  transactionId: string
  createdAt: Date
  refund?: {
    amount: number
    timestamp: string
    reason: string
  }

  // NEW
  appointmentStatus?: "pending" | "confirmed" | "rescheduled" | "cancelled"
  appointmentDate?: string
  appointmentTime?: string
}

export default function PaymentsPage() {
  const [user, setUser] = useState<any>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "refunded">("all")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))

    fetchPayments()

    // Auto-refresh payments every 5 seconds to catch refund updates
    const interval = setInterval(() => {
      fetchPayments()
    }, 5000)

    // Also refresh when window gains focus
    const handleFocus = () => {
      fetchPayments()
    }
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/payments?t=${Date.now()}`, { cache: "no-store" })
      const data = await response.json()
      setPayments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[Error fetching payments]:", error)
    } finally {
      setLoading(false)
    }
  }

  // CONFIRM Regular or Rescheduled Appointment
  const handleConfirmPayment = async (paymentId: string, appointmentId: string, isReschedule = false) => {
    try {
      await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          appointmentId,
          action: isReschedule ? "confirmReschedule" : "confirm",
        }),
      })

      fetchPayments()
      alert(isReschedule ? "Rescheduled appointment confirmed!" : "Payment confirmed!")
    } catch (error) {
      alert("Error confirming payment")
    }
  }

  const filteredPayments = payments.filter((p) =>
    filterStatus === "all" ? true : p.status === filterStatus
  )

  // Calculate statistics from ALL payments (not filtered) for accurate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const completedAmount = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0)
  const refundedAmount = payments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + (p.refund?.amount ?? p.amount ?? 0), 0)

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <ReceptionistNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold flex items-center gap-2">
              <CreditCard className="w-8 h-8" />
              Payment Management
            </h1>
            <Button variant="outline" onClick={fetchPayments} className="gap-2">
              <RotateCw className="w-4 h-4" /> Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-3xl font-bold text-primary mt-2">₹{totalAmount}</p>
              <p className="text-xs text-muted-foreground mt-1">{payments.length} transactions</p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">₹{completedAmount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {payments.filter((p) => p.status === "completed").length} transactions
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">₹{pendingAmount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {payments.filter((p) => p.status === "pending").length} transactions
              </p>
            </Card>

            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Refunded</p>
              <p className="text-3xl font-bold text-red-600 mt-2">₹{refundedAmount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {payments.filter((p) => p.status === "refunded").length} transactions
              </p>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {["all", "completed", "pending", "refunded"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                onClick={() => setFilterStatus(status as any)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {/* Payment Table */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No payments found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Physician</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Payment Method</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-t border-border hover:bg-muted/50">
                        <td className="px-6 py-3 text-sm">{payment.patientName}</td>
                        <td className="px-6 py-3 text-sm">{payment.physicianName}</td>

                        <td className="px-6 py-3 text-sm font-semibold">
                          ₹{payment.amount}
                          {payment.status === "refunded" && payment.refund && (
                            <div className="text-xs text-red-600 mt-1">
                              Refunded: ₹{payment.refund.amount}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-3 text-sm">{payment.paymentMethod}</td>

                        <td className="px-6 py-3 text-sm font-mono text-xs">
                          {payment.transactionId}
                        </td>

                        {/* STATUS DISPLAY */}
                        <td className="px-6 py-3 text-sm">
                          <div className="flex items-center gap-2">

                            {/* Confirmed */}
                            {payment.appointmentStatus === "confirmed" && (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-green-600">Confirmed</span>
                              </>
                            )}

                            {/* Pending */}
                            {payment.appointmentStatus === "pending" && (
                              <>
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                                <span className="text-yellow-600">Pending</span>
                              </>
                            )}

                            {/* Rescheduled → Pending Confirmation */}
                            {payment.appointmentStatus === "rescheduled" && (
                              <>
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                <span className="text-orange-600">Rescheduled (Pending)</span>
                              </>
                            )}

                            {/* Refunded */}
                            {payment.status === "refunded" && (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-red-600">Refunded</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* ACTION BUTTONS */}
                        <td className="px-6 py-3 text-sm">
                          {/* Confirm NEW appointment */}
                          {payment.appointmentStatus === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleConfirmPayment(payment.id, payment.appointmentId)
                              }
                            >
                              Confirm
                            </Button>
                          )}

                          {/* Confirm AFTER reschedule */}
                          {payment.appointmentStatus === "rescheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleConfirmPayment(payment.id, payment.appointmentId, true)
                              }
                            >
                              Confirm Reschedule
                            </Button>
                          )}

                          <Button size="sm" variant="ghost" className="ml-2">
                            <Download className="w-4 h-4" />
                          </Button>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
