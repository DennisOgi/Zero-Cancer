/**
 * Admin Wallet Migration API
 * 
 * Provides endpoints for migrating wallet balances and verifying consistency.
 * These endpoints should only be accessible to admins.
 */

import { Hono } from 'hono'
import { THonoApp } from '../lib/types'
import { authMiddleware } from '../middleware/auth.middleware'
import { getDB } from '../lib/db'
import type { TDataResponse, TErrorResponse } from '@zerocancer/shared/types'

export const adminWalletMigrationApp = new Hono<THonoApp>()

// Apply admin-only middleware to all routes
adminWalletMigrationApp.use('/*', authMiddleware(['admin']))

/**
 * POST /api/admin/wallet-migration/migrate
 * Run the wallet balance migration
 */
adminWalletMigrationApp.post('/migrate', async (c) => {
  try {
    const db = getDB(c)

    console.log('🚀 Starting wallet balance migration...')

    const result = {
      success: true,
      centersProcessed: 0,
      platformBalance: 0,
      errors: [] as Array<{ centerId: string; error: string }>,
      details: [] as Array<{
        centerId: string
        centerName: string
        totalEarnings: number
        totalPaidOut: number
        finalBalance: number
        transactionCount: number
      }>,
    }

    // Get all active service centers
    const centers = await db.serviceCenter.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        centerName: true,
      },
    })

    console.log(`📊 Found ${centers.length} active service centers`)

    // Process each center
    for (const center of centers) {
      try {
        // Get all completed transactions for this center
        const transactions = await db.transaction.findMany({
          where: {
            status: 'COMPLETED',
            appointments: {
              some: {
                centerId: center.id,
              },
            },
          },
          include: {
            appointments: {
              where: {
                centerId: center.id,
              },
              include: {
                screeningType: true,
              },
            },
          },
        })

        let totalEarnings = 0

        // Calculate center share for each transaction
        for (const transaction of transactions) {
          const appointment = transaction.appointments[0]
          if (!appointment) continue

          // Use price snapshots if available, otherwise use current prices
          const basePrice = appointment.basePriceSnapshot || appointment.screeningType.basePrice
          const retailPrice = appointment.retailPriceSnapshot || appointment.screeningType.retailPrice || transaction.amount

          // Center share is the markup
          const centerShare = retailPrice - basePrice
          totalEarnings += centerShare
        }

        // Calculate total paid out
        const payoutResult = await db.payout.aggregate({
          where: {
            centerId: center.id,
            status: { in: ['SUCCESS', 'PROCESSING'] },
          },
          _sum: {
            amount: true,
          },
        })

        const totalPaidOut = Number(payoutResult._sum.amount) || 0

        // Calculate final balance
        const finalBalance = totalEarnings - totalPaidOut

        // Update center wallet balance
        await db.centerWallet.update({
          where: { centerId: center.id },
          data: { balance: finalBalance },
        })

        console.log(`✅ ${center.centerName}: ₦${finalBalance.toLocaleString()}`)

        result.centersProcessed++
        result.details.push({
          centerId: center.id,
          centerName: center.centerName,
          totalEarnings,
          totalPaidOut,
          finalBalance,
          transactionCount: transactions.length,
        })
      } catch (error) {
        console.error(`❌ Error processing ${center.centerName}:`, error)
        result.errors.push({
          centerId: center.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        result.success = false
      }
    }

    // Calculate platform wallet balance
    const allTransactions = await db.transaction.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        appointments: {
          include: {
            screeningType: true,
          },
        },
      },
    })

    let platformEarnings = 0

    for (const transaction of allTransactions) {
      const appointment = transaction.appointments[0]
      if (!appointment) continue

      const basePrice = appointment.basePriceSnapshot || appointment.screeningType.basePrice
      platformEarnings += basePrice
    }

    // Update platform wallet
    await db.platformWallet.updateMany({
      data: { balance: platformEarnings },
    })

    result.platformBalance = platformEarnings

    console.log(`✅ Platform wallet: ₦${platformEarnings.toLocaleString()}`)
    console.log(`✅ Migration completed! Processed ${result.centersProcessed}/${centers.length} centers`)

    return c.json<TDataResponse<typeof result>>({
      ok: true,
      data: result,
    })
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Migration failed',
      },
      500
    )
  }
})

