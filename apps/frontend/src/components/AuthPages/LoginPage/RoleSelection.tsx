import { Label } from '@/components/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/shared/ui/radio-group'
import { cn } from '@/lib/utils'
import { useId } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'

interface RoleSelectionProps {
  field: ControllerRenderProps<any, 'role'>
  selectedRoles?: string[]
}

export default function RoleSelection({
  field,
  selectedRoles,
}: RoleSelectionProps) {
  const id = useId()
  const roles = [
    {
      value: 'patient',
      label: 'Patient',
      description: 'Book, waitlist, and view your results.',
    },
    {
      value: 'donor',
      label: 'Donor',
      description: 'Create and view donation campaigns.',
    },
    {
      value: 'center',
      label: 'Center',
      description: 'Manage dashboard, staff, and results.',
    },
    {
      value: 'center-staff',
      label: 'Center Staff',
      description: 'Manage dashboard, staff, and results.',
    },
  ]

  return (
    <RadioGroup
      className="flex flex-col lg:flex-row gap-4"
      defaultValue={field.value}
      onValueChange={field.onChange}
      {...field}
    >
      {roles
        .filter((role) => !selectedRoles || selectedRoles.includes(role.value))
        .map((role) => (
          <div
            key={role.value}
            className={cn(
              'border-input has-data-[state=checked]:border-primary relative flex w-full items-start gap-2 rounded-md border p-4 shadow-sm transition',
            )}
          >
            <RadioGroupItem
              value={role.value}
              id={`${id}-${role.value}`}
              aria-describedby={`${id}-${role.value}-description`}
              className="order-1 mt-0.5 after:absolute after:inset-0"
            />
            <div className="grid grow gap-1.5">
              <Label htmlFor={`${id}-${role.value}`} className="font-semibold">
                {role.label}
              </Label>
            </div>
          </div>
        ))}
    </RadioGroup>
  )
}
