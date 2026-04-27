# Donor-Sponsored Patient Selection - Feature Specification

## Client Request Summary

The client wants donors to be able to sponsor specific individuals by entering their phone number. The system should:
1. Check if the patient exists in the system
2. If exists: Display their name for confirmation
3. If not: Send SMS invitation
4. Handle two scenarios:
   - Patient has smartphone → Self-registration via app
   - Patient has no smartphone → Agent-assisted registration

---

## Feature Breakdown

### 1. Phone Number Lookup System
**What**: Donor enters phone number, system checks database

**User Flow**:
```
Donor Dashboard → Select Patient → Enter Phone Number
  ↓
System checks database
  ↓
Found? → Display: "Jane Doe - Lagos, Nigeria" → Confirm Selection
  ↓
Not Found? → Display: "Patient not found. Send invitation?" → Send SMS
```

**Technical Requirements**:
- API endpoint: `POST /api/v1/donor/lookup-patient`
- Input: Phone number (E.164 format)
- Output: Patient details (name, location) OR not found
- Security: Rate limiting to prevent abuse

---

### 2. SMS Invitation System
**What**: Send SMS to invite unregistered patients

**SMS Template**:
```
Hello! [Donor Name] has selected you for a FREE cancer screening 
through ZeroCancer Africa. Register here: [Short Link]

Need help? Call our agents at [Phone Number]
```

**Technical Requirements**:
- SMS Provider: Twilio or Africa's Talking (recommended for Nigeria)
- Track invitation status (sent, delivered, failed)
- Generate unique registration link with donor reference
- Store invitation record in database

**Database Schema Addition**:
```typescript
PatientInvitation {
  id: string
  donorId: string
  phoneNumber: string
  status: "SENT" | "DELIVERED" | "FAILED" | "REGISTERED"
  sentAt: DateTime
  registeredAt: DateTime?
  agentAssisted: boolean
  agentId: string?
}
```

---

### 3. Agent Assignment System
**What**: Queue system for patients needing registration help

**Agent Workflow**:
```
Patient receives SMS → Calls helpline → "I need help registering"
  ↓
Agent opens dashboard → Sees pending invitations
  ↓
Agent selects patient → Fills registration form on their behalf
  ↓
System links patient to donor → Sends confirmation to both
```

**Technical Requirements**:
- New role: `AGENT` in user system
- Agent dashboard with pending invitations queue
- Agent can register patients on their behalf
- Track which agent helped which patient
- Agent performance metrics (registrations completed)

**Database Schema Addition**:
```typescript
Agent {
  id: string
  fullName: string
  email: string
  phone: string
  passwordHash: string
  status: "ACTIVE" | "INACTIVE"
  registrationsCompleted: number
  createdAt: DateTime
}
```

---

### 4. Donor-Patient Linking
**What**: Connect registered patient to sponsoring donor

**Linking Flow**:
```
Patient registers (self or agent-assisted)
  ↓
System checks for pending invitation by phone number
  ↓
Links patient to donor who invited them
  ↓
Notifications sent:
  - Donor: "Jane Doe has registered! You can now sponsor her screening."
  - Patient: "Thank you for registering! [Donor Name] will sponsor your screening."
```

**Technical Requirements**:
- `DonorPatientLink` table to track relationships
- Notification system for both parties
- Donor can view their sponsored patients
- Patient can see who sponsored them

**Database Schema Addition**:
```typescript
DonorPatientLink {
  id: string
  donorId: string
  patientId: string
  invitationId: string
  status: "PENDING" | "ACTIVE" | "COMPLETED"
  screeningPaid: boolean
  appointmentId: string?
  createdAt: DateTime
}
```

---

## Implementation Plan

