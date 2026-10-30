import { StaffSchedulePage } from '@/components/CenterPages/StaffSchedule.page'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { teamStaffSchedules } from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { staffRoleLabel } from '@zerocancer/shared'
import { Loader2, Pencil } from 'lucide-react'
import { useState } from 'react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function TeamSchedulesPage() {
  const { data, isLoading, isError, refetch } = useQuery(teamStaffSchedules())
  const schedules = data?.data?.schedules || []
  const [editing, setEditing] = useState<{
    staffId: string
    fullName: string
  } | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-sm text-red-600">Could not load team schedules.</p>
        <button className="underline text-sm" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team schedules</h1>
        <p className="mt-1 text-muted-foreground">
          Personal hours for doctors and nurses. Referred patients book inside
          the intersection of facility hours and these schedules. Edit a
          clinician&apos;s hours if they have not set them yet.
        </p>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No clinical staff on your team yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {schedules.map((row: any) => (
            <Card key={row.staffId}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-lg">{row.fullName}</CardTitle>
                  <CardDescription>
                    {staffRoleLabel(row.role)} · {row.email}
                    {!row.hasCustomHours
                      ? ' · using facility hours until personal schedule is saved'
                      : ''}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditing({
                      staffId: row.staffId,
                      fullName: row.fullName,
                    })
                  }
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(row.weekly || []).map((rule: any) => (
                  <div
                    key={rule.weekday}
                    className="flex items-center justify-between border-b last:border-0 py-1"
                  >
                    <span className="font-medium">{WEEKDAYS[rule.weekday]}</span>
                    <span className="text-muted-foreground">
                      {rule.isOpen
                        ? `${rule.startTime} – ${rule.endTime}`
                        : 'Closed'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.fullName
                ? `Edit schedule — ${editing.fullName}`
                : 'Edit schedule'}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <StaffSchedulePage
              key={editing.staffId}
              staffId={editing.staffId}
              staffName={editing.fullName}
              embedded
              onSaved={() => {
                void refetch()
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
