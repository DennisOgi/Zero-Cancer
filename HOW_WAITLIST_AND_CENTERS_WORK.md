# How Waitlists and Centers Work in ZeroCancer

## 📋 Overview

The ZeroCancer platform connects **patients who need cancer screenings** with **donors who fund them** through an intelligent **waitlist matching system**. Cancer centers provide the actual screening services.

---

## 🔄 The Complete Flow

```
Patient → Joins Waitlist → Matching Algorithm → Matched with Donor Campaign → 
Books Appointment → Goes to Center → Gets Screening → Center Gets Paid
```

---

## 👥 How the Waitlist Works

### 1. Patient Joins Waitlist

**What happens:**
- Patient browses available screening types (25 types: cancer screenings, vaccines, general health checks)
- Patient clicks "Join Waitlist" for a specific screening (e.g., "Breast Cancer Screening")
- System creates a waitlist entry with status `PENDING`
- Patient is added to the queue (First Come, First Served)

**Example:**
```javascript
// Patient joins waitlist for Breast Cancer Screening
POST /api/v1/waitlist/patient/join
{
  "screeningTypeId": "bb52f453-623d-4699-82b5-0fd6a41bf1cc"
}

// Response:
{
  "ok": true,
  "data": {
    "waitlist": {
      "id": "a72022d5-c94f-4f2f-b083-d2c071cf7d7f",
      "screeningTypeId": "bb52f453-623d-4699-82b5-0fd6a41bf1cc",
      "patientId": "1913af98-154d-4928-bc68-91189a14b477",
      "status": "PENDING",  // Waiting to be matched
      "joinedAt": "2026-04-09T16:45:00.000Z"
    }
  }
}
```

### 2. Matching Algorithm Runs

**When it runs:**
- Automatically every hour (scheduled)
- Manually triggered by admin
- Via webhook when new donations arrive

**What it does:**
1. Finds all `PENDING` waitlist entries
2. Groups them by screening type
3. For each patient, finds the best matching donor campaign
4. Creates allocation and changes status to `MATCHED`
5. Sends notification to patient

**Matching Rules:**

```javascript
// Priority order for matching:
1. Check patient eligibility:
   - Has fewer than 3 unclaimed allocations
   - Not already matched for this screening type
   
2. Find suitable campaigns:
   - Campaign must be ACTIVE
   - Campaign must have available funds
   - Campaign must support this screening type
   
3. Apply targeting (if enabled):
   - Demographic: Age, Gender
   - Geographic: State, LGA (Local Government Area)
   - Income level
   
4. Prioritize campaigns:
   - Most specific targeting (better match = higher priority)
   - Highest available funding
   - Oldest campaign first
   
5. Fallback to General Donor Pool if no targeted campaign matches
```

**Example Matching:**
```javascript
// Patient: Female, Age 35, Lagos State, Ikeja LGA
// Screening: Breast Cancer Screening (₦10,000)

// Available Campaigns:
Campaign A: "Women's Health Fund"
  - Target: Females aged 30-50 in Lagos
  - Available: ₦500,000
  - Targeting Score: 50 (age + gender + state match)
  
Campaign B: "General Health Fund"
  - Target: Anyone, anywhere
  - Available: ₦300,000
  - Targeting Score: 0 (no targeting)
  
General Pool: "General Donor Pool"
  - Target: Anyone, anywhere
  - Available: ₦1,000,000
  - Targeting Score: 0 (fallback only)

// Result: Patient matched to Campaign A (best targeting match)
```

### 3. Patient Gets Matched

**What happens:**
- Waitlist status changes from `PENDING` → `MATCHED`
- Donation allocation created linking patient to campaign
- Campaign's available amount decremented by screening cost
- Patient receives notification: "You've been matched!"
- Patient can now book an appointment

**Database Changes:**
```sql
-- Waitlist updated
UPDATE Waitlist 
SET status = 'MATCHED' 
WHERE id = 'patient-waitlist-id';

-- Allocation created
INSERT INTO DonationAllocation (
  waitlistId, patientId, campaignId, 
  amountAllocated, createdViaMatching
) VALUES (
  'waitlist-id', 'patient-id', 'campaign-id',
  10000, true
);

-- Campaign updated
UPDATE DonationCampaign 
SET availableAmount = availableAmount - 10000
WHERE id = 'campaign-id';
```

### 4. Patient Books Appointment

**What happens:**
- Patient views their matched allocations
- Patient selects a cancer center (from list of centers offering this screening)
- Patient picks a date/time
- System creates appointment with `isDonation: true` (free for patient)
- Check-in code generated for verification

