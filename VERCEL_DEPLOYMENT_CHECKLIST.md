# Vercel Deployment Checklist ✅

Follow this checklist to deploy ZeroCancer to Vercel successfully.

## Pre-Deployment Setup

### 1. Database Setup (Choose One)
- [ ] **Neon** (Recommended): Create account at [neon.tech](https://neon.tech)
- [ ] **Supabase**: Create account at [supabase.com](https://supabase.com) 
- [ ] **PlanetScale**: Create account at [planetscale.com](https://planetscale.com)
- [ ] Copy the PostgreSQL connection string

### 2. Third-Party Services (Optional but Recommended)
- [ ] **Cloudinary**: For file uploads - [cloudinary.com](https://cloudinary.com)
- [ ] **Paystack**: For payments - [paystack.com](https://paystack.com)
- [ ] **Email Service**: Gmail or other SMTP provider

## Vercel Deployment

### 3. Connect to Vercel
- [ ] Go to [vercel.com/dashboard](https://vercel.com/dashboard)
- [ ] Click "New Project"
- [ ] Import from GitHub: `https://github.com/DennisOgi/Zero-Cancer.git`
- [ ] Click "Import"

### 4. Configure Build Settings
Vercel should auto-detect, but verify:
- [ ] **Framework Preset**: Other
- [ ] **Root Directory**: `./` (leave empty)
- [ ] **Build Command**: `pnpm vercel-build`
- [ ] **Output Directory**: `apps/frontend/dist`
- [ ] **Install Command**: `pnpm install`

### 5. Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

#### Required Variables:
- [ ] `DATABASE_URL` = `postgresql://username:password@host:port/database`
- [ ] `JWT_TOKEN_SECRET` = `your-super-secret-jwt-key-here-make-it-long-and-random`
- [ ] `FRONTEND_URL` = `https://your-app-name.vercel.app`
- [ ] `ENV_MODE` = `production`

#### Optional Variables (for full functionality):
- [ ] `CLOUDINARY_CLOUD_NAME` = `your-cloudinary-cloud-name`
- [ ] `CLOUDINARY_API_KEY` = `your-cloudinary-api-key`
- [ ] `CLOUDINARY_API_SECRET` = `your-cloudinary-api-secret`
- [ ] `PAYSTACK_SECRET_KEY` = `sk_live_your-paystack-secret-key`
- [ ] `PAYSTACK_PUBLIC_KEY` = `pk_live_your-paystack-public-key`
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`
- [ ] `SMTP_USER` = `your-email@gmail.com`
- [ ] `SMTP_PASS` = `your-app-password`

### 6. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Note your deployment URL: `https://your-app-name.vercel.app`

## Post-Deployment Setup

### 7. Database Initialization
After successful deployment:
- [ ] Go to Vercel Dashboard → Functions → View Function Logs
- [ ] Or use Vercel CLI to run database setup:
  ```bash
  npx vercel env pull .env.local
  cd apps/backend
  npx prisma migrate deploy
  npx prisma db seed
  ```

### 8. Update Environment Variables
- [ ] Update `FRONTEND_URL` to your actual Vercel URL
- [ ] Redeploy if you changed `FRONTEND_URL`

### 9. Test Deployment
- [ ] Visit your deployed URL
- [ ] Test user registration (Patient, Donor, Center)
- [ ] Test login functionality
- [ ] Check if blog and about pages load
- [ ] Verify API endpoints are working

## Verification Checklist

### Frontend Tests:
- [ ] Homepage loads correctly
- [ ] Navigation works (Blog, About, Login, Sign Up)
- [ ] Responsive design works on mobile
- [ ] All images and assets load

### Backend Tests:
- [ ] API health check: `https://your-app.vercel.app/api/healthz`
- [ ] User registration works
- [ ] Login/logout functionality
- [ ] Database connections are working

### Full Feature Tests:
- [ ] Create test accounts (Patient, Donor, Center, Admin)
- [ ] Test appointment booking flow
- [ ] Test donation campaign creation
- [ ] Test center management features
- [ ] Test blog functionality

## Troubleshooting

### Common Issues:
- [ ] **Build fails**: Check build logs, verify all dependencies
- [ ] **Database connection fails**: Verify DATABASE_URL format
- [ ] **API routes not working**: Check function logs in Vercel dashboard
- [ ] **Environment variables**: Ensure all required vars are set
- [ ] **CORS errors**: Verify FRONTEND_URL matches your domain

### Debug Steps:
1. [ ] Check Vercel Function logs
2. [ ] Verify environment variables are set correctly
3. [ ] Test database connection separately
4. [ ] Check if all required services are configured

## Production Optimization

### Performance:
- [ ] Enable Vercel Analytics
- [ ] Set up custom domain (optional)
- [ ] Configure CDN caching
- [ ] Monitor function execution times

### Security:
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS only
- [ ] Set up proper CORS policies
- [ ] Use production API keys for all services

### Monitoring:
- [ ] Set up error tracking
- [ ] Monitor database performance
- [ ] Track user analytics
- [ ] Set up uptime monitoring

## Success! 🎉

Once all items are checked:
- [ ] Your ZeroCancer application is live on Vercel
- [ ] All features are working correctly
- [ ] Database is properly initialized
- [ ] Third-party integrations are active

**Your app is now live at**: `https://your-app-name.vercel.app`

## Next Steps

- [ ] Share the URL with stakeholders
- [ ] Set up monitoring and analytics
- [ ] Plan for ongoing maintenance
- [ ] Consider setting up staging environment
- [ ] Document any custom configurations

---

**Need help?** Check the detailed guide in [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md)