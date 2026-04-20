import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/shared/ui/badge'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/shared/ui/command'
import { cn } from '@/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'

const multiSelectVariants = cva(
  'm-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300',
  {
    variants: {
      variant: {
        default:
          'border-foreground/10 text-foreground bg-card hover:bg-card/80',
        secondary:
          'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        inverted: 'inverted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface MultiSelectProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiSelectVariants> {
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  onValueChange: (value: string[]) => void
  defaultValue?: string[]
  value?: string[]
  placeholder?: string
  animation?: number
  maxCount?: number
  asChild?: boolean
  className?: string
}

const MultiSelect = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      value = [],
      placeholder = 'Select options',
      animation = 0,
      maxCount = 3,
      asChild = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = React.useState('')
    const [open, setOpen] = React.useState(false)
    const [selected, setSelected] = React.useState<string[]>(
      value || defaultValue,
    )

    React.useEffect(() => {
      setSelected(value || defaultValue)
    }, [value, defaultValue])

    const handleUnselect = (val: string) => {
      const newValue = selected.filter((s) => s !== val)
      setSelected(newValue)
      onValueChange(newValue)
    }

    const handleSelect = (val: string) => {
      const newValue = [...selected, val]
      setSelected(newValue)
      onValueChange(newValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = e.target as HTMLInputElement
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (input.value === '') {
          const newSelected = [...selected]
          newSelected.pop()
          setSelected(newSelected)
          onValueChange(newSelected)
        }
      }
      if (e.key === 'Escape') {
        input.blur()
      }
    }

    const selectedValues = selected.map((val) =>
      options.find((o) => o.value === val),
    )

    return (
      <CommandPrimitive
        onKeyDown={handleKeyDown}
        className={cn(
          'overflow-visible bg-transparent flex flex-col space-y-2',
          className,
        )}
        ref={ref}
        {...props}
      >
        <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex gap-1 flex-wrap">
            {selectedValues.map((option) => {
              return (
                <Badge key={option?.value} variant={'secondary'}>
                  {option?.label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUnselect(option?.value || '')
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => handleUnselect(option?.value || '')}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              )
            })}
            <CommandPrimitive.Input
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
            />
          </div>
        </div>
        <div className="relative mt-2">
          <CommandList>
            {open && options.length > 0 ? (
              <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandGroup className="h-full overflow-auto">
                  {options.map((option) => {
                    const isSelected = selected.includes(option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onSelect={() => {
                          if (isSelected) {
                            handleUnselect(option.value)
                          } else {
                            handleSelect(option.value)
                          }
                          setInputValue('')
                        }}
                        className={cn('cursor-pointer', {
                          'bg-accent': isSelected,
                        })}
                      >
                        {option.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </div>
            ) : null}
          </CommandList>
        </div>
      </CommandPrimitive>
    )
  },
)

MultiSelect.displayName = 'MultiSelect'

export { MultiSelect }
