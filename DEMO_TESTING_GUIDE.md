# ZeroCancer Demo Testing Guide - Hosted Version

**Demo Environment:** Netlify + Cloudflare Workers  
**Frontend:** https://your-netlify-url.netlify.app  
**Backend:** https://app.go54.com  
**Last Updated:** April 21, 2026

---

## 🎯 Demo Overview

This guide provides ready-to-use test accounts for demonstrating the ZeroCancer platform's key features:
- **Patient Journey**: Waitlist → Matching → Appointment
- **Donor Journey**: Campaign Creation → Funding → Impact
- **Center Journey**: Appointment Management → Results Upload
- **Admin Journey**: System Analytics → Matching Algorithm

---

## 👤 Demo Test Accounts

### 🏥 **Center Accounts** (Recommended for Demo)

| Email | Password | Location | Features |
|-------|----------|----------|----------|
| center1@zerocancer.org | centerpass | Lagos - Ikeja | ✅ Active, Has appointments |
| center2@zerocancer.org | centerpass | Lagos - Surulere | ✅ Active, Has staff |
| center3@zerocancer.org | centerpass | Ogun - Abeokuta | ✅ Active, Multiple services |

**What Centers Can Demo:**
- View scheduled appointments
- Manage staff members
- Verify patient check-in codes
- Upload screening results
- Track payout balances

### 👨‍⚕️ **Center Staff Accounts**

| Email | Password | Role | Center |
|-------|----------|------|--------|
| staff1a@zerocancer.africa | staffpass | Admin | Center 1 |
| staff1b@zerocancer.africa | staffpass | Nurse | Center 1 |
| staff2a@zerocancer.africa | staffpass | Admin | Center 2 |

### 🤒 **Patient Accounts**

| Email | Password | Status | Demo Features |
|-------|----------|--------|---------------|
| testpatient1@example.com | password123 | ✅ Has matches | Waitlists, Appointments |
| testpatient2@example.com | testpass456 | ✅ Has appointments | Booking, Results |
| testpatient3@example.com | demo789 | ✅ Active waitlists | Join waitlists |

**What Patients Can Demo:**
- Browse available screenings
- Join waitlists for free screenings
- View matched donation funding
- Book and manage appointments
- View screening results

### 💰 **Donor Accounts**

| Email | Password | Campaigns | Demo Features |
|-------|----------|-----------|---------------|
| testdonor1@example.com | password123 | 2 active | Targeted campaigns |
| testdonor2@example.com | testpass456 | 2 active | General campaigns |
| testdonor3@example.com | demo789 | 1 active | Impact tracking |

**What Donors Can Demo:**
- View campaign performance
- See patients helped
- Track fund allocation
- Monitor impact metrics

### 👨‍💼 **Admin Accounts**

| Email | Password | Access Level |
|-------|----------|--------------|
| ttaiwo4910@gmail.com | fake.password | Full admin |
| raphaelgbaorun@gmail.com | he_wanted_one | Full admin |

**What Admins Can Demo:**
- System-wide analytics
- Trigger waitlist matching
- Manage all campaigns
- Oversee center operations

---

## 🎬 Demo Scenarios

### **Scenario 1: Patient Experience (5 minutes)**

**Story:** "Show how a patient gets free cancer screening"

1. **Login as Patient**
   - Email: `testpatient1@example.com`
   - Password: `password123`

2. **Show Patient Dashboard**
   - View available screenings (25 types)
   - Check waitlist status (3 entries)
   - See matched funding (5 allocations)

3. **Demonstrate Matching**
   - Show how donations fund their screenings
   - Explain targeting (age, location, gender)
   - View appointment booking

4. **Key Demo Points:**
   - "This patient has ₦150,000 in matched funding"
   - "They can get 5 different screenings for free"
   - "Matching happens automatically based on donor preferences"

### **Scenario 2: Donor Impact (5 minutes)**

**Story:** "Show how donations help real patients"

1. **Login as Donor**
   - Email: `testdonor1@example.com`
   - Password: `password123`

2. **Show Campaign Dashboard**
   - View 2 active campaigns
   - Total donated: ₦800,000
   - Patients helped: 3-5 people

3. **Demonstrate Targeting**
   - Campaign 1: "Women aged 30-50 in Lagos"
   - Campaign 2: "General health screenings"
   - Show geographic and demographic filters

4. **Key Demo Points:**
   - "Your ₦500,000 helped 3 women get breast cancer screening"
   - "Funds are allocated automatically to matching patients"
   - "You can see exactly who you helped"

### **Scenario 3: Center Operations (5 minutes)**

**Story:** "Show how healthcare centers manage appointments"

1. **Login as Center**
   - Email: `center1@zerocancer.org`
   - Password: `centerpass`

2. **Show Center Dashboard**
   - View scheduled appointments (5 total)
   - See staff members (2 people)
   - Check payout balance

3. **Demonstrate Workflow**
   - Patient check-in with codes
   - Appointment verification
   - Result upload process
   - Financial tracking

4. **Key Demo Points:**
   - "Centers get paid for each completed screening"
   - "Secure check-in codes prevent fraud"
   - "Results are uploaded directly to patients"

### **Scenario 4: Admin Overview (3 minutes)**

**Story:** "Show system-wide impact and matching algorithm"

1. **Login as Admin**
   - Email: `ttaiwo4910@gmail.com`
   - Password: `fake.password`

