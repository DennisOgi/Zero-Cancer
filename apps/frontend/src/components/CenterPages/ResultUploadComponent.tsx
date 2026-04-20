import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import { Progress } from '@/components/shared/ui/progress'
import { Textarea } from '@/components/shared/ui/textarea'
import { useResultManagement } from '@/hooks/useResultManagement'
import { useResultUpload } from '@/hooks/useResultUpload'
import { useAppointmentResults } from '@/services/providers/patient.provider'
import type { FileWithPath } from '@/services/upload.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  File,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Schema for upload result form
const resultUploadSchema = z.object({
  // appointmentId: z.string(),
  notes: z.string().optional(),
  completionNotes: z.string().optional(),
})

type ResultUploadFormData = z.infer<typeof resultUploadSchema>

interface ResultUploadComponentProps {
  appointmentId: string
  appointmentData?: {
    patient?: { fullName?: string }
    screeningType?: { name?: string }
    appointmentDateTime?: string
    status?: string
    result?: { files?: any[] }
  }
  onUploadComplete?: () => void
  onAppointmentComplete?: () => void
}

export function ResultUploadComponent({
  appointmentId,
  appointmentData,
  onUploadComplete,
  onAppointmentComplete,
}: ResultUploadComponentProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showCompletion, setShowCompletion] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [operatingFileId, setOperatingFileId] = useState<string | null>(null)

  // Fetch appointment results to check for existing files
  const { data: resultsData, isLoading: isLoadingResults } = useQuery(
    useAppointmentResults(appointmentId),
  )
  const appointmentResults = resultsData?.data

  console.log(appointmentResults)

  const form = useForm<ResultUploadFormData>({
    resolver: zodResolver(resultUploadSchema),
    defaultValues: {
      notes: '',
      completionNotes: '',
    },
  })

  // Upload functionality
  const {
    uploadFiles,
    uploadStates,
    isUploading,
    error: uploadError,
    reset: resetUpload,
  } = useResultUpload({
    appointmentId,
    onSuccess: () => {
      toast.success('Files uploaded successfully!')
      setSelectedFiles([])
      form.setValue('notes', '')
      onUploadComplete?.()
      // The useAppointmentResults query will automatically refetch due to the mutation
    },
    onError: (error) => {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    },
  })

  // Result management functionality
  const {
    deleteFile,
    restoreFile,
    completeAppointment,
    isCompletingAppointment,
    isDeletingFile,
    isRestoringFile,
    deleteError,
    restoreError,
    completeError,
  } = useResultManagement({
    appointmentId,
    onSuccess: () => {
      toast.success('Appointment completed successfully!')
      setShowCompletion(false)
      onAppointmentComplete?.()
    },
    onError: (error) => {
      console.error('Complete appointment error:', error)
      toast.error('Failed to complete appointment')
    },
  })

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])

      // Validate file types
      const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
      const invalidFiles = files.filter((file) => {
        const extension = file.name.split('.').pop()?.toLowerCase()
        return !allowedTypes.includes(extension || '')
      })

      if (invalidFiles.length > 0) {
        toast.error(
          `Invalid file types: ${invalidFiles.map((f) => f.name).join(', ')}. Allowed: PDF, Images, DOC, DOCX`,
        )
        return
      }

      // Validate file sizes (max 10MB each)
      const oversizedFiles = files.filter(
        (file) => file.size > 10 * 1024 * 1024,
      )
      if (oversizedFiles.length > 0) {
        toast.error(
          `Files too large: ${oversizedFiles.map((f) => f.name).join(', ')}. Max size: 10MB`,
        )
        return
      }

      setSelectedFiles((prev) => [...prev, ...files])
    },
    [],
  )

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async (values: ResultUploadFormData) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    // Convert Files to FileWithPath format
    const filesWithPath: FileWithPath[] = selectedFiles.map((file) => ({
      file,
      path: file.name, // Simple path, could be enhanced with folder structure
    }))

    uploadFiles({
      files: filesWithPath,
      notes: values.notes || undefined,
      folderName: appointmentData?.screeningType?.name?.replace(/\s+/g, '-'),
    })
  }

  const handleCompleteAppointment = (values: ResultUploadFormData) => {
    completeAppointment.mutate({
      completionNotes: values.completionNotes || undefined,
    })
  }

  // Handle file deletion (soft delete)
  const handleDeleteFile = (fileId: string) => {
    const reason = deletionReason || 'File deleted by center staff'
    setOperatingFileId(fileId)

    deleteFile.mutate(
      {
        fileId,
        reason,
        notifyPatient: appointmentData?.status === 'COMPLETED', // Only notify if already completed
      },
      {
        onSuccess: () => {
          toast.success('File deleted successfully')
          setDeletionReason('')
          setOperatingFileId(null)
        },
        onError: (error) => {
          console.error('Delete file error:', error)
          toast.error('Failed to delete file')
          setOperatingFileId(null)
        },
      },
    )
  }

  // Handle file restoration
  const handleRestoreFile = (fileId: string) => {
    setOperatingFileId(fileId)

    restoreFile.mutate(
      { fileId },
      {
        onSuccess: () => {
          toast.success('File restored successfully')
          setOperatingFileId(null)
        },
        onError: (error) => {
          console.error('Restore file error:', error)
          toast.error('Failed to restore file')
          setOperatingFileId(null)
        },
      },
    )
  }

  // Handle file view
  const handleViewFile = (cloudinaryUrl: string) => {
    window.open(cloudinaryUrl, '_blank')
  }

  // Handle file download
  const handleDownloadFile = (cloudinaryUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = cloudinaryUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const hasExistingFiles = appointmentResults
    ? (appointmentResults.files?.length ?? 0) > 0 ||
      (appointmentResults.folders &&
        Object.values(appointmentResults.folders).some(
          (files) => files.length > 0,
        ))
    : false
  const canCompleteAppointment = hasExistingFiles && !isUploading

  return (
    <div className="space-y-6">
      {/* Loading state for results */}
      {isLoadingResults && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading appointment results...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Info */}
      {appointmentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Patient:</span>
                <span>{appointmentData.patient?.fullName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Screening:</span>
                <span>{appointmentData.screeningType?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{formatDate(appointmentData.appointmentDateTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant="outline">{appointmentData.status}</Badge>
              </div>
              {hasExistingFiles && appointmentResults && (
                <div className="flex justify-between">
                  <span className="font-medium">Files:</span>
                  <span>
                    {(appointmentResults.files?.length ?? 0) +
                      (appointmentResults.folders
                        ? Object.values(appointmentResults.folders).reduce(
                            (sum, files) => sum + files.length,
                            0,
                          )
                        : 0)}{' '}
                    uploaded
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Section */}
      {appointmentData?.status !== 'COMPLETED' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Result Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleUpload)}
                className="space-y-4"
              >
                {/* Notes Field */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes about the results..."
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes about the screening results
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Upload Area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Result Files</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload PDF reports, images, or lab results
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById('file-upload')?.click()
                      }
                      disabled={isUploading}
                    >
                      Select Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Images, DOC files • Max 10MB each
                    </p>
                  </div>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Selected Files ({selectedFiles.length})
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            <span className="text-sm truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(1)}MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadStates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload Progress
                    </label>
                    {uploadStates.map((progress) => (
                      <div key={progress.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{progress.fileName}</span>
                          <span>{progress.progress}%</span>
                        </div>
                        <Progress value={progress.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isUploading || selectedFiles.length === 0}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedFiles([])
                      form.reset()
                      resetUpload()
                    }}
                    disabled={isUploading}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </Form>

            {/* Upload Error */}
            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">
                  Upload failed: {uploadError.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Complete Appointment Section */}
      {canCompleteAppointment && appointmentData?.status !== 'COMPLETED' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Complete Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showCompletion ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Files have been uploaded successfully. You can now complete
                    this appointment to notify the patient that results are
                    ready.
                  </p>
                </div>
                <Button
                  onClick={() => setShowCompletion(true)}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Appointment
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCompleteAppointment)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="completionNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completion Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any final notes about the completed screening..."
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional final notes for the completed appointment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isCompletingAppointment}
                      className="flex-1"
                    >
                      {isCompletingAppointment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete & Notify Patient
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCompletion(false)}
                      disabled={isCompletingAppointment}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Complete Error */}
            {completeError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">
                  Failed to complete appointment: {completeError.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Management Section */}
      {appointmentResults &&
        (appointmentResults.files?.length > 0 ||
          (appointmentResults.folders &&
            Object.keys(appointmentResults.folders).length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Manage Uploaded Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deletion Reason Input */}
              {appointmentData?.status !== 'COMPLETED' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Deletion Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="Reason for deleting file..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  ,
                </>
              )}

              {/* Direct Files */}
              {appointmentResults.files &&
                appointmentResults.files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Result Files</h4>
                    <div className="space-y-2">
                      {appointmentResults.files.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            file.isDeleted
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                title={file.fileName}
                              >
                                {file.fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {file.fileType} •{' '}
                                {(file.fileSize / 1024 / 1024).toFixed(1)}MB
                              </p>
                              {file.isDeleted && (
                                <div className="mt-1 text-xs text-red-600">
                                  <p>
                                    Deleted:{' '}
                                    {new Date(
                                      file.deletedAt!,
                                    ).toLocaleDateString()}
                                  </p>
                                  {file.deletionReason && (
                                    <p>Reason: {file.deletionReason}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {!file.isDeleted ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleViewFile(file.cloudinaryUrl)
                                  }
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleDownloadFile(
                                      file.cloudinaryUrl,
                                      file.fileName,
                                    )
                                  }
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                {appointmentData?.status !== 'COMPLETED' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDeleteFile(file.id)}
                                    disabled={operatingFileId === file.id}
                                  >
                                    {operatingFileId === file.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3 text-red-600" />
                                    )}
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleRestoreFile(file.id)}
                                disabled={operatingFileId === file.id}
                              >
                                {operatingFileId === file.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3 text-green-600" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Folder Files */}
              {/* {appointmentResults.folders && Object.keys(appointmentResults.folders).length > 0 && (
              <div className="space-y-3">
                {Object.entries(appointmentResults.folders).map(([folderName, folderFiles]) => (
                  <div key={folderName} className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <File className="h-4 w-4" />
                      {folderName} ({folderFiles.length} files)
                    </h4>
                    <div className="space-y-2 ml-6">
                      {folderFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            file.isDeleted ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" title={file.fileName}>
                                {file.fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {file.fileType} • {(file.fileSize / 1024 / 1024).toFixed(1)}MB
                              </p>
                              {file.isDeleted && (
                                <div className="mt-1 text-xs text-red-600">
                                  <p>Deleted: {new Date(file.deletedAt!).toLocaleDateString()}</p>
                                  {file.deletionReason && (
                                    <p>Reason: {file.deletionReason}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!file.isDeleted ? (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleViewFile(file.cloudinaryUrl)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDownloadFile(file.cloudinaryUrl, file.fileName)}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDeleteFile(file.id)}
                                  disabled={operatingFileId === file.id}
                                >
                                  {operatingFileId === file.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  )}
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleRestoreFile(file.id)}
                                disabled={operatingFileId === file.id}
                              >
                                {operatingFileId === file.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3 text-green-600" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )} */}

              {/* File Operation Errors */}
              {(deleteError || restoreError) && (
                <div className="space-y-2">
                  {deleteError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-800">
                        Delete Error: {deleteError.message}
                      </p>
                    </div>
                  )}
                  {restoreError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-800">
                        Restore Error: {restoreError.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Instructions */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Upload Process:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Upload all relevant test results and reports</li>
                <li>• Files are automatically organized by screening type</li>
                <li>• Multiple uploads can be done before completion</li>
                <li>• Ensure all screening procedures are finished</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Completion:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Complete appointment after all uploads are done</li>
                <li>• Patient will be automatically notified</li>
                <li>• Results become available in patient portal</li>
                <li>• Appointment status changes to COMPLETED</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
