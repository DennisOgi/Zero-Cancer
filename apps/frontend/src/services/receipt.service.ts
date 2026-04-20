import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import {
  CreateReceiptRequestSchema,
  ResendReceiptRequestSchema,
} from '@zerocancer/shared/schemas/receipt.schema'
import type {
  TCreateReceiptResponse,
  TReceiptResponse,
  TResendReceiptResponse,
} from '@zerocancer/shared/types'
import type { z } from 'zod'

/**
 * Receipt Service - handles all receipt-related API calls using the established project patterns
 *
 * Usage in components:
 * - Import these functions for use with React Query through the receipt provider
 * - Always use the receipt provider hooks for better state management and caching
 */

/**
 * Get receipt data for a transaction
 *
 * @example
 * // Use through the provider:
 * const { data: receipt } = useReceiptQuery(transactionId);
 */
export const getReceipt = async (
  transactionId: string,
): Promise<TReceiptResponse> => {
  return await request.get(endpoints.getReceiptV1(transactionId))
}

/**
 * Download receipt PDF
 * Returns a blob that can be used to download or display the PDF
 *
 * @example
 * // Use through the provider:
 * const downloadPDF = useDownloadReceiptPDF();
 * const handleDownloadPDF = () => {
 *   downloadPDF.mutate(transactionId, {
 *     onSuccess: (blob) => {
 *       const url = URL.createObjectURL(blob);
 *       const a = document.createElement('a');
 *       a.href = url;
 *       a.download = `receipt-${transactionId}.pdf`;
 *       a.click();
 *       URL.revokeObjectURL(url);
 *     }
 *   });
 * };
 */
export const downloadReceiptPDF = async (
  transactionId: string,
): Promise<Blob> => {
  // Note: For blob responses, we need to handle this differently than JSON responses
  const response = await fetch(endpoints.downloadReceiptPDF(transactionId), {
    method: 'GET',
    credentials: 'include', // Include cookies for authentication
  })

  if (!response.ok) {
    throw new Error(`Failed to download receipt PDF: ${response.statusText}`)
  }

  return response.blob()
}

/**
 * Create or regenerate a receipt
 *
 * @example
 * // Use through the provider:
 * const createReceipt = useCreateReceipt();
 * createReceipt.mutate({ transactionId, emailRecipient: 'user@example.com' });
 */
export const createReceipt = async (
  data: z.infer<typeof CreateReceiptRequestSchema>,
): Promise<TCreateReceiptResponse> => {
  return await request.post(endpoints.createReceiptV1(data.transactionId), data)
}

/**
 * Resend receipt via email
 *
 * @example
 * // Use through the provider:
 * const resendReceipt = useResendReceipt();
 * resendReceipt.mutate({ transactionId, emailRecipient: 'user@example.com' });
 */
export const resendReceipt = async (
  transactionId: string,
  data: z.infer<typeof ResendReceiptRequestSchema>,
): Promise<TResendReceiptResponse> => {
  return await request.post(endpoints.resendReceipt(transactionId), data)
}

/**
 * List receipts with pagination and filters
 *
 * @example
 * // Use through the provider:
 * const { data: receipts } = useReceiptsQuery({ page: 1, limit: 20, type: 'APPOINTMENT' });
 */
// export const listReceipts = async (
//   params: Partial<z.infer<typeof ReceiptListQuerySchema>> = {},
// ): Promise<TReceiptListResponse> => {
//   return await request.get(endpoints.listReceiptsV1(params))
// }

/**
 * Utility functions for working with receipts
 */
export const receiptUtils = {
  /**
   * Format receipt amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  },

  /**
   * Format receipt date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  },

  /**
   * Get receipt type display name
   */
  getTypeDisplayName(type: string): string {
    switch (type) {
      case 'APPOINTMENT':
        return 'Appointment Payment'
      case 'DONATION':
        return 'Donation'
      case 'PAYOUT':
        return 'Payout'
      case 'REFUND':
        return 'Refund'
      default:
        return type
    }
  },

  /**
   * Check if receipt is tax deductible
   */
  isTaxDeductible(receiptData: {
    type: string
    taxDeductible?: boolean
  }): boolean {
    return receiptData.type === 'DONATION' && receiptData.taxDeductible === true
  },

  /**
   * Generate receipt summary text
   */
  getReceiptSummary(receiptData: {
    amount: number
    type: string
    date: string
  }): string {
    const amount = this.formatAmount(receiptData.amount)
    const type = this.getTypeDisplayName(receiptData.type)
    const date = this.formatDate(receiptData.date)

    return `${type} of ${amount} on ${date}`
  },
}
