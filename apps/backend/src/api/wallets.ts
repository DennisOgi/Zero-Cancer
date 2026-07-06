/**
 * Wallet API Routes
 * 
 * Handles wallet operations for platform and service centers:
 * - Platform wallet queries
 * - Center wallet queries
 * - Transaction history
 * - Cashout requests
 * - Payment splits
 */

import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getDB } from '../lib/db'
import { THonoApp } from '../lib/types'
import { authMiddleware } from '../middleware/auth.middleware'
import * as walletService from '../lib/wallet.service'
import type {
  TDataResponse,
  TErrorResponse,
} from '@zerocancer/shared/types'

export const walletApp = new Hono<THonoApp>()

// ============================================
// VALIDATION SCHEMAS
// ============================================

const getCenterWalletSchema = z.object({
  centerId: z.string().uuid(),
})

const getTransactionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const requestCashoutSchema = z.object({
  amount: z.number().min(1000, 'Minimum cashout amount is ₦1,000'),
  fee: z.number().default(10),
})

const updateCashoutStatusSchema = z.object({
  status: z.enum(['SUCCESS', 'FAILED']),
  paystackReference: z.string().optional(),
  failureReason: z.string().optional(),
})

// ============================================
// PLATFORM WALLET ROUTES (Admin Only)
// ============================================

// GET /api/wallets/platform - Get platform wallet balance
walletApp.get(
  '/platform',
  authMiddleware(['admin']),
  async (c) => {
    try {
      const balance = await walletService.getPlatformWalletBalance(c)

      return c.json<TDataResponse<typeof balance>>({
        ok: true,
        data: balance,
      })
    } catch (error) {
      console.error('Error fetching platform wallet:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to fetch platform wallet' },
        500
      )
    }
  }
)

// GET /api/wallets/platform/transactions - Get platform transaction history
walletApp.get(
  '/platform/transactions',
  authMiddleware(['admin']),
  zValidator('query', getTransactionsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { page, pageSize, startDate, endDate } = c.req.valid('query')
      const offset = (page - 1) * pageSize

      const result = await walletService.getPlatformWalletTransactions(
        c,
        pageSize,
        offset,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )

      return c.json<TDataResponse<typeof result>>({
        ok: true,
        data: {
          ...result,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
        },
      })
    } catch (error) {
      console.error('Error fetching platform transactions:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to fetch transactions' },
        500
      )
    }
  }
)

// GET /api/wallets/platform/stats - Get platform wallet statistics
walletApp.get(
  '/platform/stats',
  authMiddleware(['admin']),
  zValidator('query', z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }), (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { startDate, endDate } = c.req.valid('query')

      const stats = await walletService.getPlatformWalletStats(
        c,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )

      return c.json<TDataResponse<typeof stats>>({
        ok: true,
        data: stats,
      })
    } catch (error) {
      console.error('Error fetching platform stats:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to fetch statistics' },
        500
      )
    }
  }
)

// ============================================
// CENTER WALLET ROUTES
// ============================================

// GET /api/wallets/center/:centerId - Get center wallet balance
walletApp.get(
  '/center/:centerId',
  authMiddleware(['center', 'center_staff', 'admin']),
  zValidator('param', getCenterWalletSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { centerId } = c.req.valid('param')
      const payload = c.get('jwtPayload')

      // Verify access: centers can only access their own wallet
      const profile = payload?.profile as string | undefined
      const isCenterScopedUser =
        profile === 'CENTER' || profile === 'CENTER_STAFF'
      if (isCenterScopedUser && payload.id !== centerId) {
        return c.json<TErrorResponse>(
          { ok: false, error: 'Access denied' },
          403
        )
      }

      const balance = await walletService.getCenterWalletBalance(c, centerId)

      return c.json<TDataResponse<typeof balance>>({
        ok: true,
        data: balance,
      })
    } catch (error) {
      console.error('Error fetching center wallet:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to fetch wallet' },
        500
      )
    }
  }
)

// GET /api/wallets/center/:centerId/transactions - Get center transaction history
walletApp.get(
  '/center/:centerId/transactions',
  authMiddleware(['center', 'center_staff', 'admin']),
  zValidator('param', getCenterWalletSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  zValidator('query', getTransactionsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { centerId } = c.req.valid('param')
      const { page, pageSize, startDate, endDate } = c.req.valid('query')
      const payload = c.get('jwtPayload')

      // Verify access
      const profile = payload?.profile as string | undefined
      const isCenterScopedUser =
        profile === 'CENTER' || profile === 'CENTER_STAFF'
      if (isCenterScopedUser && payload.id !== centerId) {
        return c.json<TErrorResponse>(
          { ok: false, error: 'Access denied' },
          403
        )
      }

      const offset = (page - 1) * pageSize

      const result = await walletService.getCenterWalletTransactions(
        c,
        centerId,
        pageSize,
        offset,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )

      return c.json<TDataResponse<typeof result>>({
        ok: true,
        data: {
          ...result,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
        },
      })
    } catch (error) {
      console.error('Error fetching center transactions:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to fetch transactions' },
        500
      )
    }
  }
)

