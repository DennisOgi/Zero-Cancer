/**
 * Payment Validation Utilities
 * 
 * Comprehensive validation for payment amounts, references, and data
 */

// Payment limits (in Naira)
export const PAYMENT_LIMITS = {
  MIN_AMOUNT: 100, // ₦100
  MAX_AMOUNT: 10_000_000, // ₦10M
  MAX_DECIMALS: 2,
  MIN_DONATION: 100, // ₦100
  MAX_DONATION: 5_000_000, // ₦5M
  MIN_CAMPAIGN: 1000, // ₦1,000
  MAX_CAMPAIGN: 10_000_000, // ₦10M
  MIN_APPOINTMENT: 1000, // ₦1,000
  MAX_APPOINTMENT: 500_000, // ₦500K
};

// Cashout limits
export const CASHOUT_LIMITS = {
  MIN_AMOUNT: 1000, // ₦1,000
  MAX_AMOUNT: 1_000_000, // ₦1M per transaction
  DAILY_LIMIT: 5_000_000, // ₦5M per day
  WEEKLY_LIMIT: 20_000_000, // ₦20M per week
  FEE: 10, // ₦10 flat fee
};

/**
 * Validate payment amount
 */
export function validateAmount(
  amount: number,
  type: 'donation' | 'campaign' | 'appointment' | 'general' = 'general'
): { valid: boolean; error?: string } {
  // Check if amount is a number
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  // Check if amount is positive
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  // Check decimal precision (max 2 decimal places)
  if (!Number.isInteger(amount * 100)) {
    return { valid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  // Type-specific validation
  let minAmount: number;
  let maxAmount: number;

  switch (type) {
    case 'donation':
      minAmount = PAYMENT_LIMITS.MIN_DONATION;
      maxAmount = PAYMENT_LIMITS.MAX_DONATION;
      break;
    case 'campaign':
      minAmount = PAYMENT_LIMITS.MIN_CAMPAIGN;
      maxAmount = PAYMENT_LIMITS.MAX_CAMPAIGN;
      break;
    case 'appointment':
      minAmount = PAYMENT_LIMITS.MIN_APPOINTMENT;
      maxAmount = PAYMENT_LIMITS.MAX_APPOINTMENT;
      break;
    default:
      minAmount = PAYMENT_LIMITS.MIN_AMOUNT;
      maxAmount = PAYMENT_LIMITS.MAX_AMOUNT;
  }

  // Check minimum amount
  if (amount < minAmount) {
    return { 
      valid: false, 
      error: `Amount must be at least ₦${minAmount.toLocaleString()}` 
    };
  }

  // Check maximum amount
  if (amount > maxAmount) {
    return { 
      valid: false, 
      error: `Amount cannot exceed ₦${maxAmount.toLocaleString()}` 
    };
  }

  return { valid: true };
}

/**
 * Validate payment reference format
 */
export function validateReference(reference: string): { valid: boolean; error?: string } {
  // Check if reference exists
  if (!reference || typeof reference !== 'string') {
    return { valid: false, error: 'Reference is required' };
  }

  // Check length (reasonable limits)
  if (reference.length < 10 || reference.length > 100) {
    return { valid: false, error: 'Reference length must be between 10 and 100 characters' };
  }

  // Check format (alphanumeric, hyphens, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(reference)) {
    return { valid: false, error: 'Reference contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check length
  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true };
}

/**
 * Validate cashout amount
 */
export function validateCashoutAmount(
  amount: number,
  walletBalance: number
): { valid: boolean; error?: string } {
  // Basic amount validation
  const amountValidation = validateAmount(amount, 'general');
  if (!amountValidation.valid) {
    return amountValidation;
  }

  // Check minimum cashout
  if (amount < CASHOUT_LIMITS.MIN_AMOUNT) {
    return { 
      valid: false, 
      error: `Minimum cashout amount is ₦${CASHOUT_LIMITS.MIN_AMOUNT.toLocaleString()}` 
    };
  }

  // Check maximum cashout
  if (amount > CASHOUT_LIMITS.MAX_AMOUNT) {
    return { 
      valid: false, 
      error: `Maximum cashout amount is ₦${CASHOUT_LIMITS.MAX_AMOUNT.toLocaleString()} per transaction` 
    };
  }

  // Check wallet balance (including fee)
  const totalRequired = amount + CASHOUT_LIMITS.FEE;
  if (walletBalance < totalRequired) {
    return { 
      valid: false, 
      error: `Insufficient balance. Required: ₦${totalRequired.toLocaleString()} (including ₦${CASHOUT_LIMITS.FEE} fee), Available: ₦${walletBalance.toLocaleString()}` 
    };
  }

  return { valid: true };
}

/**
 * Convert Naira to Kobo (for Paystack)
 */
export function nairaToKobo(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert Kobo to Naira
 */
export function koboToNaira(amount: number): number {
  return amount / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate bank account number (Nigerian format)
 */
export function validateBankAccount(accountNumber: string): { valid: boolean; error?: string } {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return { valid: false, error: 'Account number is required' };
  }

  // Nigerian account numbers are 10 digits
  if (!/^\d{10}$/.test(accountNumber)) {
    return { valid: false, error: 'Account number must be exactly 10 digits' };
  }

  return { valid: true };
}

/**
 * Sanitize payment metadata
 * Remove sensitive information before logging
 */
export function sanitizePaymentMetadata(metadata: any): any {
  const sanitized = { ...metadata };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'pin', 'cvv', 'card_number', 'card_cvv'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
