# ZeroCancer Frontend

The ZeroCancer frontend is a modern, responsive React application built with TypeScript, TanStack Router, and Vite. It provides intuitive interfaces for patients, cancer centers, and administrators to interact with the platform.

## 🏗️ Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router (file-based routing)
- **Build Tool**: Vite (fast development and building)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query) + Zustand
- **Forms**: React Hook Form with Zod validation
- **Type Safety**: Full TypeScript with shared schemas

## 📁 Project Structure

```
apps/frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── button.tsx   # Button component
│   │   │   ├── card.tsx     # Card component
│   │   │   ├── input.tsx    # Input component
│   │   │   └── ...          # Other UI primitives
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.tsx   # Main navigation header
│   │   │   ├── Sidebar.tsx  # Sidebar navigation
│   │   │   └── Footer.tsx   # Page footer
│   │   ├── forms/           # Form components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── DonationForm.tsx
│   │   │   └── RegistrationForm.tsx
│   │   ├── admin/           # Admin-specific components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminWaitlistPanel.tsx
│   │   │   └── CampaignManager.tsx
│   │   └── patient/         # Patient-specific components
│   │       ├── WaitlistStatus.tsx
│   │       ├── AppointmentBooking.tsx
│   │       └── DonationHistory.tsx
│   ├── routes/              # TanStack Router pages
│   │   ├── __root.tsx       # Root layout
│   │   ├── index.tsx        # Home page
│   │   ├── login.tsx        # Login page
│   │   ├── register.tsx     # Registration page
│   │   ├── dashboard/       # Dashboard routes
│   │   │   ├── index.tsx    # Dashboard home
│   │   │   ├── admin/       # Admin routes
│   │   │   ├── patient/     # Patient routes
│   │   │   └── center/      # Center staff routes
│   │   ├── campaigns/       # Campaign routes
│   │   ├── appointments/    # Appointment routes
│   │   └── about.tsx        # About page
│   ├── services/            # API services
│   │   ├── api.ts          # Base API configuration
│   │   ├── auth.service.ts # Authentication API calls
│   │   ├── campaign.service.ts # Campaign operations
│   │   ├── donation.service.ts # Donation operations
│   │   ├── waitlist.service.ts # Waitlist operations
│   │   ├── appointment.service.ts # Appointment operations
│   │   ├── endpoints.ts    # API endpoint definitions
│   │   ├── keys.ts         # React Query keys
│   │   └── providers/      # React Query providers
│   │       ├── auth.provider.ts
│   │       ├── campaign.provider.ts
│   │       └── waitlist.provider.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useLocalStorage.ts # Local storage hook
│   │   └── useDebounce.ts  # Debounce hook
│   ├── lib/                # Utility functions
│   │   ├── utils.ts        # General utilities
│   │   ├── auth.ts         # Auth helper functions
│   │   ├── formatters.ts   # Data formatting functions
│   │   └── validators.ts   # Form validation schemas
│   ├── constants/          # Application constants
│   │   ├── routes.ts       # Route definitions
│   │   ├── api.ts          # API constants
│   │   └── ui.ts           # UI constants
│   ├── assets/             # Static assets
│   │   ├── images/         # Image files
│   │   ├── icons/          # Icon files
│   │   └── fonts/          # Font files
│   ├── styles/             # Global styles
│   │   ├── globals.css     # Global CSS
│   │   └── components.css  # Component-specific styles
│   ├── main.tsx            # Application entry point
│   └── routeTree.gen.ts    # Generated route tree
├── public/                 # Public assets
│   ├── favicon.ico
│   ├── logo192.png
│   └── manifest.json
├── components.json         # shadcn/ui configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.ts          # Vite configuration
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

2. **Start the development server**:
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`

## 🎨 UI Components & Styling

### shadcn/ui Integration

The frontend uses shadcn/ui for consistent, accessible components:

```bash
# Add new shadcn/ui components
pnpx shadcn@latest add button
pnpx shadcn@latest add card
pnpx shadcn@latest add input
pnpx shadcn@latest add form
```

### Tailwind CSS

Utility-first CSS framework for rapid styling:

```tsx
// Example component styling
<div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Details</h2>
  <p className="text-gray-600 leading-relaxed">
    Support cancer screening for underserved communities.
  </p>
</div>
```

