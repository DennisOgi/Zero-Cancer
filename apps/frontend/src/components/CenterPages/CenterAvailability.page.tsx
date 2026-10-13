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
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  ownCenterAvailability,
  useUpdateCenterAvailability,
} from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import type {
  TAvailabilityException,
  TAvailabilityRule,
} from '@zerocancer/shared/types'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

export function CenterAvailabilityPage() {
  const authUserQuery = useQuery(useAuthUser())
  const user = authUserQuery.data?.data?.user
  const canEdit = user?.profile === 'CENTER' || user?.staffRole === 'ADMIN'
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

  const { data, isLoading } = useQuery(ownCenterAvailability({ from, to }))
  const updateAvailability = useUpdateCenterAvailability()

  const [weekly, setWeekly] = useState<TAvailabilityRule[]>(defaultWeekly())
  const [exceptions, setExceptions] = useState<TAvailabilityException[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [exceptionReason, setExceptionReason] = useState('')
  const [exceptionStart, setExceptionStart] = useState('09:00')
  const [exceptionEnd, setExceptionEnd] = useState('13:00')

  useEffect(() => {
    if (data?.data?.weekly?.length) {
      setWeekly(defaultWeekly().map((fallback) => {
        const match = data.data.weekly.find((item) => item.weekday === fallback.weekday)
        return match || fallback
      }))
    }
    if (data?.data?.exceptions) {
      setExceptions(data.data.exceptions)
    }
  }, [data])

  const daysByDate = useMemo(() => {
    return new Map((data?.data?.days || []).map((day) => [day.date, day]))
  }, [data])

  const selectedKey = selectedDate ? toDateKey(selectedDate) : ''
  const selectedException = exceptions.find((item) => item.date === selectedKey)

  const updateDay = (weekday: number, patch: Partial<TAvailabilityRule>) => {
    setWeekly((current) =>
      current.map((item) => (item.weekday === weekday ? { ...item, ...patch } : item)),
    )
  }

  const handleSave = () => {
    updateAvailability.mutate(
      { weekly, exceptions },
      {
        onSuccess: () => toast.success('Availability saved'),
        onError: (error: any) =>
          toast.error(error?.response?.data?.error || 'Could not save availability'),
      },
    )
  }

  const closeSelectedDay = () => {
    setExceptions((current) => [
      ...current.filter((item) => item.date !== selectedKey),
      { date: selectedKey, type: 'CLOSED', reason: exceptionReason || 'Closed' },
    ])
    setDialogOpen(false)
  }

  const openSelectedDay = () => {
    setExceptions((current) => [
      ...current.filter((item) => item.date !== selectedKey),
      {
        date: selectedKey,
        type: 'OPEN',
        startTime: exceptionStart,
        endTime: exceptionEnd,
        slotMinutes: weekly[0]?.slotMinutes || 60,
        maxBookingsPerSlot: weekly[0]?.maxBookingsPerSlot || 4,
        reason: exceptionReason || 'Extra screening day',
      },
    ])
    setDialogOpen(false)
  }

  const clearSelectedDay = () => {
    setExceptions((current) => current.filter((item) => item.date !== selectedKey))
    setDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Availability</h1>
          <p className="mt-1 text-muted-foreground">
            Set the days and times patients can book screening appointments.
          </p>
        </div>
        {canEdit ? (
          <Button onClick={handleSave} disabled={updateAvailability.isPending}>
            {updateAvailability.isPending ? 'Saving...' : 'Save hours'}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Only facility admins can edit hours.</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly hours</CardTitle>
          <CardDescription>
            These repeat every week. Use the calendar below for holidays or extra outreach days.
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
                  disabled={!canEdit}
                  onChange={(event) => updateDay(rule.weekday, { isOpen: event.target.checked })}
                />
                {WEEKDAYS[rule.weekday]}
              </label>
              <Input
                type="time"
                value={rule.startTime}
                disabled={!canEdit || !rule.isOpen}
                onChange={(event) => updateDay(rule.weekday, { startTime: event.target.value })}
              />
              <Input
                type="time"
                value={rule.endTime}
                disabled={!canEdit || !rule.isOpen}
                onChange={(event) => updateDay(rule.weekday, { endTime: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={15}
                  max={240}
                  value={rule.slotMinutes}
                  disabled={!canEdit || !rule.isOpen}
                  onChange={(event) =>
                    updateDay(rule.weekday, { slotMinutes: Number(event.target.value) || 60 })
                  }
                />
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={rule.maxBookingsPerSlot}
                  disabled={!canEdit || !rule.isOpen}
                  onChange={(event) =>
                    updateDay(rule.weekday, {
                      maxBookingsPerSlot: Number(event.target.value) || 4,
                    })
                  }
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            The last two fields are slot length in minutes and how many patients can book each slot.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Month calendar</CardTitle>
          <CardDescription>
            Green days are open. Click a date to close it or add extra hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date || !canEdit) return
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
                  exceptions.find((item) => item.date === key && item.type === 'CLOSED') ||
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
            <Button variant="outline" onClick={clearSelectedDay}>
              Use weekly hours
            </Button>
            <Button variant="destructive" onClick={closeSelectedDay}>
              Close this day
            </Button>
            <Button onClick={openSelectedDay}>Open extra hours</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