**Example:**
```javascript
POST /api/v1/appointment/book
{
  "screeningTypeId": "bb52f453-623d-4699-82b5-0fd6a41bf1cc",
  "centerId": "34a40fdb-0866-4750-8394-6ba27ff6e930",
  "appointmentDateTime": "2026-04-20T10:00:00.000Z",
  "isDonation": true,  // Free appointment (donor-funded)
  "allocationId": "9f855211-343e-4cc2-b41c-ccbb86dbdb80"
}

// Response:
{
  "ok": true,
  "data": {
    "appointment": {
      "id": "appointment-id",
      "checkInCode": "ABC123",  // Patient shows this at center
      "checkInCodeExpiresAt": "2026-04-21T10:00:00.000Z",
      "status": "SCHEDULED"
    }
  }
}
```

---

## 🏥 How Centers Work

### 1. Center Registration

**What centers provide:**
- Center name and location (state, LGA, address)
- Contact information (email, phone)
- Bank account details (for payouts)
- List of screening services they offer
- Pricing for each service

**Example:**
```javascript
{
  "centerName": "Lagos Cancer Screening Center",
  "state": "Lagos",
  "lga": "Ikeja",
  "address": "123 Health Street",
  "email": "center@example.com",
  "phone": "+234-123-456-7890",
  "services": [
    {
      "screeningTypeId": "breast-cancer-screening-id",
      "amount": 10000  // ₦10,000 per screening
    },
    {
      "screeningTypeId": "cervical-cancer-screening-id",
      "amount": 12000  // ₦12,000 per screening
    }
  ],
  "bankAccount": "1234567890",
  "bankName": "GTBank",
  "bankCode": "058"
}
```

### 2. Center Receives Appointments

**What centers see:**
- List of all scheduled appointments
- Patient information (name, contact)
- Screening type requested
- Appointment date/time
- Check-in code for verification
- Payment status (free/donation-funded vs paid)

**Center Dashboard:**
```javascript
GET /api/v1/appointment/center

// Response:
{
  "appointments": [
    {
      "id": "appointment-id",
      "patient": {
        "fullName": "Jane Doe",
        "phone": "+234-xxx-xxx-xxxx"
      },
      "screeningType": {
        "name": "Breast Cancer Screening"
      },
      "appointmentDateTime": "2026-04-20T10:00:00.000Z",
      "isDonation": true,  // Donor-funded (center will be paid by platform)
      "checkInCode": "ABC123",
      "status": "SCHEDULED"
    }
  ]
}
```

### 3. Patient Arrives at Center

**Check-in Process:**
1. Patient arrives and provides check-in code: "ABC123"
2. Center staff enters code in system
3. System verifies:
   - Code is valid and not expired
   - Appointment exists and is scheduled
   - Patient identity matches
4. Appointment status changes to `IN_PROGRESS`
5. Center performs screening

**Check-in API:**
```javascript
POST /api/v1/appointment/center/verify
{
  "checkInCode": "ABC123"
}

// Response:
{
  "ok": true,
  "data": {
    "appointment": {
      "id": "appointment-id",
      "patient": { "fullName": "Jane Doe" },
      "screeningType": { "name": "Breast Cancer Screening" },
      "isDonation": true,
      "status": "IN_PROGRESS"
    }
  }
}
```

### 4. Center Completes Screening

**What happens:**
1. Center performs the screening
2. Center uploads results (PDF, images, lab reports)
3. Center marks appointment as `COMPLETED`
4. Patient receives notification with results
5. Center becomes eligible for payout

**Complete Appointment:**
```javascript
POST /api/v1/appointment/center/:id/complete
{
  "notes": "Screening completed successfully. No abnormalities detected.",
  "resultFiles": [
    {
      "fileName": "mammogram_results.pdf",
      "fileUrl": "https://cloudinary.com/...",
      "fileType": "application/pdf"
    }
  ]
}

// Response:
{
  "ok": true,
  "data": {
    "appointment": {
      "status": "COMPLETED",
      "completedAt": "2026-04-20T11:30:00.000Z"
    }
  }
}
```

### 5. Center Gets Paid

**Payout Process:**

**For Donation-Funded Appointments:**
- Platform pays center from donor campaign funds
- Payout amount = agreed screening price (e.g., ₦10,000)
- Processed automatically or manually by admin

**For Paid Appointments:**
- Patient pays directly via Paystack
- Platform takes small commission (e.g., 5%)
- Remaining amount goes to center

**Payout Flow:**
```javascript
// Center checks payout balance
GET /api/v1/payouts/center/:centerId/balance

// Response:
{
  "ok": true,
  "data": {
    "availableBalance": 50000,  // ₦50,000 available
    "pendingBalance": 20000,    // ₦20,000 pending (appointments in progress)
    "totalEarned": 200000       // ₦200,000 total earned
  }
}

// Center requests payout
POST /api/v1/payouts/request
{
  "amount": 50000,
  "bankAccount": "1234567890"
}

// Platform processes payout via Paystack
// Money transferred to center's bank account
```

---

## 📊 Key Metrics & Tracking

### For Patients:
- Waitlist position and status
- Matched allocations
- Upcoming appointments
- Screening history
- Notifications

