// import { ResultViewer } from '@/components/ResultViewer'
// import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { ResultUploadComponent } from '@/components/CenterPages/ResultUploadComponent'
// Removed Badge, Input, Select imports in favor of extracted components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { centerAppointments } from '@/services/providers/center.provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CenterUploadResultsFilters } from './CenterUploadResultsFilters'
import { CenterAppointmentList } from './CenterAppointmentList'

export function CenterUploadResultsPage() {
  const queryClient = useQueryClient()
  const [selectedAppointment, setSelectedAppointment] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState('completed')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch completed appointments that need results uploaded
  const { data: appointmentsData, isLoading } = useQuery(
    centerAppointments({
      page: 1,
      pageSize: 50,
    }),
  )

  const appointments = appointmentsData?.data?.appointments || []

  // Filter appointments that are completed and don't have results yet
  const eligibleAppointments = appointments.filter((apt: any) => {
    const matchesSearch =
      !searchTerm ||
      apt.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.screeningType?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const isCompleted = apt.status === 'COMPLETED'
    const isInProgress = apt.status === 'IN_PROGRESS'
    const needsResults = !(apt as any).result?.id

    return (
      matchesSearch &&
      (isCompleted || isInProgress) &&
      (statusFilter === 'all' || needsResults)
    )
  })

  const selectedAppointmentData = appointments.find(
    (apt: any) => apt.id === selectedAppointment,
  )

  const handleSelectAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Upload Results</h1>
        <p className="text-muted-foreground">
          Upload screening results for completed appointments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <CenterUploadResultsFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            {/* Appointments List */}
            <CenterAppointmentList
              appointments={eligibleAppointments}
              isLoading={isLoading}
              selectedId={selectedAppointment}
              onSelect={handleSelectAppointment}
            />
          </CardContent>
        </Card>

        {/* Result Upload Component */}
        {!selectedAppointment ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an appointment to upload results</p>
                <p className="text-sm">Choose from appointments on the left</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <ResultUploadComponent
              appointmentId={selectedAppointment}
              appointmentData={selectedAppointmentData}
              onUploadComplete={() => {
                // Invalidate queries to refresh appointment list
                queryClient.invalidateQueries({
                  queryKey: ['centerAppointments'],
                })
              }}
              onAppointmentComplete={() => {
                // Refresh and clear selection
                queryClient.invalidateQueries({
                  queryKey: ['centerAppointments'],
                })
                setSelectedAppointment('')
                toast.success('Appointment completed successfully!')
              }}
            />

            {/* Show existing results if any */}
            {/* <ResultViewer
              appointmentId={selectedAppointment}
              showHeader={true}
              compact={false}
            /> */}
          </div>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">For Center Staff:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • Upload results for completed or in-progress appointments
                </li>
                <li>• Ensure all screening procedures are finished</li>
                <li>• Include all relevant test results and reports</li>
                <li>• Double-check patient identity before submitting</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">File Requirements:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Supported: PDF, JPG, PNG, DOC, DOCX</li>
                <li>• Maximum file size: 10MB per file</li>
                <li>• Multiple files can be uploaded per appointment</li>
                <li>• Files are securely stored and encrypted</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once uploaded, results will be
              automatically made available to patients through their patient
              portal. Ensure accuracy before submission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
