# Center Registration Testing Guide

## Current Status
✅ Backend API endpoint: `/api/register/center` - Running on http://127.0.0.1:8787
✅ Frontend form: `/sign-up/center` - Running on http://localhost:3000
✅ Schema validation: All fields properly validated

## Test Steps

### 1. Access the Registration Page
Navigate to: http://localhost:3000/sign-up/center

### 2. Fill in the Form
Required fields:
- **Center Name**: e.g., "Hope Medical Center"
- **Email**: e.g., "hope@medical.com"
- **Password**: Minimum 6 characters
- **Phone Number**: Valid Nigerian phone number (e.g., +234 801 234 5678)
- **Address**: e.g., "123 Healthway Street, Ikeja"
- **State**: Select from dropdown
- **Local Government**: Select from dropdown (after selecting state)
- **Services Offered**: Select at least one screening type

### 3. Expected Behavior

#### On Success:
1. Form submits successfully
2. Toast notification: "Registration successful! Redirecting to login..."
3. Redirects to `/login` after 1.5 seconds
4. Center account created in database
5. Center staff admin account created automatically

#### On Error:
- **Email already registered**: "Email already registered"
- **Validation errors**: Field-specific error messages
- **Network errors**: "Registration failed. Please try again."

## Common Issues to Check

### Issue 1: "Registration doesn't seem to be working"
**Possible Causes:**
1. **Backend not running** - Check if http://127.0.0.1:8787 is accessible
2. **Frontend not connected to backend** - Check `.env` file has correct `VITE_API_BASE_URL`
3. **Screening types not loading** - Check if `/api/screening-types` endpoint works
4. **Form validation failing** - Check browser console for validation errors
5. **CORS issues** - Check backend CORS configuration

### Issue 2: Form submits but nothing happens
**Check:**
1. Browser console for JavaScript errors
2. Network tab for API request/response
3. Backend logs for errors

### Issue 3: Services dropdown is empty
**Check:**
1. Screening types API: http://127.0.0.1:8787/api/screening-types
2. Backend database has screening types seeded
3. Browser console for loading errors

## Testing with Browser DevTools

### 1. Open DevTools (F12)
- **Console Tab**: Check for JavaScript errors
- **Network Tab**: Monitor API requests
- **Application Tab**: Check localStorage/cookies

### 2. Monitor the Registration Request
Look for:
```
POST http://127.0.0.1:8787/api/register/center
Status: 201 Created (success) or 4xx/5xx (error)
```

### 3. Check Request Payload
Should include:
```json
{
  "centerName": "Hope Medical Center",
  "email": "hope@medical.com",
  "password": "password123",
  "phoneNumber": "+2348012345678",
  "address": "123 Healthway Street",
  "state": "Lagos",
  "localGovernment": "Ikeja",
  "services": ["screening-type-id-1", "screening-type-id-2"]
}
```

### 4. Check Response
Success response:
```json
{
  "ok": true,
  "message": "Center registered successfully",
  "data": {
    "centerId": "center-id",
    "centerName": "Hope Medical Center",
    "email": "hope@medical.com",
    "phoneNumber": "+2348012345678",
    "address": "123 Healthway Street",
    "state": "Lagos",
    "localGovernment": "Ikeja",
    "services": ["screening-type-id-1"]
  }
}
```

## Backend Verification

### Check if center was created:
```bash
# Using the backend API
curl http://127.0.0.1:8787/api/centers
```

### Check database directly:
The center should be in the `ServiceCenter` table with:
- Email
- Password hash
- Center details
- Associated services

## Frontend Environment Check

### Verify `.env` file in `apps/frontend/`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8787
```

### Verify backend `.dev.vars` file in `apps/backend/`:
```env
FRONTEND_URL=http://localhost:3000
```

## Quick Debug Commands

### Test backend health:
```bash
curl http://127.0.0.1:8787/api/health
```

### Test screening types endpoint:
```bash
curl http://127.0.0.1:8787/api/screening-types
```

### Test registration endpoint (manual):
```bash
curl -X POST http://127.0.0.1:8787/api/register/center \
  -H "Content-Type: application/json" \
  -d '{
    "centerName": "Test Center",
    "email": "test@center.com",
    "password": "password123",
    "phoneNumber": "+2348012345678",
    "address": "123 Test Street",
    "state": "Lagos",
    "localGovernment": "Ikeja",
    "services": []
  }'
```

## What to Report

If registration is still not working, please provide:
1. **Browser console errors** (screenshot or copy-paste)
2. **Network tab** showing the failed request (screenshot)
3. **Specific error message** shown to the user
4. **Steps you took** before the error occurred
5. **Backend logs** if accessible

---

**Last Updated**: April 27, 2026
**Status**: Ready for testing