### Custom Components

Reusable components built on top of shadcn/ui:

```tsx
// Example: Custom card component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{campaign.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{campaign.description}</p>
        <div className="mt-4">
          <Progress value={campaign.progress} />
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🛣️ Routing with TanStack Router

### File-Based Routing

Routes are automatically generated from the file structure:

```
src/routes/
├── __root.tsx           # Layout wrapper
├── index.tsx           # Home page (/)
├── about.tsx           # About page (/about)
├── login.tsx           # Login page (/login)
├── dashboard/
│   ├── index.tsx       # Dashboard home (/dashboard)
│   ├── admin/
│   │   ├── index.tsx   # Admin dashboard (/dashboard/admin)
│   │   └── campaigns.tsx # Campaign management (/dashboard/admin/campaigns)
│   └── patient/
│       ├── index.tsx   # Patient dashboard (/dashboard/patient)
│       └── history.tsx # Donation history (/dashboard/patient/history)
```

### Route Components

```tsx
// src/routes/dashboard/patient/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { PatientDashboard } from '@/components/patient/PatientDashboard'

export const Route = createFileRoute('/dashboard/patient/')({
  component: PatientDashboard,
  beforeLoad: ({ context }) => {
    if (!context.auth.user || context.auth.user.profile !== 'patient') {
      throw redirect({ to: '/login' })
    }
  },
})
```

### Navigation

```tsx
import { Link } from '@tanstack/react-router'

export function Navigation() {
  return (
    <nav>
      <Link to="/" className="nav-link">
        Home
      </Link>
      <Link to="/campaigns" className="nav-link">
        Campaigns
      </Link>
      <Link to="/dashboard" className="nav-link">
        Dashboard
      </Link>
    </nav>
  )
}
```

## 🔄 State Management

### TanStack Query (React Query)

For server state management and API calls:

```tsx
// Service definition
export const campaignService = {
  getCampaigns: (): Promise<Campaign[]> =>
    api.get('/campaigns').then((res) => res.data),

  createCampaign: (data: CreateCampaignData): Promise<Campaign> =>
    api.post('/campaigns', data).then((res) => res.data),
}

// React Query hook
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: campaignService.getCampaigns,
  })
}

// Component usage
export function CampaignList() {
  const { data: campaigns, isLoading, error } = useCampaigns()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns?.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  )
}
```

### Zustand for Client State

For local application state:

```tsx
// stores/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    },
  ),
)
```

## 📝 Forms & Validation

### React Hook Form + Zod

Type-safe forms with validation:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const donationSchema = z.object({
  amount: z.number().min(1, 'Amount must be positive'),
  campaignId: z.string().optional(),
  anonymous: z.boolean().default(false),
})

type DonationData = z.infer<typeof donationSchema>

export function DonationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DonationData>({
    resolver: zodResolver(donationSchema),
  })

  const onSubmit = async (data: DonationData) => {
    try {
      await donationService.createDonation(data)
      toast.success('Donation created successfully!')
    } catch (error) {
      toast.error('Failed to create donation')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="amount">Amount ($)</label>
        <input
          {...register('amount', { valueAsNumber: true })}
          type="number"
          className="form-input"
        />
        {errors.amount && (
          <p className="text-red-500 text-sm">{errors.amount.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary">
        {isSubmitting ? 'Processing...' : 'Donate Now'}
      </button>
    </form>
  )
}
```

## 🔐 Authentication

### Auth Context & Hooks

```tsx
// hooks/useAuth.ts
export function useAuth() {
  const { user, token, setAuth, logout } = useAuthStore()

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      setAuth(response.user, response.token)
      return response
    } catch (error) {
      throw error
    }
  }

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.profile === 'admin'
  const isCenterStaff = user?.profile === 'center_staff'
  const isPatient = user?.profile === 'patient'

  return {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isCenterStaff,
    isPatient,
  }
}
```

### Protected Routes

```tsx
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (requiredRoles && !requiredRoles.includes(user?.profile || '')) {
    return <div>Access denied. Insufficient permissions.</div>
  }

  return <>{children}</>
}
```

## 🎯 User Roles & Interfaces

