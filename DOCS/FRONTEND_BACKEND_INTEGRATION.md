# Frontend-Backend Integration Pattern

## Overview

This document describes the complete integration pattern used in the ZeroCancer application, from UI components to backend API routes. This pattern ensures type safety, maintainable code, and clean separation of concerns across the entire stack.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │───▶│    Providers    │───▶│  Service Layer  │───▶│ Request Utility │───▶│  Backend Routes │
│   (.page.tsx)   │    │ (.provider.ts)  │    │ (.service.ts)   │    │   (request.ts)  │    │   (api/*.ts)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Hook     │    │  TanStack Query │    │   API Calls +   │    │ Axios + Auth +  │    │   Hono.js +     │
│  Form + Zod     │    │   (Caching)     │    │   Endpoints     │    │ Interceptors    │    │    Prisma       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                  │                       │                       │
                                  ▼                       ▼                       ▼
                         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
                         │   Query Keys    │    │    Endpoints    │    │  Shared Types   │
                         │   (keys.ts)     │    │ (endpoints.ts)  │    │ (@zerocancer/   │
                         │                 │    │                 │    │    shared)      │
                         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Layer-by-Layer Breakdown

### 1. UI Components Layer

**Location**: `apps/frontend/src/components/`

**Responsibilities**:

- User interface and form handling
- Form validation using Zod schemas
- State management via React Hook Form
- Calling provider hooks for data operations

**Example**:

```tsx
// PatientPayBooking.page.tsx
import { useBookSelfPayAppointment } from "@/services/providers/patient.provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const bookingSchema = z.object({
  centerId: z.string().min(1, "Center ID is required"),
  appointmentDate: z.string().min(1, "Date is required"),
});

export function PatientPayBookingPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
  });

  const bookAppointmentMutation = useBookSelfPayAppointment();

  function onSubmit(values: FormData) {
    bookAppointmentMutation.mutate(values, {
      onSuccess: (data) => {
        // Handle success
      },
      onError: (error) => {
        // Handle error
      },
    });
  }
}
```

### 2. Providers Layer

**Location**: `apps/frontend/src/services/providers/`

**Responsibilities**:

- Define TanStack Query hooks for data fetching
- Export query and mutation functions using centralized keys
- Handle caching, loading states, and error handling
- Call service layer functions

**Example**:

```typescript
// patient.provider.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { QueryKeys, MutationKeys } from "@/services/keys";
import * as patientService from "@/services/patient.service";
import type { TBookSelfPayAppointmentRequest } from "@zerocancer/shared";

export function useBookSelfPayAppointment() {
  return useMutation({
    mutationKey: [MutationKeys.bookAppointment],
    mutationFn: (data: TBookSelfPayAppointmentRequest) =>
      patientService.bookSelfPayAppointment(data),
    onSuccess: () => {
      // Invalidate related queries using centralized keys
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.patientAppointments],
      });
    },
  });
}

export function usePatientAppointments(patientId: string) {
  return useQuery({
    queryKey: [QueryKeys.patientAppointments, patientId],
    queryFn: () => patientService.getAppointments(patientId),
    enabled: !!patientId,
  });
}
```

### 3. Service Layer

**Location**: `apps/frontend/src/services/`

**Responsibilities**:

- API function definitions that call the request utility
- Endpoint URL construction using centralized endpoints
- Type-safe request/response handling
- Business logic abstraction

**Example**:

```typescript
// patient.service.ts
import request from "@/lib/request";
import * as endpoints from "@/services/endpoints";
import type {
  TBookSelfPayAppointmentRequest,
  TBookSelfPayAppointmentResponse,
} from "@zerocancer/shared";

export const bookSelfPayAppointment = async (
  data: TBookSelfPayAppointmentRequest
): Promise<TBookSelfPayAppointmentResponse> => {
  return await request.post(endpoints.bookSelfPayAppointment(), data);
};

export const getAppointments = async (patientId: string) => {
  return await request.get(endpoints.getPatientAppointments(patientId));
};
```

### 4. Request Utility Layer

**Location**: `apps/frontend/src/lib/request.ts`

**Responsibilities**:

- HTTP client wrapper around Axios
- Request/response interceptors for authentication
- Token refresh logic and error handling
- URL rewriting for development vs production
- Centralized request configuration

**Key Features**:

```typescript
// request.ts
import axios from "axios";
import { ACCESS_TOKEN_KEY } from "@/services/keys";

// Setup interceptors with QueryClient for token management
export function setupAxiosInterceptors(queryClient: QueryClient) {
  // Request interceptor: attach token from React Query cache
  axios.interceptors.request.use((config) => {
    const token = queryClient.getQueryData<string>([ACCESS_TOKEN_KEY]);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: handle 401s and token refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response.status === 401) {
        // Token refresh logic
        const newToken = await refreshToken();
        // Retry original request with new token
      }
      return Promise.reject(error);
    }
  );
}
```

### 5. Centralized Keys and Endpoints

**Location**: `apps/frontend/src/services/keys.ts` and `endpoints.ts`

**Responsibilities**:

- Centralized query and mutation key definitions
- Type-safe endpoint URL generation
- Consistent key naming across the application

**Example**:

```typescript
// keys.ts
export enum QueryKeys {
  patientAppointments = "patientAppointments",
  donorCampaigns = "donorCampaigns",
  centerStaff = "centerStaff",
  // ... all query keys
}

export enum MutationKeys {
  bookAppointment = "bookAppointment",
  createCampaign = "createCampaign",
  inviteStaff = "inviteStaff",
  // ... all mutation keys
}

// endpoints.ts
export const bookSelfPayAppointment = () => "/api/patient/book-self-pay";
export const getPatientAppointments = (patientId: string) =>
  `/api/patient/${patientId}/appointments`;
```

### 6. Backend Routes Layer

**Location**: `apps/backend/src/api/`

**Responsibilities**:

- Hono.js route handlers with request validation
- Database operations via Prisma
- Business logic implementation
- Type-safe responses using shared schemas

**Example**:

```typescript
// apps/backend/src/api/patient.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { bookSelfPayAppointmentSchema } from "@zerocancer/shared";
import { getDB } from "../lib/db";

const patient = new Hono();

patient.post(
  "/book-self-pay",
  zValidator("json", bookSelfPayAppointmentSchema),
  async (c) => {
    const data = c.req.valid("json");
    const db = getDB(c);

    // Business logic
    const appointment = await db.appointment.create({
      data: {
        centerId: data.centerId,
        appointmentDateTime: new Date(data.appointmentDateTime),
        // ... other fields
      },
    });

    return c.json({
      success: true,
      data: { appointment },
      message: "Appointment booked successfully",
    });
  }
);
```

### 7. Shared Types Layer

**Location**: `packages/shared/`

**Responsibilities**:

- Zod schemas for request/response validation
- TypeScript types derived from schemas
- Shared constants and utilities
- Single source of truth for data contracts

**Example**:

```typescript
// packages/shared/schemas/appointment.schema.ts
import { z } from "zod";

export const bookSelfPayAppointmentSchema = z.object({
  centerId: z.string().uuid(),
  appointmentDateTime: z.string().datetime(),
  screeningTypeId: z.string().uuid(),
  paymentReference: z.string().optional(),
});

export type TBookSelfPayAppointmentRequest = z.infer<
  typeof bookSelfPayAppointmentSchema
>;

export const bookSelfPayAppointmentResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    appointment: z.object({
      id: z.string().uuid(),
      appointmentDateTime: z.string().datetime(),
      // ... other fields
    }),
    payment: z
      .object({
        authorizationUrl: z.string().url(),
      })
      .optional(),
  }),
  message: z.string(),
});

export type TBookSelfPayAppointmentResponse = z.infer<
  typeof bookSelfPayAppointmentResponseSchema
>;
```

## Data Flow Example

Let's trace a complete request from UI to database:

### 1. User Action

```tsx
// User submits booking form
<form onSubmit={form.handleSubmit(onSubmit)}>
  <Button type="submit">Book Appointment</Button>
</form>
```

### 2. Form Validation

```tsx
// Zod validates the form data
const bookingSchema = z.object({
  centerId: z.string().min(1, "Center ID is required"),
  appointmentDate: z.string().min(1, "Date is required"),
});
```

### 3. Provider Call

```tsx
// Component calls provider hook
const bookAppointmentMutation = useBookSelfPayAppointment();

function onSubmit(values: FormData) {
  bookAppointmentMutation.mutate(values);
}
```

### 4. Service Layer Call

```typescript
// Provider calls service function using centralized keys
export function useBookSelfPayAppointment() {
  return useMutation({
    mutationKey: [MutationKeys.bookAppointment],
    mutationFn: (data) => patientService.bookSelfPayAppointment(data),
  });
}
```

### 5. Request Utility Call

```typescript
// Service calls request utility with endpoint
export const bookSelfPayAppointment = async (
  data: TBookSelfPayAppointmentRequest
) => {
  return await request.post(endpoints.bookSelfPayAppointment(), data);
};
```

### 6. HTTP Request with Interceptors

```typescript
// Request utility makes HTTP request with auth and URL rewriting
async function _post(url: string, data?: any) {
  const response = await axios.post(url, JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

// Interceptors handle:
// - Token attachment from React Query cache
// - URL rewriting for dev/prod environments
// - 401 handling and token refresh
```

### 7. Backend Route Handler

```typescript
// Backend validates and processes request
patient.post(
  "/book-self-pay",
  zValidator("json", bookSelfPayAppointmentSchema),
  async (c) => {
    const data = c.req.valid("json"); // Type-safe validated data
    const appointment = await db.appointment.create({ data });
    return c.json({ success: true, data: { appointment } });
  }
);
```

### 8. Response Flow

The response flows back through the same layers:

- Backend returns typed response
- Request utility receives and returns data
- Service layer forwards the response
- Provider handles success/error states and cache invalidation
- Component updates UI accordingly

## Key Benefits

### 1. **Type Safety**

- End-to-end type safety from UI to database
- Compile-time error catching
- IntelliSense and autocomplete support

### 2. **Single Source of Truth**

- Shared schemas define data contracts
- Changes in one place propagate everywhere
- Prevents frontend/backend drift

### 3. **Separation of Concerns**

- Each layer has a specific responsibility
- Easy to test individual layers
- Clear boundaries between concerns

### 4. **Developer Experience**

- Predictable patterns across features
- Easy to add new endpoints
- Consistent error handling

### 5. **Maintainability**

- Changes are localized and predictable
- Easy to refactor without breaking changes
- Clear debugging path

## Best Practices

### 1. **Always Use Shared Types**

```typescript
// ✅ Good - Use shared types
import type { TBookAppointmentRequest } from "@zerocancer/shared";

// ❌ Bad - Duplicate type definitions
interface BookAppointmentRequest {
  centerId: string;
  date: string;
}
```

### 2. **Validate at Boundaries**

```typescript
// ✅ Good - Validate at API boundaries
patient.post("/book", zValidator("json", bookAppointmentSchema), handler);

// ❌ Bad - No validation
patient.post("/book", handler);
```

### 3. **Handle Errors Consistently**

```typescript
// ✅ Good - Consistent error handling in providers
export function useBookAppointment() {
  return useMutation({
    mutationFn: patientApi.bookAppointment,
    onError: (error) => {
      toast.error(error.message || "Booking failed");
    },
  });
}
```

### 4. **Use Query Keys Consistently**

```typescript
// ✅ Good - Centralized query keys from keys.ts
import { QueryKeys, MutationKeys } from "@/services/keys";

export function usePatientAppointments(patientId: string) {
  return useQuery({
    queryKey: [QueryKeys.patientAppointments, patientId],
    queryFn: () => patientService.getAppointments(patientId),
  });
}

export function useBookAppointment() {
  return useMutation({
    mutationKey: [MutationKeys.bookAppointment],
    mutationFn: patientService.bookAppointment,
  });
}

// ❌ Bad - Hardcoded strings
export function usePatientAppointments(patientId: string) {
  return useQuery({
    queryKey: ["appointments", patientId], // Inconsistent
    queryFn: () => patientService.getAppointments(patientId),
  });
}
```

### 5. **Use Centralized Endpoints**

```typescript
// ✅ Good - Import from centralized endpoints
import * as endpoints from "@/services/endpoints";

export const bookAppointment = async (data: TBookAppointmentRequest) => {
  return await request.post(endpoints.bookSelfPayAppointment(), data);
};

// ❌ Bad - Hardcoded URLs
export const bookAppointment = async (data: TBookAppointmentRequest) => {
  return await request.post("/api/patient/book-self-pay", data);
};
```

### 6. **Leverage Request Utility Features**

```typescript
// ✅ Good - Use request utility methods
import request from "@/lib/request";

// File upload
export const uploadResult = async (formData: FormData) => {
  return await request.postMultiPart(endpoints.uploadResult(), formData);
};

// Standard JSON
export const createCampaign = async (data: TCampaignData) => {
  return await request.post(endpoints.createCampaign(), data);
};

// ❌ Bad - Direct axios calls bypassing utility
import axios from "axios";

export const uploadResult = async (formData: FormData) => {
  return await axios.post("/api/upload", formData); // Missing auth, interceptors
};
```

## Common Patterns

### 1. **CRUD Operations**

Each entity typically has:

- `useCreate{Entity}()` - For creating new records
- `useUpdate{Entity}()` - For updating existing records
- `useDelete{Entity}()` - For deleting records
- `use{Entity}()` - For fetching single record
- `use{Entities}List()` - For fetching multiple records

**Service Layer Pattern**:

```typescript
// patient.service.ts
export const createPatient = async (data: TCreatePatientRequest) => {
  return await request.post(endpoints.createPatient(), data);
};

export const updatePatient = async (
  id: string,
  data: TUpdatePatientRequest
) => {
  return await request.put(endpoints.updatePatient(id), data);
};

export const deletePatient = async (id: string) => {
  return await request.delete(endpoints.deletePatient(id));
};

export const getPatient = async (id: string) => {
  return await request.get(endpoints.getPatient(id));
};

export const getPatients = async (params?: TGetPatientsParams) => {
  return await request.get(endpoints.getPatients(params));
};
```

### 2. **Centralized Key Management**

```typescript
// keys.ts - Single source of truth for all query/mutation keys
export enum QueryKeys {
  patientAppointments = "patientAppointments",
  donorCampaigns = "donorCampaigns",
  centerStaff = "centerStaff",
  // All query keys defined here
}

export enum MutationKeys {
  bookAppointment = "bookAppointment",
  createCampaign = "createCampaign",
  inviteStaff = "inviteStaff",
  // All mutation keys defined here
}

export const ACCESS_TOKEN_KEY = "accessToken"; // Special key for auth token
```

### 3. **Endpoint URL Generation**

```typescript
// endpoints.ts - Centralized URL construction
export const getPatients = (params?: Record<string, any>) => {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return `/api/patients${query}`;
};

export const getPatient = (id: string) => `/api/patients/${id}`;
export const createPatient = () => "/api/patients";
export const updatePatient = (id: string) => `/api/patients/${id}`;
export const deletePatient = (id: string) => `/api/patients/${id}`;
```

### 4. **Request Utility Methods**

```typescript
// request.ts - Different HTTP methods for different content types
export default {
  get: _get, // Standard GET requests
  post: _post, // JSON POST requests
  postMultiPart: _postMultiPart, // File uploads
  put: _put, // JSON PUT requests
  delete: _delete, // DELETE requests
  patch: _patch, // PATCH requests
};
```

### 5. **Error Handling**

```typescript
// Standard error response format
{
  success: false,
  error: "Error message",
  data: null
}

// Provider error handling
export function useCreateAppointment() {
  return useMutation({
    mutationKey: [MutationKeys.bookAppointment],
    mutationFn: patientService.bookAppointment,
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Operation failed'
      )
    }
  })
}
```

### 6. **Loading States**

```tsx
// Standard loading state handling in components
const { data, isLoading, error } = useAppointments();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <AppointmentsList appointments={data} />;
```

This pattern ensures consistency, maintainability, and developer productivity across the entire application stack.
