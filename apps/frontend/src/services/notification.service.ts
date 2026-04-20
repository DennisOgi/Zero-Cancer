import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import { notificationSchema } from '@zerocancer/shared/schemas/notification.schema'
import type {
  TCreateNotificationResponse,
  TGetNotificationsResponse,
  TMarkNotificationReadResponse,
} from '@zerocancer/shared/types'
import type { z } from 'zod'

export const getNotifications =
  async (): Promise<TGetNotificationsResponse> => {
    const res = await request.get(endpoints.getNotifications())
    return res as TGetNotificationsResponse
  }

export const markNotificationRead = async (
  id: string,
): Promise<TMarkNotificationReadResponse> => {
  const res = await request.post(endpoints.markNotificationRead(id))
  return res as TMarkNotificationReadResponse
}

export const createNotification = async (
  data: z.infer<typeof notificationSchema>,
): Promise<TCreateNotificationResponse> => {
  // Validate data using shared Zod schema
  const parsed = notificationSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error('Invalid data for createNotification')
  }
  const res = await request.post(endpoints.createNotification(), parsed.data)
  return res as TCreateNotificationResponse
}
