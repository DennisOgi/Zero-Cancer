# ZeroCancer - Quick Start Testing Guide

**Last Updated:** April 9, 2026  
**Environment:** Local Development  
**Backend:** http://localhost:8787  
**Frontend:** http://localhost:3002

---

## 🚀 Quick Start

### 1. Servers Running
- ✅ Backend: http://localhost:8787
- ✅ Frontend: http://localhost:3002
- ✅ Database: Seeded with comprehensive test data

### 2. Test Accounts Ready

All accounts are **pre-verified** and ready to use immediately!

---

## 👤 Test Accounts

### Patients (3 accounts)

| Email | Password | Profile | Status |
|-------|----------|---------|--------|
| testpatient1@example.com | password123 | Patient | ✅ Verified |
| testpatient2@example.com | testpass456 | Patient | ✅ Verified |
| testpatient3@example.com | demo789 | Patient | ✅ Verified |

**What they have:**
- Waitlist entries (9 total)
- 5 matched allocations
- 3 appointments booked
- Notifications received

---

### Donors (3 accounts)

| Email | Password | Profile | Status |
|-------|----------|---------|--------|
| testdonor1@example.com | password123 | Donor | ✅ Verified |
| testdonor2@example.com | testpass456 | Donor | ✅ Verified |
| testdonor3@example.com | demo789 | Donor | ✅ Verified |

**What they have:**
- 6 funded campaigns (₦2.3M total)
- Mix of targeted and general campaigns
- Patients helped: 5 allocations
- Transaction history

---

### Cancer Centers (7 centers)

| Email | Password | Location | Status |
|-------|----------|----------|--------|
| center1@zerocancer.org | centerpass | Lagos - Ikeja | ✅ Active |
| center2@zerocancer.org | centerpass | Lagos - Surulere | ✅ Active |
| center3@zerocancer.org | centerpass | Ogun - Abeokuta South | ✅ Active |
| center4@zerocancer.org | centerpass | FCT - Gwagwalada | ✅ Active |
| center5@zerocancer.org | centerpass | Kano - Nasarawa | ✅ Active |
| center6@zerocancer.org | centerpass | Enugu - Nsukka | ✅ Active |
| center7@zerocancer.org | centerpass | Sokoto - Wamako | ✅ Active |

**What they have:**
- 5 appointments scheduled
- 1 completed appointment with results
- Staff members (2 per center)
- Screening services configured

---

### Center Staff (14 staff members)

**Pattern:** `staff{N}a@zerocancer.africa` / `staffpass` (admin role)  
**Pattern:** `staff{N}b@zerocancer.africa` / `staffpass` (nurse role)

Examples:
- staff1a@zerocancer.africa / staffpass (admin at Center 1)
- staff1b@zerocancer.africa / staffpass (nurse at Center 1)
- staff2a@zerocancer.africa / staffpass (admin at Center 2)
- ... (continues for all 7 centers)

---

### Admins (2 accounts)

| Email | Password | Role |
|-------|----------|------|
| ttaiwo4910@gmail.com | fake.password | Admin |
| raphaelgbaorun@gmail.com | he_wanted_one | Admin |

**What they can do:**
- Trigger waitlist matching
- View all campaigns
- Manage centers
- View analytics
- Approve/reject operations

---

## 🧪 Testing Scenarios

### Scenario 1: Patient Journey (15 minutes)

**Goal:** Test complete patient flow from registration to appointment

1. **Login as Patient**
   ```bash
   POST http://localhost:8787/api/v1/auth/login?actor=patient
   {
     "email": "testpatient1@example.com",
     "password": "password123"
   }
   ```

2. **View Available Screenings**
   ```bash
   GET http://localhost:8787/api/v1/screening-types
   ```

3. **Check Waitlist Status**
   ```bash
   GET http://localhost:8787/api/v1/waitlist/patient
   Authorization: Bearer {token}
   ```

4. **View Matched Allocations**
   - Should see 5 matched entries
   - Check campaign details
   - Verify funding source

5. **View Appointments**
   ```bash
   GET http://localhost:8787/api/v1/appointment/patient
   Authorization: Bearer {token}
   ```

6. **Check Notifications**
   ```bash
   GET http://localhost:8787/api/v1/notifications
   Authorization: Bearer {token}
   ```

**Expected Results:**
- ✅ Login successful
- ✅ See 25 screening types
- ✅ See 3+ waitlist entries
- ✅ See matched allocations
- ✅ See appointments
- ✅ See notifications

---

### Scenario 2: Donor Journey (15 minutes)

**Goal:** Test donor campaign management

