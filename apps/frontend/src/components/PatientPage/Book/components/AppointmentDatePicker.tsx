import { Button } from '@/components/shared/ui/button'
import { Calendar as ShadCalendar } from '@/components/shared/ui/calendar'
import {
  Popover as ShadPopover,
  PopoverContent as ShadPopoverContent,
  PopoverTrigger as ShadPopoverTrigger,
} from '@/components/shared/ui/popover'
import { ChevronDownIcon } from 'lucide-react'

interface AppointmentDatePickerProps {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  disableWeekends?: boolean
}

export function AppointmentDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disableWeekends = true,
}: AppointmentDatePickerProps) {
  return (
    <ShadPopover>
      <ShadPopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
        >
          {value ? new Date(value).toLocaleDateString() : placeholder}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </ShadPopoverTrigger>
      <ShadPopoverContent className="w-auto p-0" align="start">
        <ShadCalendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date: Date | undefined) => {
            onChange(date ? date.toISOString() : '')
          }}
          disabled={(date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const dayOfWeek = date.getDay()
            return (
              date < today ||
              (disableWeekends && (dayOfWeek === 0 || dayOfWeek === 6))
            )
          }}
          initialFocus
        />
      </ShadPopoverContent>
    </ShadPopover>
  )
}

export default AppointmentDatePicker
