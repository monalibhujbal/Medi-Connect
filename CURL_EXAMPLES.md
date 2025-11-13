# cURL Examples for Pharmacist Feature

This document provides ready-to-use cURL commands for testing the pharmacist feature.

## Prerequisites

1. Start your Next.js development server: `npm run dev` or `pnpm dev`
2. Base URL: `http://localhost:3000`
3. Replace placeholders like `YOUR_TOKEN`, `PHARMACIST_ID`, etc. with actual values

## Authentication

### Login as Receptionist (to create pharmacist)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "receptionist@test.com",
    "password": "password123"
  }'
```

Save the `token` from the response.

### Login as Pharmacist
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pharmacist@test.com",
    "password": "password123"
  }'
```

## Pharmacist Management

### 1. Create a Pharmacist
```bash
curl -X POST http://localhost:3000/api/pharmacists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RECEPTIONIST_TOKEN" \
  -d '{
    "name": "John Pharmacist",
    "email": "pharmacist@test.com",
    "password": "password123",
    "contact": "1234567890"
  }'
```

**Expected Response:**
```json
{
  "id": "pharm_1234567890",
  "name": "John Pharmacist",
  "email": "pharmacist@test.com",
  "role": "pharmacist",
  "contact": "1234567890",
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

### 2. List All Pharmacists
```bash
curl -X GET http://localhost:3000/api/pharmacists \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Pharmacy Management

### 3. Get List of Pharmacies
```bash
curl -X GET http://localhost:3000/api/pharmacies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
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

### 4. Create a Pharmacy (Admin/Receptionist only)
```bash
curl -X POST http://localhost:3000/api/pharmacies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RECEPTIONIST_TOKEN" \
  -d '{
    "name": "New Pharmacy",
    "endpointUrl": "https://api.new-pharmacy.com/orders",
    "apiKey": "api_key_123",
    "supportedDeliveryHours": "08:00-20:00"
  }'
```

## Prescription Management

### 5. Get Pharmacist's Prescriptions (Pending)
```bash
curl -X GET "http://localhost:3000/api/pharmacists/PHARMACIST_ID/prescriptions?status=pending" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN"
```

**Replace `PHARMACIST_ID` with actual pharmacist ID from step 1.**

### 6. Get Pharmacist's Prescriptions (All Statuses)
```bash
# Available
curl -X GET "http://localhost:3000/api/pharmacists/PHARMACIST_ID/prescriptions?status=available" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN"

# Forwarded
curl -X GET "http://localhost:3000/api/pharmacists/PHARMACIST_ID/prescriptions?status=forwarded" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN"

# Unavailable
curl -X GET "http://localhost:3000/api/pharmacists/PHARMACIST_ID/prescriptions?status=unavailable" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN"
```

### 7. Get Single Prescription Details
```bash
curl -X GET "http://localhost:3000/api/prescriptions?id=PRESCRIPTION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Prescription Status Updates

### 8. Mark Prescription as Available
```bash
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN" \
  -d '{
    "status": "available",
    "pharmacistId": "PHARMACIST_ID",
    "notes": "All medications are in stock and ready for pickup"
  }'
```

**Expected Response:**
```json
{
  "id": "pres_123",
  "status": "available",
  "pharmacistId": "pharm_1234567890",
  "availabilityNotes": "All medications are in stock and ready for pickup",
  "audit": [
    {
      "by": "pharm_1234567890",
      "at": "2025-01-15T10:30:00.000Z",
      "action": "Status changed to available",
      "notes": "All medications are in stock and ready for pickup"
    }
  ]
}
```

### 9. Mark Prescription as Unavailable
```bash
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN" \
  -d '{
    "status": "unavailable",
    "pharmacistId": "PHARMACIST_ID",
    "notes": "Out of stock. Requires special order. Expected delivery in 3-5 business days."
  }'
```

### 10. Forward Prescription to Pharmacy
```bash
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN" \
  -d '{
    "status": "forwarded",
    "pharmacistId": "PHARMACIST_ID",
    "pharmacyId": "pharmacy_1",
    "notes": "Patient requested home delivery"
  }'
```

**Expected Response:**
```json
{
  "id": "pres_123",
  "status": "forwarded",
  "pharmacistId": "pharm_1234567890",
  "pharmacyOrderId": "ph_ord_1234567890_abc123",
  "availabilityNotes": "Patient requested home delivery",
  "orderEta": "2025-01-16T10:30:00.000Z",
  "audit": [
    {
      "by": "pharm_1234567890",
      "at": "2025-01-15T10:30:00.000Z",
      "action": "Status changed to forwarded",
      "notes": "Patient requested home delivery"
    }
  ]
}
```

