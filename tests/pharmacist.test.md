# Pharmacist Feature Test Cases

This document outlines test cases for the pharmacist feature. These can be implemented as Jest tests or manual test scenarios.

## Test Setup

Before running tests, ensure:
1. Database is initialized with sample data
2. At least one pharmacist user exists
3. At least one prescription exists
4. At least one pharmacy exists

## Test 1: Create Pharmacist User

**Description:** Verify that a pharmacist user can be created by authorized staff.

**Steps:**
1. Login as receptionist or physician
2. POST `/api/pharmacists` with:
   ```json
   {
     "name": "Test Pharmacist",
     "email": "test.pharmacist@test.com",
     "password": "password123",
     "contact": "1234567890"
   }
   ```

**Expected Results:**
- Status: 201 Created
- Response contains pharmacist object (without password)
- User can login with created credentials
- User role is "pharmacist"

**Edge Cases:**
- Duplicate email → 409 Conflict
- Missing required fields → 400 Bad Request
- Unauthorized user → 401 Unauthorized
- Non-staff user → 403 Forbidden

## Test 2: Pharmacist Authentication

**Description:** Verify pharmacist can login and access pharmacist routes.

**Steps:**
1. POST `/api/auth/login` with pharmacist credentials
2. Verify token is returned
3. Access `/api/pharmacists/:id/prescriptions` with token

**Expected Results:**
- Login successful with token
- Can access pharmacist endpoints
- Redirected to `/pharmacist/dashboard` on frontend

## Test 3: List Pharmacist Prescriptions

**Description:** Verify pharmacist can view pending prescriptions.

**Steps:**
1. Login as pharmacist
2. GET `/api/pharmacists/:id/prescriptions?status=pending`
3. Verify response includes prescriptions with patient and physician info

**Expected Results:**
- Status: 200 OK
- Response is array of prescriptions
- Each prescription includes patient and physician details
- Only pending/unassigned prescriptions are returned

## Test 4: Mark Prescription as Available

**Description:** Verify pharmacist can mark prescription as available.

**Steps:**
1. Login as pharmacist
2. Get a pending prescription ID
3. PUT `/api/prescriptions/:id/status` with:
   ```json
   {
     "status": "available",
     "pharmacistId": "PHARMACIST_ID",
     "notes": "All medications in stock"
   }
   ```

**Expected Results:**
- Status: 200 OK
- Prescription status updated to "available"
- `pharmacistId` set to pharmacist ID
- `availabilityNotes` set
- Audit entry added
- Patient notification created

## Test 5: Mark Prescription as Unavailable

**Description:** Verify pharmacist can mark prescription as unavailable with reason.

**Steps:**
1. Login as pharmacist
2. PUT `/api/prescriptions/:id/status` with:
   ```json
   {
     "status": "unavailable",
     "pharmacistId": "PHARMACIST_ID",
     "notes": "Out of stock, requires special order"
   }
   ```

**Expected Results:**
- Status: 200 OK
- Prescription status updated to "unavailable"
- Notes saved
- Patient notification includes reason

## Test 6: Forward Prescription to Pharmacy

**Description:** Verify pharmacist can forward prescription and create pharmacy order.

**Steps:**
1. Login as pharmacist
2. Get a pharmacy ID from `/api/pharmacies`
3. PUT `/api/prescriptions/:id/status` with:
   ```json
   {
     "status": "forwarded",
     "pharmacistId": "PHARMACIST_ID",
     "pharmacyId": "pharmacy_1",
     "notes": "Patient requested home delivery"
   }
   ```

**Expected Results:**
- Status: 200 OK
- Prescription status updated to "forwarded"
- `pharmacyOrderId` set
- Pharmacy order created in database
- Order has status "created" and ETA (24 hours)
- Patient notification includes delivery ETA

## Test 7: Pharmacy Order Creation

**Description:** Verify pharmacy order is created correctly.

**Steps:**
1. Forward a prescription (Test 6)
2. Verify order exists in database
3. Check order details match prescription

**Expected Results:**
- Order ID is generated
- Order status is "created"
- ETA is 24 hours from creation
- Order linked to prescription via `prescriptionId`

