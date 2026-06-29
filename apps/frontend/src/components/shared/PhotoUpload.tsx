import { Button } from '@/components/shared/ui/button'
import { uploadPatientPhoto } from '@/services/register.service'
import { Loader2, Upload, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type PhotoUploadProps = {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read the selected file'))
    reader.readAsDataURL(file)
  })
}

function normalizeMimeType(file: File): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (file.type === 'image/png') return 'image/png'
  if (file.type === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

export default function PhotoUpload({
  value,
  onChange,
  disabled = false,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)

  useEffect(() => {
    setPreviewUrl(value || null)
  }, [value])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, or WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be 5MB or smaller.')
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setIsUploading(true)

    try {
      const fileBase64 = await readFileAsDataUrl(file)
      const response = await uploadPatientPhoto({
        fileBase64,
        fileName: file.name,
        mimeType: normalizeMimeType(file),
      })

      if (!response.ok || !response.data?.url) {
        throw new Error(response.error || 'Upload failed')
      }

      setPreviewUrl(response.data.url)
      onChange(response.data.url)
      toast.success('Photo uploaded successfully')
    } catch (error: any) {
      setPreviewUrl(value || null)
      toast.error(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to upload photo',
      )
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(localPreview)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const clearPhoto = () => {
    setPreviewUrl(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border bg-muted">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Patient profile preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <User className="h-10 w-10" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={disabled || isUploading}
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isUploading}
              onClick={clearPhoto}
            >
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Optional. JPG, PNG, or WEBP, up to 5MB.
      </p>
    </div>
  )
}
