# Quick Center Reference Guide

## 🎯 States and LGAs for Our 7 Active Centers

### How to Search

| State | LGA | Center Name | Kits Available | Funded? |
|-------|-----|-------------|----------------|---------|
| **Lagos** | Lagos Island | Lagos General Health Center | 55 | ✅ Yes |
| **Lagos** | Ikeja | Ikeja Medical Center | 28 | ✅ Yes |
| **FCT** | Municipal | Abuja Central Hospital | 80 | ✅ Yes |
| **Kano** | Nassarawa | Kano State Health Center | 5 | ❌ No |
| **Rivers** | Port Harcourt | Port Harcourt Medical Hub | 35 | ✅ Yes |
| **Oyo** | Ibadan North | Ibadan University Teaching Hospital | 20 | ✅ Yes |
| **Enugu** | Enugu North | Enugu State Specialist Hospital | 3 | ❌ No |

---

## 🔍 Test Searches on Netlify

### Search by State (Returns All Centers in State)

1. **Lagos** → Returns 2 centers
2. **FCT** → Returns 1 center  
3. **Kano** → Returns 1 center
4. **Rivers** → Returns 1 center
5. **Oyo** → Returns 1 center
6. **Enugu** → Returns 1 center

### Search by State + LGA (Returns Specific Center)

1. **Lagos + Lagos Island** → Lagos General Health Center
2. **Lagos + Ikeja** → Ikeja Medical Center
3. **FCT + Municipal** → Abuja Central Hospital
4. **Kano + Nassarawa** → Kano State Health Center
5. **Rivers + Port Harcourt** → Port Harcourt Medical Hub
6. **Oyo + Ibadan North** → Ibadan University Teaching Hospital
7. **Enugu + Enugu North** → Enugu State Specialist Hospital

---

## 📊 Quick Stats

- **Total Centers**: 7
- **States Covered**: 6
- **Funded**: 5 centers (71%)
- **Unfunded**: 2 centers (29%)
- **Total Kits Available**: 226
- **Total Funding**: ₦23.5M

---

## 🚀 Testing on Netlify

**URL**: https://zerocancerafrica.netlify.app

1. Go to homepage
2. Scroll to "Find a Screening Center Near You"
3. Select a state from the list above
4. Optionally select an LGA
5. Click "Find Centers"
6. View results with funding badges and kit availability

---

## ✅ Fixed Issues

- ✅ 500 error resolved (services/staff arrays now always returned)
- ✅ All 7 centers display correctly
- ✅ Funding badges show properly
- ✅ Kit availability displays with progress bars
- ✅ State and LGA filtering works
- ✅ Empty states handled gracefully

---

**Deployment Status**: Changes pushed to GitHub, Netlify will auto-deploy in ~3-5 minutes
