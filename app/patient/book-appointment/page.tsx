"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PatientNav } from "@/components/patient-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Calendar, Clock, User, CreditCard, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getClassificationLabel, getClassificationColor } from "@/lib/physician-utils"

const appointmentTypes = [
  { value: "regular", label: "Regular Check-up", icon: "👨‍⚕️" },
  { value: "emergency", label: "Emergency", icon: "🚨" },
  { value: "follow-up", label: "Follow-up", icon: "📋" },
  { value: "routine-checkup", label: "Routine Check-up", icon: "✅" },
]

const BOOKING_FEE = 50

export default function BookAppointmentPage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [physicians, setPhysicians] = useState<any[]>([])
  const [selectedPhysician, setSelectedPhysician] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<{ time: string; booked: boolean }[]>([])
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [showPayment, setShowPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // 🔄 RESCHEDULE MODE STATES
  const [isReschedule, setIsReschedule] = useState(false)
  const [rescheduleAptId, setRescheduleAptId] = useState<string | null>(null)
  const [preloadingApt, setPreloadingApt] = useState(true)
  const [isReferredBooking, setIsReferredBooking] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))

    fetchPhysicians()
  }, [])

  const fetchPhysicians = async () => {
    try {
      const res = await fetch("/api/physicians", { cache: "no-store" })
      const data = await res.json()
      setPhysicians(data)
    } catch (error) {
      console.error("Error fetching physicians:", error)
    }
  }

  // 🔄 Detect reschedule mode or referral
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const aptId = params.get("reschedule")
    const referredPhysicianId = params.get("referred")

    if (referredPhysicianId) {
      setIsReferredBooking(true)
      // Wait for physicians to load, then pre-select referred physician
      if (physicians.length > 0) {
        const physicianExists = physicians.find((p) => p.id === referredPhysicianId)
        if (physicianExists) {
          setSelectedPhysician(referredPhysicianId)
        } else {
          alert("Referred physician not found. Please select a physician manually.")
        }
      }
      setPreloadingApt(false)
      return
    }

    if (!aptId) {
      setPreloadingApt(false)
      return
    }

    setIsReschedule(true)
    setRescheduleAptId(aptId)

    const loadOldApt = async () => {
      try {
        const res = await fetch(`/api/appointments?appointmentId=${aptId}`)
        const arr = await res.json()
        const apt = arr[0]

        if (!apt) throw new Error("Invalid appointment")

        setSelectedPhysician(apt.physicianId)
        setSelectedType(apt.type)
        setNotes(apt.notes || "")
      } catch (err) {
        console.error(err)
        alert("Could not load appointment for reschedule")
        router.push("/patient/appointments")
      } finally {
        setPreloadingApt(false)
      }
    }

    loadOldApt()
  }, [physicians, router])

  // Fetch available slots
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedPhysician || !selectedDate) return

      try {
        // For emergency appointments, pass emergency=true to show all slots as available
        const isEmergency = selectedType === "emergency"
        const res = await fetch(
          `/api/physicians/schedule?physicianId=${selectedPhysician}&date=${selectedDate}&emergency=${isEmergency}&_=${Date.now()}`,
          { cache: "no-store" }
        )

        if (res.status === 404) {
          setAvailableSlots([])
          return
        }

        const data = await res.json()
        const schedule = Array.isArray(data) ? data[0] : data
        setAvailableSlots(schedule?.slots || [])
      } catch (error) {
        console.error("Error fetching schedule:", error)
        setAvailableSlots([])
      }
    }

    fetchSchedule()
  }, [selectedPhysician, selectedDate, selectedType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPhysician || !selectedDate || !selectedTime || !selectedType) {
      alert("Please fill all fields")
      return
    }

    if (isReschedule) {
      // Skip payment screen
      handlePayment()
      return
    }

    setShowPayment(true)
  }

  // RESCHEDULE + BOOK PAYMENT HANDLER
  const handlePayment = async () => {
    setLoading(true)

    try {
      let appointment
      const physician = physicians.find((p) => p.id === selectedPhysician)

      if (isReschedule && rescheduleAptId) {
        // 🔄 RESCHEDULE API
        const res = await fetch("/api/appointments/reschedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId: rescheduleAptId,
            newDate: selectedDate,
            newTime: selectedTime,
          }),
        })

        appointment = await res.json()

        if (!res.ok) {
          alert(appointment.message || "Unable to reschedule")
          setLoading(false)
          return
        }

        alert("Appointment rescheduled successfully!")
        router.push("/patient/appointments")
        return
      }

      // 🆕 NORMAL BOOKING FLOW
      // Check if this is a referral booking
      const params = new URLSearchParams(window.location.search)
      const referredPhysicianId = params.get("referred")
      let referredByInfo = null

      if (referredPhysicianId && selectedPhysician === referredPhysicianId) {
        // Find the original appointment that had the referral
        const appointmentsRes = await fetch(`/api/appointments?patientId=${user?.id}`)
        const allAppointments = await appointmentsRes.json()
        const referralAppointment = allAppointments.find(
          (apt: any) =>
            apt.referredToPhysicianId === referredPhysicianId &&
            apt.status === "completed"
        )

        if (referralAppointment) {
          referredByInfo = {
            referredByPhysicianId: referralAppointment.referredByPhysicianId,
            referredByPhysicianName: referralAppointment.referredByPhysicianName,
            originalAppointmentId: referralAppointment.id,
          }
        }
      }

      const appointmentRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user?.id,
          patientName: user?.name,
          physicianId: selectedPhysician,
          physicianName: physician?.name,
          date: selectedDate,
          time: selectedTime,
          type: selectedType,
          notes,
          paymentAmount: BOOKING_FEE,
          ...(referredByInfo && {
            referredByPhysicianId: referredByInfo.referredByPhysicianId,
            referredByPhysicianName: referredByInfo.referredByPhysicianName,
            originalAppointmentId: referredByInfo.originalAppointmentId,
          }),
        }),
      })

      appointment = await appointmentRes.json()

      if (!appointmentRes.ok) {
        alert(appointment.message || "Slot already booked")
        setLoading(false)
        return
      }

      // PAYMENT
      const paymentRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          patientId: user?.id,
          patientName: user?.name,
          physicianId: selectedPhysician,
          physicianName: physician?.name,
          amount: BOOKING_FEE,
          paymentMethod,
        }),
      })

      if (paymentRes.ok) {
        setPaymentSuccess(true)
      } else {
        alert("Payment failed")
      }
    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleViewAppointments = () => router.push("/patient/appointments")

  // SUCCESS PAGE
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <PatientNav />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <Card className="p-8 text-center bg-green-50 border border-green-300 space-y-4">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto" />
            <h1 className="text-3xl font-bold text-green-800">Payment Successful</h1>
            <p>Your appointment has been booked</p>
            <Button onClick={handleViewAppointments} className="w-full">View Appointments</Button>
          </Card>
        </main>
      </div>
    )
  }

  // LOADING PRE-RESCHEDULE
  if (preloadingApt) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <p>Loading appointment...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientNav />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">
          {isReschedule ? "Reschedule Appointment" : "Book an Appointment"}
        </h1>

        {/* Referral Notice */}
        {isReferredBooking && selectedPhysician && (
          <Card className="p-4 mb-6 bg-blue-50 border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <User className="w-4 h-4" />
              Booking with Referred Physician
            </p>
            <p className="text-xs text-blue-700 mt-1">
              You are booking an appointment with a physician you were referred to.
            </p>
          </Card>
        )}

        {!showPayment || isReschedule ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SELECT PHYSICIAN */}
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5" /> Select Physician
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {physicians.map((doc) => (
                  <Card
                    key={doc.id}
                    className={`p-4 cursor-pointer ${
                      selectedPhysician === doc.id ? "border-primary bg-primary/5" : ""
                    } ${isReschedule ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !isReschedule && setSelectedPhysician(doc.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">{doc.specialization || "No specialization"}</p>
                      </div>
                      {doc.classification && (
                        <Badge className={`text-xs ${getClassificationColor(doc.classification)}`}>
                          {getClassificationLabel(doc.classification)}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* TYPE */}
            {selectedPhysician && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Appointment Type</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {appointmentTypes.map((type) => (
                    <Card
                      key={type.value}
                      className={`p-4 cursor-pointer ${
                        selectedType === type.value ? "border-primary bg-primary/5" : ""
                      } ${isReschedule ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => !isReschedule && setSelectedType(type.value)}
                    >
                      <div className="text-center space-y-2">
                        <div className="text-3xl">{type.icon}</div>
                        <p className="font-semibold text-sm">{type.label}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* DATE + TIME */}
            {selectedPhysician && selectedType && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Select Date & Time
                </h2>

                {selectedType === "emergency" && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                      🚨 Emergency Appointment
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      All slots are available. Existing appointments will be automatically rescheduled to accommodate your emergency.
                    </p>
                  </div>
                )}

                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

                {selectedDate && (
                  <div>
                    <label className="text-sm font-medium">Available Slots</label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {availableSlots.length === 0 ? (
                        <p className="text-sm text-red-600">No slots available</p>
                      ) : (
                        availableSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            type="button"
                            variant={selectedTime === slot.time ? "default" : "outline"}
                            disabled={slot.booked && selectedType !== "emergency"}
                            onClick={() => setSelectedTime(slot.time)}
                            className={selectedType === "emergency" && slot.booked ? "border-red-300 bg-red-50" : ""}
                          >
                            <Clock className="w-4 h-4" />
                            {slot.time}
                            {selectedType === "emergency" && slot.booked && (
                              <span className="ml-1 text-xs">⚠️</span>
                            )}
                          </Button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* NOTES */}
            {selectedPhysician && selectedType && selectedDate && selectedTime && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-2">Notes</h2>
                <textarea
                  className="w-full border rounded p-2"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Card>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {isReschedule ? "Confirm Reschedule" : "Proceed to Payment"}
            </Button>
          </form>
        ) : (
          /* PAYMENT SCREEN */
          <Card className="p-8 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6" /> Payment for Appointment
            </h2>

            <div className="bg-blue-50 p-4 rounded border">
              <p>Booking Fee</p>
              <p className="text-3xl font-bold">₹{BOOKING_FEE}</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm">Select Payment Method</label>
              {["UPI", "Credit Card", "Debit Card", "Net Banking"].map((method) => (
                <div
                  key={method}
                  className={`p-4 border rounded cursor-pointer ${
                    paymentMethod === method ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setPaymentMethod(method)}
                >
                  <input type="radio" checked={paymentMethod === method} readOnly />
                  <span className="ml-2">{method}</span>
                </div>
              ))}
            </div>

            <Button className="w-full" disabled={!paymentMethod || loading} onClick={handlePayment}>
              Pay ₹{BOOKING_FEE}
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}
