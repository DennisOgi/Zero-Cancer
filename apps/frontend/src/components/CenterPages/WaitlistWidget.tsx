import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card'
import { Button } from '@/components/shared/ui/button'
import { allWaitlists } from '@/services/providers/waitlist.provider'
import { useQuery } from '@tanstack/react-query'
import { Users, TrendingUp, Clock } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function WaitlistWidget() {
  const { data: waitlistData, isLoading } = useQuery(
    allWaitlists({ page: 1, pageSize: 5, demandOrder: 'desc' })
  )

  const waitlists = waitlistData?.data?.waitlists || []
  const totalPending = waitlists.reduce((sum, w) => sum + w.pendingCount, 0)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (waitlists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No patients currently on waitlist
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Waitlist Overview
        </CardTitle>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="font-semibold">{totalPending}</span>
          <span>pending</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {waitlists.slice(0, 3).map((waitlist) => (
            <div
              key={waitlist.screeningTypeId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {waitlist.screeningType.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {waitlist.pendingCount} patient{waitlist.pendingCount !== 1 ? 's' : ''} waiting
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {waitlist.pendingCount}
                  </div>
                  <div className="text-xs text-muted-foreground">pending</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {waitlists.length > 3 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              +{waitlists.length - 3} more screening types with waitlists
            </p>
          </div>
        )}

        <div className="pt-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900">
                  Waitlist Matching Active
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Patients are automatically matched with available donations
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full" size="sm" asChild>
          <Link to="/center/appointments">
            View All Waitlists
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
