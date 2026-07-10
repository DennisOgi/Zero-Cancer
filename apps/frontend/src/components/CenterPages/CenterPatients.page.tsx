import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { centerPatientsList } from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2, Search, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export function CenterPatientsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    centerPatientsList({
      page,
      pageSize,
      search: debouncedSearch || undefined,
    }),
  )

  const patients = data?.data?.patients || []
  const total = data?.data?.total || 0
  const totalPages = data?.data?.totalPages || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="mt-1 text-muted-foreground">
            All patients assigned to your center after registration, enrollment
            approval, or location matching.
          </p>
        </div>
        <Button asChild>
          <Link to="/center/register-patient">
            <UserPlus className="mr-2 h-4 w-4" />
            Register / Enroll
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned patients
            </CardTitle>
            <CardDescription>
              {total} patient{total === 1 ? '' : 's'} at your center
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading patients...
            </div>
          ) : isError ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-sm text-red-600">Could not load patients.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : patients.length === 0 ? (
            <div className="space-y-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {debouncedSearch
                  ? 'No patients match your search.'
                  : 'No patients assigned to your center yet.'}
              </p>
              {!debouncedSearch ? (
                <Button asChild variant="outline">
                  <Link to="/center/register-patient">Register a patient</Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {isFetching && !isLoading ? (
                <p className="text-xs text-muted-foreground">Updating…</p>
              ) : null}
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{patient.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {patient.email}
                    </p>
                    {patient.phone ? (
                      <p className="text-sm text-muted-foreground">
                        WhatsApp: {patient.phone}
                      </p>
                    ) : null}
                    {(patient.city || patient.state) && (
                      <p className="text-xs text-muted-foreground">
                        {[patient.city, patient.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 space-y-1 text-left sm:text-right">
                    <p className="text-sm font-medium text-blue-700">
                      {patient.waitlistCount} waitlist
                      {patient.waitlistCount !== 1 ? 's' : ''}
                    </p>
                    {patient.pendingCount > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {patient.pendingCount} pending funding
                      </p>
                    ) : null}
                    {patient.matchedCount > 0 ? (
                      <p className="text-xs text-green-700">
                        {patient.matchedCount} matched / funded
                      </p>
                    ) : null}
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                    >
                      <Link to="/center/reports">Create report</Link>
                    </Button>
                  </div>
                </div>
              ))}

              {totalPages > 1 ? (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
