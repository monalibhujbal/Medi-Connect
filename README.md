# 🏥 Medi-Connect

A full-stack healthcare platform that digitizes the end-to-end clinical workflow — from patient registration and physician consultations to prescription management, pharmacist dispensing, and home delivery coordination.

---

## ✨ Features

- **Multi-Role Authentication** — Separate dashboards and permissions for Patients, Physicians, Receptionists, and Pharmacists
- **Prescription Lifecycle Management** — Create, track, and update prescriptions through `pending → available → forwarded → dispensed` states
- **Pharmacist Portal** — Pharmacists can review prescriptions, mark availability, add notes, and forward to partner pharmacies
- **Pharmacy Order Integration** — Mock pharmacy integration with 24-hour delivery simulation and webhook support
- **Audit Trail** — Every prescription status change is logged with user ID, timestamp, and action
- **Real-time Notifications** — Patients get notified at every stage of their prescription status
- **RESTful API** — Clean, documented API endpoints for all core workflows

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | Next.js API Routes |
| Database | Firebase Firestore (via `lib/db.ts`) |
| Auth | Custom JWT-based auth |
| Testing | cURL-based integration tests |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm

### Installation

````bash
git clone https://github.com/monalibhujbal/Medi-Connect.git
cd Medi-Connect
pnpm install
````

### Environment Variables

Create a `.env.local` file:

````env
SIMULATE_PHARMACY=true   # Set to false to disable mock pharmacy integration
````

### Run Locally

````bash
pnpm dev
````

Open [http://localhost:3000](http://localhost:3000)

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Patient** | View appointments, prescriptions, notifications |
| **Physician** | Create prescriptions, manage consultations |
| **Receptionist** | Register patients, manage appointments |
| **Pharmacist** | Review & update prescription status, forward to pharmacy |

---

## 📋 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pharmacists` | List all pharmacists |
| `POST` | `/api/pharmacists` | Create a pharmacist user |
| `GET` | `/api/pharmacists/:id/prescriptions` | Get prescriptions for a pharmacist |
| `PUT` | `/api/prescriptions/:id/status` | Update prescription status |
| `POST` | `/api/pharmacy/orders` | Create a pharmacy delivery order |
| `POST` | `/api/pharmacy/webhook` | Receive delivery status updates |
| `GET` | `/api/pharmacies` | List partner pharmacies |

See [`CURL_EXAMPLES.md`](./CURL_EXAMPLES.md) for full request/response examples.

---

## 🔄 Prescription Status Flow

````
pending → available    (meds in stock, ready for pickup)
        → unavailable  (out of stock, reason noted)
        → forwarded    (home delivery requested, pharmacy order created)
        → dispensed    (meds handed to patient)
````

---

## 📁 Project Structure

````
app/
├── api/
│   ├── pharmacists/       # Pharmacist user management
│   ├── prescriptions/     # Prescription status updates
│   └── pharmacy/          # Order creation & webhooks
├── pharmacist/
│   ├── dashboard/         # Pharmacist prescription queue
│   └── prescription/[id]/ # Prescription detail & actions
components/
└── pharmacist-nav.tsx
lib/
├── auth.ts
├── db.ts
└── pharmacy-integration.ts
````

---

## 🧪 Testing

See [`CURL_EXAMPLES.md`](./CURL_EXAMPLES.md) for step-by-step API testing with cURL.

---

## 🌐 Currency & Localisation

- Currency: ₹ Indian Rupees
- Timestamps: ISO 8601 format
- Target market: India

---

## 👩‍💻 Author

**Monali Bhujbal**
B.Tech Computer Engineering, VIT Pune
[LinkedIn](https://linkedin.com/in/monalibhujbal) • [GitHub](https://github.com/monalibhujbal)