1. **Login as Donor**
   ```bash
   POST http://localhost:8787/api/v1/auth/login?actor=donor
   {
     "email": "testdonor1@example.com",
     "password": "password123"
   }
   ```

2. **View My Campaigns**
   ```bash
   GET http://localhost:8787/api/v1/donor/campaigns
   Authorization: Bearer {token}
   ```

3. **View Campaign Details**
   ```bash
   GET http://localhost:8787/api/v1/donor/campaigns/{campaign-id}
   Authorization: Bearer {token}
   ```

4. **Check Impact Metrics**
   - Patients helped
   - Funds allocated
   - Remaining balance

**Expected Results:**
- ✅ Login successful
- ✅ See 2 campaigns
- ✅ See funding details
- ✅ See patients helped (1-2 per campaign)

---

### Scenario 3: Center Journey (15 minutes)

**Goal:** Test center appointment management

1. **Login as Center**
   ```bash
   POST http://localhost:8787/api/v1/auth/login?actor=center
   {
     "email": "center1@zerocancer.org",
     "password": "centerpass"
   }
   ```

2. **View Appointments**
   ```bash
   GET http://localhost:8787/api/v1/appointment/center
   Authorization: Bearer {token}
   ```

3. **View Staff**
   ```bash
   GET http://localhost:8787/api/v1/center/staff
   Authorization: Bearer {token}
   ```

4. **Check Payout Balance**
   ```bash
   GET http://localhost:8787/api/v1/payouts/center/{center-id}/balance
   Authorization: Bearer {token}
   ```

**Expected Results:**
- ✅ Login successful
- ✅ See appointments
- ✅ See staff members
- ✅ See payout information

---

### Scenario 4: Admin Journey (15 minutes)

**Goal:** Test admin operations and matching trigger

1. **Login as Admin**
   ```bash
   POST http://localhost:8787/api/v1/admin/login
   {
     "email": "ttaiwo4910@gmail.com",
     "password": "fake.password"
   }
   ```

2. **View Analytics**
   ```bash
   GET http://localhost:8787/api/v1/analytics/overview
   Authorization: Bearer {token}
   ```

3. **View Matching Stats**
   ```bash
   GET http://localhost:8787/api/v1/waitlist/matching-stats
   Authorization: Bearer {token}
   ```

4. **Trigger Manual Matching**
   ```bash
   POST http://localhost:8787/api/v1/waitlist/manual-trigger
   Authorization: Bearer {token}
   ```

5. **View Results**
   - Check execution logs
   - Verify new allocations
   - Check notifications sent

**Expected Results:**
- ✅ Login successful
- ✅ See system analytics
- ✅ See matching statistics
- ✅ Matching executes successfully
- ✅ New allocations created (if pending waitlists exist)

---

### Scenario 5: Matching Algorithm Test (20 minutes)

**Goal:** Test the intelligent matching system

**Setup:**
1. Login as patient (testpatient2)
2. Join a new waitlist for "Breast Cancer Screening"

**Execute:**
1. Login as admin
2. Trigger manual matching
3. Check execution logs

**Verify:**
1. New allocation created
2. Campaign balance decremented
3. Waitlist status changed to MATCHED
4. Notification sent to patient
5. Matching execution record created

**Expected Behavior:**
- Algorithm processes PENDING waitlists
- Finds best matching campaign (demographic/geographic targeting)
- Falls back to general pool if needed
- Creates allocation atomically
- Sends notifications

---

## 📊 Test Data Overview

### Screening Types (25 total)

**Cancer (5):**
- Cervical Cancer Screening
- Breast Cancer Screening
- Prostate Cancer Screening
- Colorectal Cancer Screening
- Skin Cancer Screening

**Vaccine (5):**
- Polio, Hepatitis B, HPV, COVID-19, Measles

**General (5):**
- Blood Pressure, Diabetes, Vision, Cholesterol, Liver Function

**Treatment (5):**
- Antiretroviral, Malaria, Tuberculosis, Typhoid, Pneumonia

**Screening (5):**
- BMI, Hearing, Mental Health, Dental, Allergy

### Campaigns (6 funded)

**Targeted Campaigns (4):**
- Women aged 30-50 in Lagos
- Specific screening types
- ₦500,000 each

**General Campaigns (2):**
- No demographic restrictions
- Multiple screening types
- ₦300,000 each

**General Donor Pool:**
- ₦1,000,000 available
- Fallback for unmatched patients

### Waitlists & Allocations

- **Total Waitlists:** 9 entries
- **Matched:** 5 allocations
- **Pending:** 4 entries (ready for matching)
- **Patients with matches:** 3

