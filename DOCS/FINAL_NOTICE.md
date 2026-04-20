# ZeroCancer Project Handover Documentation

⚠️ **IMPORTANT**: This app was originally designed to be a prototype and should be used as one. It requires significant production hardening before being used in a live environment.

## Project Overview

ZeroCancer is a health screening management platform that connects patients, donors, health centers, and administrators. The platform facilitates donation-based cancer screening appointments and manages the entire workflow from booking to results delivery.

## Architecture & Setup

### Monorepo Structure

The project uses **pnpm workspaces** to achieve a monorepo structure allowing frontend and backend to work together locally:

```
zerocancer/
├── apps/
│   ├── frontend/          # React + TypeScript + Vite
│   └── backend/           # Hono.js + Prisma
├── packages/
│   └── shared/            # Shared types and schemas
└── DOCS/                  # Documentation
```

### Development Setup

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev              # Starts both frontend and backend
pnpm dev:frontend     # Frontend only (port 3000)
pnpm dev:backend      # Backend only (port 8787)
```

## Technology Stack & Documentation

### Frontend Stack

- **React.js** - UI framework for building interactive user interfaces
  - [React Documentation](https://react.dev/)
- **TypeScript** - Type-safe JavaScript for better developer experience
  - [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- **Vite** - Fast build tool and development server
  - [Vite Documentation](https://vitejs.dev/)
- **TanStack Router** - Type-safe routing with file-based routing system
  - [TanStack Router Documentation](https://tanstack.com/router)
- **TanStack Query** - Data fetching, caching, and synchronization
  - [TanStack Query Documentation](https://tanstack.com/query)
- **React Hook Form** - Performant forms with easy validation
  - [React Hook Form Documentation](https://react-hook-form.com/)
- **shadcn/ui** - Accessible and customizable UI components
  - [shadcn/ui Documentation](https://ui.shadcn.com/)
- **Tailwind CSS** - Utility-first CSS framework
  - [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Backend Stack

- **Hono.js** - Fast, lightweight web framework for Cloudflare Workers
  - [Hono.js Documentation](https://hono.dev/)
- **Prisma** - Type-safe database ORM and query builder
  - [Prisma Documentation](https://www.prisma.io/docs)
- **Zod** - Runtime and compile-time schema validation
  - [Zod Documentation](https://zod.dev/)

### Infrastructure & Services

- **NeonDB** - Serverless PostgreSQL database
  - [NeonDB Documentation](https://neon.tech/docs)
- **Cloudflare Workers** - Edge computing platform for backend deployment
  - [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- **Cloudinary** - Image and file upload management
  - [Cloudinary Documentation](https://cloudinary.com/documentation)
- **worker-mailer** - SMTP email sending service
  - [worker-mailer Documentation](https://github.com/Sh4yy/worker-mailer)
- **Paystack** - Payment processing for Nigeria
  - [Paystack Documentation](https://paystack.com/docs)

## Current State & Architecture

### ✅ Frontend Modularization (Completed)

The frontend has been fully modularized with:

- **Thin route files** focused only on routing concerns
- **Group layouts** for different user types (Admin, Patient, Center, Donor, Public)
- **Componentized pages** with extracted filters, tables, forms, and dialogs
- **Shared UI components** using shadcn/ui patterns
- **Centralized state management** with TanStack Query
- **Type-safe integration** using shared schemas

### 🔄 Backend Modularization (Needs Work)

The backend requires modularization following Hono.js best practices:

- **Factory Pattern**: Use `createHandlers` in Hono Factory for better organization
  - [Hono Factory Documentation](https://hono.dev/docs/guides/best-practices#factory-createhandlers-in-hono-factory)
- **Route Organization**: Split monolithic route files into smaller, focused modules
- **Middleware Extraction**: Extract common middleware into reusable functions
- **Service Layer**: Create service classes for business logic separation

## Integration Pattern

The project follows a well-defined integration pattern documented in [`FRONTEND_BACKEND_INTEGRATION.md`](./FRONTEND_BACKEND_INTEGRATION.md):

```
UI Components → Providers → Services → Request Utility → Backend Routes
      ↓              ↓          ↓            ↓              ↓
React Hook Form  TanStack   Endpoints   Axios +        Hono.js +
   + Zod         Query      + Types    Interceptors     Prisma
