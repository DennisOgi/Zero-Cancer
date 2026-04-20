import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import type {
  TCampaignAnalyticsResponse,
  TCenterPerformanceResponse,
  TDashboardMetricsResponse,
  TGeographicReportResponse,
  TTimeBasedReportResponse,
} from '@zerocancer/shared/types'

/**
 * Analytics Service - handles all analytics-related API calls
 *
 * Usage in components:
 * - Use through the analytics provider hooks for better state management and caching
 * - All functions return properly typed responses using shared types
 */

/**
 * Get dashboard metrics (overview stats)
 *
 * @example
 * // Use through the provider:
 * const { data: metrics } = useDashboardMetrics();
 */
export const getDashboardMetrics =
  async (): Promise<TDashboardMetricsResponse> => {
    return await request.get(endpoints.getDashboardMetrics())
  }

/**
 * Get time-based reports with growth metrics
 *
 * @example
 * // Use through the provider:
 * const { data: report } = useTimeBasedReport({
 *   period: 'monthly',
 *   from: '2024-01-01',
 *   to: '2024-12-31'
 * });
 */
export const getTimeBasedReport = async (
  params: {
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    from?: string
    to?: string
  } = {},
): Promise<TTimeBasedReportResponse> => {
  return await request.get(endpoints.getTimeBasedReport(params))
}

/**
 * Get geographic distribution report
 *
 * @example
 * // Use through the provider:
 * const { data: geoReport } = useGeographicReport();
 */
export const getGeographicReport =
  async (): Promise<TGeographicReportResponse> => {
    return await request.get(endpoints.getGeographicReport())
  }

/**
 * Get center performance analytics
 *
 * @example
 * // Use through the provider:
 * const { data: centerReports } = useCenterPerformance();
 *
 * // Or for a specific center:
 * const { data: singleCenter } = useCenterPerformance('center-id-123');
 */
export const getCenterPerformance = async (params?: {
  centerId?: string
}): Promise<TCenterPerformanceResponse> => {
  return await request.get(endpoints.getCenterPerformance(params))
}

/**
 * Get campaign analytics and funding insights
 *
 * @example
 * // Use through the provider:
 * const { data: campaignAnalytics } = useCampaignAnalytics();
 */
export const getCampaignAnalytics =
  async (): Promise<TCampaignAnalyticsResponse> => {
    return await request.get(endpoints.getCampaignAnalytics())
  }

/**
 * Utility functions for analytics data formatting
 */
export const analyticsUtils = {
  /**
   * Format currency values for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  },

  /**
   * Format percentage values for display
   */
  formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`
  },

  /**
   * Format large numbers with K, M suffixes
   */
  formatCompactNumber(value: number): string {
    return new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  },

  /**
   * Format growth rate with proper sign and color indication
   */
  formatGrowthRate(rate: number): {
    formatted: string
    isPositive: boolean
    isNeutral: boolean
  } {
    const isPositive = rate > 0
    const isNeutral = rate === 0
    const sign = isPositive ? '+' : ''

    return {
      formatted: `${sign}${rate.toFixed(1)}%`,
      isPositive,
      isNeutral,
    }
  },

  /**
   * Get time period display name
   */
  getPeriodDisplayName(period: string): string {
    switch (period) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      case 'yearly':
        return 'Yearly'
      default:
        return period
    }
  },

  /**
   * Calculate completion rate percentage
   */
  calculateCompletionRate(completed: number, total: number): number {
    return total > 0 ? (completed / total) * 100 : 0
  },

  /**
   * Generate chart colors for different data series
   */
  getChartColors() {
    return {
      revenue: '#22c55e', // Green
      appointments: '#3b82f6', // Blue
      registrations: '#f59e0b', // Orange
      donations: '#8b5cf6', // Purple
      success: '#10b981', // Emerald
      warning: '#f59e0b', // Amber
      danger: '#ef4444', // Red
      info: '#06b6d4', // Cyan
    }
  },

  /**
   * Format date for chart display
   */
  formatChartDate(dateString: string, period: string): string {
    const date = new Date(dateString)

    switch (period) {
      case 'daily':
        return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
      case 'weekly':
        return `Week ${Math.ceil(date.getDate() / 7)}, ${date.toLocaleDateString('en', { month: 'short' })}`
      case 'monthly':
        return date.toLocaleDateString('en', {
          month: 'short',
          year: 'numeric',
        })
      case 'yearly':
        return date.getFullYear().toString()
      default:
        return date.toLocaleDateString()
    }
  },

  /**
   * Calculate average from array of values
   */
  calculateAverage(values: number[]): number {
    return values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : 0
  },

  /**
   * Find top performing items from array
   */
  getTopPerformers<T>(
    items: T[],
    getValue: (item: T) => number,
    limit = 5,
  ): T[] {
    return items.sort((a, b) => getValue(b) - getValue(a)).slice(0, limit)
  },

  /**
   * Calculate trend direction
   */
  getTrendDirection(
    currentValue: number,
    previousValue: number,
  ): 'up' | 'down' | 'stable' {
    if (currentValue > previousValue) return 'up'
    if (currentValue < previousValue) return 'down'
    return 'stable'
  },
}
