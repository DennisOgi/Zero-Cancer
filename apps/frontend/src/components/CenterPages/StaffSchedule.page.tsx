import { Button } from '@/components/shared/ui/button'
import { Calendar } from '@/components/shared/ui/calendar'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { Input } from '@/components/shared/ui/input'
import {
  staffAvailability,
  useUpdateStaffAvailability,
} from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import type {
  TAvailabilityException,
  TAvailabilityRule,
} from '@zerocancer/shared/types'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultWeekly(): TAvailabilityRule[] {
  return WEEKDAYS.map((_, weekday) => ({
    weekday,
    isOpen: weekday >= 1 && weekday <= 5,
    startTime: '09:00',
    endTime: '17:00',
    slotMinutes: 60,
    maxBookingsPerSlot: 4,
  }))
}

export type StaffSchedulePageProps = {
  /** When set (admin editing a teammate), load/save that staff member's hours */
  staffId?: string
  staffName?: string
  embedded?: boolean
  onSaved?: () => void
}

export function StaffSchedulePage({
  staffId,
  staffName,
  embedded = false,
  onSaved,
}: StaffSchedulePageProps = {}) {
  const monthStart = useMemo(() => {
    const now = new Date()
    now.setDate(1)
    now.setHours(0, 0, 0, 0)
    return now
  }, [])
  const from = toDateKey(monthStart)
  const toDate = new Date(monthStart)
  toDate.setMonth(toDate.getMonth() + 2)
  toDate.setDate(0)
  const to = toDateKey(toDate)

  const { data, isLoading } = useQuery(
    staffAvailability({ from, to, staffId }),
  )
  const updateAvailability = useUpdateStaffAvailability()

  const [weekly, setWeekly] = useState<TAvailabilityRule[]>(defaultWeekly())
  const [exceptions, setExceptions] = useState<TAvailabilityException[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [exceptionReason, setExceptionReason] = useState('')
  const [exceptionStart, setExceptionStart] = useState('09:00')
  const [exceptionEnd, setExceptionEnd] = useState('13:00')

  const hasCustomHours = Boolean(data?.data?.hasCustomHours)

  useEffect(() => {
    if (data?.data?.weekly?.length) {
      setWeekly(
        defaultWeekly().map((fallback) => {
          const match = data.data.weekly.find(
            (item: TAvailabilityRule) => item.weekday === fallback.weekday,
          )
          return match || fallback
        }),
      )
    }
    if (data?.data?.exceptions) {
      setExceptions(data.data.exceptions)
    }
  }, [data])

  const daysByDate = useMemo(() => {
    return new Map(
      (data?.data?.days || []).map((day: any) => [day.date, day]),
    )
  }, [data])

  const selectedKey = selectedDate ? toDateKey(selectedDate) : ''
  const selectedException = exceptions.find((item) => item.date === selectedKey)

  const updateDay = (weekday: number, patch: Partial<TAvailabilityRule>) => {
    setWeekly((current) =>
      current.map((item) =>
        item.weekday === weekday ? { ...item, ...patch } : item,
      ),
    )
  }

  const handleSave = () => {
    updateAvailability.mutate(
      { weekly, exceptions, ...(staffId ? { staffId } : {}) },
      {
        onSuccess: () => {
          toast.success(
            staffName
              ? `Schedule saved for ${staffName}`
              : 'Your schedule was saved',
          )
          onSaved?.()
        },
        onError: (error: any) =>
          toast.error(
            error?.response?.data?.error || 'Could not save schedule',
          ),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const title = staffName ? `${staffName}'s schedule` : 'My schedule'
  const subtitle = staffName
    ? 'Patients referred by this clinician book inside the intersection of facility hours and these hours.'
    : 'Patients who join through your referral link can only book during these hours (intersected with facility open times).'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!embedded ? <h1 className="text-3xl font-bold">{title}</h1> : null}
          {embedded ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : (
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Button onClick={handleSave} disabled={updateAvailability.isPending}>
          {updateAvailability.isPending ? 'Saving...' : 'Save schedule'}
        </Button>
      </div>

      {!hasCustomHours ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Personal hours are not saved yet. Until you save, referred patients
          can book any open facility slot. Edit the week below and click Save
          schedule to enforce these hours.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Weekly hours</CardTitle>
          <CardDescription>
            These repeat every week. Use the calendar for time off or extra
            days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {weekly.map((rule) => (
            <div
              key={rule.weekday}
              className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[140px_1fr_1fr_1fr] sm:items-center"
            >
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={rule.isOpen}
                  onChange={(event) =>
                    updateDay(rule.weekday, { isOpen: event.target.checked })
                  }
                />
                {WEEKDAYS[rule.weekday]}
              </label>
              <Input
                type="time"
                value={rule.startTime}
                disabled={!rule.isOpen}
                onChange={(event) =>
                  updateDay(rule.weekday, { startTime: event.target.value })
                }
              />
              <Input
                type="time"
                value={rule.endTime}
                disabled={!rule.isOpen}
                onChange={(event) =>
                  updateDay(rule.weekday, { endTime: event.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={15}
                  max={240}
                  value={rule.slotMinutes}
                  disabled={!rule.isOpen}
                  onChange={(event) =>
                    updateDay(rule.weekday, {
                      slotMinutes: Number(event.target.value) || 60,
                    })
                  }
                />
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={rule.maxBookingsPerSlot}
                  disabled={!rule.isOpen}
                  onChange={(event) =>
                    updateDay(rule.weekday, {
                      maxBookingsPerSlot: Number(event.target.value) || 4,
                    })
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Month calendar</CardTitle>
          <CardDescription>
            Click a date to close it or add extra hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return
              setSelectedDate(date)
              setExceptionReason(selectedException?.reason || '')
              setExceptionStart(selectedException?.startTime || '09:00')
              setExceptionEnd(selectedException?.endTime || '13:00')
              setDialogOpen(true)
            }}
            modifiers={{
              open: (date) => daysByDate.get(toDateKey(date))?.isOpen === true,
              closed: (date) => {
                const key = toDateKey(date)
                return Boolean(
                  exceptions.find(
                    (item) => item.date === key && item.type === 'CLOSED',
                  ) ||
                    (daysByDate.get(key) && !daysByDate.get(key)?.isOpen),
                )
              },
            }}
            modifiersClassNames={{
              open: 'bg-emerald-100 text-emerald-900',
              closed: 'bg-rose-50 text-rose-700',
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Reason (optional)"
              value={exceptionReason}
              onChange={(event) => setExceptionReason(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="time"
                value={exceptionStart}
                onChange={(event) => setExceptionStart(event.target.value)}
              />
              <Input
                type="time"
                value={exceptionEnd}
                onChange={(event) => setExceptionEnd(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setExceptions((current) =>
                  current.filter((item) => item.date !== selectedKey),
                )
                setDialogOpen(false)
              }}
            >
              Use weekly hours
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setExceptions((current) => [
                  ...current.filter((item) => item.date !== selectedKey),
                  {
                    date: selectedKey,
                    type: 'CLOSED',
                    reason: exceptionReason || 'Unavailable',
                  },
                ])
                setDialogOpen(false)
              }}
            >
              Close this day
            </Button>
            <Button
              onClick={() => {
                setExceptions((current) => [
                  ...current.filter((item) => item.date !== selectedKey),
                  {
                    date: selectedKey,
                    type: 'OPEN',
                    startTime: exceptionStart,
                    endTime: exceptionEnd,
                    slotMinutes: weekly[0]?.slotMinutes || 60,
                    maxBookingsPerSlot: weekly[0]?.maxBookingsPerSlot || 4,
                    reason: exceptionReason || 'Extra hours',
                  },
                ])
                setDialogOpen(false)
              }}
            >
              Open extra hours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