```

**Key Files**:

- `apps/frontend/src/services/keys.ts` - Centralized query/mutation keys
- `apps/frontend/src/services/endpoints.ts` - URL generation
- `apps/frontend/src/lib/request.ts` - HTTP client with auth interceptors
- `packages/shared/` - Shared types and schemas

## User Flows & Features

### Core User Types

1. **Patients** - Book screenings, view results, manage appointments
2. **Donors** - Create campaigns, fund screenings, track impact
3. **Health Centers** - Manage appointments, upload results, handle staff
4. **Administrators** - Oversee platform, manage users, analytics

### Key Features

- **Waitlist Matching Algorithm** - Matches patient needs with donor campaigns
- **Payment Integration** - Paystack for donations and self-pay appointments
- **Multi-role Authentication** - JWT-based auth with role-based access
- **File Management** - Cloudinary integration for result uploads
- **Email Notifications** - Automated emails for appointments and results
- **Analytics Dashboard** - Comprehensive reporting for all user types

## Critical Issues & Technical Debt

### 🚨 Production Readiness Concerns

1. **Security Hardening** - Needs comprehensive security audit
2. **Error Handling** - Inconsistent error handling across the application
3. **Input Validation** - Some endpoints lack proper validation
4. **Rate Limiting** - No rate limiting implemented
5. **Logging** - Insufficient logging for production debugging
6. **Testing** - No test suite implemented

### 🔧 Backend Refactoring Needed

1. **Route Organization** - Monolithic route files need splitting
2. **Business Logic** - Move logic from routes to service layer
3. **Database Queries** - Some N+1 query issues
4. **Caching** - No caching strategy implemented
5. **Background Jobs** - Manual processes that should be automated

### 📱 Frontend Improvements

1. **Mobile Responsiveness** - Needs better mobile optimization
2. **Accessibility** - ARIA labels and keyboard navigation improvements (currently depends on Shadcn's default optimizations)
3. **Performance** - Code splitting and lazy loading optimization
4. **Error Boundaries** - Better error handling in UI

## Deployment

### Current Deployment

- **Backend**: Cloudflare Workers
- **Frontend**: Static hosting (served directly by cloudflares workers - https://developers.cloudflare.com/workers/static-assets/)
- **Database**: NeonDB (serverless PostgreSQL)

### Deployment Commands

```bash
# Backend deployment
cd apps/backend
pnpm deploy

# Frontend build
cd apps/frontend
pnpm build
```

## Next Steps for New Team

If you are to continue developing on this prototype, here are the following key notes to address:

1. **Security Audit** - Comprehensive security review
2. **Backend Refactoring** - Implement Hono Factory pattern
3. **Error Handling** - Standardize error responses
4. **Environment Setup** - Document complete setup process
5. **Testing Suite** - Implement unit and integration tests
6. **API Documentation** - Generate OpenAPI/Swagger docs
7. **Performance Optimization** - Database query optimization
8. **Mobile Improvements** - Better responsive design
9. **Production Hardening** - Rate limiting, logging, monitoring
10. **Feature Enhancements** - Based on user feedback
11. **Scalability** - Optimize for higher loads
12. **Analytics** - Enhanced reporting and insights

## Documentation Links

- [Frontend-Backend Integration Pattern](./FRONTEND_BACKEND_INTEGRATION.md)
- [Build Instructions](./BUILD.md)
- [User Flows](./zerocancer_user_flows.md)
- [Waitlist Algorithm](./waitlist-matching-algorithm.md)

## Contact & Handover Notes

This project represents a functional prototype with significant potential. The architecture is solid, but production readiness requires additional work. The modular frontend provides a good foundation, and the backend structure (while functional) needs refactoring for maintainability.

**Key Strengths**:

- Well-structured frontend with clean patterns
- Type-safe integration throughout the stack
- Comprehensive feature set for MVP
- Good documentation of integration patterns

**Key Weaknesses**:

- Prototype-level security and error handling
- Backend needs architectural improvements
- Limited testing and monitoring
- Performance optimizations needed

Good luck with the continued development! 🚀

Signing out [\_code.J](https://github.com/T4910) & [RalphFred](https://github.com/RalphFred) ☮️✌️
