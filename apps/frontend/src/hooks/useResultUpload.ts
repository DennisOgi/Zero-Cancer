import { centerService } from '@/services'
import { QueryKeys } from '@/services/keys'
import {
  extractCloudinaryId,
  FileUploadService,
  type FileWithPath,
  type UploadProgress,
} from '@/services/upload.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

/**
 * Hook for uploading result files to screening appointments
 * 
 * This hook handles the file upload process and saves file metadata to the backend.
 * Important notes:
 * 
 * 1. Uploading files does NOT automatically complete the appointment
 * 2. Uploading files does NOT trigger patient notifications
 * 3. The appointment remains IN_PROGRESS until explicitly completed using useResultManagement
 * 4. Multiple uploads can be done before marking the appointment as complete
 * 
 * For managing uploaded files (delete/restore) and completing appointments, 
 * use the useResultManagement hook.
 * 
 * Usage:
 * ```tsx
 * const { uploadFiles, uploadStates, isUploading } = useResultUpload({
 *   appointmentId: '123',
 *   onSuccess: () => console.log('Files uploaded successfully'),
 *   onError: (error) => console.error('Upload failed', error)
 * })
 * 
 * const handleUpload = (files: FileWithPath[]) => {
 *   uploadFiles({ 
 *     files, 
 *     notes: 'Lab results from screening', 
 *     folderName: 'blood-work' 
 *   })
 * }
 * ```
 */
export interface UseResultUploadOptions {
  appointmentId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useResultUpload({
  appointmentId,
  onSuccess,
  onError,
}: UseResultUploadOptions) {
  const queryClient = useQueryClient()
  const [uploadStates, setUploadStates] = useState<UploadProgress[]>([])

  const uploadMutation = useMutation({
    mutationFn: async ({
      files,
      notes,
      folderName,
    }: {
      files: FileWithPath[]
      notes?: string
      folderName?: string
    }) => {
      const uploadService = FileUploadService.getInstance()

      // Upload to Cloudinary with progress tracking
      const results = await uploadService.uploadFilesWithFolders(
        files,
        {
          folder: `screening-results/${appointmentId}`,
          maxConcurrent: 3,
          allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
          maxFileSize: 10,
          folderName,
        },
        setUploadStates,
      )

      // Prepare files data for backend
      const filesData = results
        .filter((r) => r.status === 'completed')
        .map((r) => {
          const originalFile = files.find((f) => f.file.name === r.fileName)
          return {
            fileName: r.fileName,
            originalName: r.fileName,
            filePath: r.filePath || r.fileName,
            fileType: originalFile?.file.type || 'unknown',
            fileSize: originalFile?.file.size || 0,
            url: r.url!,
            cloudinaryId: extractCloudinaryId(r.url!),
          }
        })

      // Save to backend
      return centerService.uploadResults(appointmentId, {
        files: filesData,
        notes,
        folderName,
      })
    },
    onSuccess: () => {
      setUploadStates([])
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.centerAppointments],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.centerAppointmentById, appointmentId],
      })
      onSuccess?.()
    },
    onError: (error: Error) => {
      onError?.(error)
    },
  })

  const reset = useCallback(() => {
    setUploadStates([])
    uploadMutation.reset()
  }, [uploadMutation])

  return {
    uploadFiles: uploadMutation.mutate,
    uploadStates,
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error,
    isSuccess: uploadMutation.isSuccess,
    reset,
  }
}
