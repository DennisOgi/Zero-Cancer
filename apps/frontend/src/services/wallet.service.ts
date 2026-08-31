/**
 * Wallet Service
 * 
 * API client for wallet operations
 */

import request from '@/lib/request'
import type { TDataResponse } from '@zerocancer/shared/types'

// ============================================
// TYPES
// ============================================

export interface WalletBalance {
  id: string
  balance: number
  currency: string
  updatedAt: string
}

export interface WalletTransaction {
  id: string
  type: 'CREDIT' | 'DEBIT' | 'CASHOUT'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  appointmentId?: string
  transactionId?: string
  cashoutId?: string
  initiatedBy?: string
  createdAt: string
}

export interface WalletStats {
  totalEarnings: number
  totalCredits: number
  totalDebits: number
  transactionCount: number
}

export interface CashoutRecord {
  id: string
  walletId: string
  amount: number
  fee: number
  netAmount: number
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  paystackReference?: string
  failureReason?: string
  initiatedBy: string
  processedAt?: string
  completedAt?: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// CENTER WALLET API
// ============================================

/**
 * Get center wallet balance
 */
export async function getCenterWalletBalance(
  centerId: string
): Promise<TDataResponse<WalletBalance>> {
  return request.get(`/api/wallets/center/${centerId}`)
}

/**
 * Get center wallet transactions
 */
export async function getCenterWalletTransactions(
  centerId: string,
  params?: {
    page?: number
    pageSize?: number
    startDate?: string
    endDate?: string
  }
): Promise<TDataResponse<PaginatedResponse<WalletTransaction>>> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)

  return request.get(
    `/api/wallets/center/${centerId}/transactions?${queryParams.toString()}`
  )
}

/**
 * Get center wallet statistics
 */
export async function getCenterWalletStats(
  centerId: string,
  params?: {
    startDate?: string
    endDate?: string
  }
): Promise<TDataResponse<WalletStats>> {
  const queryParams = new URLSearchParams()
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)

  return request.get(
    `/api/wallets/center/${centerId}/stats?${queryParams.toString()}`
  )
}

/**
 * Request cashout
 */
export async function requestCashout(
  centerId: string,
  data: {
    amount: number
    fee: number
  }
): Promise<TDataResponse<CashoutRecord>> {
  return request.post(`/api/wallets/center/${centerId}/cashout`, data)
}

/**
 * Get cashout history
 */
export async function getCenterCashouts(
  centerId: string,
  params?: {
    page?: number
    pageSize?: number
  }
): Promise<TDataResponse<PaginatedResponse<CashoutRecord>>> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())

  return request.get(
    `/api/wallets/center/${centerId}/cashouts?${queryParams.toString()}`
  )
}

// ============================================
// PLATFORM WALLET API (Admin Only)
// ============================================

/**
 * Get platform wallet balance
 */
export async function getPlatformWalletBalance(): Promise<
  TDataResponse<WalletBalance>
> {
  return request.get('/api/wallets/platform')
}

/**
 * Get platform wallet transactions
 */
export async function getPlatformWalletTransactions(
  params?: {
    page?: number
    pageSize?: number
    startDate?: string
    endDate?: string
  }
): Promise<TDataResponse<PaginatedResponse<WalletTransaction>>> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)

  return request.get(`/api/wallets/platform/transactions?${queryParams.toString()}`)
}

/**
 * Get platform wallet statistics
 */
export async function getPlatformWalletStats(
  params?: {
    startDate?: string
    endDate?: string
  }
): Promise<TDataResponse<WalletStats>> {
  const queryParams = new URLSearchParams()
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)

  return request.get(`/api/wallets/platform/stats?${queryParams.toString()}`)
}

/**
 * Get all center wallets (admin only)
 */
export async function getAllCenterWallets(
  params?: {
    page?: number
    pageSize?: number
  }
): Promise<
  TDataResponse<
    PaginatedResponse<WalletBalance & { centerName: string; centerId: string }>
  >
> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())

  return request.get(`/api/wallets/centers?${queryParams.toString()}`)
}
