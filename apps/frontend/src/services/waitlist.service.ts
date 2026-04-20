import request from '@/lib/request'
import { getAllWaitlistsSchema } from '@zerocancer/shared/schemas/waitlist.schema'
import type * as t from '@zerocancer/shared/types'
import type { TGetAllWaitlistsResponse } from '@zerocancer/shared/types'
import type { z } from 'zod'
import * as endpoints from './endpoints'

export interface WaitlistMatchingStats {
  pending: number
  matched: number
  recentMatches: number
  campaigns: {
    total: number
    active: number
  }
  lastUpdated: string
}

export interface WaitlistMatchingResult {
  executionTime: number
  timestamp: string
  triggeredBy: {
    adminId: string
    adminEmail: string
  }
}

export interface WaitlistMatchingStatus {
  status: string
  message: string
  timestamp: string
}

// --- General/Admin Waitlist Management ---

export const getAllWaitlists = async (
  params: z.infer<typeof getAllWaitlistsSchema>,
): Promise<TGetAllWaitlistsResponse> => {
  // Validate params using shared Zod schema
  const parsed = getAllWaitlistsSchema.safeParse(params)
  if (!parsed.success) {
    throw new Error('Invalid params for getAllWaitlists')
  }
  const res = await request.get(endpoints.getAllWaitlists(parsed.data))
  return res as TGetAllWaitlistsResponse
}

// --- Admin Waitlist Matching ---

/**
 * Trigger waitlist matching algorithm manually
 */
export const triggerWaitlistMatching = async (): Promise<
  t.TDataResponse<WaitlistMatchingResult>
> => {
  return await request.post(endpoints.triggerWaitlistMatching())
}

/**
 * Get waitlist matching statistics
 */
export const getWaitlistMatchingStats = async (): Promise<
  t.TDataResponse<WaitlistMatchingStats>
> => {
  return await request.get(endpoints.getWaitlistMatchingStats())
}

/**
 * Get waitlist matching service status
 */
export const getWaitlistMatchingStatus = async (): Promise<
  t.TDataResponse<WaitlistMatchingStatus>
> => {
  return await request.get(endpoints.getWaitlistMatchingStatus())
}
