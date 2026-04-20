import { QueryKeys } from '@/services/keys'
import {
  useCompleteAppointment,
  useDeleteResultFile,
  useRestoreResultFile,
} from '@/services/providers/center.provider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

export interface UseResultManagementOptions {
  appointmentId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Hook for managing result files (delete, restore) and appointment completion
 *
 * This hook provides a unified interface for all result management operations:
 * - Deleting result files (soft delete)
 * - Restoring deleted result files
 * - Completing appointments (which triggers patient notifications)
 *
 * Usage:
 * ```tsx
 * const {
 *   deleteFile,
 *   restoreFile,
 *   completeAppointment,
 *   isLoading
 * } = useResultManagement({
 *   appointmentId: '123',
 *   onSuccess: () => console.log('Operation completed'),
 *   onError: (error) => console.error('Operation failed', error)
 * })
 *
 * // Delete a file
 * deleteFile.mutate({
 *   fileId: 'file-123',
 *   reason: 'Wrong file uploaded',
 *   notifyPatient: false // optional, defaults to true
 * })
 *
 * // Restore a file
 * restoreFile.mutate({ fileId: 'file-123' })
 *
 * // Complete appointment
 * completeAppointment.mutate({
 *   completionNotes: 'All results uploaded and verified'
 * })
 * ```
 */
export function useResultManagement({
  appointmentId,
  onSuccess,
  onError,
}: UseResultManagementOptions) {
  const queryClient = useQueryClient()

  // Individual mutation hooks
  const deleteFileMutation = useDeleteResultFile()
  const restoreFileMutation = useRestoreResultFile()
  const completeAppointmentMutation = useCompleteAppointment()

  // Invalidate relevant queries after any operation
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [QueryKeys.centerAppointments],
    })
    queryClient.invalidateQueries({
      queryKey: [QueryKeys.centerAppointmentById, appointmentId],
    })
    onSuccess?.()
  }, [queryClient, appointmentId, onSuccess])

  // Enhanced delete file function
  const deleteFile = useMutation({
    mutationFn: ({
      fileId,
      reason,
      notifyPatient,
    }: {
      fileId: string
      reason?: string
      notifyPatient?: boolean
    }) => deleteFileMutation.mutateAsync({ fileId, reason, notifyPatient }),
    onSuccess: invalidateQueries,
    onError: (error: Error) => {
      console.error('Failed to delete result file:', error)
      onError?.(error)
    },
  })

  // Enhanced restore file function
  const restoreFile = useMutation({
    mutationFn: ({ fileId }: { fileId: string }) =>
      restoreFileMutation.mutateAsync({ fileId }),
    onSuccess: invalidateQueries,
    onError: (error: Error) => {
      console.error('Failed to restore result file:', error)
      onError?.(error)
    },
  })

  // Enhanced complete appointment function
  const completeAppointment = useMutation({
    mutationFn: ({ completionNotes }: { completionNotes?: string }) =>
      completeAppointmentMutation.mutateAsync({
        appointmentId,
        completionNotes,
      }),
    onSuccess: invalidateQueries,
    onError: (error: Error) => {
      console.error('Failed to complete appointment:', error)
      onError?.(error)
    },
  })

  return {
    // Mutation functions
    deleteFile,
    restoreFile,
    completeAppointment,

    // Loading states
    isLoading:
      deleteFile.isPending ||
      restoreFile.isPending ||
      completeAppointment.isPending,

    // Individual loading states
    isDeletingFile: deleteFile.isPending,
    isRestoringFile: restoreFile.isPending,
    isCompletingAppointment: completeAppointment.isPending,

    // Error states
    deleteError: deleteFile.error,
    restoreError: restoreFile.error,
    completeError: completeAppointment.error,

    // Success states
    deleteSuccess: deleteFile.isSuccess,
    restoreSuccess: restoreFile.isSuccess,
    completeSuccess: completeAppointment.isSuccess,

    // Reset functions
    resetDelete: deleteFile.reset,
    resetRestore: restoreFile.reset,
    resetComplete: completeAppointment.reset,
  }
}

/**
 * Simplified hook for just file operations (delete/restore)
 *
 * Usage:
 * ```tsx
 * const { deleteFile, restoreFile, isLoading } = useResultFileOperations({
 *   appointmentId: '123',
 *   onFileDeleted: (fileId) => console.log('File deleted:', fileId),
 *   onFileRestored: (fileId) => console.log('File restored:', fileId)
 * })
 * ```
 */
export function useResultFileOperations({
  appointmentId,
  onFileDeleted,
  onFileRestored,
  onError,
}: {
  appointmentId: string
  onFileDeleted?: (fileId: string) => void
  onFileRestored?: (fileId: string) => void
  onError?: (error: Error) => void
}) {
  const {
    deleteFile,
    restoreFile,
    isDeletingFile,
    isRestoringFile,
    deleteError,
    restoreError,
  } = useResultManagement({
    appointmentId,
    onError,
  })

  const handleDeleteFile = useCallback(
    (fileId: string, reason?: string, notifyPatient?: boolean) => {
      deleteFile.mutate(
        { fileId, reason, notifyPatient },
        {
          onSuccess: () => onFileDeleted?.(fileId),
        },
      )
    },
    [deleteFile, onFileDeleted],
  )

  const handleRestoreFile = useCallback(
    (fileId: string) => {
      restoreFile.mutate(
        { fileId },
        {
          onSuccess: () => onFileRestored?.(fileId),
        },
      )
    },
    [restoreFile, onFileRestored],
  )

  return {
    deleteFile: handleDeleteFile,
    restoreFile: handleRestoreFile,
    isLoading: isDeletingFile || isRestoringFile,
    isDeletingFile,
    isRestoringFile,
    deleteError,
    restoreError,
  }
}
