# Database Migration Guide: SQLite to PostgreSQL

This guide helps you migrate from SQLite (development) to PostgreSQL (production-ready for Vercel).

## Why PostgreSQL?

- **Vercel Compatibility**: Serverless functions don't support file-based databases
- **Production Ready**: Better performance, concurrent connections, and reliability
- **Cloud Integration**: Works seamlessly with Neon, Supabase, PlanetScale
- **Scalability**: Handles multiple users and high traffic

## Quick Setup Options

### Option 1: Neon (Recommended - Free Tier Available)

1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Copy the connection string
4. Use it as your `DATABASE_URL`

### Option 2: Supabase (Full Backend Service)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string (replace `[YOUR-PASSWORD]`)
5. Use it as your `DATABASE_URL`

### Option 3: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database: `createdb zerocancer_dev`
3. Use: `postgresql://postgres:password@localhost:5432/zerocancer_dev`

## Migration Steps

### 1. Update Environment Variables

**Development (`.env`):**
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

**Production (Vercel):**
```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_TOKEN_SECRET="your-long-random-secret"
FRONTEND_URL="https://your-app.vercel.app"
ENV_MODE="production"
```

### 2. Run Database Migration

```bash
cd apps/backend

# Generate Prisma client for PostgreSQL
pnpm prisma generate

# Create and apply migrations
pnpm prisma migrate dev --name init

# Seed the database with initial data
pnpm prisma db seed
```

### 3. Verify Connection

```bash
# Check database connection
pnpm prisma studio

# Test the application
pnpm dev
```

## Data Migration (If You Have Existing Data)

### Export from SQLite

```bash
# Export data from SQLite (if you have existing data)
sqlite3 apps/backend/prisma/dev.db .dump > backup.sql
```

### Import to PostgreSQL

You'll need to manually recreate important data or use the seed script:

```bash
# Use the seed script to populate initial data
cd apps/backend
pnpm prisma db seed
```

## Environment Configuration

### Development Setup

Create `apps/backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/zerocancer_dev"
JWT_TOKEN_SECRET="your-development-secret-key"
FRONTEND_URL="http://localhost:3000"
ENV_MODE="development"
```

### Production Setup (Vercel)

Set these environment variables in Vercel Dashboard:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_TOKEN_SECRET="your-super-long-random-production-secret"
FRONTEND_URL="https://your-app.vercel.app"
ENV_MODE="production"
```

## Troubleshooting

### Connection Issues

1. **Check connection string format**:
   ```
   postgresql://username:password@host:port/database
   ```

2. **Verify database exists**:
   ```bash
   psql "postgresql://username:password@host:port/database"
   ```

3. **Check firewall/network access**:
   - Ensure your database allows connections from Vercel
   - Most cloud providers allow this by default

### Migration Errors

1. **"relation does not exist"**:
   ```bash
   pnpm prisma migrate reset
   pnpm prisma migrate dev
   ```

2. **"database does not exist"**:
   - Create the database first in your PostgreSQL instance
   - Or use a cloud provider that auto-creates databases

### Performance Issues

1. **Connection pooling**: Most cloud providers handle this automatically
2. **Query optimization**: PostgreSQL is generally faster than SQLite
3. **Indexing**: The schema already includes proper indexes

## Testing Your Setup

### 1. Database Connection
```bash
cd apps/backend
pnpm prisma studio
```

### 2. Application Functionality
```bash
# Start development server
pnpm dev

# Test API endpoints
curl http://localhost:8787/api/v1/healthz
```

### 3. Full Application Test
1. Register new users (Patient, Donor, Center)
2. Create donation campaigns
3. Test appointment booking
4. Verify all features work

## Production Deployment

Once PostgreSQL is working locally:

1. **Deploy to Vercel** with PostgreSQL `DATABASE_URL`
2. **Run migrations** in production:
   ```bash
   npx vercel env pull .env.local
   cd apps/backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Test production deployment**

## Benefits After Migration

✅ **Vercel Compatible**: Fully works with serverless functions
✅ **Better Performance**: Faster queries and concurrent connections  
✅ **Production Ready**: Reliable for real users and traffic
✅ **Scalable**: Handles growth without issues
✅ **Cloud Native**: Works with modern deployment platforms
✅ **Backup & Recovery**: Better data protection options

## Need Help?

- **Neon Documentation**: [neon.tech/docs](https://neon.tech/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Prisma PostgreSQL Guide**: [prisma.io/docs/concepts/database-connectors/postgresql](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- **Vercel Environment Variables**: [vercel.com/docs/concepts/projects/environment-variables](https://vercel.com/docs/concepts/projects/environment-variables)