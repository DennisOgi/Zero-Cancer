import { Button } from '@/components/shared/ui/button'
import { Calendar as ShadCalendar } from '@/components/shared/ui/calendar'
import {
  Popover as ShadPopover,
  PopoverContent as ShadPopoverContent,
  PopoverTrigger as ShadPopoverTrigger,
} from '@/components/shared/ui/popover'
import { ChevronDownIcon } from 'lucide-react'

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface AppointmentDatePickerProps {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  allowedDates?: Set<string>
}

export function AppointmentDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  allowedDates,
}: AppointmentDatePickerProps) {
  const selected = value ? new Date(`${value.slice(0, 10)}T00:00:00`) : undefined

  return (
    <ShadPopover>
      <ShadPopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
        >
          {selected ? selected.toLocaleDateString() : placeholder}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </ShadPopoverTrigger>
      <ShadPopoverContent className="w-auto p-0" align="start">
        <ShadCalendar
          mode="single"
          selected={selected}
          onSelect={(date: Date | undefined) => {
            onChange(date ? toDateKey(date) : '')
          }}
          disabled={(date) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (date < today) return true
            if (!allowedDates) return date.getDay() === 0 || date.getDay() === 6
            return !allowedDates.has(toDateKey(date))
          }}
          initialFocus
        />
      </ShadPopoverContent>
    </ShadPopover>
  )
}

export default AppointmentDatePicker
