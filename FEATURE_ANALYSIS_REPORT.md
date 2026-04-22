# Feature Analysis Report: Center Finder & Funding Status

**Date**: April 22, 2026  
**Analyzed By**: Kiro AI Assistant

---

## 🔍 Analysis Summary

### 1. "Find a Screening Center Near You" Feature

**Location**: `apps/frontend/src/components/LandingPage/Find.tsx`

#### Current Status: ⚠️ **NON-FUNCTIONAL (UI Only)**

**What Exists:**
- ✅ Beautiful UI component with state and LGA dropdowns
- ✅ "Find Centers" button
- ✅ Placeholder image and description

**What's Missing:**
- ❌ No state change handlers
- ❌ No API integration
- ❌ Hardcoded dropdown values (Lagos, Abuja, Rivers only)
- ❌ Button has no onClick handler
- ❌ No navigation to results page
- ❌ No dynamic LGA loading based on selected state
- ❌ No comprehensive state/LGA data

**Current Implementation:**
```typescript
// Static dropdowns with no functionality
<Select>
  <SelectTrigger id="state">
    <SelectValue placeholder="Lagos" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="lagos">Lagos</SelectItem>
    <SelectItem value="abuja">Abuja</SelectItem>
    <SelectItem value="rivers">Rivers</SelectItem>
  </SelectContent>
</Select>

// Button with no action
<button className="px-8 py-2 bg-secondary text-white rounded-lg">
  Find Centers
</button>
```

---

### 2. Center Funding Status & Kit Availability Feature

**Location**: Database schema and API endpoints

#### Current Status: ⚠️ **PARTIALLY IMPLEMENTED**

**What Exists:**
- ✅ Backend API endpoint: `GET /api/v1/center` (returns center list)
- ✅ Backend API endpoint: `GET /api/v1/center/:id` (returns center details)
- ✅ Mock database with 7 service centers across Nigeria
- ✅ Center model in Prisma schema
- ✅ Kit model in Prisma schema (tracks individual kits)

**What's Missing:**
- ❌ No funding status fields in ServiceCenter model
- ❌ No kit count aggregation in API responses
- ❌ No funding information in mock database
- ❌ No frontend UI to display funding status
- ❌ No frontend UI to display kit availability
- ❌ No real-time kit count updates

**Current Center Data Structure:**
```typescript
{
  id: string
  email: string
  centerName: string
  address: string
  state: string
  lga: string
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  services: Array<{id, name, price}>
  staff: Array<{id, email}>
  // Missing: funding info, kit counts
}
```

---

## 📊 Database Analysis

### Current Mock Centers (7 Total)

| Center | State | LGA | Status |
|--------|-------|-----|--------|
| Lagos General Health Center | Lagos | Lagos Island | ACTIVE |
| Ikeja Medical Center | Lagos | Ikeja | ACTIVE |
| Abuja Central Hospital | FCT | Municipal | ACTIVE |
| Kano State Health Center | Kano | Nassarawa | ACTIVE |
| Port Harcourt Medical Hub | Rivers | Port Harcourt | ACTIVE |
| Ibadan University Teaching Hospital | Oyo | Ibadan North | ACTIVE |
| Enugu State Specialist Hospital | Enugu | Enugu North | ACTIVE |

**Geographic Coverage**: 6 states (Lagos, FCT, Kano, Rivers, Oyo, Enugu)

---

## 🎯 Required Implementations

### Priority 1: Center Funding & Kit Tracking

**Schema Changes Needed:**
```prisma
model ServiceCenter {
  // ... existing fields
  
  // NEW FIELDS
  isFunded      Boolean  @default(false)
  fundingSource String?  // "Government", "NGO", "Private Donor"
  fundingAmount Float?   // Total funding received
  fundingDate   DateTime?
  fundingExpiry DateTime?
  totalKits     Int      @default(0)  // Total kits received
  usedKits      Int      @default(0)  // Kits used in appointments
  availableKits Int      @default(0)  // Currently available
}
```

**Mock Database Updates:**
- Add funding information to all 7 centers
- Add kit availability data
- Vary funding sources (Government, NGO, Private)
- Include some funded and some unfunded centers

**API Response Updates:**
- Include funding status in `GET /api/v1/center` response
- Include kit counts in center details
- Add filtering by funding status
- Add sorting by kit availability

**Frontend Display:**
- Badge showing "Funded" or "Seeking Funding"
- Kit availability indicator (e.g., "25 kits available")
- Funding source display
- Funding expiry warning if applicable

---

### Priority 2: Functional Center Finder

**Required Components:**

1. **State/LGA Data File**
   - Create `apps/frontend/src/data/nigeria-locations.ts`
   - Include all 36 states + FCT
   - Include LGAs for each state
   - Format: `{ state: string, lgas: string[] }[]`

2. **State Management**
   - Use React state for selected state/LGA
   - Dynamic LGA dropdown based on selected state
   - Form validation

