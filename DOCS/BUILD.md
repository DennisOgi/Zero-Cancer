# Zerocancer Build & Deployment Guide

## 🚀 Quick Start

### Development Mode

```bash
# Install dependencies
pnpm install

# Start development servers (backend + frontend)
pnpm dev

# Or start individually:
pnpm backend:dev  # Backend only
pnpm frontend:dev # Frontend only
```

### Production Build & Deploy

```bash
# Complete production build
pnpm build:production

# Start production server
pnpm start:production

# Test production build end-to-end
pnpm test:production
```

## 📋 Available Scripts

### Development Scripts

- `pnpm dev` - Start both backend and frontend in development mode
- `pnpm backend:dev` - Start only the backend development server
- `pnpm frontend:dev` - Start only the frontend development server

### Build Scripts

- `pnpm build` - Build all packages (shared, backend, frontend) and copy frontend to backend
- `pnpm build:production` - Complete production build with frontend copy
- `pnpm build:copy-frontend` - Copy frontend build to backend's static directory
- `pnpm build-backend` - Build only backend and shared packages

### Production Scripts

- `pnpm start:production` - Start the backend server in production mode (serves frontend)
- `pnpm test:production` - Full production build and test cycle

### Database Scripts

- `pnpm prisma:generate` - Generate Prisma client
- `pnpm --filter ./apps/backend prisma:migrate` - Run database migrations
- `pnpm --filter ./apps/backend prisma:studio` - Open Prisma Studio

## 🏗️ Build Process

### 1. **Shared Package Build**

```bash
pnpm --filter @zerocancer/shared build
```

Compiles the shared TypeScript schemas and types used by both frontend and backend.

### 2. **Backend Build**

```bash
pnpm --filter ./apps/backend prisma:generate
pnpm --filter ./apps/backend build
```

- Generates Prisma client
- Compiles TypeScript backend code

### 3. **Frontend Build**

```bash
pnpm --filter ./apps/frontend build
```

- Builds React app using Vite
- Outputs to `apps/frontend/dist/`

### 4. **Frontend Copy**

```bash
pnpm build:copy-frontend
```

- Copies frontend build from `apps/frontend/dist/` to `apps/backend/frontend-dist/`
- Enables backend to serve frontend static files

## 🌐 Production Deployment

### Environment Setup

Ensure you have the required environment variables in `apps/backend/.env`:

```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_TOKEN_SECRET=your_jwt_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FRONTEND_URL=https://your-domain.com
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

### Single Server Deployment

The backend serves both API and frontend:

1. **Build everything**: `pnpm build:production`
2. **Start server**: `pnpm start:production`
3. **Access app**: `http://localhost:8000` (or your configured port)

### API Endpoints

- Frontend: `http://localhost:8000/`
- API: `http://localhost:8000/api/v1/`
- Health check: `http://localhost:8000/api/v1/healthz`

## 🔧 Technical Details

### Static File Serving

- In production (`NODE_ENV=production`), the backend serves frontend files from `frontend-dist/`
- React Router is supported with SPA fallback (serves `index.html` for non-asset routes)
- API routes (`/api/*`) are prioritized over static files

### File Structure After Build

```
apps/backend/
├── dist/                 # Compiled backend code
├── frontend-dist/        # Frontend build (copied from apps/frontend/dist)
│   ├── index.html
│   ├── assets/
│   └── ...
├── src/                  # Backend source
└── prisma/              # Database schema
```

### Development vs Production

- **Development**: Frontend and backend run separately (ports 3000 and 8000)
- **Production**: Backend serves both API and frontend on single port (8000)

## 🐛 Troubleshooting

### Common Issues

1. **Frontend not updating in production**

   ```bash
   pnpm build:copy-frontend
   ```

2. **TypeScript errors during build**

   ```bash
   pnpm --filter @zerocancer/shared build
   pnpm --filter ./apps/backend build
   ```

3. **Database connection issues**

   ```bash
   pnpm --filter ./apps/backend prisma:generate
   ```

4. **ES Module errors**
   - The backend uses `tsx` to run TypeScript directly in production
   - This avoids ES module import issues with compiled JavaScript

### Build Order Dependencies

1. Shared package (schemas/types)
2. Backend (uses shared package)
3. Frontend (uses shared package)
4. Frontend copy (enables static serving)

## 📝 Notes

- The build process ensures proper dependency order
- Frontend TypeScript errors don't block Vite build (but are reported)
- Static file serving includes proper MIME types for common file extensions
- CORS is configured for development and production environments
