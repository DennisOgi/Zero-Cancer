import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { centerEnrollmentRequests } from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { Clock, Loader2, User } from 'lucide-react'

function formatExpiry(expiresAt?: string) {
  if (!expiresAt) return ''
  const date = new Date(expiresAt)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PendingEnrollmentRequestsWidget() {
  const { data, isLoading } = useQuery(centerEnrollmentRequests('PENDING'))

  const requests = data?.data?.requests || []

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

  if (requests.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-amber-900">
          Pending patient approvals ({requests.length})
        </CardTitle>
        <CardDescription className="text-amber-800">
          These patients must approve before they appear as assigned to your
          center.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request: any) => (
          <div
            key={request.id}
            className="rounded-lg border bg-white p-4 space-y-2"
          >
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">
                  {request.patient?.fullName || 'Patient'}
                </p>
                {request.patient?.phone ? (
                  <p className="text-sm text-muted-foreground">
                    {request.patient.phone}
                  </p>
                ) : null}
                <p className="text-sm">
                  Screening:{' '}
                  <span className="font-medium">
                    {request.screeningType?.name}
                  </span>
                </p>
                {request.expiresAt ? (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Expires {formatExpiry(request.expiresAt)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
