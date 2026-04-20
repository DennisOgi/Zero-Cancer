import { MutationKeys, QueryKeys } from '@/services/keys'
import * as receiptService from '@/services/receipt.service'
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ReceiptListQuerySchema,
  ResendReceiptRequestSchema,
} from '@zerocancer/shared/schemas/receipt.schema'
import type { z } from 'zod'

/**
 * Receipt Provider - React Query hooks for receipt management
 *
 * This provider follows the established project patterns for:
 * - Query management with proper keys
 * - Cache invalidation on mutations
 * - Type safety with shared schemas
 */

/**
 * Query for getting a single receipt by transaction ID
 *
 * @example
 * const receiptQuery = useReceiptQuery(transactionId);
 *
 * // In component:
 * const { data: receipt, isLoading, error } = useQuery(receiptQuery);
 */
export const useReceiptQuery = (transactionId: string) =>
  queryOptions({
    queryKey: [QueryKeys.receiptV1, transactionId],
    queryFn: () => receiptService.getReceipt(transactionId),
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

/**
 * Query for listing receipts with pagination and filters
 *
 * @example
 * const receiptsQuery = useReceiptsQuery({ page: 1, limit: 20, type: 'APPOINTMENT' });
 *
 * // In component:
 * const { data: receipts, isLoading, error } = useQuery(receiptsQuery);
 */
export const useReceiptsQuery = (
  params: Partial<z.infer<typeof ReceiptListQuerySchema>> = {},
) =>
  queryOptions({
    queryKey: [QueryKeys.receiptsV1, params],
    queryFn: () => receiptService.listReceipts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

/**
 * Mutation for creating or regenerating a receipt
 *
 * @example
 * const createReceipt = useCreateReceipt();
 *
 * // In component:
 * const handleCreateReceipt = () => {
 *   createReceipt.mutate({
 *     transactionId: 'tx-123',
 *     emailRecipient: 'user@example.com',
 *     forceRegenerate: false
 *   });
 * };
 */
export const useCreateReceipt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.createReceiptV1],
    mutationFn: receiptService.createReceipt,
    onSuccess: (data, variables) => {
      // Invalidate and update the specific receipt query
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.receiptV1, variables.transactionId],
      })

      // Invalidate the receipts list to reflect the new/updated receipt
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.receiptsV1],
      })

      // Optimistically update the specific receipt cache
      queryClient.setQueryData(
        [QueryKeys.receiptV1, variables.transactionId],
        data,
      )
    },
  })
}

/**
 * Mutation for resending a receipt via email
 *
 * @example
 * const resendReceipt = useResendReceipt();
 *
 * // In component:
 * const handleResendReceipt = () => {
 *   resendReceipt.mutate({
 *     transactionId: 'tx-123',
 *     emailRecipient: 'user@example.com'
 *   });
 * };
 */
export const useResendReceipt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.resendReceiptV1],
    mutationFn: ({
      transactionId,
      ...data
    }: { transactionId: string } & z.infer<
      typeof ResendReceiptRequestSchema
    >) => receiptService.resendReceipt(transactionId, data),
    onSuccess: (_, variables) => {
      // Update the receipt to reflect that it was sent
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.receiptV1, variables.transactionId],
      })

      // Also refresh the receipts list in case it shows email status
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.receiptsV1],
      })
    },
  })
}

/**
 * Mutation for downloading a receipt PDF
 * Note: This returns a blob that should be handled by the component for download
 *
 * @example
 * const downloadPDF = useDownloadReceiptPDF();
 *
 * // In component:
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
export const useDownloadReceiptPDF = () => {
  return useMutation({
    mutationKey: ['downloadReceiptPDF'],
    mutationFn: receiptService.downloadReceiptPDF,
  })
}

/**
 * Utility function to create receipt query keys for manual cache management
 *
 * @example
 * // Invalidate all receipt queries
 * queryClient.invalidateQueries({ queryKey: receiptQueryKeys.all() });
 *
 * // Invalidate specific receipt
 * queryClient.invalidateQueries({ queryKey: receiptQueryKeys.receipt(transactionId) });
 */
export const receiptQueryKeys = {
  all: () => [QueryKeys.receiptsV1] as const,
  lists: () => [QueryKeys.receiptsV1, 'list'] as const,
  list: (params: Partial<z.infer<typeof ReceiptListQuerySchema>>) =>
    [QueryKeys.receiptsV1, 'list', params] as const,
  receipts: () => [QueryKeys.receiptV1] as const,
  receipt: (transactionId: string) =>
    [QueryKeys.receiptV1, transactionId] as const,
}
