import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'

export const getKitStats = async () => {
  return request.get(endpoints.getKitStats()) as Promise<{
    ok: boolean
    data: {
      AVAILABLE: number
      USED: number
      DAMAGED: number
      TOTAL: number
    }
  }>
}

export const getKits = async (params?: {
  page?: number
  pageSize?: number
  status?: string
  search?: string
}) => {
  return request.get(endpoints.getKits(params)) as Promise<{
    ok: boolean
    data: {
      kits: Array<{
        id: string
        serialNumber: string
        status: string
        batchNumber?: string | null
        receivedAt?: string
        screeningType?: { name?: string }
      }>
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }>
}

export const getKitOrders = async () => {
  return request.get(endpoints.getKitOrders()) as Promise<{
    ok: boolean
    data: {
      orders: Array<{
        id: string
        screeningTypeId: string
        screeningTypeName?: string
        requestedQuantity: number
        urgency: string
        status: string
        reason?: string | null
        requestedAt: string
      }>
    }
  }>
}

export const createKitOrder = async (data: {
  screeningTypeId: string
  quantity: number
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string
}) => {
  return request.post(endpoints.createKitOrder(), data)
}
