# Quick Start Guide - Pharmacist Feature

## Getting Started

### 1. Start the Development Server

```bash
npm run dev
# or
pnpm dev
```

The app will be available at `http://localhost:3000`

### 2. Create a Pharmacist User

**Option A: Via Frontend (Receptionist)**
1. Login as receptionist: `receptionist@test.com` / `password123`
2. Navigate to receptionist dashboard
3. Use API endpoint to create pharmacist (see below)

**Option B: Via API (cURL)**
```bash
# First, login as receptionist to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"receptionist@test.com","password":"password123"}'

# Copy the token, then create pharmacist
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

### 3. Login as Pharmacist

1. Go to `http://localhost:3000/auth/login`
2. Login with pharmacist credentials
3. You'll be redirected to `/pharmacist/dashboard`

### 4. Test the Feature

#### View Pending Prescriptions
- Dashboard shows all pending prescriptions
- Filter by status using the buttons

#### Mark Prescription as Available
1. Click "View" on a prescription
2. Click "Mark Available" button
3. Prescription status updates
4. Patient receives notification

#### Forward to Pharmacy
1. Click "View" on a prescription
2. Click "Forward to Pharmacy"
3. Select a pharmacy from dropdown
4. Add optional notes
5. Click "Forward Order"
6. Pharmacy order is created
7. Patient receives notification with ETA

#### Mark as Unavailable
1. Click "View" on a prescription
2. Click "Mark Unavailable"
3. Enter reason (required)
4. Click "Mark Unavailable"
5. Patient receives notification with reason

## Sample Data Setup

### Create a Prescription (via Physician)

1. Login as physician: `doctor@test.com` / `password123`
2. Go to physician dashboard
3. Create a prescription for a patient
4. The prescription will appear as "pending" for pharmacists

### Verify Pharmacies Exist

Pharmacies are auto-seeded when you first call `/api/pharmacies`. You can also create them manually:

```bash
curl -X POST http://localhost:3000/api/pharmacies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "MediCare Pharmacy",
    "endpointUrl": "https://api.medicare-pharmacy.com/orders",
    "supportedDeliveryHours": "09:00-21:00"
  }'
```

## Testing Checklist

- [ ] Create pharmacist user
- [ ] Login as pharmacist
- [ ] View pending prescriptions
- [ ] Mark prescription as available
- [ ] Mark prescription as unavailable
- [ ] Forward prescription to pharmacy
- [ ] Verify patient notification created
- [ ] Verify audit trail updated
- [ ] Test webhook (simulate order dispatch)
- [ ] Test authorization (non-pharmacist cannot update status)

## Common Issues

### "Unauthorized" Error
- Make sure you're logged in
- Check that token is being sent in Authorization header
- Verify user role is "pharmacist"

### "No prescriptions found"
- Make sure there are prescriptions in the database
- Check that prescriptions have status "pending" or no status
- Verify pharmacist ID is correct

### "Pharmacy not found"
- Call `/api/pharmacies` to seed sample pharmacies
- Or create a pharmacy manually

### Frontend not loading
- Check browser console for errors
- Verify API endpoints are working
- Check network tab for failed requests

## Next Steps

1. Read `PHARMACIST_FEATURE.md` for complete documentation
2. See `CURL_EXAMPLES.md` for API testing
3. Review `tests/pharmacist.test.md` for test cases

## Support

For issues or questions:
1. Check the documentation files
2. Review the test cases
3. Check browser console and network tab
4. Verify database state in localStorage (dev tools)

