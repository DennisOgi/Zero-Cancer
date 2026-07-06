import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  fetchPatientEnrollmentRequests,
  respondToEnrollmentRequest,
} from '@/services/enrollment.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Clock, Loader2, MapPin } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function PatientEnrollmentRequests() {
  const queryClient = useQueryClient()
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['patientEnrollmentRequests'],
    queryFn: () => fetchPatientEnrollmentRequests('PENDING'),
    refetchOnWindowFocus: true,
  })

  const respondMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string
      action: 'approve' | 'reject'
    }) => respondToEnrollmentRequest(id, action),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patientEnrollmentRequests'] })
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
      queryClient.invalidateQueries({ queryKey: ['waitlists'] })
      toast.success(
        variables.action === 'approve'
          ? response.message || 'Enrollment approved'
          : 'Enrollment request declined',
      )
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || 'Failed to respond to enrollment request',
      )
    },
    onSettled: () => {
      setRespondingId(null)
    },
  })

  const requests = data?.data?.requests || []

  const handleApprove = (request: {
    id: string
    center?: { centerName?: string }
    screeningType?: { name?: string }
  }) => {
    const centerName = request.center?.centerName || 'this center'
    const screeningName = request.screeningType?.name || 'screening'
    const confirmed = window.confirm(
      `Approve enrollment with ${centerName} for ${screeningName}?\n\nThis will set ${centerName} as your assigned center and update your waitlist.`,
    )
    if (!confirmed) return
    setRespondingId(request.id)
    respondMutation.mutate({ id: request.id, action: 'approve' })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading enrollment requests...
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">
            Could not load enrollment requests
          </CardTitle>
          <CardDescription className="text-red-800">
            Please check your connection and try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-amber-900">
          Center enrollment requests
        </CardTitle>
        <CardDescription className="text-amber-800">
          These centers have requested to enroll you. Approve only if you want to
          join that center — approving will change your assigned center.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request: any) => (
          <div
            key={request.id}
            className="rounded-lg border bg-white p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="font-semibold">{request.center?.centerName}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {request.center?.address}, {request.center?.lga},{' '}
                  {request.center?.state}
                </p>
                <p className="text-sm">
                  Screening:{' '}
                  <span className="font-medium">
                    {request.screeningType?.name}
                  </span>
                </p>
                {request.expiresAt ? (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Respond by{' '}
                    {new Date(request.expiresAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={respondMutation.isPending}
                onClick={() => handleApprove(request)}
              >
                {respondingId === request.id && respondMutation.isPending
                  ? 'Approving...'
                  : 'Approve'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={respondMutation.isPending}
                onClick={() => {
                  setRespondingId(request.id)
                  respondMutation.mutate({ id: request.id, action: 'reject' })
                }}
              >
                {respondingId === request.id && respondMutation.isPending
                  ? 'Declining...'
                  : 'Decline'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