/**
 * GET /api/admin/wallet-migration/verify
 * Verify wallet balance consistency
 */
adminWalletMigrationApp.get('/verify', async (c) => {
  try {
    const db = getDB(c)

    console.log('🔍 Verifying wallet balance consistency...')

    const issues: Array<{
      centerId: string
      centerName: string
      calculatedBalance: number
      actualBalance: number
      difference: number
    }> = []

    const centers = await db.serviceCenter.findMany({
      where: { status: 'ACTIVE' },
      include: {
        wallet: true,
      },
    })

    for (const center of centers) {
      // Calculate expected balance
      const transactions = await db.transaction.findMany({
        where: {
          status: 'COMPLETED',
          appointments: {
            some: {
              centerId: center.id,
            },
          },
        },
        include: {
          appointments: {
            where: {
              centerId: center.id,
            },
            include: {
              screeningType: true,
            },
          },
        },
      })

      let totalEarnings = 0

      for (const transaction of transactions) {
        const appointment = transaction.appointments[0]
        if (!appointment) continue

        const basePrice = appointment.basePriceSnapshot || appointment.screeningType.basePrice
        const retailPrice = appointment.retailPriceSnapshot || appointment.screeningType.retailPrice || transaction.amount

        const centerShare = retailPrice - basePrice
        totalEarnings += centerShare
      }

      const payoutResult = await db.payout.aggregate({
        where: {
          centerId: center.id,
          status: { in: ['SUCCESS', 'PROCESSING'] },
        },
        _sum: {
          amount: true,
        },
      })

      const totalPaidOut = Number(payoutResult._sum.amount) || 0
      const calculatedBalance = totalEarnings - totalPaidOut
      const actualBalance = center.wallet?.balance || 0

      // Check for discrepancies (allow 1 cent difference)
      const difference = Math.abs(calculatedBalance - actualBalance)
      if (difference > 0.01) {
        console.log(`❌ ${center.centerName}: Expected ₦${calculatedBalance}, Actual ₦${actualBalance}`)
        issues.push({
          centerId: center.id,
          centerName: center.centerName,
          calculatedBalance,
          actualBalance,
          difference,
        })
      } else {
        console.log(`✅ ${center.centerName}: ₦${actualBalance.toLocaleString()}`)
      }
    }

    const consistent = issues.length === 0

    if (consistent) {
      console.log('✅ All wallet balances are consistent!')
    } else {
      console.log(`❌ Found ${issues.length} inconsistencies`)
    }

    return c.json<TDataResponse<{ consistent: boolean; issues: typeof issues }>>({
      ok: true,
      data: {
        consistent,
        issues,
      },
    })
  } catch (error) {
    console.error('❌ Verification failed:', error)
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      },
      500
    )
  }
})

/**
 * GET /api/admin/wallet-migration/status
 * Get current wallet migration status
 */
adminWalletMigrationApp.get('/status', async (c) => {
  try {
    const db = getDB(c)

    // Get platform wallet
    const platformWallet = await db.platformWallet.findFirst()

    // Get all center wallets
    const centerWallets = await db.centerWallet.findMany({
      include: {
        center: {
          select: {
            id: true,
            centerName: true,
            status: true,
          },
        },
      },
      orderBy: {
        balance: 'desc',
      },
    })

    // Calculate totals
    const totalCenterBalance = centerWallets.reduce((sum, w) => sum + w.balance, 0)
    const centersWithBalance = centerWallets.filter((w) => w.balance > 0).length

    return c.json<TDataResponse<{
      platformWallet: typeof platformWallet
      centerWallets: typeof centerWallets
      summary: {
        totalCenterBalance: number
        centersWithBalance: number
        totalCenters: number
      }
    }>>({
      ok: true,
      data: {
        platformWallet,
        centerWallets,
        summary: {
          totalCenterBalance,
          centersWithBalance,
          totalCenters: centerWallets.length,
        },
      },
    })
  } catch (error) {
    console.error('❌ Status check failed:', error)
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Status check failed',
      },
      500
    )
  }
})
