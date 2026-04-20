export interface UploadProgress {
  id: string
  fileName: string
  filePath?: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

export interface FileWithPath {
  file: File
  path: string // e.g., "lab-results/blood-test.pdf"
}

export interface UploadOptions {
  folder: string
  maxConcurrent?: number
  allowedTypes?: string[]
  maxFileSize?: number // in MB
}

export interface FolderUploadOptions extends UploadOptions {
  folderName?: string // If provided, will prefix all files
}

export class FileUploadService {
  private static instance: FileUploadService

  static getInstance() {
    if (!this.instance) {
      this.instance = new FileUploadService()
    }
    return this.instance
  }

  async uploadFiles(
    files: File[],
    options: UploadOptions,
    onProgress?: (progresses: UploadProgress[]) => void,
  ): Promise<UploadProgress[]> {
    // Validate files
    this.validateFiles(files, options)

    const { maxConcurrent = 3, folder } = options
    const results: UploadProgress[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }))

    onProgress?.(results)

    // Process in batches
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent)
      const batchPromises = batch.map(async (file, batchIndex) => {
        const resultIndex = i + batchIndex

        try {
          results[resultIndex].status = 'uploading'
          onProgress?.(results)

          const uploadResult = await this.uploadSingleFile(
            file,
            folder,
            (progress) => {
              results[resultIndex].progress = progress
              onProgress?.(results)
            },
          )

          results[resultIndex] = {
            ...results[resultIndex],
            status: 'completed',
            progress: 100,
            url: uploadResult.secure_url,
            filePath: file.name,
          }
        } catch (error) {
          results[resultIndex] = {
            ...results[resultIndex],
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          }
        }

        onProgress?.(results)
      })

      await Promise.all(batchPromises)
    }

    return results
  }

  async uploadFilesWithFolders(
    files: FileWithPath[],
    options: FolderUploadOptions,
    onProgress?: (progresses: UploadProgress[]) => void,
  ): Promise<UploadProgress[]> {
    const { folderName, folder, maxConcurrent = 3 } = options

    const results: UploadProgress[] = files.map((fileItem, index) => ({
      id: `upload-${Date.now()}-${index}`,
      fileName: fileItem.file.name,
      filePath: fileItem.path,
      progress: 0,
      status: 'pending',
    }))

    onProgress?.(results)

    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent)
      const batchPromises = batch.map(async (fileItem, batchIndex) => {
        const resultIndex = i + batchIndex

        try {
          results[resultIndex].status = 'uploading'
          onProgress?.(results)

          // Create the full path: base-folder/user-folder/file-name
          const fullPath = [
            folder, // e.g., "screening-results/appointment-123"
            folderName || fileItem.path.split('/')[0], // e.g., "lab-results"
            fileItem.file.name,
          ]
            .filter(Boolean)
            .join('/')

          const uploadResult = await this.uploadSingleFile(
            fileItem.file,
            fullPath,
            (progress) => {
              results[resultIndex].progress = progress
              onProgress?.(results)
            },
          )

          results[resultIndex] = {
            ...results[resultIndex],
            status: 'completed',
            progress: 100,
            url: uploadResult.secure_url,
            filePath: fileItem.path,
          }
        } catch (error) {
          results[resultIndex] = {
            ...results[resultIndex],
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          }
        }

        onProgress?.(results)
      })

      await Promise.all(batchPromises)
    }

    return results
  }

  private validateFiles(files: File[], options: UploadOptions) {
    const { allowedTypes, maxFileSize = 10 } = options

    files.forEach((file) => {
      if (
        allowedTypes &&
        !allowedTypes.some((type) => file.type.includes(type))
      ) {
        throw new Error(
          `File ${file.name} has invalid type. Allowed: ${allowedTypes.join(', ')}`,
        )
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        throw new Error(
          `File ${file.name} is too large. Max size: ${maxFileSize}MB`,
        )
      }
    })
  }

  private uploadSingleFile(
    file: File,
    fullPath: string,
    onProgress: (progress: number) => void,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'upload_preset',
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      )
      formData.append('public_id', fullPath) // This sets the full path

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      )
      xhr.send(formData)
    })
  }
}

// Helper function to extract Cloudinary ID from URL
export function extractCloudinaryId(url: string): string {
  return url.split('/').pop()?.split('.')[0] || ''
}
