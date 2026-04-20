import * as t from '@zerocancer/shared/types'

const buildQuery = (params: Record<string, unknown>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    })
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`).join('&')
      }
      return `${key}=${encodeURIComponent(String(value))}`
    })
    .join('&')
  return query ? `?${query}` : ''
}

// 🔌 Zerocancer MVP API ROUTES
export const backendHealth = () => '/api/healthz'

// USER REGISTRATION
export const registerUser = (actor: t.TActors) => `/api/register/${actor}`
export const checkProfiles = () => '/api/register/check-profiles'

// AUTHENTICATION
export const loginUser = (actor: t.TActors) =>
  `/api/auth/login${buildQuery({ actor })}`
export const logoutUser = () => '/api/auth/logout'
export const authUser = () => '/api/auth/me'
export const refreshToken = (retry?: boolean) =>
  `/api/auth/refresh${retry === true ? '?retry=true' : ''}`
export const forgotPassword = () => '/api/auth/forgot-password'
export const resetPassword = () => '/api/auth/reset-password'
export const verifyEmail = () => '/api/auth/verify-email'
export const resendVerification = () => '/api/auth/resend-verification'

// PATIENT
export const getAppointments = (page = 1, size = 20) =>
  `/api/patient/appointments${buildQuery({ page, size })}`
export const createSelfPayAppointment = () => '/api/appointment/patient/book'
export const getQR = () => '/api/patient/qr'
export const getResults = (page = 1, size = 20) =>
  `/api/patient/results${buildQuery({ page, size })}`
export const getWaitlists = (params: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'EXPIRED'
}) =>
  `/api/waitlist/patient${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    status: params.status ?? undefined,
  })}`

export const getAllWaitlists = (params: {
  page?: number
  pageSize?: number
  demandOrder?: 'asc' | 'desc'
}) =>
  `/api/waitlist${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    demandOrder: params.demandOrder ?? 'desc',
  })}`
export const joinWaitlist = () => '/api/waitlist/patient/join'
export const leaveWaitlist = () => '/api/waitlist/patient/leave'
export const getWaitlist = (waitlistId: string) =>
  `/api/waitlist/patient/${waitlistId}`
export const checkWaitlistStatus = (screeningTypeId: string) =>
  `/api/waitlist/patient/status/${screeningTypeId}`
export const selectCenter = () =>
  '/api/appointment/patient/matches/select-center'
export const getReceipt = (id: string) => `/api/patient/receipt/${id}`
export const getEligibleCenters = (
  allocationId: string,
  page = 1,
  size = 20,
  state?: string,
  lga?: string,
) =>
  `/api/appointment/patient/matches/eligible-centers/${allocationId}${buildQuery({ page, size, state, lga })}`
export const selectCenterAfterMatch = () =>
  `/api/appointment/patient/matches/select-center`
export const getPatientAppointments = (params: {
  page?: number
  size?: number
  status?: string
}) => `/api/appointment/patient${buildQuery(params)}`

// export const getPatientResults = (params: {
//   page?: number
//   pageSize?: number
// }) => `/api/appointment/patient/results${buildQuery(params)}`

export const getPatientResult = (id: string) =>
  `/api/appointment/patient/results/${id}`
// Get check-in code for an appointment
export const getCheckInCode = (appointmentId: string) =>
  `/api/appointment/patient/${appointmentId}/checkin-code`

// Get appointment details by ID
export const getPatientAppointmentById = (appointmentId: string) =>
  `/api/appointment/patient/${appointmentId}`

// Get appointment results by ID (works for any role)
export const getAppointmentResults = (appointmentId: string) =>
  `/api/appointment/${appointmentId}/results`

// Center verifies a check-in code
export const verifyCheckInCode = () => `/api/appointment/center/verify`

// DONOR
export const donateAnonymous = () => '/api/donor/donations/anonymous'
export const createCampaign = () => '/api/donor/campaigns'
export const getCampaigns = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) =>
  `/api/donor/campaigns${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    status: params.status ?? undefined,
    search: params.search ?? undefined,
  })}`
export const getCampaign = (id: string) => `/api/donor/campaigns/${id}`
export const fundCampaign = (id: string) => `/api/donor/campaigns/${id}/fund`
export const updateCampaign = (id: string) => `/api/donor/campaigns/${id}`
export const deleteCampaign = (id: string) => `/api/donor/campaigns/${id}`
export const verifyPayment = (reference: string) =>
  `/api/donor/verify-payment/${reference}`
export const getDonorReceipts = (page = 1, size = 20) =>
  `/api/donor/receipts${buildQuery({ page, size })}`
export const getDonationImpact = () => '/api/donor/impact'

// CENTER
export const getCenters = (params: {
  page?: number
  pageSize?: number
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  lga?: string
}) =>
  `/api/center${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    search: params.search ?? undefined,
    status: params.status ?? undefined,
    state: params.state ?? undefined,
    lga: params.lga ?? undefined,
  })}`

export const getCenterById = (id: string) => `/api/center/${id}`

export const getCenterAppointments = (params: {
  page?: number
  pageSize?: number
  screeningType?: string
}) =>
  `/api/appointment/center${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    screeningType: params.screeningType ?? undefined,
  })}`

export const getCenterAppointmentById = (id: string) =>
  `/api/appointment/center/${id}`

export const cancelCenterAppointment = (id: string) =>
  `/api/appointment/center/${id}/cancel`

export const uploadResults = (appointmentId: string) =>
  `/api/appointment/center/${appointmentId}/upload-results`

// Result file management endpoints
export const deleteResultFile = (fileId: string) =>
  `/api/appointment/center/files/${fileId}`
export const restoreResultFile = (fileId: string) =>
  `/api/appointment/center/files/${fileId}/restore`

// Appointment completion endpoint
export const completeAppointment = (appointmentId: string) =>
  `/api/appointment/center/${appointmentId}/complete`

// ADMIN AUTH
export const loginAdmin = () => '/api/admin/login'
export const forgotPasswordAdmin = () => '/api/admin/forgot-password'
export const resetPasswordAdmin = () => '/api/admin/reset-password'
export const createAdmin = () => '/api/admin/create'

// ADMIN MANAGEMENT
// Center Management
export const getAdminCenters = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  search?: string
}) => `/api/admin/centers${buildQuery(params)}`
export const updateCenterStatus = (id: string) =>
  `/api/admin/centers/${id}/status`

// User Management
export const getAdminUsers = (params: {
  page?: number
  pageSize?: number
  profileType?: 'PATIENT' | 'DONOR'
  search?: string
}) => `/api/admin/users${buildQuery(params)}`

// Campaign Management
export const getAdminCampaigns = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) => `/api/admin/campaigns${buildQuery(params)}`
export const updateAdminCampaignStatus = (id: string) =>
  `/api/admin/campaigns/${id}/status`

// Appointment Monitoring
export const getAdminAppointments = (params: {
  page?: number
  pageSize?: number
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  centerId?: string
  isDonation?: boolean
  dateFrom?: string
  dateTo?: string
}) => `/api/admin/appointments${buildQuery(params)}`

// Transaction Monitoring
export const getAdminTransactions = (params: {
  page?: number
  pageSize?: number
  type?: 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND'
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'
  dateFrom?: string
  dateTo?: string
}) => `/api/admin/transactions${buildQuery(params)}`

// Waitlist Analytics
export const getAdminWaitlist = (params: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'CLAIMED' | 'EXPIRED'
  screeningTypeId?: string
  state?: string
  groupBy?: 'state' | 'screening_type' | 'status'
}) => `/api/admin/waitlist${buildQuery(params)}`

// Store Management
export const getAdminStoreProducts = (params: {
  page?: number
  pageSize?: number
  search?: string
}) => `/api/admin/store/products${buildQuery(params)}`
export const createStoreProduct = () => '/api/admin/store/products'
export const updateStoreProduct = (id: string) =>
  `/api/admin/store/products/${id}`

// Notification endpoints
export const getNotifications = () => `/api/notifications`
export const markNotificationRead = (notificationRecipientId: string) =>
  `/api/notifications/${notificationRecipientId}/read`
export const createNotification = () => `/api/notifications`

export const getPatientReceipts = (params: { page?: number; size?: number }) =>
  `/api/patient/receipts${buildQuery({
    page: params.page ?? 1,
    size: params.size ?? 20,
  })}`
export const getPatientReceipt = (id: string) => `/api/patient/receipts/${id}`

// V1 Receipt System Endpoints
export const getReceiptV1 = (transactionId: string) =>
  `/api/receipts/${transactionId}`
export const downloadReceiptPDF = (transactionId: string) =>
  `/api/receipts/${transactionId}/pdf`
export const createReceiptV1 = (transactionId: string) =>
  `/api/receipts/${transactionId}`
export const resendReceipt = (transactionId: string) =>
  `/api/receipts/${transactionId}/resend`
export const listReceiptsV1 = (params: {
  page?: number
  limit?: number
  type?: string
  userId?: string
  startDate?: string
  endDate?: string
}) => `/api/receipts${buildQuery(params)}`

// Screening types
export const getScreeningTypes = (params: {
  page?: number
  pageSize?: number
  search?: string
}) =>
  `/api/screening-types${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    search: params.search ?? undefined,
  })}`
export const getAllScreeningTypes = (search?: string) =>
  `/api/screening-types/all${buildQuery({ search })}`
export const getScreeningTypeCategories = () =>
  `/api/screening-types/categories`
export const getScreeningTypesByCategory = (
  categoryId: string,
  params: { page?: number; pageSize?: number; search?: string },
) =>
  `/api/screening-types/category/${categoryId}${buildQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    search: params.search ?? undefined,
  })}`
export const getScreeningTypeById = (id: string) => `/api/screening-types/${id}`
export const getScreeningTypeByName = (name: string) =>
  `/api/screening-types/by-name/${encodeURIComponent(name)}`

// CENTER STAFF
export const centerStaffForgotPassword = () =>
  '/api/center/staff/forgot-password'
export const centerStaffResetPassword = () => '/api/center/staff/reset-password'
export const inviteStaff = () => '/api/center/staff/invite'
export const getStaffInvites = () => '/api/center/staff/invite'
export const createCenterStaffPassword = () =>
  '/api/center/staff/create-new-password'
export const centerStaffLogin = () => '/api/center/staff/login'
export const validateStaffInvite = (token: string) =>
  `/api/center/staff/invite/validate/${token}`

// Analytics endpoints
export const getDashboardMetrics = () => '/api/analytics/dashboard'
export const getTimeBasedReport = (params: {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  from?: string
  to?: string
}) => `/api/analytics/reports/time${buildQuery(params)}`
export const getGeographicReport = () => '/api/analytics/geographic'
export const getCenterPerformance = (params?: { centerId?: string }) =>
  `/api/analytics/centers${params ? buildQuery(params) : ''}`
export const getCampaignAnalytics = () => '/api/analytics/campaigns'

// WAITLIST ADMIN ENDPOINTS
export const triggerWaitlistMatching = () => `/api/waitlist/manual-trigger`
export const getWaitlistMatchingStats = () => `/api/waitlist/matching-stats`
export const getWaitlistMatchingStatus = () => `/api/waitlist/matching-status`

// WAITLIST MATCHING EXECUTION MANAGEMENT
export const getMatchingExecutions = (params: Record<string, unknown>) =>
  `/api/admin/matching/executions${buildQuery(params)}`

export const getMatchingExecution = (executionId: string) =>
  `/api/admin/matching/executions/${executionId}`

export const triggerMatching = () => `/api/admin/matching/trigger`

export const getExecutionLogs = (
  executionId: string,
  params: Record<string, unknown>,
) => `/api/admin/matching/executions/${executionId}/logs${buildQuery(params)}`

// ALLOCATION MANAGEMENT
export const getAllocations = (params: Record<string, unknown>) =>
  `/api/admin/allocations${buildQuery(params)}`

export const getExpiredAllocations = () => `/api/admin/allocations/expired`

export const expireAllocation = (allocationId: string) =>
  `/api/admin/allocations/${allocationId}/expire`

export const getPatientAllocations = (patientId: string) =>
  `/api/admin/allocations/patient/${patientId}`

// SYSTEM CONFIGURATION
export const getMatchingConfig = () => `/api/admin/config/matching`

export const updateMatchingConfig = () => `/api/admin/config/matching`

export const getSystemHealth = () => `/api/admin/system/health`

export const cancelPatientAppointment = (appointmentId: string) =>
  `/api/appointment/${appointmentId}/cancel`

// Payouts
// PAYOUTS
export const getAllCenterBalances = () => '/api/payouts/center-balances'
export const getCenterBalance = (centerId: string) =>
  `/api/payouts/center/${centerId}/balance`
export const createManualPayout = () => '/api/payouts/manual'
export const processPayout = (payoutId: string) =>
  `/api/payouts/${payoutId}/process`
export const retryPayout = (payoutId: string) =>
  `/api/payouts/${payoutId}/retry`
export const getPayouts = (params?: Record<string, unknown>) =>
  `/api/payouts${buildQuery(params || {})}`
export const getCenterPayouts = (
  centerId: string,
  params?: Record<string, unknown>,
) => `/api/payouts/center/${centerId}${buildQuery(params || {})}`
export const getCenterTransactions = (
  centerId: string,
  params?: Record<string, unknown>,
) => `/api/payouts/center/${centerId}/transactions${buildQuery(params || {})}`
export const getBanks = () => '/api/payouts/banks'
export const verifyAccount = () => '/api/payouts/verify-account'
