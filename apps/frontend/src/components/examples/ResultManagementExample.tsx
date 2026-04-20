/**
 * EXAMPLE: Complete Result Management Component
 *
 * This example shows how to integrate all result management hooks:
 * - useResultUpload: For uploading files
 * - useResultManagement: For file operations and appointment completion
 *
 * This is NOT a functional component - it's documentation for frontend developers
 * showing the complete flow and proper usage patterns.
 */

import {
  useResultFileOperations,
  useResultManagement,
} from '@/hooks/useResultManagement'
import { useResultUpload } from '@/hooks/useResultUpload'
import type { FileWithPath } from '@/services/upload.service'
import React, { useState } from 'react'

interface ResultManagementExampleProps {
  appointmentId: string
  appointment: {
    id: string
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    resultFiles: Array<{
      id: string
      fileName: string
      url: string
      uploadedAt: string
      isDeleted: boolean
      deletedAt?: string
      deletionReason?: string
    }>
  }
}

export function ResultManagementExample({
  appointmentId,
  appointment,
}: ResultManagementExampleProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([])
  const [completionNotes, setCompletionNotes] = useState('')
  const [deletionReason, setDeletionReason] = useState('')

  // STEP 1: Upload files
  const {
    uploadFiles,
    uploadStates,
    isUploading,
    error: uploadError,
    isSuccess: uploadSuccess,
    reset: resetUpload,
  } = useResultUpload({
    appointmentId,
    onSuccess: () => {
      console.log('Files uploaded successfully')
      setSelectedFiles([])
    },
    onError: (error) => {
      console.error('Upload failed:', error)
    },
  })

  // STEP 2: Manage files and complete appointment
  const {
    deleteFile,
    restoreFile,
    completeAppointment,
    isLoading: isManaging,
    isDeletingFile,
    isRestoringFile,
    isCompletingAppointment,
    deleteError,
    restoreError,
    completeError,
    completeSuccess,
  } = useResultManagement({
    appointmentId,
    onSuccess: () => {
      console.log('Management operation completed')
    },
    onError: (error) => {
      console.error('Management operation failed:', error)
    },
  })

  // Alternative: Use simplified file operations hook
  const fileOps = useResultFileOperations({
    appointmentId,
    onFileDeleted: (fileId) => console.log('File deleted:', fileId),
    onFileRestored: (fileId) => console.log('File restored:', fileId),
    onError: (error) => console.error('File operation failed:', error),
  })

  // Handle file upload
  const handleUpload = () => {
    if (selectedFiles.length === 0) return

    uploadFiles({
      files: selectedFiles,
      notes: 'Screening results uploaded by center staff',
      folderName: 'screening-results',
    })
  }

  // Handle file deletion (soft delete)
  const handleDeleteFile = (fileId: string) => {
    const reason = deletionReason || 'File deleted by center staff'

    // Option 1: Using full result management hook
    deleteFile.mutate({
      fileId,
      reason,
      notifyPatient: appointment.status === 'COMPLETED', // Only notify if already completed
    })

    // Option 2: Using simplified file operations hook
    // fileOps.deleteFile(fileId, reason, false) // notifyPatient param
  }

  // Handle file restoration
  const handleRestoreFile = (fileId: string) => {
    // Option 1: Using full result management hook
    restoreFile.mutate({ fileId })

    // Option 2: Using simplified file operations hook
    // fileOps.restoreFile(fileId)
  }

  // Handle appointment completion
  const handleCompleteAppointment = () => {
    // This will:
    // 1. Validate that results have been uploaded
    // 2. Mark appointment as COMPLETED
    // 3. Send notification to patient
    // 4. Lock in the results (future changes trigger notifications)

    completeAppointment.mutate({
      completionNotes:
        completionNotes || 'Appointment completed by center staff',
    })
  }

  return (
    <div className="result-management">
      {/* FILE UPLOAD SECTION */}
      <section className="upload-section">
        <h3>Upload Result Files</h3>

        {/* File Selection UI would go here */}
        <div className="file-input">
          {/* Implementation: File picker component */}
          <p>📁 File picker component goes here</p>
          <p>Selected files: {selectedFiles.length}</p>
        </div>

        {/* Upload Progress */}
        {uploadStates.length > 0 && (
          <div className="upload-progress">
            <h4>Upload Progress</h4>
            {uploadStates.map((state, index) => (
              <div key={index} className="progress-item">
                <span>{state.fileName}</span>
                <span>{state.progress}%</span>
                <span>{state.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0}
          className="upload-btn"
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </button>

        {uploadError && (
          <p className="error">Upload Error: {uploadError.message}</p>
        )}

        {uploadSuccess && (
          <p className="success">Files uploaded successfully!</p>
        )}
      </section>

      {/* UPLOADED FILES MANAGEMENT */}
      <section className="files-section">
        <h3>Uploaded Files</h3>

        {appointment.resultFiles.map((file) => (
          <div
            key={file.id}
            className={`file-item ${file.isDeleted ? 'deleted' : ''}`}
          >
            <div className="file-info">
              <span className="file-name">{file.fileName}</span>
              <span className="upload-date">{file.uploadedAt}</span>

              {file.isDeleted && (
                <div className="deletion-info">
                  <span>Deleted: {file.deletedAt}</span>
                  <span>Reason: {file.deletionReason}</span>
                </div>
              )}
            </div>

            <div className="file-actions">
              {!file.isDeleted ? (
                <>
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="view-btn"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={isDeletingFile}
                    className="delete-btn"
                  >
                    {isDeletingFile ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleRestoreFile(file.id)}
                  disabled={isRestoringFile}
                  className="restore-btn"
                >
                  {isRestoringFile ? 'Restoring...' : 'Restore'}
                </button>
              )}
            </div>
          </div>
        ))}

        {appointment.resultFiles.length === 0 && (
          <p className="no-files">No files uploaded yet</p>
        )}
      </section>

      {/* DELETION REASON INPUT */}
      <section className="deletion-section">
        <h4>Deletion Reason (Optional)</h4>
        <input
          type="text"
          value={deletionReason}
          onChange={(e) => setDeletionReason(e.target.value)}
          placeholder="Reason for deleting file..."
          className="deletion-reason-input"
        />
      </section>

      {/* APPOINTMENT COMPLETION */}
      <section className="completion-section">
        <h3>Complete Appointment</h3>

        <div className="completion-info">
          <p>
            <strong>Current Status:</strong> {appointment.status}
          </p>
          <p>
            <strong>Files Uploaded:</strong>{' '}
            {appointment.resultFiles.filter((f) => !f.isDeleted).length}
          </p>

          {appointment.status === 'IN_PROGRESS' && (
            <div className="completion-warning">
              ⚠️ Once completed, the patient will be notified and any future
              file changes will trigger additional notifications.
            </div>
          )}
        </div>

        <div className="completion-notes">
          <label htmlFor="completion-notes">Completion Notes (Optional)</label>
          <textarea
            id="completion-notes"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Notes about the completed appointment..."
            className="completion-notes-input"
          />
        </div>

        <button
          onClick={handleCompleteAppointment}
          disabled={
            appointment.status !== 'IN_PROGRESS' ||
            appointment.resultFiles.filter((f) => !f.isDeleted).length === 0 ||
            isCompletingAppointment
          }
          className="complete-btn"
        >
          {isCompletingAppointment ? 'Completing...' : 'Mark as Completed'}
        </button>

        {appointment.status === 'COMPLETED' && (
          <p className="completion-status">
            ✅ Appointment completed. Patient has been notified.
          </p>
        )}

        {completeError && (
          <p className="error">Completion Error: {completeError.message}</p>
        )}

        {completeSuccess && (
          <p className="success">Appointment completed successfully!</p>
        )}
      </section>

      {/* LOADING STATES */}
      {isManaging && (
        <div className="loading-overlay">
          <p>Processing operation...</p>
        </div>
      )}

      {/* ERROR HANDLING */}
      {(deleteError || restoreError) && (
        <div className="error-section">
          {deleteError && (
            <p className="error">Delete Error: {deleteError.message}</p>
          )}
          {restoreError && (
            <p className="error">Restore Error: {restoreError.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * USAGE NOTES FOR FRONTEND DEVELOPERS:
 *
 * 1. UPLOAD FLOW:
 *    - Use useResultUpload for file uploads
 *    - Files are uploaded but appointment stays IN_PROGRESS
 *    - No patient notifications are sent during upload
 *
 * 2. FILE MANAGEMENT:
 *    - Use useResultManagement or useResultFileOperations for delete/restore
 *    - Deletes are soft deletes (can be restored)
 *    - If appointment is COMPLETED, file changes trigger patient notifications
 *
 * 3. APPOINTMENT COMPLETION:
 *    - Use useResultManagement.completeAppointment
 *    - Validates that files have been uploaded
 *    - Sends notification to patient
 *    - Changes appointment status to COMPLETED
 *    - Cannot be undone
 *
 * 4. ERROR HANDLING:
 *    - All hooks provide error states
 *    - Handle network errors, validation errors, etc.
 *    - Show appropriate user feedback
 *
 * 5. LOADING STATES:
 *    - All hooks provide loading states
 *    - Disable buttons during operations
 *    - Show progress indicators
 *
 * 6. QUERY INVALIDATION:
 *    - Hooks automatically invalidate relevant queries
 *    - Appointment data will refresh after operations
 *    - No manual refetching needed
 */
