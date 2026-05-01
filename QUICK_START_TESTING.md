# Quick Start Testing Guide

## ✅ Patient Registration (FIXED)

### Test from Center Dashboard
1. Navigate to: https://zerocancerafrica.netlify.app/center/register-patient
2. Fill in patient details:
   - Full Name: Test Patient
   - Email: test@example.com
   - Phone: +2348012345678
   - Password: (auto-generated)
   - Gender: Select one
   - Date of Birth: Select date
   - State: Select state
   - Local Government: Select LGA
3. Click "Register Patient"
4. ✅ Should see success screen with patient credentials

### Test via API (PowerShell)
```powershell
$body = @{
    fullName = "Test Patient"
    email = "test$(Get-Random)@test.com"
    phone = "+2348012345678"
    password = "TempPass123"
    gender = "FEMALE"
    dateOfBirth = "1990-01-01T00:00:00.000Z"
    state = "Lagos"
    localGovernment = "Ikeja"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://zerocancer.daunderlord.workers.dev/api/v1/register/patient" -Method Post -Body $body -ContentType "application/json"
```

Expected Response:
```json
{
  "ok": true,
  "message": "Patient registered successfully",
  "data": {
    "patientId": "uuid",
    "email": "test@test.com",
    "fullName": "Test Patient",
    "phone": "+2348012345678",
    "dateOfBirth": "1990-01-01T00:00:00",
    "gender": "FEMALE",
    "state": "Lagos",
    "localGovernment": "Ikeja"
  }
}
```

## 🔧 Known Issues

### Email Verification Disabled
- ⚠️ Users will NOT receive verification emails
- ⚠️ Email verification tokens are NOT created
- ✅ Registration still works and data persists
- 📝 TODO: Configure proper SMTP credentials to re-enable

### Center Authentication
- Need to verify center login endpoint exists and works
- Test credentials: `center@zerocancer.org` / `password123`

## 📊 Database Status

### Supabase PostgreSQL
- **Project ID:** ouiikyvcjnanhwyobqwp
- **Region:** EU West 1
- **Status:** ✅ Connected and working

### Seeded Data
- ✅ 7 Service Centers (all ACTIVE)
- ✅ 10 Screening Types
- ✅ 3 Screening Type Categories
- ✅ 1 Admin account
- ✅ Multiple test patients (from registration tests)

### Verify Data
```sql
-- Check recent patient registrations
SELECT u.*, p.* FROM "User" u 
LEFT JOIN "PatientProfile" p ON u.id = p."userId" 
ORDER BY u."createdAt" DESC 
LIMIT 5;

-- Check service centers
SELECT * FROM "ServiceCenter" WHERE status = 'ACTIVE';

-- Check screening types
SELECT * FROM "ScreeningType" WHERE active = true;
```

## 🚀 Deployment Status

### Backend (Cloudflare Workers)
- **URL:** https://zerocancer.daunderlord.workers.dev
- **Version:** e87c2fda-07f9-46fa-a26b-4cdc847b1b5e
- **Status:** ✅ Deployed and running
- **Database:** Supabase PostgreSQL (not mock)

### Frontend (Netlify)
- **URL:** https://zerocancerafrica.netlify.app
- **Status:** ✅ Deployed
- **Auto-deploy:** Enabled on GitHub push

## 🧪 Test Endpoints

### Public Endpoints
```powershell
# Get all screening types
Invoke-RestMethod -Uri "https://zerocancer.daunderlord.workers.dev/api/v1/screening-types/all"

# Search centers by state
Invoke-RestMethod -Uri "https://zerocancer.daunderlord.workers.dev/api/v1/center/search?state=Lagos"

# Register patient (see above)
```

### Protected Endpoints (Require Authentication)
- `/api/v1/center/*` - Center dashboard endpoints
- `/api/v1/patient/*` - Patient dashboard endpoints
- `/api/v1/donor/*` - Donor dashboard endpoints
- `/api/v1/admin/*` - Admin dashboard endpoints

## 📝 Next Steps

1. **Test Center Dashboard Features:**
   - Login as center
   - Register walk-in patient
   - View appointments
   - View notifications
   - Refer patient

2. **Configure SMTP for Email Verification:**
   - Get proper SMTP credentials
   - Update `wrangler.json` and `.dev.vars`
   - Uncomment email code in `registration.ts`
   - Test email sending
   - Deploy

3. **Implement Kit Inventory & Marketplace System:**
   - See `.kiro/specs/kit-inventory-marketplace-system/requirements.md`
   - 13 major requirements
   - 141 acceptance criteria

---

**Last Updated:** April 30, 2026  
**Status:** Patient Registration ✅ WORKING
