# Deployment Verification Checklist

## Patient Registration Feature - Netlify Deployment

### Build Status
- ✅ Code pushed to GitHub (commit: `8d298b0`)
- 🔄 Netlify auto-build triggered
- ⏳ Waiting for build completion (2-3 minutes)

### Verification Steps

#### 1. Check Netlify Build Status
Visit: https://app.netlify.com/sites/zerocancerafrica/deploys

Look for:
- Latest deploy from `master` branch
- Build status: "Published" (green)
- Deploy time: Should be recent (within last 5 minutes)

#### 2. Clear Browser Cache
Before testing, clear your browser cache:

**Option A: Hard Refresh**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Option B: Clear Cache Manually**
- Chrome: Settings → Privacy → Clear browsing data → Cached images and files
- Firefox: Settings → Privacy → Clear Data → Cached Web Content
- Safari: Develop → Empty Caches

#### 3. Test Direct Route Access
Navigate directly to:
```
https://zerocancerafrica.netlify.app/center/register-patient
```

**Expected Result:**
- Should redirect to login if not authenticated
- After login as center, should show patient registration form

#### 4. Test Navigation Links

**Desktop Navigation:**
1. Log in as a center user
2. Check sidebar (left side)
3. Look for "Register Patient" (2nd item after Dashboard)
4. Click it - should navigate to registration form

**Mobile Navigation:**
1. Log in as a center user on mobile
2. Check bottom navigation bar
3. Look for "Register" icon
4. Tap it - should navigate to registration form

**Dashboard Quick Actions:**
1. Log in as a center user
2. Go to Dashboard
3. Look for "Register Patient" card (first quick action)
4. Click it - should navigate to registration form

#### 5. Test Registration Flow
1. Navigate to Register Patient page
2. Fill in all required fields:
   - Full Name: Test Patient
   - Email: test@example.com
   - Phone: +234 800 000 0000
   - Date of Birth: 1990-01-01
   - Gender: Male
   - State: Lagos
   - LGA: Lagos Island
3. Click "Register Patient"
4. Should see success screen with credentials
5. Verify credentials are displayed
6. Test "Copy Credentials" button
7. Test "Print" button

### Troubleshooting

#### Issue: "Register Patient" not visible in navigation

**Possible Causes:**
1. Browser cache not cleared
2. Netlify build still in progress
3. Build failed on Netlify

**Solutions:**
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear browser cache completely
3. Check Netlify build logs for errors
4. Try incognito/private browsing mode
5. Try different browser
6. Wait 5 minutes and try again

#### Issue: Route shows 404 error

**Possible Causes:**
1. Route not properly generated
2. Netlify redirects not working

**Solutions:**
1. Check `routeTree.gen.ts` includes `/center/register-patient`
2. Verify `netlify.toml` has catch-all redirect
3. Check Netlify deploy logs

#### Issue: Page loads but form doesn't work

**Possible Causes:**
1. API endpoint not accessible
2. CORS issues
3. Authentication issues

**Solutions:**
1. Check browser console for errors
2. Verify backend is deployed and accessible
3. Check network tab for failed requests
4. Verify environment variables in Netlify

### Files to Check

#### Route File
`apps/frontend/src/routes/center/register-patient.tsx`
- Should export Route with createFileRoute
- Should import CenterRegisterPatientPage

#### Component File
`apps/frontend/src/components/CenterPages/CenterRegisterPatient.page.tsx`
- Should export CenterRegisterPatientPage
- Should have form with all fields

#### Layout File
`apps/frontend/src/components/layouts/CenterLayout.tsx`
- Should include register-patient in baseNavLinks
- Should be 2nd item in navigation

#### Route Tree (Generated)
`apps/frontend/src/routeTree.gen.ts`
- Should include CenterRegisterPatientRoute
- Should have '/center/register-patient' path

### Expected Behavior

#### Navigation
- ✅ Visible in sidebar (desktop)
- ✅ Visible in bottom nav (mobile)
- ✅ Visible in dashboard quick actions
- ✅ Accessible via direct URL

#### Form
- ✅ All fields render correctly
- ✅ Validation works
- ✅ State/LGA dropdowns populate
- ✅ Submit button works
- ✅ Success screen shows credentials

#### Security
- ✅ Only accessible when logged in as center
- ✅ Redirects to login if not authenticated
- ✅ Password auto-generated securely
- ✅ Credentials displayed only once

### Success Criteria

All of the following must be true:
- [ ] Netlify build completed successfully
- [ ] Route accessible via direct URL
- [ ] Navigation link visible in sidebar
- [ ] Navigation link visible in dashboard
- [ ] Form renders without errors
- [ ] Form submission works
- [ ] Success screen displays credentials
- [ ] Copy and print buttons work

### Current Status

**Last Updated:** April 22, 2026 - 2:05 PM

**Git Commits:**
- `8131424` - Initial feature implementation
- `879c9e5` - User guide documentation
- `7d9a681` - Implementation documentation
- `8d298b0` - Force rebuild for route visibility

**Deployment:**
- GitHub: ✅ Pushed
- Netlify: 🔄 Building
- Backend: ✅ Already deployed

**Next Steps:**
1. Wait for Netlify build to complete
2. Hard refresh browser
3. Test all verification steps above
4. Report any issues found

### Contact

If issues persist after following all troubleshooting steps:
1. Check Netlify deploy logs
2. Check browser console for errors
3. Verify backend API is accessible
4. Check network requests in browser DevTools

---

**Build Trigger:** Commit `8d298b0` - Force rebuild for patient registration route visibility
**Expected Completion:** ~3 minutes from push time
**Verification URL:** https://zerocancerafrica.netlify.app/center/register-patient