2. **Show Analytics Dashboard**
   - Total patients: 3
   - Total donors: 3
   - Total centers: 7
   - Funds allocated: ₦2.3M

3. **Demonstrate Matching**
   - Trigger manual matching
   - Show algorithm execution
   - View matching results

4. **Key Demo Points:**
   - "Algorithm matches patients with donors automatically"
   - "Considers location, age, gender, screening type"
   - "Falls back to general pool if no targeted match"

---

## 🔗 Demo URLs & Navigation

### **Login Pages**
- **Patients/Donors:** `/login`
- **Centers:** `/staff/login`
- **Admins:** `/admin/login`

### **Key Demo Pages**
- **Patient Dashboard:** `/patient/dashboard`
- **Donor Dashboard:** `/donor/dashboard`
- **Center Dashboard:** `/center/dashboard`
- **Admin Dashboard:** `/admin/dashboard`
- **Public Pages:** `/`, `/about`, `/blog`

### **API Testing** (Optional)
If you want to show the API during demo:
```bash
# Test patient login
curl -X POST https://app.go54.com/api/auth/login?actor=patient \
  -H "Content-Type: application/json" \
  -d '{"email":"testpatient1@example.com","password":"password123"}'

# Test center login  
curl -X POST https://app.go54.com/api/center/staff/login \
  -H "Content-Type: application/json" \
  -d '{"centerId":"center-1-id","email":"center1@zerocancer.org","password":"centerpass"}'
```

---

## 📊 Demo Data Overview

### **Current System State**
- **Patients:** 3 registered, all verified
- **Donors:** 3 registered, ₦2.3M donated
- **Centers:** 7 active across Nigeria
- **Staff:** 14 members (2 per center)
- **Campaigns:** 6 funded campaigns
- **Waitlists:** 9 entries (5 matched, 4 pending)
- **Appointments:** 5 scheduled (3 free, 2 paid)

### **Screening Types Available**
- **Cancer Screenings:** Cervical, Breast, Prostate, Colorectal, Skin
- **Vaccines:** Polio, Hepatitis B, HPV, COVID-19, Measles
- **General Health:** Blood Pressure, Diabetes, Vision, Cholesterol
- **Treatment:** HIV, Malaria, TB, Typhoid, Pneumonia
- **Screening:** BMI, Hearing, Mental Health, Dental, Allergy

### **Geographic Coverage**
- **Lagos:** 2 centers (Ikeja, Surulere)
- **FCT:** 1 center (Gwagwalada)
- **Kano:** 1 center (Nasarawa)
- **Enugu:** 1 center (Nsukka)
- **Ogun:** 1 center (Abeokuta South)
- **Sokoto:** 1 center (Wamako)

---

## 🎯 Demo Talking Points

### **Problem Statement**
- "Cancer screening is expensive in Nigeria"
- "Many people can't afford early detection"
- "Healthcare centers need sustainable funding"

### **Solution Highlights**
- "Donors fund specific screenings for patients"
- "Intelligent matching based on preferences"
- "Healthcare centers get paid for services"
- "Patients get free, quality healthcare"

### **Technology Features**
- "Real-time matching algorithm"
- "Secure payment processing"
- "Geographic and demographic targeting"
- "Comprehensive audit trails"

### **Impact Metrics**
- "₦2.3M donated so far"
- "15+ patients helped"
- "7 healthcare centers onboarded"
- "25 different screening types available"

---

## 🔧 Demo Troubleshooting

### **If Login Fails**
1. Check internet connection
2. Verify backend is running (https://app.go54.com/api/healthz)
3. Try different test account
4. Clear browser cache/cookies

### **If Pages Don't Load**
1. Check Netlify deployment status
2. Verify frontend build completed
3. Check browser console for errors
4. Try incognito/private browsing

### **If API Calls Fail**
1. Check network tab in browser dev tools
2. Verify CORS configuration
3. Check if backend is deployed
4. Verify API endpoints are correct

### **Backup Demo Plan**
If hosted version fails:
1. Use local development environment
2. Show screenshots/videos of functionality
3. Walk through code architecture
4. Demonstrate database schema

---

## 📱 Mobile Demo Tips

The application is responsive and works on mobile:
- **Patient app** works great on phones
- **Center dashboard** optimized for tablets
- **Admin panel** best on desktop
- **Public pages** fully responsive

---

## 🎉 Demo Success Metrics

### **Audience Engagement**
- [ ] Showed complete patient journey
- [ ] Demonstrated donor impact
- [ ] Explained matching algorithm
- [ ] Highlighted center benefits

### **Technical Demonstration**
- [ ] All logins worked
- [ ] Data loaded correctly
- [ ] Navigation was smooth
- [ ] Features functioned as expected

### **Business Value**
- [ ] Explained problem being solved
- [ ] Showed measurable impact
- [ ] Demonstrated scalability
- [ ] Highlighted sustainability model

---

## 📞 Demo Support

### **Before Demo**
1. Test all accounts 30 minutes before
2. Check backend health endpoint
3. Verify Netlify deployment is live
4. Have backup screenshots ready

### **During Demo**
1. Start with patient journey (most engaging)
2. Keep scenarios under 5 minutes each
3. Highlight the matching algorithm
4. Show real impact numbers

### **After Demo**
1. Provide access to test accounts
2. Share GitHub repository
3. Offer technical deep-dive session
4. Discuss deployment options

---

**Ready to Demo! 🚀**

All test accounts are verified and ready to use. The system has realistic data showing the complete patient-donor-center ecosystem in action.