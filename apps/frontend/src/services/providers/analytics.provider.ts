import * as analyticsService from '@/services/analytics.service'
import { QueryKeys } from '@/services/keys'
import { queryOptions } from '@tanstack/react-query'

/**
 * Analytics Provider - React Query hooks for analytics data
 *
 * This provider follows the established project patterns for:
 * - Query management with proper keys
 * - Stale time management for performance
 * - Type safety with shared schemas
 * - Consistent caching strategies
 */

/**
 * Query for dashboard metrics (main overview stats)
 *
 * @example
 * const dashboardQuery = useDashboardMetrics();
 *
 * // In component:
 * const { data: metrics, isLoading, error } = useQuery(dashboardQuery);
 */
export const useDashboardMetrics = () =>
  queryOptions({
    queryKey: [QueryKeys.dashboardMetrics],
    queryFn: analyticsService.getDashboardMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes - dashboard should be relatively fresh
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
  })

/**
 * Query for time-based reports with growth metrics
 *
 * @example
 * const timeReportQuery = useTimeBasedReport({
 *   period: 'monthly',
 *   from: '2024-01-01'
 * });
 *
 * // In component:
 * const { data: report, isLoading } = useQuery(timeReportQuery);
 */
export const useTimeBasedReport = (
  params: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    from?: string
    to?: string
  } = {},
) =>
  queryOptions({
    queryKey: [QueryKeys.timeBasedReport, params],
    queryFn: () => analyticsService.getTimeBasedReport(params),
    staleTime: 10 * 60 * 1000, // 10 minutes - time reports change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
  })

/**
 * Query for geographic distribution analytics
 *
 * @example
 * const geoReportQuery = useGeographicReport();
 *
 * // In component:
 * const { data: geoData, isLoading } = useQuery(geoReportQuery);
 */
export const useGeographicReport = () =>
  queryOptions({
    queryKey: [QueryKeys.geographicReport],
    queryFn: analyticsService.getGeographicReport,
    staleTime: 15 * 60 * 1000, // 15 minutes - geographic data changes slowly
    gcTime: 60 * 60 * 1000, // 1 hour in cache
  })

/**
 * Query for center performance analytics
 *
 * @example
 * const centerPerfQuery = useCenterPerformance();
 *
 * // For all centers:
 * const { data: allCenters } = useQuery(centerPerfQuery);
 *
 * // For specific center:
 * const specificCenterQuery = useCenterPerformance({ centerId: 'center-123' });
 * const { data: centerData } = useQuery(specificCenterQuery);
 */
export const useCenterPerformance = (params?: { centerId?: string }) =>
  queryOptions({
    queryKey: [QueryKeys.centerPerformance, params],
    queryFn: () => analyticsService.getCenterPerformance(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
  })

/**
 * Query for campaign analytics and funding insights
 *
 * @example
 * const campaignAnalyticsQuery = useCampaignAnalytics();
 *
 * // In component:
 * const { data: campaigns, isLoading } = useQuery(campaignAnalyticsQuery);
 */
export const useCampaignAnalytics = () =>
  queryOptions({
    queryKey: [QueryKeys.campaignAnalytics],
    queryFn: analyticsService.getCampaignAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes - campaign data should be fresh
    gcTime: 15 * 60 * 1000, // 15 minutes in cache
  })

/**
 * Utility function to create analytics query keys for manual cache management
 *
 * @example
 * // Invalidate all analytics queries
 * queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all() });
 *
 * // Invalidate specific report
 * queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.timeBasedReport(params) });
 */
export const analyticsQueryKeys = {
  all: () => ['analytics'] as const,
  dashboard: () => [QueryKeys.dashboardMetrics] as const,
  timeBasedReport: (params?: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    from?: string
    to?: string
  }) => [QueryKeys.timeBasedReport, params] as const,
  geographicReport: () => [QueryKeys.geographicReport] as const,
  centerPerformance: (params?: { centerId?: string }) =>
    [QueryKeys.centerPerformance, params] as const,
  campaignAnalytics: () => [QueryKeys.campaignAnalytics] as const,
}

/**
 * Hook for refreshing analytics data
 * Useful for manual refresh buttons or periodic updates
 *
 * @example
 * const refreshAnalytics = useRefreshAnalytics();
 *
 * // In component:
 * const handleRefresh = () => {
 *   refreshAnalytics.dashboard();
 *   // or refreshAnalytics.all();
 * };
 */
export const useRefreshAnalytics = () => {
  return {
    all: () => {
      // This would need to be implemented with useQueryClient
      // but keeping the structure for future implementation
    },
    dashboard: () => {
      // Refresh dashboard metrics
    },
    timeBasedReport: (params?: any) => {
      // Refresh time-based reports
    },
    geographic: () => {
      // Refresh geographic report
    },
    centerPerformance: () => {
      // Refresh center performance
    },
    campaignAnalytics: () => {
      // Refresh campaign analytics
    },
  }
}
