/**
 * Wallet Service
 * 
 * Handles all wallet-related operations including:
 * - Platform and center wallet balance queries
 * - Transaction history
 * - Payment splits
 * - Cashout processing
 * 
 * @module wallet.service
 */

import { getDB } from './db';
import type { Context } from 'hono';
import { getPaystackKeys } from './paystack-config';
import { PaystackService } from './paystack.service';
import { getSupabaseClient } from './supabase';

// ============================================
// TYPES
// ============================================

export interface WalletBalance {
  id: string;
  balance: number;
  currency: string;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'CASHOUT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  appointmentId?: string;
  transactionId?: string;
  cashoutId?: string;
  initiatedBy?: string;
  createdAt: Date;
}

export interface PaymentSplitResult {
  success: boolean;
  platformShare: number;
  centerShare: number;
  platformTransactionId: string;
  centerTransactionId?: string;
}

export interface CashoutRequest {
  walletId: string;
  centerId: string;
  amount: number;
  fee: number;
  netAmount: number;
  initiatedBy: string;
}

export interface CashoutRecord {
  id: string;
  walletId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  paystackReference?: string;
  failureReason?: string;
  initiatedBy: string;
  processedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ============================================
// PLATFORM WALLET OPERATIONS
// ============================================

/**
 * Get platform wallet balance
 */
export async function getPlatformWalletBalance(c: Context): Promise<WalletBalance> {
  const wallet = await getDB(c).platformWallet.findFirst({
    select: {
      id: true,
      balance: true,
      currency: true,
      updatedAt: true,
    },
  });

  if (!wallet) {
    throw new Error('Platform wallet not found');
  }

  return wallet;
}

/**
 * Get platform wallet transaction history
 */
export async function getPlatformWalletTransactions(
  c: Context,
  limit: number = 50,
  offset: number = 0,
  startDate?: Date,
  endDate?: Date
): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const wallet = await db(c).platformWallet.findFirst();
  
  if (!wallet) {
    throw new Error('Platform wallet not found');
  }