## Test 8: Pharmacy Webhook

**Description:** Verify webhook updates order and prescription status.

**Steps:**
1. Create a pharmacy order (via forwarding)
2. POST `/api/pharmacy/webhook` with:
   ```json
   {
     "orderId": "ORDER_ID",
     "status": "dispatched",
     "message": "Order dispatched"
   }
   ```

**Expected Results:**
- Status: 200 OK
- Order status updated to "dispatched"
- Prescription audit entry added
- Patient notification created

**Test with "delivered" status:**
- Order status updated to "delivered"
- Prescription status updated to "dispensed"
- Patient notification created

## Test 9: Authorization Checks

**Description:** Verify only pharmacists can access pharmacist endpoints.

**Test Cases:**
1. Patient tries to access `/api/pharmacists/:id/prescriptions` → 403 Forbidden
2. Patient tries to update prescription status → 403 Forbidden
3. Receptionist can list pharmacists → 200 OK
4. Receptionist cannot update prescription status → 403 Forbidden

## Test 10: Prescription Audit Trail

**Description:** Verify all status changes are logged in audit trail.

**Steps:**
1. Mark prescription as available
2. Mark as unavailable
3. Forward to pharmacy
4. Check prescription audit array

**Expected Results:**
- Each status change has audit entry
- Each entry includes: `by`, `at`, `action`, `notes` (if provided)
- Entries are in chronological order

## Test 11: Patient Notifications

**Description:** Verify patients receive notifications for status changes.

**Steps:**
1. Update prescription status (available/unavailable/forwarded)
2. GET `/api/notifications?userId=PATIENT_ID`

**Expected Results:**
- Notification created for each status change
- Notification type is "prescription" or "pharmacy"
- Notification message includes medication name and relevant details
- Notification is unread initially

## Test 12: Frontend Dashboard

**Description:** Verify pharmacist dashboard displays prescriptions correctly.

**Steps:**
1. Login as pharmacist
2. Navigate to `/pharmacist/dashboard`
3. Test filter buttons (pending/available/forwarded/etc.)
4. Click "View" on a prescription

**Expected Results:**
- Dashboard loads without errors
- Prescriptions displayed in cards
- Status badges show correct colors
- Filter buttons work correctly
- "View" button navigates to detail page

## Test 13: Frontend Prescription Detail

**Description:** Verify prescription detail page shows all information.

**Steps:**
1. Navigate to `/pharmacist/prescription/:id`
2. Verify all prescription details displayed
3. Verify patient information sidebar
4. Test action buttons

**Expected Results:**
- All prescription fields displayed
- Patient information shown
- Previous prescriptions listed
- Action buttons work correctly
- Dialogs open/close properly

## Test 14: Forward Dialog

**Description:** Verify forward to pharmacy dialog works.

**Steps:**
1. Open prescription detail page
2. Click "Forward to Pharmacy"
3. Select pharmacy from dropdown
4. Add optional notes
5. Submit

**Expected Results:**
- Dialog opens
- Pharmacy list populated
- Can select pharmacy
- Can add notes
- Order created on submit
- Dialog closes after success
- Page refreshes with updated status

## Test 15: Error Handling

**Description:** Verify error handling for edge cases.

**Test Cases:**
1. Forward without selecting pharmacy → Error message
2. Mark unavailable without reason → Error message
3. Update non-existent prescription → 404 Not Found
4. Invalid status value → 400 Bad Request
5. Network error → Error message displayed

## Integration Test Flow

**Complete Flow:**
1. Receptionist creates pharmacist user
2. Pharmacist logs in
3. Pharmacist views pending prescriptions
4. Pharmacist marks prescription as available
5. Patient receives notification
6. Pharmacist forwards another prescription
7. Pharmacy order created
8. Webhook updates order to "dispatched"
9. Patient receives dispatch notification
10. Webhook updates order to "delivered"
11. Prescription status updated to "dispensed"
12. Patient receives delivery notification

**Expected:** All steps complete successfully with proper notifications and audit trails.

