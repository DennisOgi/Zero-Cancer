import { Button } from '@/components/shared/ui/button'
import { cn } from '@/lib/utils'

interface TimeSlotsPickerProps {
  slots: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}

export function TimeSlotsPicker({
  slots,
  value,
  onChange,
}: TimeSlotsPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => (
        <Button
          key={slot.value}
          type="button"
          variant={value === slot.value ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'text-xs',
            value === slot.value && 'bg-pink-600 hover:bg-pink-700',
          )}
          onClick={() => onChange(slot.value)}
        >
          {slot.label}
        </Button>
      ))}
    </div>
  )
}

export default TimeSlotsPicker
