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
        kitProduct?: string | null
        kitProductName?: string | null
      }>
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }>
}

export type TEoiInvoice = {
  type: string
  title: string
  invoiceNumber: string
  issuedAt: string
  priceNote: string
  footerNote: string
  lines: Array<{
    kitProduct: string
    name: string
    shortName?: string | null
    quantity: number
    unitLabel?: string
    priceDisplay: string
  }>
  buyer: {
    name: string
    email?: string | null
    phone?: string | null
    address?: string
  }
}

export type TKitOrder = {
  id: string
  screeningTypeId: string
  screeningTypeName?: string
  kitProduct?: string | null
  kitProductName?: string | null
  invoiceNumber?: string | null
  requestedQuantity: number
  urgency: string
  status: string
  reason?: string | null
  reviewNotes?: string | null
  reviewedAt?: string | null
  requestedAt: string
}

export const getKitOrders = async () => {
  return request.get(endpoints.getKitOrders()) as Promise<{
    ok: boolean
    data: {
      orders: TKitOrder[]
    }
  }>
}

export const getKitOrderInvoice = async (invoiceNumber: string) => {
  return request.get(endpoints.getKitOrderInvoice(invoiceNumber)) as Promise<{
    ok: boolean
    data: { invoice: TEoiInvoice; orders: TKitOrder[] }
  }>
}

export const cancelKitOrder = async (id: string) => {
  return request.post(endpoints.cancelKitOrder(id), {})
}

export type TAdminKitOrder = {
  id: string
  centerId: string
  screeningTypeId: string
  screeningTypeName: string
  kitProduct?: string | null
  kitProductName?: string | null
  invoiceNumber?: string | null
  requestedQuantity: number
  urgency: string
  status: string
  reason?: string | null
  requestedBy: string
  requestedAt: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewNotes?: string | null
  center: {
    id: string
    centerName: string
    state?: string
    lga?: string
    phone?: string | null
    email?: string
  } | null
}

export const getAdminKitOrders = async (params?: { status?: string }) => {
  return request.get(endpoints.adminKitOrders(params)) as Promise<{
    ok: boolean
    data: { orders: TAdminKitOrder[] }
  }>
}

export const updateAdminKitOrder = async ({
  id,
  ...data
}: {
  id: string
  status: 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'REJECTED'
  reviewNotes?: string
  trackingNumber?: string
  batchNumber?: string
  serialNumbers?: string[]
}) => {
  return request.patch(endpoints.adminKitOrder(id), data) as Promise<{
    ok: boolean
    data: { kitsAdded: number }
  }>
}

export const createKitOrder = async (data: {
  screeningTypeId?: string
  items?: Array<{ kitProduct: string; quantity: number }>
  kitProduct?: string
  quantity?: number
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string
}) => {
  return request.post(endpoints.createKitOrder(), data)
}
