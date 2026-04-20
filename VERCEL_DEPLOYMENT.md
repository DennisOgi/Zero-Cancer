# ZeroCancer - Vercel Deployment Guide

This guide will help you deploy the ZeroCancer application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: The code should be in a GitHub repository
3. **Database**: Set up a PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `https://github.com/DennisOgi/Zero-Cancer.git`
4. Select the repository and click "Import"

### 2. Configure Build Settings

Vercel should automatically detect the configuration from `vercel.json`, but verify these settings:

- **Framework Preset**: Other
- **Root Directory**: `./` (leave empty)
- **Build Command**: `pnpm vercel-build`
- **Output Directory**: `apps/frontend/dist`
- **Install Command**: `pnpm install`

### 3. Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

#### Required Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_TOKEN_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
FRONTEND_URL=https://your-app-name.vercel.app
ENV_MODE=production
```

#### Optional Variables (for full functionality):
```
# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Paystack (for payments)
PAYSTACK_SECRET_KEY=sk_live_your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=pk_live_your-paystack-public-key

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WhatsApp (optional)
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

### 4. Database Setup

#### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add it as `DATABASE_URL` in Vercel

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (make sure to replace `[YOUR-PASSWORD]`)
5. Add it as `DATABASE_URL` in Vercel

#### Option C: PlanetScale
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Create a branch and get connection details
4. Add the connection string as `DATABASE_URL` in Vercel

### 5. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-app-name.vercel.app`

### 6. Post-Deployment Setup

#### Initialize Database
After deployment, you need to set up the database:

1. Go to your Vercel project dashboard
2. Go to Functions → View Function Logs
3. Or use Vercel CLI to run migrations:
   ```bash
   npx vercel env pull .env.local
   cd apps/backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

#### Test the Application
1. Visit your deployed URL
2. Try creating accounts for different user types
3. Test the main functionality

## Troubleshooting

### Build Errors
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify the database connection string

### Runtime Errors
- Check the Function logs in Vercel dashboard
- Ensure the database is accessible
- Verify all required environment variables are set

### Database Issues
- Make sure the database URL is correct
- Check if the database allows connections from Vercel's IP ranges
- Verify the database has the correct schema (run migrations)

## Architecture

The deployment uses:
- **Frontend**: Static files served by Vercel's CDN
- **Backend**: Serverless functions powered by Vercel Functions
- **Database**: External PostgreSQL database
- **File Storage**: Cloudinary for images and documents
- **Payments**: Paystack integration

## Performance Optimization

1. **Database**: Use connection pooling for better performance
2. **Images**: Cloudinary automatically optimizes images
3. **Caching**: Vercel automatically caches static assets
4. **CDN**: Global distribution through Vercel's edge network

## Monitoring

- Use Vercel Analytics for performance monitoring
- Check Function logs for backend errors
- Monitor database performance through your database provider

## Support

If you encounter issues:
1. Check the Vercel documentation
2. Review the application logs
3. Ensure all environment variables are correctly set
4. Verify database connectivity

## Custom Domain (Optional)

To use a custom domain:
1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. Update `FRONTEND_URL` environment variable to your custom domain