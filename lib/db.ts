// Persistent database using localStorage and global state
// In production, replace with MongoDB

export interface Notification {
  id: string
  userId: string
  message: string
  type: "booking" | "cancellation" | "refund" | "reschedule" | "confirmation" | "prescription" | "pharmacy"
  read: boolean
  createdAt: Date
}

// Global in-memory database that persists across requests
let dbStore = {
  users: [
    {
      id: "1",
      name: "John Patient",
      email: "patient@test.com",
      password: "password123",
      role: "patient" as const,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Dr. Jane Smith",
      email: "doctor@test.com",
      password: "password123",
      role: "physician" as const,
      licenseNumber: "MD123456",
      specialization: "Cardiology",
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Mary Receptionist",
      email: "receptionist@test.com",
      password: "password123",
      role: "receptionist" as const,
      createdAt: new Date(),
    },
  ],
  appointments: [] as any[],
  payments: [] as any[],
  notifications: [] as Notification[],
  prescriptions: [] as any[],
  pharmacies: [] as any[],
  pharmacyOrders: [] as any[],
  physicianSchedules: [
    {
      id: "sch1",
      physicianId: "2",
      physicianName: "Dr. Jane Smith",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
    },
  ],
}

// Sync with localStorage
export function getDB() {
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem("db_store") : null
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.log("[v0] localStorage read error, using in-memory db")
  }
  return dbStore
}

export function saveDB(data: any) {
  dbStore = data
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("db_store", JSON.stringify(data))
    }
  } catch (e) {
    console.log("[v0] localStorage write error, keeping in-memory")
  }
}

export function updateDB(updateFn: (db: any) => void) {
  const db = getDB()
  updateFn(db)
  saveDB(db)
  return db
}
