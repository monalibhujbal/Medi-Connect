# Pharmacist Feature Documentation

## Overview

This document describes the pharmacist feature implementation for MediConnect, including database changes, API endpoints, frontend pages, and testing instructions.

## Database Changes

### Users Table
- Added `"pharmacist"` to the `role` enum: `"patient" | "physician" | "receptionist" | "pharmacist"`

### Prescriptions Table
New fields added:
- `status?: "pending" | "available" | "unavailable" | "forwarded" | "dispensed"`
- `pharmacistId?: string` - ID of pharmacist who updated/assigned
- `pharmacyOrderId?: string | null` - ID from partner pharmacy
- `availabilityNotes?: string | null` - Notes about availability
- `audit?: Array<{ by: string; at: string; action: string; notes?: string }>` - Audit trail

### New Tables

#### Pharmacies
```typescript
{
  id: string
  name: string
  endpointUrl?: string
  apiKey?: string
  supportedDeliveryHours?: string
  createdAt: string
}
```

#### Pharmacy Orders
```typescript
{
  id: string
  prescriptionId: string
  pharmacyId: string
  status: "created" | "dispatched" | "delivered" | "failed"
  eta: string
  patient: { name, address, phone }
  items: Array<{ name, quantity }>
  createdAt: string
  updatedAt: string
}
```

## API Endpoints

### 1. GET /api/pharmacists
List all pharmacist users.

**Authorization:** Receptionist, Physician, or Pharmacist

**Response:**
```json
[
  {
    "id": "pharm_123",
    "name": "John Pharmacist",
    "email": "pharmacist@test.com",
    "role": "pharmacist",
    "contact": "1234567890",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
]
```

### 2. POST /api/pharmacists
Create a new pharmacist user.

**Authorization:** Receptionist or Physician

**Request Body:**
```json
{
  "name": "John Pharmacist",
  "email": "pharmacist@test.com",
  "password": "password123",
  "contact": "1234567890"
}
```

**Response:** 201 Created with pharmacist object (without password)

### 3. GET /api/pharmacists/:id/prescriptions?status=pending
Get prescriptions visible to a pharmacist, filtered by status.

**Authorization:** Pharmacist (own ID) or Receptionist/Physician

**Query Parameters:**
- `status` (optional): `pending` | `available` | `unavailable` | `forwarded` | `dispensed`
- Default: `pending` (shows unassigned prescriptions)

**Response:**
```json
[
  {
    "id": "pres_123",
    "patientId": "pat_456",
    "medication": "Paracetamol 500mg",
    "dosage": "10 tablets",
    "frequency": "Twice daily",
    "duration": "5 days",
    "status": "pending",
    "patient": { "id": "pat_456", "name": "Alice", "age": 30 },
    "physician": { "id": "doc_789", "name": "Dr. Smith" }
  }
]
```

### 4. PUT /api/prescriptions/:id/status
Update prescription status.

**Authorization:** Pharmacist only

**Request Body:**
```json
{
  "status": "available" | "unavailable" | "forwarded" | "dispensed",
  "pharmacistId": "pharm_123",
  "notes": "All meds in stock",
  "pharmacyId": "pharmacy_1"  // Required if status is "forwarded"
}
```

**Response:** Updated prescription object

**Behavior:**
- Updates prescription status and adds audit entry
- If status is "forwarded", creates pharmacy order and stores `pharmacyOrderId`
- Creates notification for patient

### 5. POST /api/pharmacy/orders
Create a pharmacy order (internal route).

**Authorization:** Pharmacist

**Request Body:**
```json
{
  "prescriptionId": "pres_123",
  "pharmacyId": "pharmacy_1",
  "patient": {
    "name": "Alice",
    "address": "123 Main St",
    "phone": "9999999999"
  },
  "items": [
    { "name": "Paracetamol 500mg", "quantity": 10 }
  ]
}
```

**Response:**
```json
{
  "orderId": "ph_ord_1234567890_abc123",
  "status": "created",
  "eta": "2025-01-16T10:00:00.000Z",
  "message": "Order created successfully. Delivery within 24 hours."
}
```

### 6. POST /api/pharmacy/webhook
Webhook endpoint for partner pharmacy updates (optional).

**Request Body:**
```json
{
  "orderId": "ph_ord_1234567890_abc123",
  "status": "dispatched" | "delivered" | "failed",
  "message": "Order dispatched"
}
```

**Response:** Success message

### 7. GET /api/pharmacies
List all pharmacies.

**Authorization:** Authenticated user

**Response:**
```json
[
  {
    "id": "pharmacy_1",
    "name": "MediCare Pharmacy",
    "endpointUrl": "https://api.medicare-pharmacy.com/orders",
    "supportedDeliveryHours": "09:00-21:00"
  }
]
```

## Frontend Pages

### /pharmacist/dashboard
- Lists prescriptions grouped by status
- Filter by status: pending, available, forwarded, unavailable, dispensed
- Each prescription card shows: patient name, medication, dosage, date, status badge
- "View" button to see full details

