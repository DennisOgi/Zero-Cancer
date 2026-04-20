# ZeroCancer Platform

ZeroCancer is a comprehensive platform that connects cancer screening donations with patients in need. The platform facilitates seamless matching between donors, cancer centers, and patients requiring screening services.

## 🎯 What ZeroCancer Does

**For Donors & Campaigns:**

- Create donation campaigns for specific cancer screening types
- Contribute to general funding pools for cancer screenings
- Track donation impact and see how funds are used

**For Patients:**

- Join waitlists for cancer screening services
- Get automatically matched with available funding
- Receive notifications when screening appointments are available

**For Cancer Centers:**

- Register to provide screening services
- Receive automatic monthly payouts for completed screenings
- Track earnings and transaction history

**For Administrators:**

- Oversee the entire platform operation
- Manually trigger matching algorithms when needed
- Monitor system health and manage campaigns

## 🏗️ System Architecture

- **Frontend**: React + TypeScript + TanStack Router + Vite
- **Backend**: Hono.js + Prisma + SQLite/PostgreSQL
- **Payments**: Paystack integration for automated payouts
- **Authentication**: JWT-based auth with role-based access control
- **Automation**: Webhook-driven cron jobs for matching and payouts

## 🚀 Quick Setup

### Prerequisites

- Node.js (v18+)
- pnpm package manager

### 1. Clone and Install

```bash
git clone https://github.com/DennisOgi/Zero-Cancer.git
cd Zero-Cancer
pnpm install
```

### 2. Environment Setup

Create environment files for both frontend and backend:

**Backend (`apps/backend/.env`):**

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-jwt-secret-key-here"

# Paystack (for payouts)
PAYSTACK_SECRET_KEY="your-paystack-secret-key"

# Webhook security (for cron jobs)
CRON_API_KEY="your-cron-api-key-here"

# Frontend url
FRONTEND_URL="http://localhost:3000"

# Optional: Email service
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email"
SMTP_PASS="your-password"
```

### 3. Database Setup

```bash
cd apps/backend
pnpm prisma:generate
pnpm --filter ./apps/backend db:push
```

### 4. Start Development Servers

**Terminal 1 (Backend):**

```bash
cd apps/backend
pnpm dev
```

**Terminal 2 (Frontend):**

```bash
cd apps/frontend
pnpm dev
```

**Or Start up both**

```bash
pnpm dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

The easiest way to deploy ZeroCancer is using Vercel:

1. **Fork/Clone** this repository to your GitHub account
2. **Connect to Vercel**: Go to [vercel.com](https://vercel.com) and import your repository
3. **Configure Environment Variables**: Add the required environment variables in Vercel dashboard
4. **Deploy**: Vercel will automatically build and deploy your application

📖 **Detailed Vercel deployment guide**: [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md)

### Option 2: Cloudflare Workers (Original)

For Cloudflare Workers deployment:

```bash
# Build for production
pnpm build:production

# Deploy to Cloudflare
pnpm start:production
```

## 🔧 Production Deployment

### Build for Production

```bash
# Build all packages
pnpm build

# Or build individually
pnpm --filter ./apps/backend build
pnpm --filter ./apps/frontend build
```

### Environment Variables (Production)

Ensure all environment variables are set in your production environment, especially:

- `DATABASE_URL` (PostgreSQL recommended for production)
- `PAYSTACK_SECRET_KEY` (live keys)
- `JWT_SECRET` (strong, random key)
- `CRON_API_KEY` (for automated webhooks)

## 🤖 Automated Operations

ZeroCancer includes two automated webhook endpoints for cron jobs:

### 1. Monthly Payouts

Automatically processes monthly payments to cancer centers:

```bash
# Run on 1st of each month at 2 AM
# Crontab: 0 2 1 * *
curl -X POST https://your-domain.com/api/v1/payouts/monthly-batch \
  -H "x-api-key: $CRON_API_KEY"
```

### 2. Waitlist Matching

Matches patients with available funding every 18 hours:

```bash
# Run every 18 hours
# Crontab: 0 */18 * * *
curl -X POST https://your-domain.com/api/v1/waitlist/trigger-matching \
  -H "x-api-key: $CRON_API_KEY"
```

📖 **Full webhook documentation**: `apps/backend/WAITLIST_WEBHOOK.md`

## 📁 Project Structure

```
zerocancer/
├── apps/
│   ├── backend/          # Hono.js API server
│   │   ├── src/api/      # API endpoints
│   │   ├── src/lib/      # Business logic & services
│   │   ├── src/middleware/ # Auth & validation
│   │   └── prisma/       # Database schema & migrations
│   └── frontend/         # React SPA
│       ├── src/components/ # Reusable UI components
│       ├── src/routes/   # TanStack Router pages
│       ├── src/services/ # API calls & state management
│       └── src/hooks/    # Custom React hooks
├── packages/
│   └── shared/           # Shared TypeScript types & schemas
└── scripts/              # Build & deployment scripts
```

## 🔑 Key Features

- **Automated Matching**: Algorithm matches patients with available funding
- **Real-time Notifications**: Patients and centers get instant updates
- **Financial Tracking**: Complete audit trail for all transactions
- **Role-based Access**: Admin, center staff, and patient permissions
- **Campaign Management**: Targeted and general donation campaigns
- **Mobile Responsive**: Works on all devices
- **Type Safety**: Full TypeScript coverage with shared schemas

## 📚 Development Resources

- **API Documentation**: Explore endpoints at `/api/docs` (when running backend)
- **Database Schema**: Check `apps/backend/prisma/schema.prisma`
- **Shared Types**: All types in `packages/shared/types/`
- **Component Library**: shadcn/ui components in `apps/frontend/src/components/ui/`

## 🚨 Important Notes

1. **Database**: Uses SQLite for development, PostgreSQL recommended for production
2. **Payments**: Requires valid Paystack account and API keys
3. **Webhooks**: Set up cron jobs for automated operations
4. **Security**: Change all default secrets before deploying to production

## 📞 Support

For questions about setup, deployment, or contributing to ZeroCancer, please check the documentation in each app's README, open an issue or contact [@T4910](https://github.com/T4910) / [@RalphFred](https://github.com/RalphFred).
