# Production Database Setup Guide

## Current Issue

The deployed Netlify app's center registration is failing because:
- ❌ Production backend returns 500 error for `/api/v1/screening-types/all`
- ❌ Production database (PostgreSQL) is not seeded with screening types
- ❌ Registration form can't load services dropdown

## Solution: Seed Production Database

### Step 1: Verify Database Connection

The production backend is configured to use:
```
postgresql://zerocancer_owner:demo_password@ep-demo-database.us-east-1.aws.neon.tech/zerocancer?sslmode=require
```

**Check if this is a real database or placeholder:**
1. Try connecting to this database
2. If it's a placeholder, create a real Neon database

### Step 2: Create Production Database (if needed)

If you don't have a production database yet:

1. **Go to [Neon.tech](https://neon.tech)**
2. **Create a new project** named "zerocancer-production"
3. **Copy the connection string** (looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
4. **Update `apps/backend/wrangler.json`** with the real connection string

### Step 3: Run Prisma Migrations

This creates all the database tables:

```bash
cd apps/backend

# Set the production database URL
$env:DATABASE_URL="postgresql://your-real-connection-string"

# Run migrations
npm run prisma:migrate
```

### Step 4: Seed the Database

This populates the database with:
- ✅ 25 screening types (cancer, vaccines, general health)
- ✅ 5 screening type categories
- ✅ 7 test service centers
- ✅ Test patients and donors
- ✅ Admin accounts

```bash
cd apps/backend

# Make sure DATABASE_URL is set
$env:DATABASE_URL="postgresql://your-real-connection-string"

# Run seed script
npm run db:seed
```

**Expected output:**
```
🌱 Seeding Zerocancer database...
🌿 Seeding screening types...
👤 Creating general public donor...
🔐 Creating admin...
💰 Seeding general donation campaign...
📤 Creating test donors...
📥 Creating test patients...
🏥 Creating service centers...
✅ Seeding complete!

🧪 Test Accounts:
👤 Admins:
  ttaiwo4910@gmail.com / fake.password
  raphaelgbaorun@gmail.com / he_wanted_one

🏥 Centers (Admin Login):
  center1@zerocancer.org / centerpass
  center2@zerocancer.org / centerpass
  ...

📤 Donors:
  testdonor1@example.com / password123
  testdonor2@example.com / testpass456
  testdonor3@example.com / demo789

📥 Patients:
  testpatient1@example.com / password123
  testpatient2@example.com / testpass456
  testpatient3@example.com / demo789
```

### Step 5: Update Cloudflare Workers Environment

Update the production environment variables:

```bash
cd apps/backend

# Set the production DATABASE_URL in Cloudflare Workers
wrangler secret put DATABASE_URL
# Paste your real connection string when prompted
```

Or update `wrangler.json` directly:
```json
{
  "vars": {
    "DATABASE_URL": "postgresql://your-real-connection-string"
  }
}
```

### Step 6: Deploy Backend

```bash
cd apps/backend
npm run deploy
```

### Step 7: Verify Production

Test the screening types API:
```bash
curl https://zerocancer.daunderlord.workers.dev/api/v1/screening-types/all
```

**Expected response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "name": "Cervical Cancer Screening",
      "description": "Pap smear test",
      "screeningTypeCategoryId": "cancer",
      "active": true
    },
    ...
  ]
}
```

### Step 8: Test Center Registration

1. Go to https://zerocancerafrica.netlify.app/sign-up/center
2. Fill in the form
3. Services dropdown should now show all 25 screening types
4. Submit the form
5. Should see success message and redirect to login

---

## Alternative: Quick Fix with Mock Database

If you want to test immediately without setting up a real database, you can temporarily use the mock database in production:

### Option A: Deploy with Mock Database

1. **Comment out the real database check** in `apps/backend/src/lib/db.ts`:

```typescript
export const getDB = (c: any) => {
  // Always use mock database for now
  console.log("Using mock database for production testing");
  
  return {
    // ... mock database code
  };
};
```

2. **Deploy backend**:
```bash
cd apps/backend
npm run deploy
```

3. **Test immediately** - center registration will work with mock data

**⚠️ Warning**: Mock database data is lost on every deployment. This is only for testing!

---

## Recommended Approach

### For Production-Ready Solution:

1. ✅ **Use real PostgreSQL database** (Neon, Supabase, or similar)
2. ✅ **Run migrations and seed script**
3. ✅ **Deploy with real database connection**
4. ✅ **Data persists across deployments**

### For Quick Testing:

1. ⚡ **Use mock database temporarily**
2. ⚡ **Test all features**
3. ⚡ **Switch to real database later**

---

## Troubleshooting

### Error: "Can't reach database server"
- Check if database URL is correct
- Verify database is running
- Check firewall/network settings

### Error: "Table doesn't exist"
- Run migrations first: `npm run prisma:migrate`
- Then run seed: `npm run db:seed`

### Error: "Unique constraint violation"
- Database already has data
- Either:
  - Skip seeding (data already exists)
  - Reset database: `npm run prisma:reset`

### Screening types still not showing
- Check backend logs in Cloudflare Workers dashboard
- Verify DATABASE_URL environment variable is set
- Test API directly: `curl https://zerocancer.daunderlord.workers.dev/api/v1/screening-types/all`

---

## Current Status

- ✅ Local development: Working (mock database with screening types)
- ❌ Production: Not working (database not seeded)
- ✅ Seed script: Ready to run
- ⏳ Action needed: Seed production database

---

**Next Steps:**
1. Decide: Real database or mock database for now?
2. If real: Set up Neon database and run seed script
3. If mock: Deploy with mock database temporarily
4. Test center registration on production
5. Verify all features work

---

**Created**: April 27, 2026
**Status**: Awaiting database setup
