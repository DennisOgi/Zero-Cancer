import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shared/ui/dialog'
import { Separator } from '@/components/shared/ui/separator'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  useAppointmentResults,
  usePatientAppointmentById,
} from '@/services/providers/patient.provider'
import { useQuery } from '@tanstack/react-query'
import type { TResultFile } from '@zerocancer/shared/types'
import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  Clock,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  Folder,
} from 'lucide-react'

interface ResultViewerProps {
  appointmentId: string
  showHeader?: boolean
  compact?: boolean
  className?: string
}

export function ResultViewer({
  appointmentId,
  showHeader = true,
  compact = false,
  className = '',
}: ResultViewerProps) {
  const { data: appointment } = useQuery(
    usePatientAppointmentById(appointmentId),
  )

  const { data: auth } = useQuery(useAuthUser())
  const profile = auth?.data?.user?.profile

  const {
    data: resultsData,
    isLoading,
    error,
  } = useQuery({
    ...useAppointmentResults(appointmentId),
    enabled:
      appointment?.data.status === 'COMPLETED' ||
      (profile !== 'PATIENT' && profile !== 'DONOR'),
  })

  const results = resultsData?.data

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Results
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Results
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load results</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!results) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Results
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No results available</p>
            <p className="text-sm">
              Results will appear here once they're ready
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const allFiles = [
    ...(results.files || []),
    ...(results.folders ? Object.values(results.folders).flat() : []),
  ]

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Screening Results
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Result Metadata */}
        {!compact && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Upload Date</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(results.uploadedAt), 'PPp')}
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        {results.notes && (
          <div>
            <p className="text-sm font-medium mb-2">Notes</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{results.notes}</p>
            </div>
          </div>
        )}

        {!compact && <Separator />}

        {/* Files Section */}
        {allFiles.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">
                Result Files ({allFiles.length})
              </p>
              <Badge variant="secondary" className="text-xs">
                Total:{' '}
                {formatFileSize(
                  allFiles.reduce((sum, file) => sum + file.fileSize, 0),
                )}
              </Badge>
            </div>

            {/* Organized Files by Folder */}
            {results.folders && Object.keys(results.folders).length > 0 && (
              <div className="space-y-3 mb-4">
                {Object.entries(results.folders).map(
                  ([folderName, folderFiles]) => (
                    <div key={folderName} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">
                          {folderName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {folderFiles.length} files
                        </Badge>
                      </div>
                      <div className="space-y-2 ml-6">
                        {folderFiles.map((file) => (
                          <FileItem
                            key={file.id}
                            file={file}
                            compact={compact}
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {/* Loose Files */}
            {/* {results.files && results.files.length > 0 && (
              <div className="space-y-2">
                {results.files.map((file) => (
                  <FileItem key={file.id} file={file} compact={compact} />
                ))}
              </div>
            )} */}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files available</p>
          </div>
        )}

        {/* Summary Stats */}
        {!compact && allFiles.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm font-medium">{allFiles.length}</p>
                <p className="text-xs text-muted-foreground">Total Files</p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {allFiles.filter((f) => f.fileType.includes('image')).length}
                </p>
                <p className="text-xs text-muted-foreground">Images</p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {allFiles.filter((f) => f.fileType.includes('pdf')).length}
                </p>
                <p className="text-xs text-muted-foreground">PDFs</p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatFileSize(
                    allFiles.reduce((sum, file) => sum + file.fileSize, 0),
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total Size</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// File Item Component
interface FileItemProps {
  file: TResultFile
  compact?: boolean
}

function FileItem({ file, compact }: FileItemProps) {
  console.log(file, 99)
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('image')) {
      return <FileImage className="h-4 w-4" />
    }
    if (type.includes('pdf')) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = (file: TResultFile) => {
    const link = document.createElement('a')
    link.href = file.cloudinaryUrl
    link.download = file.fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = (file: TResultFile) => {
    window.open(file.cloudinaryUrl, '_blank')
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-muted-foreground">
          {getFileIcon(file.fileType)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={file.fileName}>
            {file.fileName}
          </p>
          {!compact && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{file.fileType}</span>
              <span>•</span>
              <span>{formatFileSize(file.fileSize)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(file.uploadedAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
        {file.isDeleted && (
          <Badge variant="destructive" className="text-xs">
            Deleted
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={file.isDeleted}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon(file.fileType)}
                {file.fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {file.fileType.includes('image') ? (
                <img
                  src={file.cloudinaryUrl}
                  alt={file.fileName}
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
              ) : (
                <iframe
                  src={file.cloudinaryUrl}
                  className="w-full h-[70vh] border rounded"
                  title={file.fileName}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => handleView(file)} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button onClick={() => handleDownload(file)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleDownload(file)}
          disabled={file.isDeleted}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
