import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Button } from '@/components/shared/ui/button'
import { centerPatientsOverview } from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { UserCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function AssignedPatientsWidget() {
  const { data: overviewData, isLoading } = useQuery(centerPatientsOverview())
  const patients = overviewData?.data?.recentPatients || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assigned Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Assigned Patients
        </CardTitle>
        <Button variant="link" size="sm" asChild>
          <Link to="/center/register-patient">Enroll</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No patients assigned to your center yet. New signups in your area are
            matched automatically.
          </p>
        ) : (
          <div className="space-y-3">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{patient.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {patient.email}
                  </p>
                  {(patient.city || patient.state) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[patient.city, patient.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-blue-700">
                    {patient.waitlistCount} waitlist
                    {patient.waitlistCount !== 1 ? 's' : ''}
                  </p>
                  {patient.pendingCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {patient.pendingCount} pending
                    </p>
                  )}
                  {patient.matchedCount > 0 && (
                    <p className="text-xs text-green-700">
                      {patient.matchedCount} matched
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
