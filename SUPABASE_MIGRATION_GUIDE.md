# Supabase Migration Guide - ZeroCancer

## ✅ Why Supabase is Perfect for ZeroCancer

### Key Benefits:
1. **PostgreSQL** - Production-grade database (same as you were planning)
2. **Built-in Auth** - Can replace custom JWT auth system
3. **Real-time** - Live notifications for centers, donors, patients
4. **Storage** - Medical documents, test results, receipts
5. **Row Level Security (RLS)** - HIPAA-compliant patient data protection
6. **Edge Functions** - SMS integration, background jobs
7. **Free Tier** - 500MB database, 1GB file storage, 2GB bandwidth
8. **Dashboard** - Easy database management and monitoring

### Perfect for Your Features:
- ✅ Secure patient medical records (RLS policies)
- ✅ Real-time notifications (donor → patient, center → admin)
- ✅ File uploads (test results, receipts)
- ✅ SMS integration (Africa's Talking via Edge Functions)
- ✅ Agent system (real-time queue management)
- ✅ Scalable (handles growth automatically)

---

## Current Status

✅ **Supabase Project Created**: "Zerocancer"
✅ **Project ID**: `ouiikyvcjnanhwyobqwp`
✅ **Region**: EU West 1 (Ireland)
✅ **Database**: PostgreSQL 17.6
✅ **CLI Linked**: Ready to migrate

---

## Migration Steps

### Step 1: Get Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ouiikyvcjnanhwyobqwp)
2. Click **Project Settings** (gear icon)
3. Click **Database** in sidebar
4. Scroll to **Connection string**
5. Click **Reset database password** if you don't have it
6. Copy the password

### Step 2: Update Environment Variables

Update `apps/backend/.env.supabase` with your password:

```env
DATABASE_URL="postgresql://postgres.ouiikyvcjnanhwyobqwp:YOUR_PASSWORD_HERE@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.ouiikyvcjnanhwyobqwp:YOUR_PASSWORD_HERE@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

### Step 3: Run Prisma Migration

This creates all tables in Supabase:

```bash
cd apps/backend

# Use the Supabase environment
$env:DATABASE_URL="postgresql://postgres.ouiikyvcjnanhwyobqwp:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
$env:DIRECT_URL="postgresql://postgres.ouiikyvcjnanhwyobqwp:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# Generate Prisma client
npm run prisma:generate

# Push schema to Supabase (creates all tables)
npx prisma db push

# Or create a migration
npx prisma migrate dev --name init_supabase
```

### Step 4: Seed the Database

Populate with test data:

```bash
cd apps/backend

# Make sure DATABASE_URL is set
npm run db:seed
```

**This creates**:
- ✅ 25 screening types
- ✅ 5 categories
- ✅ 7 test centers
- ✅ Test patients & donors
- ✅ Admin accounts

### Step 5: Verify in Supabase Dashboard

1. Go to [Table Editor](https://supabase.com/dashboard/project/ouiikyvcjnanhwyobqwp/editor)
2. You should see all tables:
   - User
   - PatientProfile
   - DonorProfile
   - ServiceCenter
   - ScreeningType
   - ScreeningTypeCategory
   - Appointment
   - DonationCampaign
   - etc.

### Step 6: Update Backend Configuration

Update `apps/backend/wrangler.json`:

```json
{
  "vars": {
    "DATABASE_URL": "postgresql://postgres.ouiikyvcjnanhwyobqwp:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    "SUPABASE_URL": "https://ouiikyvcjnanhwyobqwp.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91aWlreXZjam5hbmh3eW9icXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDE2NTIsImV4cCI6MjA5Mjk3NzY1Mn0.Rmd5xGZXtz35VftBTcjQ7i0zS9XkodgdlJrh4Nu06MU"
  }
}
```

### Step 7: Update Local Development

Update `apps/backend/.dev.vars`:

```env
DATABASE_URL="postgresql://postgres.ouiikyvcjnanhwyobqwp:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.ouiikyvcjnanhwyobqwp:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

### Step 8: Test Locally

```bash
cd apps/backend
npm run dev
```

Test the API:
```bash
curl http://127.0.0.1:8787/api/v1/screening-types/all
```

Should return all 25 screening types!

### Step 9: Deploy to Production

```bash
cd apps/backend
npm run deploy
```

### Step 10: Test Production

```bash
curl https://zerocancer.daunderlord.workers.dev/api/v1/screening-types/all
```

### Step 11: Test Center Registration

1. Go to https://zerocancerafrica.netlify.app/sign-up/center
2. Fill in the form
3. Services dropdown should show all 25 screening types ✅
4. Submit and verify success!

---

## Database Schema Overview

### Core Tables:
- **User** - Patients and donors
- **PatientProfile** - Patient-specific data
- **DonorProfile** - Donor-specific data
- **ServiceCenter** - Screening centers
- **CenterStaff** - Center employees
- **ScreeningType** - Types of screenings (25 types)
- **ScreeningTypeCategory** - Categories (5 categories)

### Appointment & Donation:
- **Appointment** - Screening appointments
- **DonationCampaign** - Donor campaigns
- **DonationAllocation** - Patient-donor matching
- **Waitlist** - Patients waiting for screening
- **Transaction** - Payment records
- **Receipt** - Payment receipts

### Center Management:
- **AppointmentVerification** - Check-in verification
- **ScreeningResult** - Test results
- **ScreeningResultFile** - Result files
- **Kit** - Screening kit inventory
- **Payout** - Center payouts
- **PayoutItem** - Payout line items

### System:
- **Notification** - System notifications
- **NotificationRecipient** - Notification delivery
- **MatchingExecution** - Automated patient matching
- **BlogPost** - Blog content
- **Association** - Patient associations
- **Group** - Patient groups

---

## Next Steps: Enable Supabase Features

### 1. Row Level Security (RLS)

Protect patient data with RLS policies:

```sql
-- Enable RLS on sensitive tables
ALTER TABLE "PatientProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScreeningResult" ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own data
CREATE POLICY "Patients can view own profile"
ON "PatientProfile"
FOR SELECT
USING (auth.uid() = "userId");

-- Centers can see their appointments
CREATE POLICY "Centers can view own appointments"
ON "Appointment"
FOR SELECT
USING (
  "centerId" IN (
    SELECT id FROM "ServiceCenter" 
    WHERE email = auth.email()
  )
);
```

### 2. Real-time Subscriptions

Enable real-time for notifications:

```sql
-- Enable realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
ALTER PUBLICATION supabase_realtime ADD TABLE "NotificationRecipient";
```

Frontend code:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Subscribe to new notifications
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'NotificationRecipient',
    filter: `userId=eq.${userId}`
  }, (payload) => {
    console.log('New notification!', payload)
    // Update UI
  })
  .subscribe()