// GET /api/wallets/center/:centerId/stats - Get center wallet statistics
walletApp.get(
  '/center/:centerId/stats',
  authMiddleware(['center', 'center_staff', 'admin']),
  zValidator('param', getCenterWalletSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  zValidator('query', z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }), (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { centerId } = c.req.valid('param')
      const { startDate, endDate } = c.req.valid('query')
      const payload = c.get('jwtPayload')

      // Verify access
      const profile = payload?.profile as string | undefined
      const isCenterScopedUser =
        profile === 'CENTER' || profile === 'CENTER_STAFF'
      if (isCenterScopedUser && payload.id !== centerId) {
        return c.json<TErrorResponse>(
          { ok: false, error: 'Access denied' },
          403
        )
      }

      const stats = await walletService.getCenterWalletStats(
        c,
        centerId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )

      return c.json<TDataResponse<typeof stats>>({
        ok: true,
        data: stats,
      })
    } catch (error) {
      console.error('Error fetching center stats:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to fetch statistics' },
        500
      )
    }
  }
)

// POST /api/wallets/center/:centerId/cashout - Request cashout
walletApp.post(
  '/center/:centerId/cashout',
  authMiddleware(['center', 'center_staff']),
  zValidator('param', getCenterWalletSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  zValidator('json', requestCashoutSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { centerId } = c.req.valid('param')
      const { amount, fee } = c.req.valid('json')
      const payload = c.get('jwtPayload')

      // Verify access
      if (payload?.id !== centerId) {
        return c.json<TErrorResponse>(
          { ok: false, error: 'Access denied' },
          403
        )
      }

      // Get wallet
      const wallet = await walletService.getCenterWalletBalance(c, centerId)

      // Calculate net amount
      const netAmount = amount - fee

      // Request cashout
      const cashout = await walletService.requestCashout(c, {
        walletId: wallet.id,
        centerId,
        amount,
        fee,
        netAmount,
        initiatedBy: payload.id!,
      })

      // Get Paystack secret key from environment
      const db = getDB(c)
      const paystackSecretKey = c.env?.PAYSTACK_SECRET_KEY

      // Process cashout (debit wallet and initiate transfer)
      await walletService.processCashout(c, cashout.id, paystackSecretKey)

      return c.json<TDataResponse<typeof cashout>>({
        ok: true,
        data: cashout,
      })
    } catch (error: any) {
      console.error('Error requesting cashout:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: error.message || 'Failed to request cashout' },
        400
      )
    }
  }
)

// GET /api/wallets/center/:centerId/cashouts - Get cashout history
walletApp.get(
  '/center/:centerId/cashouts',
  authMiddleware(['center', 'center_staff', 'admin']),
  zValidator('param', getCenterWalletSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  zValidator('query', z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(50),
  }), (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { centerId } = c.req.valid('param')
      const { page, pageSize } = c.req.valid('query')
      const payload = c.get('jwtPayload')

      // Verify access
      const profile = payload?.profile as string | undefined
      const isCenterScopedUser =
        profile === 'CENTER' || profile === 'CENTER_STAFF'
      if (isCenterScopedUser && payload.id !== centerId) {
        return c.json<TErrorResponse>(
          { ok: false, error: 'Access denied' },
          403
        )
      }

      const offset = (page - 1) * pageSize

      const result = await walletService.getCenterCashouts(
        c,
        centerId,
        pageSize,
        offset
      )

      return c.json<TDataResponse<typeof result>>({
        ok: true,
        data: {
          ...result,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
        },
      })
    } catch (error) {
      console.error('Error fetching cashouts:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to fetch cashouts' },
        500
      )
    }
  }
)

// ============================================
// ADMIN ROUTES
// ============================================

// GET /api/wallets/centers - Get all center wallets (admin only)
walletApp.get(
  '/centers',
  authMiddleware(['admin']),
  zValidator('query', z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(50),
  }), (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { page, pageSize } = c.req.valid('query')
      const offset = (page - 1) * pageSize

      const result = await walletService.getAllCenterWallets(c, pageSize, offset)

      return c.json<TDataResponse<typeof result>>({
        ok: true,
        data: {
          ...result,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
        },
      })
    } catch (error) {
      console.error('Error fetching center wallets:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to fetch center wallets' },
        500
      )
    }
  }
)

// ============================================
// WEBHOOK ROUTES
// ============================================

// POST /api/wallets/webhook/cashout/:cashoutId - Update cashout status (Paystack webhook)
walletApp.post(
  '/webhook/cashout/:cashoutId',
  zValidator('param', z.object({ cashoutId: z.string().uuid() }), (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  zValidator('json', updateCashoutStatusSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400)
  }),
  async (c) => {
    try {
      const { cashoutId } = c.req.valid('param')
      const { status, paystackReference, failureReason } = c.req.valid('json')

      // TODO: Verify Paystack webhook signature

      await walletService.updateCashoutStatus(
        c,
        cashoutId,
        status,
        paystackReference,
        failureReason
      )

      return c.json<TDataResponse<{ cashoutId: string; status: string }>>({
        ok: true,
        data: { cashoutId, status },
      })
    } catch (error) {
      console.error('Error updating cashout status:', error)
      return c.json<TErrorResponse>(
        { ok: false, error: 'Failed to update cashout status' },
        500
      )
    }
  }
)
