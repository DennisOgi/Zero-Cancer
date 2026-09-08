import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'

export type StaffEarningsResponse = {
  ok: boolean
  data: {
    staff: {
      id: string
      email: string
      fullName?: string | null
      role?: string
      status?: string
      referralCode?: string | null
      bankName?: string | null
      bankCode?: string | null
      accountNumber?: string | null
      accountName?: string | null
      totalEarned?: number
      totalPaidOut?: number
    }
    wallet: { balance?: number }
    shareUrl?: string | null
    shareMessage?: string | null
    referrals: Array<{
      id: string
      inviteCode: string
      name: string
      status: string
      acceptedAt?: string | null
      createdAt?: string
    }>
    commissions: Array<{
      id: string
      amount: number
      status: string
      sourceType?: string
      note?: string | null
    }>
    cashouts: unknown[]
    config: {
      screenCommissionFlat: number
      homeScreenCommissionFlat: number
      nurseReferralCommissionFlat: number
      payoutProvider: string
    }
  }
}

export const getStaffEarnings = async () => {
  return request.get(endpoints.getStaffEarnings()) as Promise<StaffEarningsResponse>
}

export const updateStaffBank = async (data: {
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
}) => {
  return request.patch(endpoints.updateStaffBank(), data)
}

export const staffCashout = async (amount: number) => {
  return request.post(endpoints.staffCashout(), { amount })
}
