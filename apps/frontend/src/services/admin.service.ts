import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import {
  adminForgotPasswordSchema,
  adminLoginSchema,
  adminResetPasswordSchema,
  createAdminSchema,
} from '@zerocancer/shared/schemas/admin.schema'
import type {
  TAdminForgotPasswordResponse,
  TAdminLoginResponse,
  TAdminResetPasswordResponse,
  TCreateAdminResponse,
} from '@zerocancer/shared/types'
import { z } from 'zod'

// ========================================
// SCHEMAS (matching backend)
// ========================================

// Center Management
const getCentersSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  state: z.string().optional(),
  search: z.string().optional(),
})

const updateCenterStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  reason: z.string().optional(),
})

// User Management
const getUsersSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  profileType: z.enum(['PATIENT', 'DONOR']).optional(),
  search: z.string().optional(),
})

// Campaign Management
const getCampaignsSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'DELETED']).optional(),
  search: z.string().optional(),
})

const updateCampaignStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'DELETED']),
  reason: z.string().optional(),
})

// Appointment Monitoring
const getAppointmentsSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  status: z
    .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  centerId: z.string().uuid().optional(),
  isDonation: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

// Transaction Monitoring
const getTransactionsSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  type: z.enum(['DONATION', 'APPOINTMENT', 'PAYOUT', 'REFUND']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

// Waitlist Analytics
const getWaitlistSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  status: z.enum(['PENDING', 'MATCHED', 'CLAIMED', 'EXPIRED']).optional(),
  screeningTypeId: z.string().uuid().optional(),
  state: z.string().optional(),
  groupBy: z.enum(['state', 'screening_type', 'status']).optional(),
})

// Waitlist Matching Management
const getMatchingExecutionsSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

const triggerMatchingSchema = z.object({
  patientsPerScreeningType: z.number().min(1).max(100).optional(),
  maxTotalPatients: z.number().min(1).max(1000).optional(),
  enableParallelProcessing: z.boolean().optional(),
  maxConcurrentScreeningTypes: z.number().min(1).max(10).optional(),
  enableDemographicTargeting: z.boolean().optional(),
  enableGeographicTargeting: z.boolean().optional(),
  allocationExpiryDays: z.number().min(1).max(365).optional(),
})

const getExecutionLogsSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(50).optional(),
  level: z.enum(['INFO', 'WARNING', 'ERROR']).optional(),
  patientId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
})

// Allocation Management
const getAllocationsSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  status: z.enum(['MATCHED', 'CLAIMED', 'EXPIRED']).optional(),
  patientId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

// System Configuration
const updateMatchingConfigSchema = z.object({
  patientsPerScreeningType: z.number().min(1).max(100).optional(),
  maxTotalPatients: z.number().min(1).max(1000).optional(),
  enableParallelProcessing: z.boolean().optional(),
  maxConcurrentScreeningTypes: z.number().min(1).max(10).optional(),
  enableDemographicTargeting: z.boolean().optional(),
  enableGeographicTargeting: z.boolean().optional(),
  allocationExpiryDays: z.number().min(1).max(365).optional(),
})

// Store Management
const getProductsSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  pageSize: z.number().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
})

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  stock: z.number().int().min(0, 'Stock must be non-negative integer'),
})

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
})

// ========================================
// RESPONSE TYPES
// ========================================

// Generic response wrapper
type TDataResponse<T> = {
  ok: true
  data: T
}

type TPaginatedResponse<T> = TDataResponse<
  {
    page: number
    pageSize: number
    total: number
    totalPages: number
  } & T
>

// Center responses
type TAdminCenter = {
  id: string
  email: string
  centerName: string
  address: string
  state: string
  lga: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  phone?: string
  bankAccount?: string
  bankName?: string
  createdAt: string
  staff: Array<{
    id: string
    email: string
    role?: string
  }>
  services: Array<{
    id: string
    name: string
  }>
  appointments: Array<{
    id: string
    status: string
  }>
}

type TGetAdminCentersResponse = TPaginatedResponse<{
  centers: TAdminCenter[]
}>

type TUpdateCenterStatusResponse = TDataResponse<{
  centerId: string
  status: string
  updatedAt: string
}>

// User responses
type TAdminUser = {
  id: string
  fullName: string
  email: string
  phone?: string
  createdAt: string
  patientProfile?: {
    id: string
    emailVerified: string | null
    gender?: string
    dateOfBirth: string
    city?: string
    state?: string
  }
  donorProfile?: {
    id: string
    emailVerified: string | null
    organizationName?: string
    country?: string
  }
  appointments: Array<{
    id: string
    status: string
    createdAt: string
  }>
  donationCampaigns: Array<{
    id: string
    status: string
    initialAmount: number
  }>
}

type TGetAdminUsersResponse = TPaginatedResponse<{
  users: TAdminUser[]
}>

