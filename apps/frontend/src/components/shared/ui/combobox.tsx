'use client'

import { Check, ChevronDown } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/shared/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/shared/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shared/ui/popover'
import { cn } from '@/lib/utils'

export type ComboboxOption = {
  value: string
  label: string
}

type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  name?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyStateMessage?: string
  className?: string
  disabled?: boolean
}

const Combobox = React.forwardRef<
  React.ElementRef<typeof Button>,
  ComboboxProps
>(
  (
    {
      options,
      value,
      onChange,
      onBlur,
      name,
      placeholder = 'Select an option',
      searchPlaceholder = 'Search...',
      emptyStateMessage = 'No results found.',
      className,
      disabled,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false)
    const selectedOption = options.find((option) => option.value === value)

    // Debug logging
    React.useEffect(() => {
      console.log('🟢 Combobox props updated:', {
        value,
        optionsLength: options.length,
        selectedOption: selectedOption?.label,
        hasOnChange: !!onChange,
      })
    }, [value, options.length, selectedOption?.label, onChange])

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            name={name}
            className={cn(
              'bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]',
              !value && 'text-muted-foreground',
              className,
            )}
            disabled={disabled}
            onBlur={onBlur}
          >
            <span className={cn('truncate')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              size={16}
              className="text-muted-foreground/80 shrink-0 ml-2"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyStateMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      console.log(
                        '🟡 CommandItem onSelect called with:',
                        currentValue,
                      )
                      console.log('🟡 Current form value:', value)
                      console.log('🟡 Will call onChange with:', currentValue)
                      onChange?.(currentValue)
                      setOpen(false)
                    }}
                  >
                    {option.label}
                    {value === option.value && (
                      <Check size={16} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

Combobox.displayName = 'Combobox'
export { Combobox }
