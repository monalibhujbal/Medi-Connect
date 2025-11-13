// This replaces mock data and provides persistent storage simulation
// In production, replace with MongoDB

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: "patient" | "physician" | "receptionist" | "pharmacist"
  licenseNumber?: string
  specialization?: string
  classification?: "general" | "specialist" | "consultant" | "senior_consultant" | "super_specialist"
  createdAt: Date
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  physicianId: string
  physicianName: string
  date: string
  time: string
  type: "regular" | "emergency" | "follow-up" | "routine-checkup"
  status: "pending" | "confirmed" | "completed" | "cancelled"
  notes: string
  paymentStatus: "pending" | "completed" | "failed"
  paymentId?: string
  paymentAmount: number
  createdAt: Date
}

export interface Payment {
  id: string
  appointmentId: string
  patientId: string
  patientName: string
  physicianId: string
  physicianName: string
  amount: number
  status: "pending" | "completed" | "failed"
  paymentMethod: string
  transactionId: string
  confirmedAt?: Date
  createdAt: Date
}

export interface PhysicianSchedule {
  id: string
  physicianId: string
  date: string
  startTime: string
  endTime: string
  slotDuration: number // in minutes
  isAvailable: boolean
}

// Persistent storage arrays (global scope for API routes)
export const users: User[] = [
  {
    id: "1",
    name: "John Patient",
    email: "patient@test.com",
    password: "password123",
    role: "patient",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Dr. Jane Smith",
    email: "doctor@test.com",
    password: "password123",
    role: "physician",
    licenseNumber: "MD123456",
    specialization: "Cardiology",
    classification: "specialist",
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Mary Receptionist",
    email: "receptionist@test.com",
    password: "password123",
    role: "receptionist",
    createdAt: new Date(),
  },
]

export const appointments: Appointment[] = [
  {
    id: "apt1",
    patientId: "1",
    patientName: "John Patient",
    physicianId: "2",
    physicianName: "Dr. Jane Smith",
    date: "2025-01-15",
    time: "10:00 AM",
    type: "regular",
    status: "confirmed",
    notes: "Follow up for heart condition",
    paymentStatus: "completed",
    paymentId: "pay1",
    paymentAmount: 50,
    createdAt: new Date(),
  },
]

export const payments: Payment[] = [
  {
    id: "pay1",
    appointmentId: "apt1",
    patientId: "1",
    patientName: "John Patient",
    physicianId: "2",
    physicianName: "Dr. Jane Smith",
    amount: 50,
    status: "completed",
    paymentMethod: "UPI",
    transactionId: "TXN123456",
    confirmedAt: new Date(),
    createdAt: new Date(),
  },
]

export const physicianSchedules: PhysicianSchedule[] = [
  {
    id: "sch1",
    physicianId: "2",
    date: "2025-01-15",
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    isAvailable: true,
  },
]
