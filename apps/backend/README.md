# ZeroCancer Backend API

The ZeroCancer backend is a robust REST API built with Hono.js, Prisma, and TypeScript. It handles all business logic for the cancer screening donation platform, including patient waitlist matching, payment processing, and automated payout systems.

## 🏗️ Architecture

- **Framework**: Hono.js (fast, lightweight web framework)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT-based with role-based access control
- **Payments**: Paystack integration for automated payouts
- **Type Safety**: Full TypeScript with shared schemas
- **Webhooks**: Automated cron job endpoints for matching and payouts

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── api/                  # API endpoint routes
│   │   ├── appointments.ts   # Appointment management
│   │   ├── auth.ts          # Authentication & registration
│   │   ├── campaigns.ts     # Donation campaign management
│   │   ├── centers.ts       # Cancer center operations
│   │   ├── donations.ts     # Donation processing
│   │   ├── payouts.ts       # Payout & financial operations
│   │   ├── users.ts         # User management
│   │   └── waitlist.ts      # Waitlist matching system
│   ├── lib/                 # Business logic & services
│   │   ├── auth.service.ts  # Authentication logic
│   │   ├── crypto.utils.ts  # Cryptographic utilities
│   │   ├── db.ts           # Database connection
│   │   ├── email.service.ts # Email notifications
│   │   ├── notification.service.ts # Push notifications
│   │   ├── payout.service.ts # Payout processing logic
│   │   ├── paystack.service.ts # Paystack API integration
│   │   └── waitlist.service.ts # Matching algorithm
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts # JWT verification
│   │   ├── cors.middleware.ts # CORS configuration
│   │   └── validation.middleware.ts # Request validation
│   ├── app.ts              # Main application setup
│   └── server.ts           # Server entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── dev.db             # SQLite development database
│   └── migrations/         # Database migrations
├── frontend-dist/          # Built frontend assets (for production)
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- pnpm package manager

### Development Setup

1. **Install dependencies** (from project root):

   ```bash
   cd ../../  # Go to project root
   pnpm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file**:

   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # Authentication
   JWT_SECRET="your-super-secret-jwt-key-here"

   # Paystack (get from https://paystack.com)
   PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key"

   # Webhook security for cron jobs
   CRON_API_KEY="your-secure-cron-api-key"

   # Frontend url
   FRONTEND_URL="http://localhost:3000"

   # Email service (optional)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"

   # Environment
   NODE_ENV="development"
   PORT=3000
   ```

4. **Set up the database**:

   ```bash
   pnpm prisma:generate
   pnpm db:push
   ```

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

The API will be available at `http://localhost:8000`

## 🗄️ Database Schema

The backend uses Prisma with the following main entities:

### Core Entities

- **User**: Patients, admins, and center staff
- **Center**: Cancer screening centers
- **Campaign**: Donation campaigns for specific screening types
- **Donation**: Individual donation records
- **Waitlist**: Patients waiting for screening appointments
- **Appointment**: Scheduled screening appointments
- **Payout**: Financial payments to centers
- **Notification**: System notifications

### Key Relationships

- Users can create donations and join waitlists
- Centers provide screening services and receive payouts
- Campaigns fund specific screening types
- Waitlist matching connects patients with funding
- Appointments track completed screenings

### Database Commands

```bash
# Generate Prisma client
pnpm prisma:generate

# Push schema changes to database
pnpm db:push

# Reset database (development only)
pnpm prisma:reset

# Open Prisma Studio (visual database editor)
pnpm prisma:studio

# Create a new migration
pnpm prisma migrate dev --name migration_name
```

## 🔐 Authentication & Authorization

### JWT Authentication

The API uses JWT tokens for authentication with role-based access control.

**User Roles:**

- `patient`: Can donate, join waitlists, book appointments
- `center_staff`: Can manage center operations, view payouts
- `admin`: Full system access, can manage campaigns and trigger operations

**Protected Routes:**

```typescript
// Middleware usage examples
app.get("/admin/*", authMiddleware(["admin"]));
app.get("/center/*", authMiddleware(["admin", "center_staff"]));
app.post("/donations", authMiddleware(["patient", "admin"]));
```

### Registration & Login

```bash
# Register a new user
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "profile": "patient"
}

# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

## 💰 Payment & Payout System

### Paystack Integration

The backend integrates with Paystack for:

- Processing center payouts
- Bank account verification
- Transfer status webhooks

### Monthly Automated Payouts

Centers are automatically paid monthly for completed screenings:

```bash
# Automated webhook (triggered by cron job)
POST /api/v1/payouts/monthly-batch
Headers: x-api-key: your_cron_api_key
```

### Manual Payout Operations

Admins can:

- View center balances
- Create manual payouts
- Retry failed transfers
- Track payout history

## 🎯 Waitlist Matching Algorithm

The core feature that matches patients with available funding:

### How It Works

1. **Processes up to 10 patients per screening type** (FCFS order)
2. **Skips patients with 3+ unclaimed allocations** (prevents over-allocation)
3. **Prioritizes campaigns by specificity and funding amount**
4. **Falls back to general donor pool** if no campaigns match
5. **Creates notifications** for successful matches
6. **Updates balances** atomically

### Automated Matching

```bash
# Triggered by cron job every 18 hours
POST /api/v1/waitlist/trigger-matching
Headers: x-api-key: your_cron_api_key
```

### Manual Admin Trigger

```bash
# Admin can manually trigger matching
POST /api/v1/waitlist/manual-trigger
Headers: Authorization: Bearer jwt_token
```

## 📡 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Users & Profiles

- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users` - List users (admin only)