  const where: any = {
    walletId: wallet.id,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [transactions, total] = await Promise.all([
    db(c).platformWalletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db(c).platformWalletTransaction.count({ where }),
  ]);

  return { transactions, total };
}

/**
 * Get platform wallet statistics
 */
export async function getPlatformWalletStats(
  c: Context,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRevenue: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
}> {
  const wallet = await db(c).platformWallet.findFirst();
  
  if (!wallet) {
    throw new Error('Platform wallet not found');
  }

  const where: any = {
    walletId: wallet.id,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [credits, debits, count] = await Promise.all([
    db(c).platformWalletTransaction.aggregate({
      where: { ...where, type: 'CREDIT' },
      _sum: { amount: true },
    }),
    db(c).platformWalletTransaction.aggregate({
      where: { ...where, type: 'DEBIT' },
      _sum: { amount: true },
    }),
    db(c).platformWalletTransaction.count({ where }),
  ]);

  return {
    totalRevenue: credits._sum.amount || 0,
    totalCredits: credits._sum.amount || 0,
    totalDebits: debits._sum.amount || 0,
    transactionCount: count,
  };
}

// ============================================
// CENTER WALLET OPERATIONS
// ============================================

/**
 * Get center wallet balance
 */
export async function getCenterWalletBalance(c: Context, centerId: string): Promise<WalletBalance> {
  const wallet = await db(c).centerWallet.findUnique({
    where: { centerId },
    select: {
      id: true,
      balance: true,
      currency: true,
      updatedAt: true,
    },
  });

  if (!wallet) {
    throw new Error(`Center wallet not found for center ${centerId}`);
  }

  return wallet;
}

/**
 * Get center wallet transaction history
 */
export async function getCenterWalletTransactions(
  c: Context,
  centerId: string,
  limit: number = 50,
  offset: number = 0,
  startDate?: Date,
  endDate?: Date
): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const wallet = await db(c).centerWallet.findUnique({
    where: { centerId },
  });

  if (!wallet) {
    throw new Error(`Center wallet not found for center ${centerId}`);
  }

  const where: any = {
    walletId: wallet.id,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [transactions, total] = await Promise.all([
    db(c).centerWalletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db(c).centerWalletTransaction.count({ where }),
  ]);

  return { transactions, total };
}

/**
 * Get center wallet statistics
 */
export async function getCenterWalletStats(
  c: Context,
  centerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalEarnings: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
}> {
  const wallet = await db(c).centerWallet.findUnique({
    where: { centerId },
  });

  if (!wallet) {
    throw new Error(`Center wallet not found for center ${centerId}`);
  }

  const where: any = {
    walletId: wallet.id,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [credits, debits, count] = await Promise.all([
    db(c).centerWalletTransaction.aggregate({
      where: { ...where, type: 'CREDIT' },
      _sum: { amount: true },
    }),
    db(c).centerWalletTransaction.aggregate({
      where: { ...where, type: 'DEBIT' },
      _sum: { amount: true },
    }),
    db(c).centerWalletTransaction.count({ where }),
  ]);

  return {
    totalEarnings: credits._sum.amount || 0,
    totalCredits: credits._sum.amount || 0,
    totalDebits: debits._sum.amount || 0,
    transactionCount: count,
  };
}

/**
 * Get all center wallets with balances (for admin dashboard)
 */
export async function getAllCenterWallets(
  c: Context,
  limit: number = 50,
  offset: number = 0
): Promise<{
  wallets: Array<WalletBalance & { centerName: string; centerId: string }>;
  total: number;
}> {
  const [wallets, total] = await Promise.all([
    db(c).centerWallet.findMany({
      include: {
        center: {
          select: {
            id: true,
            centerName: true,
          },
        },
      },
      orderBy: { balance: 'desc' },
      take: limit,
      skip: offset,
    }),
    db(c).centerWallet.count(),
  ]);

  return {
    wallets: wallets.map((w) => ({
      id: w.id,
      balance: w.balance,
      currency: w.currency,
      updatedAt: w.updatedAt,
      centerName: w.center.centerName,
      centerId: w.center.id,
    })),
    total,
  };
}

// ============================================
// PAYMENT SPLIT OPERATIONS
// ============================================

/**
 * Process payment split using database function
 * This should be called after Paystack confirms payment
 */
export async function processPaymentSplit(
  c: Context,
  appointmentId: string,
  transactionId: string,
  basePrice: number,
  retailPrice: number
): Promise<PaymentSplitResult> {
  // Validate prices
  if (retailPrice < basePrice) {
    throw new Error(
      `Retail price (${retailPrice}) cannot be less than base price (${basePrice})`
    );
  }

  // Get Supabase client
  const supabase = getSupabaseClient(c);

  // Call database function using RPC
  const { data, error } = await supabase.rpc('process_payment_split', {
    p_appointment_id: appointmentId,
    p_transaction_id: transactionId,
    p_base_price: basePrice,
    p_retail_price: retailPrice,
  });

  if (error) {
    console.error('Payment split RPC error:', error);
    throw new Error(`Payment split failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Payment split failed - no result returned');
  }

  return {
    success: data.success,
    platformShare: data.platform_share,
    centerShare: data.center_share,
    platformTransactionId: data.platform_transaction_id,
    centerTransactionId: data.center_transaction_id,
  };
}

/**
 * Store price snapshot when booking appointment
 */
export async function storePriceSnapshot(
  c: Context,
  appointmentId: string,
  basePrice: number,
  retailPrice: number
): Promise<void> {
  await db(c).appointment.update({
    where: { id: appointmentId },
    data: {
      basePriceSnapshot: basePrice,
      retailPriceSnapshot: retailPrice,
    },
  });
}

// ============================================
// CASHOUT OPERATIONS
// ============================================

/**
 * Request cashout from center wallet
 */
export async function requestCashout(
  c: Context,
  request: CashoutRequest
): Promise<CashoutRecord> {
  // Validate balance
  const wallet = await db(c).centerWallet.findUnique({
    where: { id: request.walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const totalAmount = request.amount + request.fee;
  if (wallet.balance < totalAmount) {
    throw new Error(
      `Insufficient balance. Available: ${wallet.balance}, Required: ${totalAmount}`
    );
  }

  // Validate minimum cashout amount
  const MIN_CASHOUT = 1000;
  if (request.amount < MIN_CASHOUT) {
    throw new Error(`Minimum cashout amount is ₦${MIN_CASHOUT}`);
  }

  // Create cashout record
  const cashout = await db(c).centerCashout.create({
    data: {
      walletId: request.walletId,
      amount: request.amount,
      fee: request.fee,
      netAmount: request.netAmount,
      status: 'PENDING',
      initiatedBy: request.initiatedBy,
    },
  });

  return cashout;
}

/**
 * Process cashout (debit wallet and initiate transfer)
 */
export async function processCashout(
  c: Context,
  cashoutId: string
): Promise<void> {
  const cashout = await db(c).centerCashout.findUnique({
    where: { id: cashoutId },
    include: {
      wallet: {
        include: {
          center: {
            select: {
              id: true,
              centerName: true,
              bankName: true,
              bankCode: true,
              bankAccount: true,
              accountNumber: true,
              accountName: true,
            },
          },
        },
      },
    },
  });

  if (!cashout) {
    throw new Error('Cashout not found');
  }

  if (cashout.status !== 'PENDING') {
    throw new Error(`Cashout is already ${cashout.status}`);
  }

  // Validate bank details
  if (!cashout.wallet.center.bankName || !cashout.wallet.center.accountNumber) {
    throw new Error('Center bank details not configured. Please update your bank information.');
  }

  // Get Supabase client
  const supabase = getSupabaseClient(c);

  // Debit wallet using database function
  const totalAmount = cashout.amount + cashout.fee;
  
  const { error: debitError } = await supabase.rpc('debit_center_wallet', {
    p_center_id: cashout.wallet.centerId,
    p_amount: totalAmount,
    p_description: 'Cashout to bank account',
    p_cashout_id: cashoutId,
  });

  if (debitError) {
    console.error('Debit wallet RPC error:', debitError);
    throw new Error(`Failed to debit wallet: ${debitError.message}`);
  }

  // Update cashout status to PROCESSING
  await db(c).centerCashout.update({
    where: { id: cashoutId },
    data: {
      status: 'PROCESSING',
      processedAt: new Date(),
    },
  });

  let paystackSecretKey = '';
  try {
    paystackSecretKey = getPaystackKeys(c).secretKey;
  } catch {
    console.warn('Paystack is not configured. Transfer not initiated.');
    return;
  }

  try {
    const paystack = new PaystackService(paystackSecretKey);
    const accountNumber =
      cashout.wallet.center.accountNumber ||
      cashout.wallet.center.bankAccount;
    const bankCode = cashout.wallet.center.bankCode;

    if (!accountNumber) {
      throw new Error(
        'Facility bank details are incomplete. Add an account number first.'
      );
    }

    let resolvedBankCode = bankCode || '';
    if (!resolvedBankCode) {
      const banks = await paystack.getBanks();
      const bank = banks.find(
        (item) =>
          item.name.toLowerCase() ===
          cashout.wallet.center.bankName?.toLowerCase()
      );
      resolvedBankCode = bank?.code || '';
    }

    if (!resolvedBankCode) {
      throw new Error(
        'Could not resolve a Paystack bank code for this facility.'
      );
    }

    const accountVerification = await paystack.verifyAccountNumber(
      accountNumber,
      resolvedBankCode
    );
    const recipient = await paystack.createRecipient({
      type: 'nuban',
      name: accountVerification.account_name,
      account_number: accountNumber,
      bank_code: resolvedBankCode,
      currency: 'NGN',
    });
    const transfer = await paystack.initiateTransfer({
      source: 'balance',
      amount: Math.round(cashout.netAmount * 100),
      recipient: recipient.recipient_code,
      reason: `Cashout for ${cashout.wallet.center.centerName}`,
      reference: `cashout_${cashoutId}`,
    });

    await db(c).centerCashout.update({
      where: { id: cashoutId },
      data: {
        paystackReference: transfer.reference,
      },
    });
  } catch (error) {
    console.error('Paystack cashout transfer error:', error);

    await db(c).centerCashout.update({
      where: { id: cashoutId },
      data: {
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    const { error: refundError } = await supabase.rpc('credit_center_wallet', {
      p_center_id: cashout.wallet.centerId,
      p_amount: totalAmount,
      p_description: 'Cashout failed - refund',
      p_cashout_id: cashoutId,
    });

    if (refundError) {
      console.error('CRITICAL: Failed to refund wallet after cashout failure:', refundError);
    }

    throw error;
  }
}

export async function settleCenterCashoutFromPaystack(
  c: Context,
  payload: { event?: string; data?: { reference?: string } }
) {
  const reference = payload?.data?.reference;
  const event = payload?.event || '';
  if (!reference || !event.startsWith('transfer.')) {
    return { handled: false };
  }

  return settleCenterCashoutFromFlutterwave(c, {
    reference,
    status:
      event === 'transfer.success'
        ? 'SUCCESS'
        : event === 'transfer.failed' || event === 'transfer.reversed'
          ? 'FAILED'
          : event,
  });
}

export async function settleCenterCashoutFromFlutterwave(
  c: Context,
  payload: { reference?: string; status?: string; id?: string | number }
) {
  const reference = payload?.reference;
  if (!reference) return { handled: false };

  const cashout = await db(c).centerCashout.findFirst({
    where: {
      OR: [
        { paystackReference: reference },
        { id: reference.replace(/^cashout_/, '') },
      ],
    },
  });
  if (!cashout) return { handled: false };
  if (cashout.status === 'SUCCESS' || cashout.status === 'FAILED') {
    return { handled: true, alreadySettled: true };
  }

  const status = String(payload.status || '').toUpperCase();
  if (status === 'SUCCESSFUL' || status === 'SUCCESS') {
    await updateCashoutStatus(c, cashout.id, 'SUCCESS', reference);
    return { handled: true, status: 'SUCCESS' };
  }
  if (status === 'FAILED' || status === 'FAILURE') {
    await updateCashoutStatus(
      c,
      cashout.id,
      'FAILED',
      reference,
      'Bank transfer failed'
    );
    return { handled: true, status: 'FAILED' };
  }
  return { handled: true, status: cashout.status };
}

/**
 * Get cashout history for a center
 */
export async function getCenterCashouts(
  c: Context,
  centerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ cashouts: CashoutRecord[]; total: number }> {
  const wallet = await db(c).centerWallet.findUnique({
    where: { centerId },
  });

  if (!wallet) {
    throw new Error(`Center wallet not found for center ${centerId}`);
  }

  const [cashouts, total] = await Promise.all([
    db(c).centerCashout.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db(c).centerCashout.count({ where: { walletId: wallet.id } }),
  ]);

  return { cashouts, total };
}

/**
 * Update cashout status (called by Paystack webhook)
 */
export async function updateCashoutStatus(
  c: Context,
  cashoutId: string,
  status: 'SUCCESS' | 'FAILED',
  paystackReference?: string,
  failureReason?: string
): Promise<void> {
  await db(c).centerCashout.update({
    where: { id: cashoutId },
    data: {
      status,
      paystackReference,
      failureReason,
      completedAt: new Date(),
    },
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get wallet balance by wallet ID
 */
export async function getWalletBalanceById(
  c: Context,
  walletId: string,
  type: 'platform' | 'center'
): Promise<number> {
  if (type === 'platform') {
    const wallet = await db(c).platformWallet.findFirst({
      select: { balance: true },
    });
    return wallet?.balance || 0;
  } else {
    const wallet = await db(c).centerWallet.findUnique({
      where: { id: walletId },
      select: { balance: true },
    });
    return wallet?.balance || 0;
  }
}

/**
 * Verify wallet balance consistency
 * Useful for debugging and auditing
 */
export async function verifyWalletBalance(
  c: Context,
  walletId: string,
  type: 'platform' | 'center'
): Promise<{ isConsistent: boolean; calculatedBalance: number; actualBalance: number }> {
  let transactions: any[];
  let actualBalance: number;

  if (type === 'platform') {
    const wallet = await db(c).platformWallet.findFirst({
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!wallet) {
      throw new Error('Platform wallet not found');
    }

    transactions = wallet.transactions;
    actualBalance = wallet.balance;
  } else {
    const wallet = await db(c).centerWallet.findUnique({
      where: { id: walletId },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!wallet) {
      throw new Error('Center wallet not found');
    }

    transactions = wallet.transactions;
    actualBalance = wallet.balance;
  }

  // Calculate balance from transactions
  let calculatedBalance = 0;
  for (const tx of transactions) {
    if (tx.type === 'CREDIT') {
      calculatedBalance += tx.amount;
    } else if (tx.type === 'DEBIT' || tx.type === 'CASHOUT') {
      calculatedBalance -= tx.amount;
    }
  }

  return {
    isConsistent: Math.abs(calculatedBalance - actualBalance) < 0.01, // Allow for floating point errors
    calculatedBalance,
    actualBalance,
  };
}
