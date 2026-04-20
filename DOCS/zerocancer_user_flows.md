# Zerocancer MVP — Core User Flows

This document provides breakdowns of all major user actions across the four core actors (Patient, Donor, Center, Admin). Each flow is written in a step-by-step format for clarity and developer alignment.

---

## 🧍‍♂️ Patient Flows

### 1. Self-Pay Booking Appointments

1. Patient logs in and navigates to `/patient/screening-options`
2. Selects screening type → chooses "Pay and Book"
3. Selects preferred center, date, and time
4. Redirected to Paystack to complete payment
5. On success:
   - Appointment is created
   - Transaction is saved (`type = appointment`)
   - Receipt is generated and shown/downloaded

### 2. Choosing Donation-Based Appointment

1. Patient selects screening type and clicks "Join Waitlist"
2. A `waitlist` record is created (status = `waiting`)
3. System matches with eligible `donation_campaign`
4. If match found:
   - `donation_allocation` created
   - `waitlist.status` updated to `matched`
5. Patient is notified and routed to select center
6. Patient books preferred time/center
7. `appointment` is created and linked to campaign
8. QR/Code is generated for check-in

### 3. Select Center After Match

1. Patient sees list of eligible centers for matched screening
2. Chooses one and schedules a time
3. Creates appointment → QR/Code generated

### 4. Track Appointment Status

- `/patient/appointments` lists:
  - scheduled, in-progress, completed
  - source (self-pay or donation)

### 5. Receive QR/Code for Check-in

- `/patient/qr` shows QR and/or numeric code
- Used by center staff to verify presence

### 6. View Screening Result

- `/patient/results` shows status per appointment
- Completed results are attached from center

### 7. Rejoin a Waitlist

- If eligible again, patient can reapply
- Admin can override cooldowns

### 8. Receipt for Self-pay

- Receipt is auto-generated
- `/patient/receipt/:id` accessible and downloadable

### 9. Contact Support

- Link or embedded widget on key error pages (missing result, unmatched, refund issue)

---

## 💸 Donor Flows

### 1. Anonymous Donation

1. Access `/donor/donate-anonymous`
2. Select screening type and amount
3. Pay via Paystack
4. Transaction saved (`type = donation`)
5. Receipt is emailed
6. Money enters general donation pool (a general donation campaign)

### 2. Register and Create Campaign

1. Donor logs in and visits `/donor/create-campaign`
2. Fills form: demographics, amount, purpose
3. Pays via Paystack
4. `donation_campaign` created and marked active
5. Matching logic is auto-triggered

### 3. Fund Campaign

- Part of campaign creation or campaign top-up
- Same process triggers transaction record and matching

### 4. View Campaign Dashboard

- `/donor/campaigns` and `/donor/campaign/:id`
- Shows usage status, patient count, center links

### 5. See Matched Patients

- Patients shown (name optional, depending on privacy setting)
- Includes appointment & completion status

### 6. Receive Receipts

- Every donation has downloadable receipt
- `/donor/receipts` for history

### 7. Campaign Usage Notifications

- Alert when:
  - No matching patients found
  - Campaign fully used
  - Expired allocations are recycled

### 8. Delete Campaign

- UI allows deletion
- `status = deleted`, funds moved to general pool
- Donor is informed and asked to contact support for refund

### 9. Contact Support

- Embedded support button or ticket system

---

## 🏥 Center Flows

### 1. Register as Service Provider

1. Center applies with services (screenings it can offer), state, LGA
2. Adds bank account and contact info
3. Record saved as `center_profile`
4. Await admin approval

### 2. Add Staff Roles

1. Center admin invites emails via `/center/staff`
2. Staff accepts invite and registers
3. Role (`verifier`) assigned in `center_staff`

### 3. View Appointments

- `/center/appointments`
- Lists patients by status, time, type

### 4. Verify Patient Check-in

- `/center/verify-code`
- Input numeric code or scan QR
- If matched, status becomes `in_progress`
- Saved in `appointment_verifications`

### 5. Upload Result

- `/center/upload-results`
- Pick appointment, enter result, optional notes
- `appointment.status = completed`

### 6. View Historical Results

- `/center/results-history`
- Filter by type, date, outcome

### 7. View Payouts

- `/center/receipt-history`
- Lists donations received, campaigns, appointments
- Monthly breakdown available

---

## 🧑‍💼 Admin Flows

### 1. Approve or Reject Centers

- `/admin/centers`
- View pending applications
- Approve → active in system

### 2. Manage All Users

- `/admin/users`
- Filter by role, activity, location
- Suspend, verify, or delete

### 3. Manage Campaigns

- `/admin/campaigns`
- Update status (deleted, complete)
- Investigate abuse or mismatches

### 4. View Appointments & Results

- `/admin/appointments`
- Global visibility
- Spot delays, incomplete results

### 5. Monitor Waitlists

- `/admin/analytics`
- See hot zones, average wait time, demand trends

### 6. Transactions & Logs

- `/admin/transactions`
- Filter by type, status, donor, center

### 7. Send Payouts

- Manual or automated monthly
- Linked to completed + verified appointments

### 8. Store Management

- `/admin/store`
- Add/edit/delete store items

### 9. Assign Admin Roles (optional)

- `/admin/roles`
- Create finance, support, or moderator roles

### 10. Analytics & Reporting

- `/admin/analytics`
- Graphs, tables, maps, trends

### 11. Receipt Monitoring

- Re-send failed receipts
- Cross-reference receipts with payment gateway
