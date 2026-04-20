import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import * as adminService from '../admin.service'
import { MutationKeys, QueryKeys } from '../keys'

// --- Admin Auth Mutations ---

// Admin login mutation
export const useAdminLogin = () => {
  return useMutation({
    mutationKey: [MutationKeys.adminLogin],
    mutationFn: adminService.loginAdmin,
  })
}

// Admin forgot password mutation
export const useAdminForgotPassword = () => {
  return useMutation({
    mutationKey: [MutationKeys.adminForgotPassword],
    mutationFn: adminService.forgotPassword,
  })
}

// Admin reset password mutation
export const useAdminResetPassword = () => {
  return useMutation({
    mutationKey: [MutationKeys.adminResetPassword],
    mutationFn: adminService.resetPassword,
  })
}

// Create admin mutation (admin-only)
export const useCreateAdmin = () => {
  return useMutation({
    mutationKey: [MutationKeys.createAdmin],
    mutationFn: adminService.createAdmin,
  })
}

// --- Admin Management Query Providers ---

// Get all centers (admin view)
export const adminCenters = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminCenters, params],
    queryFn: () => adminService.getAdminCenters(params),
  })

// Get all users (admin view)
export const adminUsers = (params: {
  page?: number
  pageSize?: number
  profileType?: 'PATIENT' | 'DONOR'
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminUsers, params],
    queryFn: () => adminService.getAdminUsers(params),
  })

// Get all campaigns (admin view)
export const adminCampaigns = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminCampaigns, params],
    queryFn: () => adminService.getAdminCampaigns(params),
  })

// Get all appointments (admin view)
export const adminAppointments = (params: {
  page?: number
  pageSize?: number
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  centerId?: string
  isDonation?: boolean
  dateFrom?: string
  dateTo?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminAppointments, params],
    queryFn: () => adminService.getAdminAppointments(params),
  })

// Get all transactions (admin view)
export const adminTransactions = (params: {
  page?: number
  pageSize?: number
  type?: 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND'
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'
  dateFrom?: string
  dateTo?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminTransactions, params],
    queryFn: () => adminService.getAdminTransactions(params),
  })

// Get waitlist analytics (admin view)
export const adminWaitlist = (params: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'CLAIMED' | 'EXPIRED'
  screeningTypeId?: string
  state?: string
  groupBy?: 'state' | 'screening_type' | 'status'
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminWaitlist, params],
    queryFn: () => adminService.getAdminWaitlist(params),
  })

// Get store products (admin view)
export const adminStoreProducts = (params: {
  page?: number
  pageSize?: number
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.adminStoreProducts, params],
    queryFn: () => adminService.getAdminStoreProducts(params),
  })

// --- Admin Management Query Providers ---

// Admin query hooks
export const useAdminCenters = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  state?: string
  search?: string
}) => {
  return useQuery(adminCenters(params))
}

export const useAdminUsers = (params: {
  page?: number
  pageSize?: number
  profileType?: 'PATIENT' | 'DONOR'
  search?: string
}) => {
  return useQuery(adminUsers(params))
}

export const useAdminCampaigns = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) => {
  return useQuery(adminCampaigns(params))
}

export const useAdminAppointments = (params: {
  page?: number
  pageSize?: number
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  centerId?: string
  isDonation?: boolean
  dateFrom?: string
  dateTo?: string
}) => {
  return useQuery(adminAppointments(params))
}

export const useAdminTransactions = (params: {
  page?: number
  pageSize?: number
  type?: 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND'
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'
  dateFrom?: string
  dateTo?: string
}) => {
  return useQuery(adminTransactions(params))
}

export const useAdminWaitlist = (params: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'MATCHED' | 'CLAIMED' | 'EXPIRED'
  screeningTypeId?: string
  state?: string
  groupBy?: 'state' | 'screening_type' | 'status'
}) => {
  return useQuery(adminWaitlist(params))
}

export const useAdminStoreProducts = (params: {
  page?: number
  pageSize?: number
  search?: string
}) => {
  return useQuery(adminStoreProducts(params))
}

// --- Admin Management Mutations ---

// Update center status mutation
export const useUpdateCenterStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateCenterStatus],
    mutationFn: ({
      centerId,
      status,
      reason,
    }: {
      centerId: string
      status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      reason?: string
    }) => adminService.updateCenterStatus(centerId, { status, reason }),
    onSuccess: () => {
      // Invalidate admin centers query when status is updated
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.adminCenters],
      })
    },
  })
}

// Update campaign status mutation
export const useUpdateCampaignStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateCampaignStatus],
    mutationFn: ({
      campaignId,
      status,
      reason,
    }: {
      campaignId: string
      status: 'ACTIVE' | 'COMPLETED' | 'DELETED'
      reason?: string
    }) =>
      adminService.updateAdminCampaignStatus(campaignId, { status, reason }),
    onSuccess: () => {
      // Invalidate admin campaigns query when status is updated
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.adminCampaigns],
      })
    },
  })
}

// Alias for backward compatibility
export const useUpdateAdminCampaignStatus = useUpdateCampaignStatus

// Create store product mutation
export const useCreateStoreProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.createStoreProduct],
    mutationFn: adminService.createStoreProduct,
    onSuccess: () => {
      // Invalidate store products query when a new product is created
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.adminStoreProducts],
      })
    },
  })
}

// Update store product mutation
export const useUpdateStoreProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateStoreProduct],
    mutationFn: ({
      productId,
      ...updateData
    }: {
      productId: string
      name?: string
      description?: string
      price?: number
      stock?: number
    }) => adminService.updateStoreProduct(productId, updateData),
    onSuccess: () => {
      // Invalidate store products query when a product is updated
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.adminStoreProducts],
      })
    },
  })
}
