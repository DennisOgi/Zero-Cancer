import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import * as React from 'react'
import AppointmentDatePicker from './AppointmentDatePicker'
import TimeSlotsPicker from './TimeSlotsPicker'

export type SchedulePickerProps = {
  date: string
  onDateChange: (v: string) => void
  time: string
  onTimeChange: (v: string) => void
  timeSlots?: { value: string; label: string }[]
}

export function SchedulePicker({
  date,
  onDateChange,
  time,
  onTimeChange,
  timeSlots,
}: SchedulePickerProps) {
  // Default time slots 9AM - 5PM hourly
  const slots = React.useMemo(
    () =>
      timeSlots ||
      Array.from({ length: 9 }, (_, i) => {
        const hour = i + 9
        const value = `${hour.toString().padStart(2, '0')}:00`
        const displayHour = hour === 12 ? 12 : hour > 12 ? hour - 12 : hour
        const meridiem = hour >= 12 ? 'PM' : 'AM'
        return { value, label: `${displayHour}:00 ${meridiem}` }
      }),
    [timeSlots],
  )

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
            <AppointmentDatePicker value={date} onChange={onDateChange} />
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