### Appointments

- **Total:** 5 appointments
- **Free (donation-funded):** 3
- **Paid:** 2
- **Completed:** 1 (with results)
- **Scheduled:** 4

---

## 🐛 Known Issues

### 1. Email Verification (RESOLVED for test accounts)
- **Issue:** New registrations require email verification
- **Status:** Test accounts are pre-verified ✅
- **Workaround:** Use provided test accounts

### 2. Payment Integration (NEEDS SETUP)
- **Issue:** Paystack requires API keys
- **Status:** Mock data created, real payments untested
- **Workaround:** Use test data, skip payment flows

### 3. File Uploads (NEEDS SETUP)
- **Issue:** Cloudinary requires credentials
- **Status:** API implemented, uploads untested
- **Workaround:** Skip result upload testing

### 4. Center Activation
- **Issue:** New centers start as INACTIVE
- **Status:** Test centers are ACTIVE ✅
- **Workaround:** Use provided test centers

---

## 🔧 Troubleshooting

### Backend Not Responding
```bash
# Check if backend is running
curl http://localhost:8787/api/v1/healthz

# Restart backend
cd apps/backend
pnpm dev
```

### Frontend Not Loading
```bash
# Check if frontend is running
# Should be on http://localhost:3002

# Restart frontend
cd apps/frontend
pnpm dev
```

### Database Issues
```bash
# Reset and reseed database
cd apps/backend
pnpm prisma:reset
pnpm db:seed
pnpm tsx src/lib/test-seed.ts
```

### Authentication Errors
- Check token expiry (5 minutes)
- Use refresh endpoint if needed
- Verify actor parameter in login URL

---

## 📝 API Testing Tools

### Recommended Tools
1. **Postman** - Full-featured API client
2. **Thunder Client** (VS Code) - Lightweight extension
3. **curl** - Command line testing
4. **Insomnia** - Alternative to Postman

### Sample Postman Collection
Create a collection with these requests:

**Authentication:**
- POST Login Patient
- POST Login Donor
- POST Login Center
- POST Login Admin
- POST Refresh Token
- POST Logout

**Patient:**
- GET Screening Types
- POST Join Waitlist
- GET My Waitlists
- GET My Appointments
- GET My Notifications

**Donor:**
- GET My Campaigns
- GET Campaign Details
- POST Create Campaign (needs Paystack)
- PATCH Update Campaign
- POST Fund Campaign (needs Paystack)

**Center:**
- GET Center Appointments
- POST Verify Check-in
- POST Upload Results (needs Cloudinary)
- GET Staff List

**Admin:**
- GET Analytics
- POST Trigger Matching
- GET Matching Stats
- GET All Campaigns
- GET All Centers

---

## 🎯 Success Criteria

### Authentication ✅
- [x] All 4 user types can login
- [x] JWT tokens generated correctly
- [x] Refresh tokens work
- [x] Logout clears cookies

### Patient Features ✅
- [x] Can view screening types
- [x] Can join waitlists
- [x] Can view waitlist status
- [x] Can see matched allocations
- [x] Can view appointments
- [x] Can receive notifications

### Donor Features ✅
- [x] Can view campaigns
- [x] Can see campaign details
- [x] Can see patients helped
- [ ] Can create campaigns (needs Paystack)
- [ ] Can fund campaigns (needs Paystack)

### Center Features ✅
- [x] Can view appointments
- [x] Can view staff
- [x] Can check payout balance
- [ ] Can verify check-ins (needs testing)
- [ ] Can upload results (needs Cloudinary)

### Admin Features ✅
- [x] Can view analytics
- [x] Can trigger matching
- [x] Can view matching stats
- [x] Can manage campaigns
- [x] Can manage centers

### Matching Algorithm ✅
- [x] Processes pending waitlists
- [x] Applies demographic targeting
- [x] Applies geographic targeting
- [x] Falls back to general pool
- [x] Creates allocations
- [x] Sends notifications
- [x] Updates campaign balances

---

## 📞 Support

### Issues Found?
Document in the format:
```
**Issue:** Brief description
**Steps to Reproduce:** 1, 2, 3...
**Expected:** What should happen
**Actual:** What actually happened
**Account Used:** testpatient1@example.com
**Endpoint:** POST /api/v1/...
```

### Questions?
- Check INVESTIGATION_REPORT.md for detailed analysis
- Check TEST_RESULTS.md for feature status
- Review API code in apps/backend/src/api/

---

**Happy Testing! 🎉**

Remember: All test accounts are pre-verified and ready to use. No email verification needed!