### Campaigns

- `GET /api/v1/campaigns` - List active campaigns
- `POST /api/v1/campaigns` - Create campaign (admin)
- `PUT /api/v1/campaigns/:id` - Update campaign (admin)
- `DELETE /api/v1/campaigns/:id` - Delete campaign (admin)

### Donations

- `POST /api/v1/donations` - Create donation
- `GET /api/v1/donations/user` - User's donation history
- `GET /api/v1/donations` - All donations (admin)

### Centers

- `GET /api/v1/centers` - List cancer centers
- `POST /api/v1/centers` - Register center (admin)
- `GET /api/v1/centers/:id` - Get center details
- `PUT /api/v1/centers/:id` - Update center (admin/staff)

### Waitlist

- `POST /api/v1/waitlist/join` - Join waitlist
- `GET /api/v1/waitlist/user` - User's waitlist status
- `POST /api/v1/waitlist/trigger-matching` - Automated trigger
- `POST /api/v1/waitlist/manual-trigger` - Manual admin trigger
- `GET /api/v1/waitlist/matching-stats` - Admin statistics

### Appointments

- `GET /api/v1/appointments` - List appointments
- `POST /api/v1/appointments` - Book appointment
- `PUT /api/v1/appointments/:id` - Update appointment
- `DELETE /api/v1/appointments/:id` - Cancel appointment

### Payouts

- `GET /api/v1/payouts/center-balances` - All center balances (admin)
- `GET /api/v1/payouts/center/:id/balance` - Specific center balance
- `POST /api/v1/payouts/manual` - Create manual payout (admin)
- `POST /api/v1/payouts/monthly-batch` - Automated monthly payouts
- `GET /api/v1/payouts` - List payouts (admin)
- `GET /api/v1/payouts/center/:id` - Center's payout history

### Webhooks

- `POST /api/v1/payouts/webhook/paystack` - Paystack transfer notifications
- `POST /api/v1/waitlist/trigger-matching` - Automated matching trigger

## 🔧 Development Commands

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server
pnpm test             # Run tests

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm db:push      # Push schema changes
pnpm prisma:studio    # Open database GUI
pnpm prisma:reset     # Reset database (dev only)

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm type-check       # TypeScript type checking
```

## 🚀 Production Deployment

### Environment Setup

1. **Set up PostgreSQL database**
2. **Configure production environment variables**
3. **Set up Paystack webhooks**
4. **Configure SMTP for emails**

### Build & Deploy

```bash
# Build the application
pnpm build

# Set production environment
export NODE_ENV=production

# Run database migrations
pnpm prisma migrate deploy

# Start the server
pnpm start
```

### Required Production Environment Variables

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-super-secure-jwt-secret"
PAYSTACK_SECRET_KEY="sk_live_your_live_paystack_key"
CRON_API_KEY="your-secure-cron-api-key"
FRONTEND_URL="http://localhost:3000"
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email"
SMTP_PASS="your-password"
PORT=3000
```

### Webhook Configuration

Configure these webhook URLs in your external systems:

**Paystack Dashboard:**

- `https://your-domain.com/api/v1/payouts/webhook/paystack`

**Cron Jobs:**

- Monthly payouts: `https://your-domain.com/api/v1/payouts/monthly-batch`
- Waitlist matching: `https://your-domain.com/api/v1/waitlist/trigger-matching`

## 🔍 Monitoring & Debugging

### Health Checks

- `GET /api/v1/waitlist/matching-status` - Waitlist system health
- `GET /health` - Basic API health check

### Logging

The application logs important events:

- Authentication attempts
- Payment processing
- Waitlist matching results
- Error conditions

### Common Issues

**Database Connection Issues:**

```bash
# Check database connection
pnpm prisma db pull

# Reset and regenerate
pnpm prisma:reset
pnpm prisma:generate
```

**JWT Token Issues:**

- Ensure `JWT_SECRET` is set and consistent
- Check token expiration times
- Verify middleware configuration

**Paystack Integration:**

- Verify secret keys are correct
- Check webhook URL configuration
- Monitor Paystack dashboard for errors

## 📚 Additional Resources

- **Webhook Documentation**: `WAITLIST_WEBHOOK.md`
- **Prisma Schema**: `prisma/schema.prisma`
- **Shared Types**: `../../packages/shared/types/`
- **API Routes**: `src/api/` directory
- **Business Logic**: `src/lib/` directory

## 🤝 Contributing

1. **Follow TypeScript conventions**
2. **Add proper error handling**
3. **Include input validation**
4. **Write comprehensive tests**
5. **Update documentation**
6. **Use shared types from packages/shared**

For questions or issues, refer to the main project README or open an issue.
