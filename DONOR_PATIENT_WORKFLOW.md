# Donor-Patient Matching Workflow

## Complete User Journey

### Scenario 1: Patient Already Registered (Has Smartphone)

```
┌─────────────────────────────────────────────────────────────────┐
│ DONOR DASHBOARD                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Select Patient to Sponsor                                       │
│  ┌────────────────────────────────────────┐                     │
│  │ Enter Phone Number: +234 801 234 5678 │ [Search]            │
│  └────────────────────────────────────────┘                     │
│                                                                  │
│  ✅ Patient Found!                                               │
│  ┌────────────────────────────────────────────────────┐         │
│  │ Name: Jane Doe                                      │         │
│  │ Location: Lagos, Nigeria                            │         │
│  │ Status: Registered                                  │         │
│  │                                                      │         │
│  │ [Sponsor This Patient]  [Cancel]                    │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Donor clicks "Sponsor This Patient"
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ CONFIRMATION                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Sponsorship Confirmed!                                       │
│                                                                  │
│  You are now sponsoring Jane Doe for cancer screening.          │
│                                                                  │
│  Next Steps:                                                     │
│  1. Jane will be notified of your sponsorship                   │
│  2. She can book an appointment at any center                   │
│  3. You'll be notified when she books                           │
│  4. Payment will be processed automatically                     │
│                                                                  │
│  [View My Sponsored Patients]  [Sponsor Another]                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Notifications sent
         ↓
┌──────────────────────────┐        ┌──────────────────────────┐
│ DONOR NOTIFICATION       │        │ PATIENT NOTIFICATION     │
├──────────────────────────┤        ├──────────────────────────┤
│                          │        │                          │
│ 📧 Email + 🔔 In-App     │        │ 📧 Email + 🔔 In-App     │
│                          │        │                          │
│ You are now sponsoring   │        │ Good news! [Donor Name]  │
│ Jane Doe. She can book   │        │ is sponsoring your free  │
│ her screening anytime.   │        │ cancer screening!        │
│                          │        │                          │
│                          │        │ [Book Appointment Now]   │
│                          │        │                          │
└──────────────────────────┘        └──────────────────────────┘
```

---

### Scenario 2: Patient Not Registered (Has Smartphone)