### /pharmacist/prescription/[id]
- Full prescription details
- Patient information sidebar
- Previous prescriptions list
- Action buttons:
  - **Mark Available**: Sets status to "available"
  - **Mark Unavailable**: Opens dialog to enter reason
  - **Forward to Pharmacy**: Opens dialog to select pharmacy and create order
- Audit trail display
- Pharmacy order information (if forwarded)

## Authentication

Pharmacist users can:
- Login via `/auth/login` (role: "pharmacist")
- Access `/pharmacist/dashboard` and `/pharmacist/prescription/[id]`
- Only pharmacists can access pharmacist-specific endpoints

## Notifications

When prescription status changes:
- **Available**: "Your prescription for [medication] is now available for pickup."
- **Unavailable**: "Your prescription for [medication] is currently unavailable. [reason]"
- **Forwarded**: "Your prescription for [medication] is being prepared for home delivery. Delivery ETA: [time]."
- **Dispensed**: "Your prescription for [medication] has been dispensed."

## Mock Pharmacy Integration

The system uses a mock pharmacy integration module (`lib/pharmacy-integration.ts`).

**Environment Variable:**
- `SIMULATE_PHARMACY` (default: `true`) - Set to `false` to disable simulation

**Behavior:**
- Simulates API delay (500ms)
- 90% success rate
- Returns order ID, status, and ETA (24 hours from creation)

## Testing with cURL

### 1. Create a Pharmacist
```bash
curl -X POST http://localhost:3000/api/pharmacists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Pharmacist",
    "email": "pharmacist@test.com",
    "password": "password123",
    "contact": "1234567890"
  }'
```

### 2. Login as Pharmacist
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pharmacist@test.com",
    "password": "password123"
  }'
```

Save the token from response.

### 3. Get Pharmacist's Prescriptions
```bash
curl -X GET "http://localhost:3000/api/pharmacists/PHARMACIST_ID/prescriptions?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Mark Prescription as Available
```bash
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "available",
    "pharmacistId": "PHARMACIST_ID",
    "notes": "All meds in stock"
  }'
```

### 5. Forward Prescription to Pharmacy
```bash
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "forwarded",
    "pharmacistId": "PHARMACIST_ID",
    "pharmacyId": "pharmacy_1",
    "notes": "Patient requested home delivery"
  }'
```

### 6. Create Pharmacy Order (Internal)
```bash
curl -X POST http://localhost:3000/api/pharmacy/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prescriptionId": "pres_123",
    "pharmacyId": "pharmacy_1",
    "patient": {
      "name": "Alice",
      "address": "123 Main St",
      "phone": "9999999999"
    },
    "items": [
      { "name": "Paracetamol 500mg", "quantity": 10 }
    ]
  }'
```

### 7. Simulate Pharmacy Webhook
```bash
curl -X POST http://localhost:3000/api/pharmacy/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ph_ord_1234567890_abc123",
    "status": "dispatched",
    "message": "Order dispatched"
  }'
```

### 8. Get Pharmacies List
```bash
curl -X GET http://localhost:3000/api/pharmacies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Test Cases

### Test 1: Create Pharmacist
1. POST `/api/pharmacists` with valid data
2. Verify 201 response
3. Verify user has role "pharmacist"
4. Verify email uniqueness check

### Test 2: Forward Prescription
1. Create a prescription (via physician)
2. Pharmacist marks as "forwarded" with pharmacyId
3. Verify prescription status updated
4. Verify pharmacy order created
5. Verify patient notification created
6. Verify audit entry added

### Test 3: Authorization
1. Try to access pharmacist endpoints without pharmacist role
2. Verify 403 Forbidden response

### Test 4: Prescription Status Flow
1. Prescription starts as "pending"
2. Pharmacist marks "available" → verify status and notification
3. Pharmacist marks "unavailable" with reason → verify status and notification
4. Pharmacist forwards to pharmacy → verify order creation and notification

## Environment Variables

```env
SIMULATE_PHARMACY=true  # Set to false to disable mock integration
```

## File Structure

```
app/
  api/
    pharmacists/
      route.ts
      [id]/
        prescriptions/
          route.ts
    prescriptions/
      [id]/
        status/
          route.ts
    pharmacy/
      orders/
        route.ts
      webhook/
        route.ts
    pharmacies/
      route.ts
  pharmacist/
    dashboard/
      page.tsx
    prescription/
      [id]/
        page.tsx
components/
  pharmacist-nav.tsx
lib/
  auth.ts
  pharmacy-integration.ts
  db.ts (updated)
```

## Notes

- All timestamps are in ISO 8601 format
- Currency is in ₹ (Indian Rupees)
- Mock pharmacy integration simulates 24-hour delivery
- Audit trail records all status changes with user ID and timestamp
- Notifications are stored in `db.notifications` and accessible via existing notification system

