import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'

export const activateAgent = async () => {
  return request.post(endpoints.activateAgent(), {})
}

export const getAgentMe = async () => {
  return request.get(endpoints.getAgentMe())
}

export const updateAgentBank = async (data: {
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
}) => {
  return request.patch(endpoints.updateAgentBank(), data)
}

export const createAgentInvite = async (data: {
  invitePhone?: string
  inviteEmail?: string
  inviteName?: string
}) => {
  return request.post(endpoints.createAgentInvite(), data)
}

export const agentCashout = async (amount: number) => {
  return request.post(endpoints.agentCashout(), { amount })
}

export const lookupReferral = async (code: string) => {
  return request.get(endpoints.lookupReferral(code))
}

export const acceptReferral = async (data: {
  code: string
  commissionAllowed?: boolean
  preferredCenterId?: string | null
}) => {
  return request.post(endpoints.acceptReferral(), data)
}

export const updateReferralConsent = async (data: {
  commissionAllowed: boolean
  preferredCenterId?: string | null
}) => {
  return request.patch(endpoints.updateReferralConsent(), data)
}

export const getMyReferral = async () => {
  return request.get(endpoints.getMyReferral())
}

export const listSavingsPlans = async () => {
  return request.get(endpoints.listSavingsPlans())
}

export const createSavingsPlan = async (data: {
  screeningTypeId: string
  preferredCenterId?: string | null
  targetAmount?: number
}) => {
  return request.post(endpoints.createSavingsPlan(), data)
}

export const depositSavings = async (id: string, amount: number) => {
  return request.post(endpoints.depositSavings(id), { amount })
}

export const verifySavingsDeposit = async (ref: string) => {
  return request.get(endpoints.verifySavingsDeposit(ref))
}

export const adminListAgents = async () => {
  return request.get(endpoints.adminListAgents())
}

export const adminListCommissions = async () => {
  return request.get(endpoints.adminListCommissions())
}

export const adminListSavings = async () => {
  return request.get(endpoints.adminListSavings())
}

export const adminSuspendAgent = async (id: string) => {
  return request.post(endpoints.adminSuspendAgent(id), {})
}

export const adminActivateAgent = async (id: string) => {
  return request.post(endpoints.adminActivateAgent(id), {})
}

export const adminVoidCommission = async (id: string) => {
  return request.post(endpoints.adminVoidCommission(id), {})
}
