import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import type * as t from '@zerocancer/shared/types'

export interface CenterBalance {
  centerId: string
  centerName?: string
  eligibleAmount: number
  eligibleTransactions: Array<{
    id: string
    amount: number
    createdAt: string
    appointments: Array<{
      center: { centerName: string }
      patient: { fullName: string }
      screeningType: { name: string }
    }>
  }>
  totalPaidOut: number
  pendingPayouts: number
  transactionCount: number
  lastPayoutDate?: string
}

export interface Payout {
  id: string
  batchReference: string
  payoutNumber: string
  centerId: string
  amount: number
  netAmount: number
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  type: 'MANUAL' | 'AUTOMATED' | 'RETRY'
  reason: string
  createdAt: string
  processedAt?: string
  completedAt?: string
  failureReason?: string
  center: {
    centerName: string
    email: string
  }
  payoutItems: Array<{
    id: string
    transactionId: string
    amount: number
    description: string
    serviceDate: string
    appointmentId?: string
  }>
}

export interface PayoutListResponse {
  payouts: Payout[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CenterTransaction {
  id: string
  amount: number
  status: string
  createdAt: string
  appointments: Array<{
    patient: { fullName: string; email: string }
    screeningType: { name: string }
  }>
  payoutItem?: {
    payout: {
      id: string
      payoutNumber: string
      status: string
      completedAt?: string
    }
  } | null
}

export interface CenterTransactionHistoryResponse {
  transactions: CenterTransaction[]
  totals: {
    totalAmount: number
    totalCount: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Bank {
  id: number
  name: string
  code: string
  longcode: string
  gateway: string
  pay_with_bank: boolean
  active: boolean
  country: string
  currency: string
  type: string
  is_deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface AccountVerification {
  account_number: string
  account_name: string
  bank_id: number
}

export interface CreateManualPayoutRequest {
  centerId: string
  amount: number
  transactionIds: string[]
  reason?: string
}

// Admin Methods
export const getAllCenterBalances = async (): Promise<
  t.TDataResponse<CenterBalance[]>
> => {
  return await request.get(endpoints.getAllCenterBalances())
}

export const getCenterBalance = async (
  centerId: string,
): Promise<t.TDataResponse<CenterBalance>> => {
  return await request.get(endpoints.getCenterBalance(centerId))
}

export const createManualPayout = async (
  data: CreateManualPayoutRequest,
): Promise<t.TDataResponse<Payout>> => {
  return await request.post(endpoints.createManualPayout(), data)
}

export const processPayout = async (
  payoutId: string,
): Promise<t.TDataResponse<any>> => {
  return await request.post(endpoints.processPayout(payoutId))
}

export const retryPayout = async (
  payoutId: string,
): Promise<t.TDataResponse<any>> => {
  return await request.post(endpoints.retryPayout(payoutId))
}

export const getPayouts = async (filters?: {
  page?: number
  limit?: number
  centerId?: string
  status?: string
  type?: string
  batchReference?: string
}): Promise<t.TDataResponse<PayoutListResponse>> => {
  return await request.get(endpoints.getPayouts(filters))
}

// Center Methods
export const getCenterPayouts = async (
  centerId: string,
  filters?: {
    page?: number
    limit?: number
    status?: string
  },
): Promise<t.TDataResponse<PayoutListResponse>> => {
  return await request.get(endpoints.getCenterPayouts(centerId, filters))
}

export const getCenterTransactionHistory = async (
  centerId: string,
  filters?: {
    page?: number
    limit?: number
    status?: string
    startDate?: Date
    endDate?: Date
  },
): Promise<t.TDataResponse<CenterTransactionHistoryResponse>> => {
  const params = { ...filters }
  if (params.startDate) {
    // @ts-ignore
    params.startDate = params.startDate.toISOString()
  }
  if (params.endDate) {
    // @ts-ignore
    params.endDate = params.endDate.toISOString()
  }
  return await request.get(endpoints.getCenterTransactions(centerId, params))
}

// Utility Methods
export const getBanks = async (): Promise<t.TDataResponse<Bank[]>> => {
  return await request.get(endpoints.getBanks())
}

export const verifyAccount = async (
  accountNumber: string,
  bankCode: string,
): Promise<t.TDataResponse<AccountVerification>> => {
  return await request.post(endpoints.verifyAccount(), {
    accountNumber,
    bankCode,
  })
}