```
┌─────────────────────────────────────────────────────────────────┐
│ DONOR DASHBOARD                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Select Patient to Sponsor                                       │
│  ┌────────────────────────────────────────┐                     │
│  │ Enter Phone Number: +234 809 876 5432 │ [Search]            │
│  └────────────────────────────────────────┘                     │
│                                                                  │
│  ❌ Patient Not Found                                            │
│  ┌────────────────────────────────────────────────────┐         │
│  │ This phone number is not registered yet.            │         │
│  │                                                      │         │
│  │ Would you like to send an invitation?               │         │
│  │                                                      │         │
│  │ An SMS will be sent with registration link.         │         │
│  │                                                      │         │
│  │ [Send Invitation]  [Cancel]                         │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Donor clicks "Send Invitation"
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ SMS SENT                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Invitation Sent!                                             │
│                                                                  │
│  SMS sent to +234 809 876 5432                                  │
│                                                                  │
│  Status: Pending Registration                                   │
│                                                                  │
│  You'll be notified when they register.                         │
│                                                                  │
│  [View Pending Invitations]  [Invite Another]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ SMS delivered
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ PATIENT'S PHONE (SMS)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  From: ZeroCancer Africa                                        │
│                                                                  │
│  Hello! [Donor Name] has selected you for a FREE cancer         │
│  screening through ZeroCancer Africa.                           │
│                                                                  │
│  Register here: https://zerocancer.app/register/ABC123          │
│                                                                  │
│  Need help? Call our agents at 0800-ZEROCANCER                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Patient clicks link
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ PATIENT REGISTRATION PAGE                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🎉 You've Been Selected for Free Screening!                    │
│                                                                  │
│  Sponsored by: [Donor Name]                                     │
│                                                                  │
│  Complete your registration:                                    │
│  ┌────────────────────────────────────────┐                    │
│  │ Full Name: ________________________    │                    │
│  │ Email: _____________________________   │                    │
│  │ Phone: +234 809 876 5432 (verified)    │                    │
│  │ Date of Birth: ____________________    │                    │
│  │ Gender: [Select]                       │                    │
│  │ State: [Select]                        │                    │
│  │ LGA: [Select]                          │                    │
│  │ Password: _________________________    │                    │
│  └────────────────────────────────────────┘                    │
│                                                                  │
│  [Complete Registration]                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Patient submits form
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ SUCCESS - LINKED TO DONOR                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Registration Complete!                                       │
│                                                                  │
│  You're now linked to [Donor Name] who will sponsor your        │
│  cancer screening.                                              │
│                                                                  │
│  [Book Your Screening Now]  [Go to Dashboard]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Scenario 3: Patient Not Registered (No Smartphone - Agent Assisted)

```
┌─────────────────────────────────────────────────────────────────┐
│ DONOR DASHBOARD                                                  │
├─────────────────────────────────────────────────────────────────┤
│  (Same as Scenario 2 - SMS sent)                                │
└─────────────────────────────────────────────────────────────────┘
         │
         │ SMS delivered
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ PATIENT'S PHONE (SMS)                                            │
├─────────────────────────────────────────────────────────────────┤
│  (Same SMS as Scenario 2)                                        │
│  Need help? Call our agents at 0800-ZEROCANCER                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Patient calls helpline (no smartphone)
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHONE CALL                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📞 Patient: "Hello, I received an SMS about free screening     │
│              but I don't have a smartphone to register."        │
│                                                                  │
│  👤 Agent: "No problem! I can help you register right now.      │
│            What's your phone number?"                           │
│                                                                  │
│  📞 Patient: "+234 809 876 5432"                                │
│                                                                  │
│  👤 Agent: "Great! I see the invitation. Let me help you..."    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Agent opens dashboard
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ AGENT DASHBOARD                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pending Invitations (5)                                         │
│  ┌────────────────────────────────────────────────────┐         │
│  │ Phone: +234 809 876 5432                            │         │
│  │ Donor: [Donor Name]                                 │         │
│  │ Sent: 10 minutes ago                                │         │
│  │ Status: Pending                                     │         │
│  │                                                      │         │
│  │ [Assist Registration]                               │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Agent clicks "Assist Registration"
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ AGENT ASSISTED REGISTRATION FORM                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Registering Patient (Agent: John Smith)                        │
│                                                                  │
│  Invitation Details:                                            │
│  • Donor: [Donor Name]                                          │
│  • Phone: +234 809 876 5432 (verified)                          │
│                                                                  │
│  Patient Information:                                           │
│  ┌────────────────────────────────────────┐                    │
│  │ Full Name: ________________________    │                    │
│  │ Email (optional): __________________   │                    │
│  │ Date of Birth: ____________________    │                    │
│  │ Gender: [Select]                       │                    │
│  │ State: [Select]                        │                    │
│  │ LGA: [Select]                          │                    │
│  │                                         │                    │
│  │ ⚠️ Agent Note: Patient has no email    │                    │
│  │    Will use phone for all contact      │                    │
│  └────────────────────────────────────────┘                    │
│                                                                  │
│  Temporary Password: [Auto-generated]                           │
│  (Will be sent via SMS)                                         │
│                                                                  │
│  [Complete Registration]  [Cancel]                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Agent submits form
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ AGENT CONFIRMATION                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Patient Registered Successfully!                             │
│                                                                  │
│  Patient: Jane Doe                                              │
│  Phone: +234 809 876 5432                                       │
│  Linked to Donor: [Donor Name]                                  │
│                                                                  │
│  Temporary Password: ZC12345678                                 │
│  (SMS sent to patient)                                          │
│                                                                  │
│  Next Steps:                                                    │
│  1. Patient can call center to book appointment                 │
│  2. Or visit center in person                                   │
│  3. Donor will be notified                                      │
│                                                                  │
│  [Next Invitation]  [Back to Dashboard]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Notifications sent
         ↓
┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐
│ DONOR NOTIFICATION       │  │ PATIENT SMS              │  │ AGENT RECORD             │
├──────────────────────────┤  ├──────────────────────────┤  ├──────────────────────────┤
│                          │  │                          │  │                          │
│ 📧 Jane Doe has          │  │ 📱 Registration complete!│  │ ✅ Registration #47      │
│ registered with help     │  │ Your password: ZC1234567 │  │ Agent: John Smith        │
│ from our agent.          │  │ Call center to book:     │  │ Time: 5 minutes          │
│                          │  │ 0800-ZEROCANCER          │  │ Status: Completed        │
│ She can now book her     │  │                          │  │                          │
│ screening!               │  │                          │  │ Total today: 12          │
│                          │  │                          │  │                          │
└──────────────────────────┘  └──────────────────────────┘  └──────────────────────────┘
```

---

## System Flow Diagram

```
┌──────────────┐
│    DONOR     │
│  Dashboard   │
└──────┬───────┘
       │
       │ Enters phone number
       ↓
┌──────────────────────────┐
│  Phone Lookup Service    │
│  (Check Database)        │
└──────┬───────────────────┘
       │
       ├─── Found? ───────────────────────────┐
       │                                      │
       │ Yes                                  │ No
       ↓                                      ↓
