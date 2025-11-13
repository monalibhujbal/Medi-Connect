# Enhanced Prescription Flow - Implementation Summary

## Overview

This document describes the enhanced prescription flow that allows patients to send prescriptions to pharmacists, order medicines, and make payments, with real-time updates throughout the process.

## Complete Flow

### 1. Physician Creates Prescription
- Physician creates a prescription for a patient
- Prescription is saved with status: `"pending"`
- Prescription automatically appears in patient's prescriptions section (real-time)

### 2. Patient Views Prescription
- Patient navigates to `/patient/prescriptions`
- Sees all prescriptions (active and past)
- Real-time updates every 5 seconds + on window focus
- New prescriptions from physician appear automatically

### 3. Patient Sends to Pharmacist
- Patient clicks "Send to Pharmacist" button on pending prescription
- Prescription status changes to `"sent_to_pharmacist"`
- Pharmacist receives notification
- Prescription appears in pharmacist dashboard under "Patient Requests"

### 4. Pharmacist Reviews Prescription
- Pharmacist views prescription in dashboard
- Can mark as:
  - **Available**: Medicines in stock
  - **Unavailable**: Medicines not available (with reason)
  - **Forward to Pharmacy**: For home delivery

### 5. Patient Receives Availability Update
- If **Available**:
  - Patient receives notification
  - Delivery date is set (24 hours from now)
  - "Order Now" button appears on prescription
- If **Unavailable**:
  - Patient receives notification with reason
  - Prescription shows unavailable status

### 6. Patient Orders Medicines
- Patient clicks "Order Now" button
- Payment dialog opens
- Patient selects payment method (UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery)
- Payment is processed
- Prescription status changes to `"ordered"`
- Patient receives confirmation notification

### 7. Reorder Functionality
- Past prescriptions (completed/dispensed) show "Reorder" button
- Patient clicks "Reorder"
- New prescription is created based on original
- Automatically sent to pharmacist
- Pharmacist receives notification

## API Endpoints

### Patient Endpoints

#### Send Prescription to Pharmacist
```
POST /api/prescriptions/:id/send-to-pharmacist
Authorization: Bearer <patient_token>
```

**Response:**
```json
{
  "id": "pres_123",
  "status": "sent_to_pharmacist",
  "sentToPharmacistAt": "2025-01-15T10:00:00.000Z",
  "message": "Prescription sent to pharmacist successfully"
}
```

#### Reorder Prescription
```
POST /api/prescriptions/:id/reorder
Authorization: Bearer <patient_token>
```

**Response:**
```json
{
  "id": "pres_456",
  "status": "sent_to_pharmacist",
  "isReorder": true,
  "originalPrescriptionId": "pres_123",
  "message": "Prescription reordered and sent to pharmacist"
}
```

#### Get Patient Prescriptions
```
GET /api/prescriptions?patientId=<patient_id>
Authorization: Bearer <patient_token>
```

#### Pay for Medicine
```
POST /api/payments/medicine
Authorization: Bearer <patient_token>
Body: {
  "prescriptionId": "pres_123",
  "amount": 500,
  "paymentMethod": "UPI",
  "pharmacyOrderId": "ph_ord_123" // optional
}
```

### Pharmacist Endpoints

#### Get Prescriptions (includes sent_to_pharmacist)
```
GET /api/pharmacists/:id/prescriptions?status=pending
Authorization: Bearer <pharmacist_token>
```

**Note:** Status "pending" now includes both `"pending"` and `"sent_to_pharmacist"` statuses.

#### Update Prescription Status
```
PUT /api/prescriptions/:id/status
Authorization: Bearer <pharmacist_token>
Body: {
  "status": "available" | "unavailable" | "forwarded",
  "pharmacistId": "pharm_123",
  "notes": "All medicines in stock",
  "pharmacyId": "pharmacy_1" // required if status is "forwarded"
}
```

## Prescription Status Flow

```
pending
  ↓ (patient sends)
sent_to_pharmacist
  ↓ (pharmacist marks)
available → (patient orders) → ordered → dispensed
  ↓
unavailable
  ↓
forwarded → dispensed
```

## Real-Time Updates

### Patient Prescriptions Page
- **Polling**: Fetches prescriptions every 5 seconds
- **Window Focus**: Refreshes when user returns to tab
- **Manual Refresh**: "Refresh" button available

### Notifications
- Patient receives notifications for:
  - Prescription available
  - Prescription unavailable
  - Order confirmation
  - Delivery updates
- Pharmacist receives notifications for:
  - New prescription from patient
  - Reorder requests

## Payment Flow

1. Patient clicks "Order Now" on available prescription
2. Payment dialog opens
3. Patient selects payment method
4. Payment is processed via `/api/payments/medicine`
5. Payment record created with type: `"medicine"`
6. Prescription status updated to `"ordered"`
7. Patient receives confirmation notification

## Database Changes

### Prescription Fields Added
- `sentToPharmacistAt`: Timestamp when sent to pharmacist
- `deliveryDate`: Expected delivery date (set when marked available)
- `paymentId`: Reference to payment record
- `paymentStatus`: Payment status
- `orderedAt`: Timestamp when order placed
- `isReorder`: Boolean flag for reordered prescriptions
- `originalPrescriptionId`: Reference to original prescription (for reorders)

### Payment Type
- Added `type: "medicine"` to payment records
- Medicine payments linked to prescriptions via `prescriptionId`

## UI Features

### Patient Prescriptions Page
- ✅ Real-time prescription list
- ✅ "Send to Pharmacist" button for pending prescriptions
- ✅ "Order Now" button for available prescriptions
- ✅ "Reorder" button for past prescriptions
- ✅ Payment dialog with multiple payment methods
- ✅ Status badges with color coding
- ✅ Delivery date display
- ✅ Pharmacist notes display
- ✅ Download prescription option

### Pharmacist Dashboard
- ✅ "Patient Requests" filter tab
- ✅ Shows prescriptions sent by patients
- ✅ Status badges
- ✅ View prescription details
- ✅ Update availability

## Testing Checklist

- [ ] Physician creates prescription → appears in patient's list
- [ ] Patient sends prescription to pharmacist → pharmacist receives notification
- [ ] Pharmacist marks as available → patient sees "Order Now" button
- [ ] Patient orders medicines → payment processed → status updated
- [ ] Pharmacist marks as unavailable → patient sees reason
- [ ] Patient reorders past prescription → new prescription created
- [ ] Real-time updates work (polling + focus)
- [ ] Notifications are created correctly
- [ ] Payment records are created with correct type

## Future Enhancements

1. **Pricing**: Calculate medicine prices dynamically
2. **Inventory**: Track medicine stock levels
3. **Delivery Tracking**: Real-time delivery status updates
4. **Prescription Images**: Upload/download prescription images
5. **Multiple Medicines**: Support for prescriptions with multiple medicines
6. **Prescription History**: Detailed history view
7. **Auto-refresh**: WebSocket/SSE for real-time updates
8. **Email/SMS**: Send notifications via email/SMS