// Campaign responses
type TAdminCampaign = {
  id: string
  purpose?: string
  status: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  initialAmount: number
  availableAmount: number
  reservedAmount: number
  targetGender?: boolean | null
  targetAgeRange?: string | null
  targetState?: string | null
  targetLga?: string | null
  createdAt: string
  donor: {
    id: string
    fullName: string
    email: string
    donorProfile?: {
      organizationName?: string
    }
  }
  screeningTypes: Array<{
    id: string
    name: string
  }>
  allocations: Array<{
    id: string
    claimedAt: string | null
  }>
  transactions: Array<{
    id: string
    amount: number
    status: string
    createdAt: string
  }>
}

type TGetAdminCampaignsResponse = TPaginatedResponse<{
  campaigns: TAdminCampaign[]
}>

type TUpdateCampaignStatusResponse = TDataResponse<{
  campaignId: string
  status: string
  updatedAt: string
}>

// Appointment responses
type TAdminAppointment = {
  id: string
  patientId: string
  centerId: string
  screeningTypeId: string
  donationId?: string | null
  isDonation: boolean
  appointmentDateTime: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  patient: {
    id: string
    fullName: string
    email: string
  }
  center: {
    id: string
    centerName: string
    state: string
    lga: string
  }
  screeningType: {
    id: string
    name: string
  }
  transaction?: {
    id: string
    amount: number
    status: string
  } | null
  result?: {
    id: string
    uploadedAt: string
    notes?: string | null
  } | null
}

type TGetAdminAppointmentsResponse = TPaginatedResponse<{
  appointments: TAdminAppointment[]
}>

// Transaction responses
type TAdminTransaction = {
  id: string
  type: 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND'
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  amount: number
  relatedDonationId?: string | null
  paymentReference?: string | null
  paymentChannel?: string | null
  createdAt: string
  donation?: {
    id: string
    purpose?: string | null
    donor: {
      id: string
      fullName: string
    }
  } | null
  appointments: Array<{
    id: string
    patient: {
      id: string
      fullName: string
    }
  }>
}

type TGetAdminTransactionsResponse = TPaginatedResponse<{
  transactions: TAdminTransaction[]
}>

// Waitlist responses
type TAdminWaitlistEntry = {
  id: string
  screeningTypeId: string
  patientId: string
  status: 'PENDING' | 'MATCHED' | 'CLAIMED' | 'EXPIRED'
  joinedAt: string
  claimedAt?: string | null
  patient: {
    id: string
    fullName: string
    patientProfile?: {
      state?: string | null
      city?: string | null
    } | null
  }
  screening: {
    id: string
    name: string
  }
  allocation?: {
    id: string
    claimedAt: string | null
  } | null
}

type TWaitlistAggregation = {
  count: number
  state?: string
  screeningType?: string
  status?: string
}

type TGetAdminWaitlistResponse =
  | TPaginatedResponse<{
      waitlistEntries: TAdminWaitlistEntry[]
    }>
  | TDataResponse<{
      aggregation: TWaitlistAggregation[]
      groupBy: string
    }>

// Store responses
type TAdminStoreProduct = {
  id: string
  name: string
  description?: string | null
  price: number
  stock: number
  createdAt: string
}

type TGetAdminStoreProductsResponse = TPaginatedResponse<{
  products: TAdminStoreProduct[]
}>

type TCreateStoreProductResponse = TDataResponse<TAdminStoreProduct>
type TUpdateStoreProductResponse = TDataResponse<TAdminStoreProduct>

// ========================================
// SERVICE FUNCTIONS
// ========================================

// Center Management
export const getAdminCenters = async (
  params: z.infer<typeof getCentersSchema>,
): Promise<TGetAdminCentersResponse> => {
  const res = await request.get(endpoints.getAdminCenters(params))
  return res as TGetAdminCentersResponse
}

export const updateCenterStatus = async (
  centerId: string,
  data: z.infer<typeof updateCenterStatusSchema>,
): Promise<TUpdateCenterStatusResponse> => {
  const res = await request.patch(endpoints.updateCenterStatus(centerId), data)
  return res as TUpdateCenterStatusResponse
}

// User Management
export const getAdminUsers = async (
  params: z.infer<typeof getUsersSchema>,
): Promise<TGetAdminUsersResponse> => {
  const res = await request.get(endpoints.getAdminUsers(params))
  return res as TGetAdminUsersResponse
}

// Campaign Management
export const getAdminCampaigns = async (
  params: z.infer<typeof getCampaignsSchema>,
): Promise<TGetAdminCampaignsResponse> => {
  const res = await request.get(endpoints.getAdminCampaigns(params))
  return res as TGetAdminCampaignsResponse
}

export const updateAdminCampaignStatus = async (
  campaignId: string,
  data: z.infer<typeof updateCampaignStatusSchema>,
): Promise<TUpdateCampaignStatusResponse> => {
  const res = await request.patch(
    endpoints.updateAdminCampaignStatus(campaignId),
    data,
  )
  return res as TUpdateCampaignStatusResponse
}

// Appointment Monitoring
export const getAdminAppointments = async (
  params: z.infer<typeof getAppointmentsSchema>,
): Promise<TGetAdminAppointmentsResponse> => {
  const res = await request.get(endpoints.getAdminAppointments(params))
  return res as TGetAdminAppointmentsResponse
}