### 11. Mark Prescription as Dispensed
```bash
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN" \
  -d '{
    "status": "dispensed",
    "pharmacistId": "PHARMACIST_ID",
    "notes": "Prescription dispensed to patient"
  }'
```

## Pharmacy Orders

### 12. Create Pharmacy Order (Internal)
```bash
curl -X POST http://localhost:3000/api/pharmacy/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN" \
  -d '{
    "prescriptionId": "pres_123",
    "pharmacyId": "pharmacy_1",
    "patient": {
      "name": "Alice Patient",
      "address": "123 Main Street, City, State 12345",
      "phone": "9999999999"
    },
    "items": [
      {
        "name": "Paracetamol 500mg",
        "quantity": 10
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "orderId": "ph_ord_1234567890_abc123",
  "status": "created",
  "eta": "2025-01-16T10:30:00.000Z",
  "message": "Order created successfully. Delivery within 24 hours."
}
```

## Webhook (Pharmacy Partner)

### 13. Simulate Pharmacy Webhook - Order Dispatched
```bash
curl -X POST http://localhost:3000/api/pharmacy/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ph_ord_1234567890_abc123",
    "status": "dispatched",
    "message": "Order has been dispatched and is on its way"
  }'
```

### 14. Simulate Pharmacy Webhook - Order Delivered
```bash
curl -X POST http://localhost:3000/api/pharmacy/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ph_ord_1234567890_abc123",
    "status": "delivered",
    "message": "Order has been delivered successfully"
  }'
```

## Notifications

### 15. Get Patient Notifications
```bash
curl -X GET "http://localhost:3000/api/notifications?userId=PATIENT_ID"
```

## Complete Test Flow

Here's a complete flow to test the entire feature:

```bash
# 1. Login as receptionist
RECEPTIONIST_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"receptionist@test.com","password":"password123"}' | jq -r '.token')

# 2. Create a pharmacist
PHARMACIST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/pharmacists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN" \
  -d '{
    "name": "Test Pharmacist",
    "email": "test.pharmacist@test.com",
    "password": "password123",
    "contact": "1234567890"
  }')

PHARMACIST_ID=$(echo $PHARMACIST_RESPONSE | jq -r '.id')

# 3. Login as pharmacist
PHARMACIST_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.pharmacist@test.com","password":"password123"}' | jq -r '.token')

# 4. Get pharmacies
PHARMACIES=$(curl -s -X GET http://localhost:3000/api/pharmacies \
  -H "Authorization: Bearer $PHARMACIST_TOKEN")

PHARMACY_ID=$(echo $PHARMACIES | jq -r '.[0].id')

# 5. Get pending prescriptions
curl -X GET "http://localhost:3000/api/pharmacists/$PHARMACIST_ID/prescriptions?status=pending" \
  -H "Authorization: Bearer $PHARMACIST_TOKEN"

# 6. Forward a prescription (replace PRESCRIPTION_ID)
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHARMACIST_TOKEN" \
  -d "{
    \"status\": \"forwarded\",
    \"pharmacistId\": \"$PHARMACIST_ID\",
    \"pharmacyId\": \"$PHARMACY_ID\",
    \"notes\": \"Test forwarding\"
  }"
```

## Error Testing

### Test Unauthorized Access
```bash
# Try to access without token
curl -X GET http://localhost:3000/api/pharmacists/PHARMACIST_ID/prescriptions
# Expected: 401 Unauthorized
```

### Test Forbidden Access (Non-Pharmacist)
```bash
# Login as patient and try to update prescription
PATIENT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"password123"}' | jq -r '.token')

curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -d '{"status": "available", "pharmacistId": "pharm_123"}'
# Expected: 403 Forbidden
```

### Test Invalid Status
```bash
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN" \
  -d '{
    "status": "invalid_status",
    "pharmacistId": "PHARMACIST_ID"
  }'
# Expected: 400 Bad Request
```

### Test Missing Pharmacy ID for Forward
```bash
curl -X PUT http://localhost:3000/api/prescriptions/PRESCRIPTION_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PHARMACIST_TOKEN" \
  -d '{
    "status": "forwarded",
    "pharmacistId": "PHARMACIST_ID"
  }'
# Expected: 400 Bad Request - pharmacyId required
```

## Notes

- All timestamps are in ISO 8601 format
- Replace placeholders with actual values from previous responses
- Use `jq` for JSON parsing in bash (install with `brew install jq` or `apt-get install jq`)
- For Windows, use Git Bash or WSL to run these commands
- Token expires when server restarts (in-memory storage)