┌──────────────────┐              ┌──────────────────────┐
│ Display Patient  │              │  Send SMS Invitation │
│ Details          │              │  (Africa's Talking)  │
└────────┬─────────┘              └──────────┬───────────┘
         │                                   │
         │ Confirm Sponsorship               │ SMS Delivered
         ↓                                   ↓
┌──────────────────┐              ┌──────────────────────┐
│ Create Link      │              │ Patient Receives SMS │
│ Donor ↔ Patient  │              └──────────┬───────────┘
└────────┬─────────┘                         │
         │                                   │
         │                        ┌──────────┴──────────┐
         │                        │                     │
         │                   Has Smartphone?       No Smartphone?
         │                        │                     │
         │                        ↓                     ↓
         │              ┌──────────────────┐  ┌──────────────────┐
         │              │ Self-Registration│  │ Calls Helpline   │
         │              │ via App/Web      │  │                  │
         │              └────────┬─────────┘  └────────┬─────────┘
         │                       │                     │
         │                       │                     ↓
         │                       │            ┌──────────────────┐
         │                       │            │ Agent Dashboard  │
         │                       │            │ (Pending Queue)  │
         │                       │            └────────┬─────────┘
         │                       │                     │
         │                       │                     ↓
         │                       │            ┌──────────────────┐
         │                       │            │ Agent Assisted   │
         │                       │            │ Registration     │
         │                       │            └────────┬─────────┘
         │                       │                     │
         │                       └─────────┬───────────┘
         │                                 │
         │                                 ↓
         │                       ┌──────────────────┐
         │                       │ Patient Created  │
         │                       │ in Database      │
         │                       └────────┬─────────┘
         │                                │
         └────────────────────────────────┘
                                 │
                                 ↓
                       ┌──────────────────┐
                       │ Link Patient to  │
                       │ Donor (Complete) │
                       └────────┬─────────┘
                                │
                                ↓
                       ┌──────────────────┐
                       │ Send Notifications│
                       │ to Both Parties  │
                       └──────────────────┘
```

---

## Key Decision Points

### 1. Patient Found vs Not Found
```
Phone Lookup
    │
    ├─ FOUND → Immediate linking → Done ✅
    │
    └─ NOT FOUND → Send SMS → Wait for registration
```

### 2. Registration Method
```
SMS Received
    │
    ├─ Has Smartphone → Self-register via link → Auto-link ✅
    │
    └─ No Smartphone → Call helpline → Agent assists → Manual link ✅
```

### 3. Agent Assignment
```
Patient Calls
    │
    ├─ Agent Available → Immediate assistance ✅
    │
    └─ Agent Busy → Queue → Callback when available
```

---

## Data Flow

### Patient Lookup Request
```json
POST /api/v1/donor/lookup-patient
{
  "phoneNumber": "+2348098765432",
  "donorId": "donor-123"
}

Response (Found):
{
  "found": true,
  "patient": {
    "id": "patient-456",
    "name": "Jane Doe",
    "location": "Lagos, Nigeria",
    "registered": true
  }
}

Response (Not Found):
{
  "found": false,
  "canInvite": true
}
```

### Send Invitation
```json
POST /api/v1/donor/send-invitation
{
  "phoneNumber": "+2348098765432",
  "donorId": "donor-123"
}

Response:
{
  "invitationId": "inv-789",
  "status": "SENT",
  "smsDelivered": true,
  "message": "SMS sent successfully"
}
```

### Agent Assisted Registration
```json
POST /api/v1/agent/register-patient
{
  "invitationId": "inv-789",
  "agentId": "agent-101",
  "patientData": {
    "fullName": "Jane Doe",
    "phoneNumber": "+2348098765432",
    "dateOfBirth": "1990-01-15",
    "gender": "FEMALE",
    "state": "Lagos",
    "localGovernment": "Ikeja",
    "email": null
  }
}

Response:
{
  "patientId": "patient-456",
  "linkId": "link-999",
  "temporaryPassword": "ZC12345678",
  "smsSent": true
}
```

---

## Timeline Summary

### Immediate (Patient Found)
```
0 min: Donor enters phone → Patient found
1 min: Donor confirms sponsorship
2 min: Link created, notifications sent
✅ DONE
```

### Self-Registration (Patient Not Found, Has Smartphone)
```
0 min: Donor enters phone → Not found
1 min: Donor sends invitation
2 min: SMS delivered
5 min: Patient clicks link
10 min: Patient completes registration
11 min: Auto-linked, notifications sent
✅ DONE
```

### Agent-Assisted (Patient Not Found, No Smartphone)
```
0 min: Donor enters phone → Not found
1 min: Donor sends invitation
2 min: SMS delivered
30 min: Patient calls helpline
31 min: Agent opens dashboard
35 min: Agent completes registration
36 min: Link created, SMS sent with password
✅ DONE
```

---

**Document Version**: 1.0
**Created**: April 27, 2026
**Purpose**: Visual workflow for client review