### Patient Interface

- **Dashboard**: Donation history, waitlist status, appointments
- **Campaigns**: Browse and donate to campaigns
- **Waitlist**: Join waitlists for screening services
- **Appointments**: View and manage screening appointments

### Center Staff Interface

- **Dashboard**: Center statistics, upcoming appointments
- **Payouts**: View payout history and current balance
- **Appointments**: Manage center's appointment schedule
- **Reports**: Center performance and earnings reports

### Admin Interface

- **Dashboard**: System overview and key metrics
- **Campaigns**: Create, edit, and manage campaigns
- **Centers**: Manage cancer center registrations
- **Waitlist**: Monitor and manually trigger matching
- **Payouts**: Oversee financial operations and payouts
- **Users**: Manage user accounts and permissions

## 🔧 Development Commands

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm preview          # Preview production build locally
pnpm test             # Run tests

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm type-check       # TypeScript type checking

# UI Components
pnpx shadcn@latest add button     # Add shadcn/ui button
pnpx shadcn@latest add card       # Add shadcn/ui card
pnpx shadcn@latest list           # List available components
```

## 📱 Responsive Design

The frontend is (not currently) fully responsive and works on all device sizes:

### Breakpoints (Tailwind CSS)

- **sm**: 640px and up (small tablets)
- **md**: 768px and up (tablets)
- **lg**: 1024px and up (laptops)
- **xl**: 1280px and up (desktops)
- **2xl**: 1536px and up (large desktops)

### Mobile-First Approach

```tsx
// Example: Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {campaigns.map(campaign => (
    <CampaignCard key={campaign.id} campaign={campaign} />
  ))}
</div>

// Example: Responsive navigation
<nav className="hidden md:flex space-x-6">
  {/* Desktop navigation */}
</nav>
<button className="md:hidden">
  {/* Mobile menu button */}
</button>
```

## 🚀 Production Build & Deployment

### Build Process

```bash
# Create production build
pnpm build

# Preview the build locally
pnpm preview
```

## 🔍 Development Tools

### Browser Developer Tools

- **React Developer Tools**: Debug React components
- **TanStack Router Devtools**: Debug routing and navigation
- **TanStack Query Devtools**: Monitor API calls and cache

### VS Code Extensions

- **TypeScript**: Language support
- **Tailwind CSS IntelliSense**: CSS class autocomplete
- **ES7+ React/Redux/React-Native snippets**: Code snippets
- **Auto Rename Tag**: Sync HTML tag renaming
- **Prettier**: Code formatting

<!-- ## 🧪 Testing

### Testing Setup
```bash
# Install testing dependencies
pnpm add -D @testing-library/react @testing-library/jest-dom vitest
```

### Example Tests
```tsx
// __tests__/components/CampaignCard.test.tsx
import { render, screen } from '@testing-library/react'
import { CampaignCard } from '@/components/CampaignCard'

const mockCampaign = {
  id: '1',
  title: 'Test Campaign',
  description: 'Test description',
  targetAmount: 1000,
  currentAmount: 500,
}

test('renders campaign title', () => {
  render(<CampaignCard campaign={mockCampaign} />)
  expect(screen.getByText('Test Campaign')).toBeInTheDocument()
})
``` -->

## 🔧 Common Issues & Solutions

### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf .vite
pnpm dev
```

### TypeScript Errors

```bash
# Regenerate route types
pnpm type-check

# Check for shared package issues
cd ../../packages/shared
pnpm build
```

## 📚 Additional Resources

- **TanStack Router**: [Documentation](https://tanstack.com/router)
- **TanStack Query**: [Documentation](https://tanstack.com/query)
- **shadcn/ui**: [Component Library](https://ui.shadcn.com)
- **Tailwind CSS**: [Documentation](https://tailwindcss.com/docs)
- **React Hook Form**: [Documentation](https://react-hook-form.com)
- **Zod**: [Validation Library](https://zod.dev)

## 🤝 Contributing

1. **Follow React best practices**
2. **Use TypeScript for all components**
3. **Follow the established folder structure**
4. **Add proper error boundaries**
5. **Write accessible components**
6. **Test your components**
7. **Use shared types from packages/shared**

For questions or issues, refer to the main project README or open an issue.
