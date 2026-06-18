/**
 * Wallet Balance Migration Script
 * 
 * This script migrates existing transaction data to populate wallet balances.
 * It calculates:
 * 1. Center earnings from completed transactions
 * 2. Subtracts already paid out amounts
 * 3. Updates center wallet balances
 * 4. Calculates platform wallet balance
 * 
 * Run this script ONCE after deploying the wallet system.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface MigrationResult {
  success: boolean
  centersProcessed: number
  platformBalance: number
  errors: Array<{ centerId: string; error: string }>
  details: Array<{
    centerId: string
    centerName: string
    totalEarnings: number
    totalPaidOut: number
    finalBalance: number
    transactionCount: number
  }>
}

/**
 * Calculate center earnings from existing transactions
 */
async function calculateCenterEarnings(centerId: string): Promise<{
  totalEarnings: number
  transactionCount: number
}> {
  // Get all completed transactions for this center
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'COMPLETED',
      appointments: {
        some: {
          centerId: centerId,
        },
      },
    },
    include: {
      appointments: {
        where: {
          centerId: centerId,
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

    // Center share is the markup (retailPrice - basePrice)
    const centerShare = retailPrice - basePrice
    totalEarnings += centerShare
  }

  return {
    totalEarnings,
    transactionCount: transactions.length,
  }
}

/**
 * Calculate total paid out to center
 */
async function calculateTotalPaidOut(centerId: string): Promise<number> {
  const result = await prisma.payout.aggregate({
    where: {
      centerId,
      status: { in: ['SUCCESS', 'PROCESSING'] },
    },
    _sum: {
      amount: true,
    },
  })

  return Number(result._sum.amount) || 0
}

/**
 * Calculate platform earnings from all transactions
 */
async function calculatePlatformEarnings(): Promise<number> {
  // Get all completed transactions
  const transactions = await prisma.transaction.findMany({
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

  let totalPlatformEarnings = 0

  // Calculate platform share for each transaction
  for (const transaction of transactions) {
    const appointment = transaction.appointments[0]
    if (!appointment) continue

    // Use price snapshots if available, otherwise use current prices
    const basePrice = appointment.basePriceSnapshot || appointment.screeningType.basePrice

    // Platform share is the base price
    totalPlatformEarnings += basePrice
  }

  return totalPlatformEarnings
}

/**
 * Main migration function
 */
export async function migrateWalletBalances(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    centersProcessed: 0,
    platformBalance: 0,
    errors: [],
    details: [],
  }

  console.log('🚀 Starting wallet balance migration...\n')

  try {
    // Get all active service centers
    const centers = await prisma.serviceCenter.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        centerName: true,
      },
    })

    console.log(`📊 Found ${centers.length} active service centers\n`)

    // Process each center
    for (const center of centers) {
      try {
        console.log(`Processing ${center.centerName}...`)

        // Calculate earnings
        const { totalEarnings, transactionCount } = await calculateCenterEarnings(center.id)
        console.log(`  - Total earnings: ₦${totalEarnings.toLocaleString()}`)
        console.log(`  - Transactions: ${transactionCount}`)

        // Calculate paid out
        const totalPaidOut = await calculateTotalPaidOut(center.id)
        console.log(`  - Already paid out: ₦${totalPaidOut.toLocaleString()}`)

        // Calculate final balance
        const finalBalance = totalEarnings - totalPaidOut
        console.log(`  - Final balance: ₦${finalBalance.toLocaleString()}`)

        // Update center wallet balance
        await prisma.centerWallet.update({
          where: { centerId: center.id },
          data: { balance: finalBalance },
        })

        console.log(`  ✅ Wallet updated\n`)

        result.centersProcessed++
        result.details.push({
          centerId: center.id,
          centerName: center.centerName,
          totalEarnings,
          totalPaidOut,
          finalBalance,
          transactionCount,
        })
      } catch (error) {
        console.error(`  ❌ Error processing ${center.centerName}:`, error)
        result.errors.push({
          centerId: center.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        result.success = false
      }
    }

    // Calculate and update platform wallet balance
    console.log('\n📊 Calculating platform wallet balance...')
    const platformEarnings = await calculatePlatformEarnings()
    console.log(`  - Total platform earnings: ₦${platformEarnings.toLocaleString()}`)

    await prisma.platformWallet.updateMany({
      data: { balance: platformEarnings },
    })

    result.platformBalance = platformEarnings
    console.log(`  ✅ Platform wallet updated\n`)

    // Print summary
    console.log('=' .repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('=' .repeat(60))
    console.log(`Centers processed: ${result.centersProcessed}/${centers.length}`)
    console.log(`Platform balance: ₦${result.platformBalance.toLocaleString()}`)
    console.log(`Errors: ${result.errors.length}`)
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:')
      result.errors.forEach((err) => {
        console.log(`  - ${err.centerId}: ${err.error}`)
      })
    }

    console.log('\n✅ Migration completed!')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ Migration failed:', error)
    result.success = false
    throw error
  } finally {
    await prisma.$disconnect()
  }

  return result
}

/**
 * Verify wallet balance consistency
 */
export async function verifyWalletBalances(): Promise<{
  consistent: boolean
  issues: Array<{
    centerId: string
    centerName: string
    calculatedBalance: number
    actualBalance: number
    difference: number
  }>
}> {
  console.log('🔍 Verifying wallet balance consistency...\n')

  const issues: Array<{
    centerId: string
    centerName: string
    calculatedBalance: number
    actualBalance: number
    difference: number
  }> = []

  const centers = await prisma.serviceCenter.findMany({
    where: { status: 'ACTIVE' },
    include: {
      wallet: true,
    },
  })

  for (const center of centers) {
    // Calculate expected balance
    const { totalEarnings } = await calculateCenterEarnings(center.id)
    const totalPaidOut = await calculateTotalPaidOut(center.id)
    const calculatedBalance = totalEarnings - totalPaidOut

    // Get actual balance
    const actualBalance = center.wallet?.balance || 0

    // Check for discrepancies (allow 1 cent difference for floating point errors)
    const difference = Math.abs(calculatedBalance - actualBalance)
    if (difference > 0.01) {
      console.log(`❌ ${center.centerName}:`)
      console.log(`   Expected: ₦${calculatedBalance.toLocaleString()}`)
      console.log(`   Actual: ₦${actualBalance.toLocaleString()}`)
      console.log(`   Difference: ₦${difference.toLocaleString()}\n`)

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

  await prisma.$disconnect()

  if (issues.length === 0) {
    console.log('\n✅ All wallet balances are consistent!')
  } else {
    console.log(`\n❌ Found ${issues.length} inconsistencies`)
  }

  return {
    consistent: issues.length === 0,
    issues,
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateWalletBalances()
    .then(() => {
      console.log('\n🔍 Running verification...\n')
      return verifyWalletBalances()
    })
    .then((verification) => {
      if (verification.consistent) {
        process.exit(0)
      } else {
        console.error('\n⚠️  Verification found issues. Please review.')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
