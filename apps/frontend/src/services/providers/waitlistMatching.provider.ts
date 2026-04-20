import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import * as adminService from '../admin.service'
import { MutationKeys, QueryKeys } from '../keys'

// ========================================
// WAITLIST MATCHING EXECUTION PROVIDERS
// ========================================

// Get matching executions query options
export const matchingExecutions = (params: {
  page?: number
  pageSize?: number
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED'
  dateFrom?: string
  dateTo?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.matchingExecutions, params],
    queryFn: () => adminService.getMatchingExecutions(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

// Use matching executions query
export const useMatchingExecutions = (params: {
  page?: number
  pageSize?: number
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED'
  dateFrom?: string
  dateTo?: string
}) => {
  return useQuery(matchingExecutions(params))
}

// Get single matching execution query options
export const matchingExecution = (executionId: string) =>
  queryOptions({
    queryKey: [QueryKeys.matchingExecution, executionId],
    queryFn: () => adminService.getMatchingExecution(executionId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!executionId,
  })

// Use matching execution query
export const useMatchingExecution = (executionId: string) => {
  return useQuery(matchingExecution(executionId))
}

// Trigger matching algorithm mutation
export const useTriggerMatching = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.triggerMatching],
    mutationFn: adminService.triggerMatching,
    onSuccess: () => {
      // Invalidate matching executions to refresh the list
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.matchingExecutions],
      })
      // Invalidate system health to refresh metrics
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.systemHealth],
      })
    },
  })
}

// Get execution logs query options
export const executionLogs = (
  executionId: string,
  params: {
    page?: number
    pageSize?: number
    level?: 'INFO' | 'WARNING' | 'ERROR'
    patientId?: string
    campaignId?: string
  },
) =>
  queryOptions({
    queryKey: [QueryKeys.executionLogs, executionId, params],
    queryFn: () => adminService.getExecutionLogs(executionId, params),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    enabled: !!executionId,
  })

// Use execution logs query
export const useExecutionLogs = (
  executionId: string,
  params: {
    page?: number
    pageSize?: number
    level?: 'INFO' | 'WARNING' | 'ERROR'
    patientId?: string
    campaignId?: string
  },
) => {
  return useQuery(executionLogs(executionId, params))
}

// ========================================
// ALLOCATION MANAGEMENT PROVIDERS
// ========================================

// Get allocations query options
export const allocations = (params: {
  page?: number
  pageSize?: number
  status?: 'MATCHED' | 'CLAIMED' | 'EXPIRED'
  patientId?: string
  campaignId?: string
  dateFrom?: string
  dateTo?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.allocations, params],
    queryFn: () => adminService.getAllocations(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

// Use allocations query
export const useAllocations = (params: {
  page?: number
  pageSize?: number
  status?: 'MATCHED' | 'CLAIMED' | 'EXPIRED'
  patientId?: string
  campaignId?: string
  dateFrom?: string
  dateTo?: string
}) => {
  return useQuery(allocations(params))
}

// Get expired allocations query options
export const expiredAllocations = () =>
  queryOptions({
    queryKey: [QueryKeys.expiredAllocations],
    queryFn: adminService.getExpiredAllocations,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  })

// Use expired allocations query
export const useExpiredAllocations = () => {
  return useQuery(expiredAllocations())
}

// Expire allocation mutation
export const useExpireAllocation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.expireAllocation],
    mutationFn: adminService.expireAllocation,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.allocations],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.expiredAllocations],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.systemHealth],
      })
    },
  })
}

// Get patient allocations query options
export const patientAllocations = (patientId: string) =>
  queryOptions({
    queryKey: [QueryKeys.patientAllocations, patientId],
    queryFn: () => adminService.getPatientAllocations(patientId),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!patientId,
  })

// Use patient allocations query
export const usePatientAllocations = (patientId: string) => {
  return useQuery(patientAllocations(patientId))
}

// ========================================
// SYSTEM CONFIGURATION PROVIDERS
// ========================================

// Get matching configuration query options
export const matchingConfig = () =>
  queryOptions({
    queryKey: [QueryKeys.matchingConfig],
    queryFn: adminService.getMatchingConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })

// Use matching configuration query
export const useMatchingConfig = () => {
  return useQuery(matchingConfig())
}

// Update matching configuration mutation
export const useUpdateMatchingConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateMatchingConfig],
    mutationFn: adminService.updateMatchingConfig,
    onSuccess: () => {
      // Invalidate config to refresh
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.matchingConfig],
      })
    },
  })
}

// Get system health query options
export const systemHealth = () =>
  queryOptions({
    queryKey: [QueryKeys.systemHealth],
    queryFn: adminService.getSystemHealth,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  })

// Use system health query
export const useSystemHealth = () => {
  return useQuery(systemHealth())
}

// ========================================
// CONVENIENCE HOOKS
// ========================================

// Combined hook for dashboard overview
export const useWaitlistMatchingDashboard = () => {
  const executions = useMatchingExecutions({ page: 1, pageSize: 5 })
  const health = useSystemHealth()
  const expired = useExpiredAllocations()

  return {
    recentExecutions: executions,
    systemHealth: health,
    expiredAllocations: expired,
    isLoading: executions.isLoading || health.isLoading || expired.isLoading,
    error: executions.error || health.error || expired.error,
  }
}

// Hook for real-time execution monitoring
export const useExecutionMonitoring = (executionId: string) => {
  const execution = useMatchingExecution(executionId)
  const logs = useExecutionLogs(executionId, { page: 1, pageSize: 50 })

  // Auto-refresh for running executions
  const isRunning = execution.data?.data?.status === 'RUNNING'

  return {
    execution: {
      ...execution,
      // Refresh more frequently for running executions
      refetchInterval: isRunning ? 5000 : false,
    },
    logs: {
      ...logs,
      refetchInterval: isRunning ? 10000 : false,
    },
    isRunning,
    isComplete: execution.data?.data?.status === 'COMPLETED',
    hasFailed: execution.data?.data?.status === 'FAILED',
  }
}