3. **API Integration**
   - Call `getCenters` API with state/lga filters
   - Handle loading states
   - Handle empty results

4. **Results Page/Modal**
   - Display filtered centers
   - Show center details (address, services, funding, kits)
   - Map integration (optional)
   - "Book Appointment" CTA

5. **Navigation**
   - Route to results page or open modal
   - Pass search parameters
   - Maintain search state

**Implementation Flow:**
```
User selects state → LGAs load dynamically
User selects LGA → Clicks "Find Centers"
→ API call with filters
→ Navigate to results page
→ Display centers with funding/kit info
→ User can book appointment
```

---

## 🚀 Recommended Implementation Order

### Phase 1: Database & API (Backend)
1. ✅ Update Prisma schema (DONE)
2. Update mock database with funding/kit data
3. Update API responses to include new fields
4. Add API filtering by funding status
5. Test API endpoints

### Phase 2: Frontend Data & UI
1. Create Nigeria states/LGAs data file
2. Update Find component with state management
3. Integrate API calls
4. Create results page/modal
5. Add funding/kit status badges

### Phase 3: Testing & Polish
1. Test all state/LGA combinations
2. Test with funded/unfunded centers
3. Test kit availability display
4. Add loading states
5. Add error handling
6. Mobile responsiveness

---

## 📝 Technical Specifications

### API Endpoint Updates

**GET /api/v1/center**
```typescript
// Current query params
{
  page?: number
  pageSize?: number
  search?: string
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  state?: string
  lga?: string
}

// ADD NEW PARAMS
{
  isFunded?: boolean  // Filter by funding status
  minKits?: number    // Minimum available kits
}

// Response should include
{
  centers: [{
    // ... existing fields
    isFunded: boolean
    fundingSource: string | null
    fundingAmount: number | null
    fundingExpiry: string | null
    totalKits: number
    usedKits: number
    availableKits: number
  }]
}
```

### Frontend Component Structure

```
Find.tsx (Homepage)
  ↓
  Uses: nigeria-locations.ts (data)
  ↓
  Calls: getCenters(state, lga)
  ↓
  Navigates to: /centers/search?state=X&lga=Y
  ↓
CenterSearchResults.tsx (New page)
  ↓
  Displays: Center cards with funding/kit info
  ↓
  Actions: View details, Book appointment
```

---

## 🎨 UI/UX Recommendations

### Funding Status Display
```
✅ Funded by Government
   25 kits available
   
⚠️ Seeking Funding
   5 kits available
   
❌ No Funding
   0 kits available
```

### Center Card Design
```
┌─────────────────────────────────────┐
│ Lagos General Health Center         │
│ 📍 Lagos Island, Lagos               │
│                                      │
│ ✅ Funded by Government              │
│ 🧪 25 kits available                 │
│ 💰 ₦2,500,000 funding                │
│                                      │
│ Services: Cervical, Breast, Prostate│
│                                      │
│ [View Details] [Book Appointment]   │
└─────────────────────────────────────┘
```

---

## ⚠️ Current Blockers

1. **Mock Database Limitation**: Current mock DB doesn't support complex queries
   - Can't aggregate kit counts from Kit model
   - Can't join with related tables
   - Need to manually add computed fields

2. **No Real Database**: Without Supabase/PostgreSQL
   - Can't do real-time kit updates
   - Can't track kit usage accurately
   - Limited to pre-configured data

3. **Missing Data**: 
   - No comprehensive Nigeria states/LGAs data
   - No funding information in current centers
   - No kit inventory data

---

## 💡 Quick Win Solutions

### For Demo/Testing (Immediate)
1. Add funding/kit data to mock database
2. Update API to return new fields
3. Create simple results page
4. Add basic state/LGA data (top 10 states)
5. Wire up Find component

### For Production (Future)
1. Migrate to Supabase PostgreSQL
2. Implement real kit inventory system
3. Add funding management dashboard
4. Integrate with real Nigeria location API
5. Add map visualization
6. Real-time kit availability updates

---

## 📈 Success Metrics

**Feature Complete When:**
- ✅ User can select any Nigerian state
- ✅ LGAs load dynamically based on state
- ✅ "Find Centers" button navigates to results
- ✅ Results show centers with funding status
- ✅ Results show kit availability
- ✅ User can filter by funding status
- ✅ User can book appointment from results
- ✅ Empty state handled gracefully
- ✅ Mobile responsive
- ✅ Loading states implemented

---

## 🎯 Conclusion

**Current State**: Both features are partially implemented with UI components but lack full functionality.

**Effort Required**: 
- Backend: 2-3 hours (schema, mock data, API updates)
- Frontend: 3-4 hours (data file, state management, results page)
- Testing: 1-2 hours
- **Total**: ~6-9 hours of development

**Recommendation**: Implement in phases, starting with backend data structure, then frontend integration, then polish.

---

**Next Steps**: Awaiting approval to proceed with implementation.