### Phase 1: Phone Lookup & SMS (Week 1)
**Backend**:
- [ ] Create phone lookup API endpoint
- [ ] Integrate SMS provider (Africa's Talking recommended)
- [ ] Create invitation tracking system
- [ ] Add invitation database tables

**Frontend**:
- [ ] Add phone number input to donor dashboard
- [ ] Create patient lookup UI
- [ ] Add "Send Invitation" button
- [ ] Show invitation status

**Testing**:
- [ ] Test phone lookup with existing patients
- [ ] Test SMS delivery to Nigerian numbers
- [ ] Test invitation tracking

---

### Phase 2: Agent System (Week 2)
**Backend**:
- [ ] Create Agent role and authentication
- [ ] Create agent dashboard API endpoints
- [ ] Add agent assignment logic
- [ ] Track agent performance metrics

**Frontend**:
- [ ] Create agent login page
- [ ] Build agent dashboard
- [ ] Create assisted registration form
- [ ] Add pending invitations queue

**Testing**:
- [ ] Test agent login and authentication
- [ ] Test assisted registration flow
- [ ] Test agent-patient linking

---

### Phase 3: Donor-Patient Linking (Week 3)
**Backend**:
- [ ] Create donor-patient link table
- [ ] Add linking logic on registration
- [ ] Create notification system
- [ ] Add donor's sponsored patients list API

**Frontend**:
- [ ] Show sponsored patients on donor dashboard
- [ ] Add "My Sponsor" section to patient dashboard
- [ ] Create notification UI for both parties
- [ ] Add screening payment flow for sponsored patients

**Testing**:
- [ ] Test end-to-end flow (lookup → invite → register → link)
- [ ] Test notifications
- [ ] Test sponsored screening payment

---

## Questions for Client

### 1. Agent System
**Q**: Do you already have agents/staff who will do this, or is this a new role?
- If existing: How many agents? Do they need training?
- If new: How will you recruit and train them?

**Q**: Should agents have access to:
- Only pending invitations?
- All patient data?
- Center information?

**Q**: Agent working hours and availability?
- 24/7 support?
- Business hours only?
- How to handle after-hours requests?

---

### 2. SMS Provider
**Q**: Do you have an SMS service provider preference?
- **Recommended**: Africa's Talking (Nigeria-focused, reliable)
- Alternative: Twilio (global, more expensive)
- Budget for SMS costs?

**Q**: SMS volume expectations?
- How many invitations per month?
- Need for bulk SMS?

---

### 3. Donor Workflow
**Q**: Can a donor sponsor multiple patients?
- If yes: Any limit? (e.g., max 10 patients per donor)
- If no: One patient at a time?

**Q**: What happens after patient registers?
- Does donor automatically pay for screening?
- Does donor choose screening type?
- Does donor select the center?

**Q**: Can donor cancel sponsorship?
- Before patient registers?
- After patient registers?

---

### 4. Patient Verification
**Q**: How do you verify the patient is the right person?
- Phone number only?
- Additional verification (name, DOB)?
- What if someone else answers the phone?

**Q**: What if patient already has a sponsor?
- Can multiple donors sponsor same patient?
- First-come-first-served?

---

### 5. Agent Assignment
**Q**: How are patients assigned to agents?
- Automatic queue (first available agent)?
- Manual assignment by supervisor?
- Based on location/language?

**Q**: What if patient doesn't respond to SMS?
- Follow-up SMS after X days?
- Phone call from agent?
- Mark as inactive?

---

## Technical Architecture

### New API Endpoints

```typescript
// Phone Lookup
POST /api/v1/donor/lookup-patient
Body: { phoneNumber: string }
Response: { found: boolean, patient?: { name, location }, invitationId?: string }

// Send Invitation
POST /api/v1/donor/send-invitation
Body: { phoneNumber: string, donorId: string }
Response: { invitationId: string, status: string }

// Agent Dashboard
GET /api/v1/agent/pending-invitations
Response: { invitations: [...], total: number }

// Agent Assisted Registration
POST /api/v1/agent/register-patient
Body: { invitationId: string, patientData: {...}, agentId: string }
Response: { patientId: string, linkId: string }

// Donor's Sponsored Patients
GET /api/v1/donor/sponsored-patients
Response: { patients: [...], total: number }
```

---

### Database Schema Changes

```prisma
model PatientInvitation {
  id            String   @id @default(cuid())
  donorId       String
  donor         User     @relation("DonorInvitations", fields: [donorId], references: [id])
  phoneNumber   String
  status        InvitationStatus @default(SENT)
  sentAt        DateTime @default(now())
  deliveredAt   DateTime?
  registeredAt  DateTime?
  agentAssisted Boolean  @default(false)
  agentId       String?
  agent         Agent?   @relation(fields: [agentId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Agent {
  id                      String   @id @default(cuid())
  fullName                String
  email                   String   @unique
  phone                   String
  passwordHash            String
  status                  AgentStatus @default(ACTIVE)
  registrationsCompleted  Int      @default(0)
  invitations             PatientInvitation[]
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}

model DonorPatientLink {
  id              String   @id @default(cuid())
  donorId         String
  donor           User     @relation("DonorLinks", fields: [donorId], references: [id])
  patientId       String
  patient         User     @relation("PatientLinks", fields: [patientId], references: [id])
  invitationId    String   @unique
  invitation      PatientInvitation @relation(fields: [invitationId], references: [id])
  status          LinkStatus @default(PENDING)
  screeningPaid   Boolean  @default(false)
  appointmentId   String?
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum InvitationStatus {
  SENT
  DELIVERED
  FAILED
  REGISTERED
  EXPIRED
}

enum AgentStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum LinkStatus {
  PENDING
  ACTIVE
  COMPLETED
  CANCELLED
}
```

---

## Cost Estimation

### SMS Costs (Africa's Talking - Nigeria)
- **Rate**: ~₦2.50 per SMS (~$0.003 USD)
- **1,000 invitations**: ₦2,500 (~$3 USD)
- **10,000 invitations**: ₦25,000 (~$30 USD)

### Development Time
- **Phase 1** (Phone Lookup & SMS): 3-4 days
- **Phase 2** (Agent System): 4-5 days
- **Phase 3** (Donor-Patient Linking): 3-4 days
- **Testing & Refinement**: 2-3 days
- **Total**: 12-16 days (2.5-3 weeks)

### Infrastructure
- SMS service account setup
- Agent training materials
- Support phone line setup

---

## Success Metrics

### Key Performance Indicators (KPIs)
1. **Invitation Success Rate**: % of SMS delivered successfully
2. **Registration Conversion**: % of invited patients who register
3. **Agent Efficiency**: Average time to complete assisted registration
4. **Donor Satisfaction**: % of donors who sponsor multiple patients
5. **Screening Completion**: % of sponsored patients who complete screening

### Monitoring
- Dashboard showing real-time invitation stats
- Agent performance leaderboard
- Donor engagement metrics
- SMS delivery reports

---

## Risk Assessment

### High Risk
❗ **SMS Delivery Failures**: Network issues, invalid numbers
- **Mitigation**: Validate phone numbers, retry failed SMS, provide alternative contact

❗ **Agent Availability**: Not enough agents to handle volume
- **Mitigation**: Agent scheduling system, overflow to voicemail, callback queue

### Medium Risk
⚠️ **Patient Privacy**: Sharing patient info with donors
- **Mitigation**: Only share name and location, require consent, GDPR compliance

⚠️ **Fraud**: Fake invitations, impersonation
- **Mitigation**: Rate limiting, phone verification, agent verification

### Low Risk
⚡ **SMS Costs**: Higher than expected volume
- **Mitigation**: Set monthly budget cap, monitor usage, optimize templates

---

## Recommendations

### Immediate Actions
1. ✅ **Confirm client requirements** - Get answers to questions above
2. ✅ **Choose SMS provider** - Set up Africa's Talking account
3. ✅ **Design agent dashboard** - Create mockups for client approval
4. ✅ **Plan agent recruitment** - If new role, start hiring process

### Technical Approach
1. **Start with MVP**: Phone lookup + SMS only (no agents initially)
2. **Test with small group**: 10-20 donors, monitor results
3. **Add agent system**: Based on demand and feedback
4. **Scale gradually**: Increase volume as system proves stable

### Alternative Approach (Simpler)
If agent system is too complex initially:
- **Option 1**: All invitations require smartphone (no agent assistance)
- **Option 2**: Provide helpline number in SMS, manual follow-up
- **Option 3**: Use existing center staff as agents (no new role)

---

## Next Steps

### For Client
- [ ] Review this specification
- [ ] Answer the questions in "Questions for Client" section
- [ ] Approve database schema changes
- [ ] Confirm budget for SMS costs
- [ ] Decide on agent system approach

### For Development
- [ ] Set up SMS provider account (pending client approval)
- [ ] Create detailed UI mockups for agent dashboard
- [ ] Design phone lookup interface for donor dashboard
- [ ] Plan database migration strategy

---

**Document Version**: 1.0
**Created**: April 27, 2026
**Status**: Awaiting Client Approval
**Estimated Timeline**: 2.5-3 weeks development
**Estimated Cost**: SMS costs + development time
