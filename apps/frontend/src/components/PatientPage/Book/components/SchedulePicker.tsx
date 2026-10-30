import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { useAuthUser } from '@/services/providers/auth.provider'
import { publicCenterAvailability } from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import AppointmentDatePicker from './AppointmentDatePicker'
import TimeSlotsPicker from './TimeSlotsPicker'

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function labelTime(value: string) {
  const [hourText, minuteText = '00'] = value.split(':')
  const hour = Number(hourText)
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minuteText} ${hour >= 12 ? 'PM' : 'AM'}`
}

export type SchedulePickerProps = {
  centerId?: string
  date: string
  onDateChange: (v: string) => void
  time: string
  onTimeChange: (v: string) => void
  timeSlots?: { value: string; label: string }[]
}

export function SchedulePicker({
  centerId,
  date,
  onDateChange,
  time,
  onTimeChange,
  timeSlots,
}: SchedulePickerProps) {
  const authUserQuery = useQuery(useAuthUser())
  const referredByStaffId =
    (authUserQuery.data?.data?.user as any)?.referredByStaffId || undefined

  const from = toDateKey(new Date())
  const toDate = new Date()
  toDate.setDate(toDate.getDate() + 60)
  const to = toDateKey(toDate)

  const { data, isLoading } = useQuery({
    ...publicCenterAvailability(centerId || '', {
      from,
      to,
      staffId: referredByStaffId,
    }),
    enabled: Boolean(centerId),
  })

  const openDays = React.useMemo(
    () =>
      (data?.data?.days || []).filter(
        (day) => day.isOpen && day.slots.some((slot) => slot.remaining > 0),
      ),
    [data],
  )
  const allowedDates = React.useMemo(
    () => new Set(openDays.map((day) => day.date)),
    [openDays],
  )
  const selectedDay = openDays.find((day) => day.date === date.slice(0, 10))

  const slots = React.useMemo(() => {
    if (selectedDay) {
      return selectedDay.slots
        .filter((slot) => slot.remaining > 0)
        .map((slot) => ({
          value: slot.time,
          label: `${labelTime(slot.time)} · ${slot.remaining} left`,
        }))
    }
    // When booking against a facility calendar, never invent open hours
    if (centerId) return []
    return (
      timeSlots ||
      Array.from({ length: 9 }, (_, i) => {
        const hour = i + 9
        const value = `${hour.toString().padStart(2, '0')}:00`
        return { value, label: labelTime(value) }
      })
    )
  }, [centerId, selectedDay, timeSlots])

  React.useEffect(() => {
    if (date && allowedDates.size && !allowedDates.has(date.slice(0, 10))) {
      onDateChange('')
      onTimeChange('')
    }
  }, [allowedDates, date, onDateChange, onTimeChange])

  React.useEffect(() => {
    if (time && selectedDay && !selectedDay.slots.some((slot) => slot.time === time && slot.remaining > 0)) {
      onTimeChange('')
    }
  }, [onTimeChange, selectedDay, time])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Schedule Your Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Appointment Date
            </label>
            <AppointmentDatePicker
              value={date}
              onChange={onDateChange}
              allowedDates={centerId ? allowedDates : undefined}
            />
            {centerId && !isLoading && allowedDates.size === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                This facility has no open booking days in the next 60 days.
              </p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Appointment Time
            </label>
            <div className="max-h-64 overflow-auto pr-1">
              <TimeSlotsPicker
                slots={slots}
                value={time}
                onChange={onTimeChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SchedulePicker
