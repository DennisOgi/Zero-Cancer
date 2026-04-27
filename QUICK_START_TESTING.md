# Quick Start Testing Guide

## ✅ Center Registration is Now Working!

### What Was Fixed
The mock database was missing screening types and the ability to create new centers. This has been fixed and tested successfully.

---

## Test Center Registration Now

### 1. Open the Registration Page
Navigate to: **http://localhost:3000/sign-up/center**

### 2. Fill in the Form

#### Required Information:
- **Center Name**: Any name (e.g., "Hope Medical Center")
- **Email**: Any valid email (e.g., "hope@medical.com")
- **Password**: Minimum 6 characters (e.g., "password123")
- **Phone Number**: Nigerian format (e.g., "+234 801 234 5678")
- **Address**: Any address (e.g., "123 Health Street, Lagos")
- **State**: Select from dropdown (e.g., "Lagos")
- **Local Government**: Select from dropdown (e.g., "Ikeja")
- **Services Offered**: Select at least one screening type

#### Available Screening Types (10 total):
✅ **Cancer Screenings:**
- Breast Cancer Screening
- Cervical Cancer Screening
- Prostate Cancer Screening
- Colorectal Cancer Screening
- Lung Cancer Screening
- Skin Cancer Screening

✅ **General Health:**
- General Health Checkup
- Blood Pressure Screening
- Diabetes Screening
- Cholesterol Screening

### 3. Submit the Form
- Click "Create Account"
- You should see: **"Registration successful! Redirecting to login..."**
- Page redirects to `/login` after 1.5 seconds

### 4. What Happens Behind the Scenes
✅ New center created with unique ID
✅ Center status set to "PENDING" (awaiting admin approval)
✅ Staff admin account created automatically
✅ Selected services linked to the center
✅ All data stored in mock database

---

## Test Existing Center Login

### Test Credentials:
```
Email: center1@zerocancer.org
Password: password123
```

### What You Can Do:
- View dashboard with funding status and kit availability
- Register walk-in patients
- Refer patients to other centers
- View notifications (donations, appointments, payouts)
- View waitlist widget
- Manage appointments
- Upload results
- Verify screening codes

---

## Available Test Accounts

### Centers (7 total):
1. **Lagos General Health Center** - center1@zerocancer.org / password123
2. **Ikeja Medical Center** - center2@zerocancer.org / password123
3. **Abuja Central Hospital** - center3@zerocancer.org / password123
4. **Kano State Health Center** - center4@zerocancer.org / password123
5. **Port Harcourt Medical Hub** - center5@zerocancer.org / password123
6. **Ibadan University Teaching Hospital** - center6@zerocancer.org / password123
7. **Enugu State Specialist Hospital** - center7@zerocancer.org / password123

### Patients:
- patient1@example.com / password123
- patient2@example.com / password123
- patient3@example.com / password123
- patient4@example.com / password123
- patient5@example.com / password123

### Donors:
- donor1@example.com / password123
- donor2@example.com / password123
- donor3@example.com / password123
- donor4@example.com / password123

### Admin:
- admin@zerocancer.org / password123

---

## Current Server Status

### Frontend
- **URL**: http://localhost:3000
- **Status**: ✅ Running
- **Features**: All center features implemented

### Backend
- **URL**: http://127.0.0.1:8787
- **Status**: ✅ Running
- **Database**: Mock database with screening types

---

## API Endpoints You Can Test

### Screening Types
```bash
# Get all screening types
curl http://127.0.0.1:8787/api/v1/screening-types/all

# Get screening type categories
curl http://127.0.0.1:8787/api/v1/screening-types/categories
```

### Center Registration
```bash
# Register a new center (PowerShell)
$body = @{
  centerName = "Test Center"
  email = "test@center.com"
  password = "password123"
  phoneNumber = "+2348012345678"
  address = "123 Test St"
  state = "Lagos"
  localGovernment = "Ikeja"
  services = @("screening-breast-cancer")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8787/api/v1/register/center" -Method Post -Body $body -ContentType "application/json"
```

### Centers Search
```bash
# Search centers by state and LGA
curl "http://127.0.0.1:8787/api/v1/center?state=Lagos&lga=Ikeja"
```

---

## Common Issues & Solutions

### Issue: Services dropdown is empty
**Solution**: ✅ Fixed! Screening types are now in the mock database

### Issue: Registration fails with 500 error
**Solution**: ✅ Fixed! Database now supports creating centers

### Issue: Form doesn't submit
**Check**:
- All required fields filled
- Valid email format
- Password at least 6 characters
- At least one service selected
- Browser console for errors

### Issue: Backend not responding
**Solution**: Restart backend server
```bash
cd apps/backend
npm run dev
```

---

## What's Next?

### For Production:
1. Replace mock database with real Prisma database
2. Seed screening types in production database
3. Set up email verification system
4. Configure admin approval workflow

### For Development:
1. Test all center features
2. Test patient registration and booking
3. Test donor campaigns
4. Test admin dashboard

---

## Recent Changes

### Commit: `61b6a65`
- ✅ Added 10 screening types to mock database
- ✅ Added 3 screening type categories
- ✅ Added database create operations for centers
- ✅ Added database create operations for staff
- ✅ Fixed center registration flow

### Deployed:
- ✅ Pushed to GitHub
- ✅ Auto-deploying to Netlify
- ✅ Backend on Cloudflare Workers

---

**Last Updated**: April 27, 2026
**Status**: ✅ All Systems Operational
**Center Registration**: ✅ Working
