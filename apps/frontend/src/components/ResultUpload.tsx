import { useResultUpload } from '@/hooks/useResultUpload'
import type { FileWithPath } from '@/services/upload.service'
import React, { useState } from 'react'

interface ResultUploadProps {
  appointmentId: string
  onSuccess?: () => void
}

export function ResultUpload({ appointmentId, onSuccess }: ResultUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [folderName, setFolderName] = useState('')
  const [notes, setNotes] = useState('')

  const { uploadFiles, uploadStates, isUploading, error, reset } =
    useResultUpload({
      appointmentId,
      onSuccess: () => {
        setFiles([])
        setFolderName('')
        setNotes('')
        onSuccess?.()
      },
    })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
  }

  const handleUpload = () => {
    if (files.length === 0) return

    // Convert files to FileWithPath format
    const filesWithPath: FileWithPath[] = files.map((file) => ({
      file,
      path: folderName ? `${folderName}/${file.name}` : file.name,
    }))

    uploadFiles({ files: filesWithPath, notes: notes || undefined, folderName })
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="result-upload">
      <div className="upload-section">
        <input
          type="text"
          placeholder="Folder name (optional, e.g., 'Lab Results')"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          disabled={isUploading}
          className="w-full p-2 border rounded mb-4"
        />

        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="w-full p-2 border rounded mb-4"
        />

        <textarea
          placeholder="Add notes about the results (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isUploading}
          className="w-full p-2 border rounded mb-4"
          rows={3}
        />
      </div>

      {files.length > 0 && (
        <div className="file-list mb-4">
          <h4 className="font-semibold mb-2">Selected Files:</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="file-item flex justify-between items-center p-2 bg-gray-50 rounded mb-2"
            >
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
              {!isUploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadStates.length > 0 && (
        <div className="upload-progress mb-4">
          <h4 className="font-semibold mb-2">Upload Progress:</h4>
          {uploadStates.map((state) => (
            <div key={state.id} className="progress-item mb-3">
              <div className="progress-info flex justify-between items-center mb-1">
                <span className="text-sm">{state.fileName}</span>
                <span
                  className={`text-xs ${
                    state.status === 'completed'
                      ? 'text-green-600'
                      : state.status === 'error'
                        ? 'text-red-600'
                        : state.status === 'uploading'
                          ? 'text-blue-600'
                          : 'text-gray-600'
                  }`}
                >
                  {state.status === 'uploading'
                    ? `${state.progress}%`
                    : state.status}
                </span>
              </div>
              <div className="progress-bar w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`progress-fill h-2 rounded-full transition-all ${
                    state.status === 'completed'
                      ? 'bg-green-500'
                      : state.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              {state.error && (
                <span className="error text-red-500 text-xs mt-1 block">
                  {state.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="upload-actions flex gap-2">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className={`px-4 py-2 rounded font-medium ${
            files.length === 0 || isUploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload Results'}
        </button>

        {(error || uploadStates.some((s) => s.status === 'error')) && (
          <button
            onClick={reset}
            className="px-4 py-2 rounded font-medium bg-gray-500 text-white hover:bg-gray-600"
          >
            Reset
          </button>
        )}
      </div>

      {error && (
        <div className="error-message mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          Error: {error.message}
        </div>
      )}
    </div>
  )
}