```

### 3. Storage for Medical Files

Create storage buckets:

```typescript
// Create bucket for test results
await supabase.storage.createBucket('test-results', {
  public: false,
  fileSizeLimit: 10485760, // 10MB
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
})

// Upload file
const { data, error } = await supabase.storage
  .from('test-results')
  .upload(`${appointmentId}/result.pdf`, file)
```

### 4. Edge Functions for SMS

Create Edge Function for SMS:

```bash
supabase functions new send-sms
```

```typescript
// supabase/functions/send-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { phoneNumber, message } = await req.json()
  
  // Call Africa's Talking API
  const response = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      'apiKey': Deno.env.get('AFRICASTALKING_API_KEY'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      username: 'zerocancer',
      to: phoneNumber,
      message: message
    })
  })
  
  return new Response(JSON.stringify(await response.json()), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Deploy:
```bash
supabase functions deploy send-sms
```

---

## Troubleshooting

### Error: "Can't reach database server"
- Check password is correct
- Verify connection string format
- Check if IP is whitelisted (Supabase allows all by default)

### Error: "Table already exists"
- Database already has tables
- Either drop tables or use `prisma migrate deploy` instead of `db push`

### Error: "Screening types not showing"
- Verify seed script ran successfully
- Check Supabase dashboard Table Editor
- Query directly: `SELECT * FROM "ScreeningType"`

### Migration fails
- Check Prisma schema syntax
- Verify PostgreSQL compatibility
- Check for SQLite-specific features (need to convert)

---

## Cost Estimate

### Free Tier (Current):
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ✅ 500,000 Edge Function invocations

### Pro Tier ($25/month) - When you scale:
- 8GB database
- 100GB file storage
- 250GB bandwidth
- Daily backups
- Point-in-time recovery

### Estimated Usage:
- **Database**: ~100MB (thousands of patients)
- **Storage**: ~5GB (test results, receipts)
- **Bandwidth**: ~10GB/month
- **Cost**: Free tier sufficient for 6-12 months

---

## Comparison: Supabase vs Neon

| Feature | Supabase | Neon |
|---------|----------|------|
| Database | PostgreSQL ✅ | PostgreSQL ✅ |
| Auth | Built-in ✅ | Need custom |
| Storage | Built-in ✅ | Need S3/Cloudinary |
| Real-time | Built-in ✅ | Need custom |
| Edge Functions | Built-in ✅ | Need Cloudflare |
| Dashboard | Excellent ✅ | Basic |
| Free Tier | 500MB ✅ | 512MB ✅ |
| **Best for** | Full-stack apps | Database only |

**Recommendation**: Supabase is better for ZeroCancer because it's an all-in-one solution.

---

## Migration Checklist

- [ ] Get Supabase database password
- [ ] Update `.env.supabase` with password
- [ ] Run `npx prisma db push` to create tables
- [ ] Run `npm run db:seed` to populate data
- [ ] Verify tables in Supabase dashboard
- [ ] Update `wrangler.json` with Supabase URL
- [ ] Update `.dev.vars` for local development
- [ ] Test locally: `npm run dev`
- [ ] Deploy backend: `npm run deploy`
- [ ] Test production API
- [ ] Test center registration on Netlify
- [ ] Enable RLS policies (optional, for security)
- [ ] Set up real-time subscriptions (optional)
- [ ] Create storage buckets (optional)
- [ ] Deploy Edge Functions for SMS (optional)

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Prisma + Supabase**: https://supabase.com/docs/guides/integrations/prisma
- **Dashboard**: https://supabase.com/dashboard/project/ouiikyvcjnanhwyobqwp

---

**Created**: April 28, 2026
**Status**: Ready to migrate
**Estimated Time**: 30 minutes