### For Donors:
- Total amount donated
- Number of patients helped
- Campaign performance
- Funds remaining
- Impact metrics

### For Centers:
- Total appointments
- Completed screenings
- Revenue earned
- Pending payouts
- Patient ratings

### For Admins:
- Total users (patients, donors, centers)
- Matching success rate
- Total funds allocated
- System health
- Campaign analytics

---

## 🎯 Example Complete Journey

### Scenario: Sarah needs a Breast Cancer Screening

**Day 1 - Sarah joins waitlist:**
```
1. Sarah logs in as patient
2. Browses screening types
3. Clicks "Join Waitlist" for Breast Cancer Screening
4. Status: PENDING
5. Receives confirmation: "You're on the waitlist!"
```

**Day 1 (1 hour later) - Matching algorithm runs:**
```
1. Algorithm finds Sarah's PENDING waitlist entry
2. Checks Sarah's profile: Female, 35, Lagos, Ikeja
3. Finds matching campaign: "Women's Health Fund"
   - Target: Females 30-50 in Lagos
   - Available: ₦500,000
4. Creates allocation: ₦10,000 from campaign to Sarah
5. Updates waitlist status: PENDING → MATCHED
6. Sends notification: "You've been matched!"
```

**Day 2 - Sarah books appointment:**
```
1. Sarah sees notification
2. Views matched allocation
3. Selects "Lagos Cancer Screening Center"
4. Picks date: April 20, 10:00 AM
5. Appointment created with check-in code: "ABC123"
6. Receives confirmation SMS and email
```

**Day 10 (April 20) - Sarah goes to center:**
```
1. Sarah arrives at center
2. Shows check-in code: "ABC123"
3. Center verifies code in system
4. Center performs mammogram screening
5. Center uploads results
6. Marks appointment as COMPLETED
7. Sarah receives results notification
```

**Day 11 - Center gets paid:**
```
1. Center's available balance increases by ₦10,000
2. Center requests payout
3. Platform transfers ₦10,000 to center's bank
4. Donor sees impact: "1 patient helped"
```

---

## 💡 Key Features

### Intelligent Matching
- **Demographic targeting**: Match patients by age, gender
- **Geographic targeting**: Match patients by state, LGA
- **Income-based**: Prioritize low-income patients
- **Campaign specificity**: More specific campaigns get priority
- **Fallback system**: General pool ensures everyone gets matched

### Patient Protection
- **Max 3 unclaimed allocations**: Prevents hoarding
- **No duplicate matches**: Can't be matched twice for same screening
- **Expiry system**: Unclaimed allocations expire after 30 days
- **Funds returned**: Expired allocations return funds to campaign

### Center Benefits
- **Guaranteed payment**: Donation-funded appointments are pre-paid
- **Automated payouts**: Streamlined payment process
- **Patient flow**: Steady stream of patients
- **No bad debt**: Platform handles all payments

### Donor Transparency
- **Real-time tracking**: See exactly who you helped
- **Impact metrics**: Number of patients, screenings completed
- **Targeting control**: Choose who to help (demographics, location)
- **Fund management**: Track spending and remaining balance

---

## 🔐 Security & Verification

### Check-in Codes
- Generated for each appointment
- Expire 24 hours after appointment time
- One-time use only
- Prevents fraud and double-booking

### Payment Security
- Paystack integration for secure payments
- Bank account verification for centers
- Automated reconciliation
- Audit trail for all transactions

### Data Privacy
- Patient information only shared with assigned center
- Donor information kept confidential
- HIPAA-compliant result storage
- Encrypted data transmission

---

## 📈 System Performance

### Current Metrics (from testing):
- **Matching Success Rate**: 55.56%
- **Average Matching Time**: 23ms
- **Center Utilization**: 71.43%
- **Total Revenue**: ₦1,300,000
- **Active Campaigns**: 7
- **Active Centers**: 7
- **Patients Helped**: 5

### Scalability:
- Batch processing: 50 patients per screening type
- Parallel processing: 5 screening types concurrently
- Database optimization: Single query for all waitlist data
- Notification batching: Reduces API calls

---

## 🚀 Future Enhancements

1. **Real-time matching**: Match patients instantly when donations arrive
2. **AI-powered scheduling**: Optimize appointment times
3. **Telemedicine integration**: Remote consultations
4. **Mobile app**: Better patient experience
5. **SMS notifications**: Reach patients without internet
6. **Multi-language support**: Serve diverse populations
7. **Insurance integration**: Accept insurance payments
8. **Referral system**: Patients refer other patients

---

## 📞 Support

For questions about:
- **Waitlist**: Check patient dashboard or contact support
- **Centers**: View center directory or call center directly
- **Donations**: Visit donor dashboard or contact admin
- **Technical issues**: Contact platform support

---

**Last Updated**: April 9, 2026  
**Version**: 2.0  
**Status**: Production Ready