// Transaction Monitoring
export const getAdminTransactions = async (
  params: z.infer<typeof getTransactionsSchema>,
): Promise<TGetAdminTransactionsResponse> => {
  const res = await request.get(endpoints.getAdminTransactions(params))
  return res as TGetAdminTransactionsResponse
}

// Waitlist Analytics
export const getAdminWaitlist = async (
  params: z.infer<typeof getWaitlistSchema>,
): Promise<TGetAdminWaitlistResponse> => {
  const res = await request.get(endpoints.getAdminWaitlist(params))
  return res as TGetAdminWaitlistResponse
}

// Store Management
export const getAdminStoreProducts = async (
  params: z.infer<typeof getProductsSchema>,
): Promise<TGetAdminStoreProductsResponse> => {
  const res = await request.get(endpoints.getAdminStoreProducts(params))
  return res as TGetAdminStoreProductsResponse
}

export const createStoreProduct = async (
  data: z.infer<typeof createProductSchema>,
): Promise<TCreateStoreProductResponse> => {
  const res = await request.post(endpoints.createStoreProduct(), data)
  return res as TCreateStoreProductResponse
}

export const updateStoreProduct = async (
  productId: string,
  data: z.infer<typeof updateProductSchema>,
): Promise<TUpdateStoreProductResponse> => {
  const res = await request.patch(endpoints.updateStoreProduct(productId), data)
  return res as TUpdateStoreProductResponse
}

// ========================================
// ADMIN AUTHENTICATION
// ========================================

// Admin login
export const loginAdmin = async (
  params: z.infer<typeof adminLoginSchema>,
): Promise<TAdminLoginResponse> => {
  const res = await request.post(`/api/admin/login`, params)
  return res as TAdminLoginResponse
}

// Admin forgot password
export const forgotPassword = async (
  params: z.infer<typeof adminForgotPasswordSchema>,
): Promise<TAdminForgotPasswordResponse> => {
  const res = await request.post(`/api/admin/forgot-password`, params)
  return res as TAdminForgotPasswordResponse
}

// Admin reset password
export const resetPassword = async (
  params: z.infer<typeof adminResetPasswordSchema>,
): Promise<TAdminResetPasswordResponse> => {
  const res = await request.post(`/api/admin/reset-password`, params)
  return res as TAdminResetPasswordResponse
}

// Create new admin
export const createAdmin = async (
  params: z.infer<typeof createAdminSchema>,
): Promise<TCreateAdminResponse> => {
  const res = await request.post(`/api/admin/create`, params)
  return res as TCreateAdminResponse
}

// Admin logout (client-side only)
export const logoutAdmin = () => {
  localStorage.removeItem('authToken')
  // Clear any other admin-specific data if needed
}

// ========================================
// WAITLIST MATCHING EXECUTION MANAGEMENT
// ========================================

export const getMatchingExecutions = async (
  params: z.infer<typeof getMatchingExecutionsSchema>,
): Promise<any> => {
  const res = await request.get(endpoints.getMatchingExecutions(params))
  return res
}

export const getMatchingExecution = async (
  executionId: string,
): Promise<any> => {
  const res = await request.get(endpoints.getMatchingExecution(executionId))
  return res
}

export const triggerMatching = async (
  config: z.infer<typeof triggerMatchingSchema>,
): Promise<any> => {
  const res = await request.post(endpoints.triggerMatching(), config)
  return res
}

export const getExecutionLogs = async (
  executionId: string,
  params: z.infer<typeof getExecutionLogsSchema>,
): Promise<any> => {
  const res = await request.get(endpoints.getExecutionLogs(executionId, params))
  return res
}

// ========================================
// ALLOCATION MANAGEMENT
// ========================================

export const getAllocations = async (
  params: z.infer<typeof getAllocationsSchema>,
): Promise<any> => {
  const res = await request.get(endpoints.getAllocations(params))
  return res
}

export const getExpiredAllocations = async (): Promise<any> => {
  const res = await request.get(endpoints.getExpiredAllocations())
  return res
}

export const expireAllocation = async (allocationId: string): Promise<any> => {
  const res = await request.post(endpoints.expireAllocation(allocationId), {})
  return res
}

export const getPatientAllocations = async (
  patientId: string,
): Promise<any> => {
  const res = await request.get(endpoints.getPatientAllocations(patientId))
  return res
}

// ========================================
// SYSTEM CONFIGURATION
// ========================================

export const getMatchingConfig = async (): Promise<any> => {
  const res = await request.get(endpoints.getMatchingConfig())
  return res
}

export const updateMatchingConfig = async (
  config: z.infer<typeof updateMatchingConfigSchema>,
): Promise<any> => {
  const res = await request.put(endpoints.updateMatchingConfig(), config)
  return res
}

export const getSystemHealth = async (): Promise<any> => {
  const res = await request.get(endpoints.getSystemHealth())
  return res
}
