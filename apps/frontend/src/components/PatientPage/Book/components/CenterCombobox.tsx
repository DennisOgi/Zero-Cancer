import { Badge } from '@/components/shared/ui/badge'
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
import statesData from '@zerocancer/shared/constants/states.json'
import { Check, ChevronDown, MapPin } from 'lucide-react'
import * as React from 'react'

export type Center = {
  id: string
  centerName: string
  lga: string
  state: string
  address: string
}

type StateOption = { value: string; label: string; lgas: string[] }

export type CenterComboboxProps = {
  centers: Center[]
  value?: string
  onChange?: (centerId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CenterCombobox({
  centers,
  value,
  onChange,
  placeholder = 'Search and select a center',
  disabled,
  className,
}: CenterComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [selectedState, setSelectedState] = React.useState<string>('')
  const [selectedLga, setSelectedLga] = React.useState<string>('')

  const selectedCenter = React.useMemo(
    () => centers.find((c) => c.id === value),
    [centers, value],
  )

  const stateOptions: StateOption[] = React.useMemo(
    () =>
      statesData.map((s: any) => ({
        value: s.state.name as string,
        label: s.state.name as string,
        lgas: ((s.state.locals || []) as Array<{ name: string }>).map(
          (l) => l.name,
        ),
      })),
    [],
  )

  const lgaOptions = React.useMemo(() => {
    if (!selectedState) return [] as string[]
    const found = stateOptions.find((s) => s.value === selectedState)
    return found?.lgas || []
  }, [selectedState, stateOptions])

  const filteredCenters = React.useMemo(() => {
    return centers.filter((c) => {
      if (selectedState && c.state !== selectedState) return false
      if (selectedLga && c.lga !== selectedLga) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        c.centerName.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.lga.toLowerCase().includes(q)
      )
    })
  }, [centers, selectedState, selectedLga, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {selectedCenter
                ? `${selectedCenter.centerName} — ${selectedCenter.lga}, ${selectedCenter.state}`
                : placeholder}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popper-anchor-width)] p-0"
      >
        <div className="p-2 border-b">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">State</label>
              <div className="mt-1 flex flex-wrap gap-2 max-h-24 overflow-auto">
                {stateOptions.map((s) => (
                  <Badge
                    key={s.value}
                    variant={selectedState === s.value ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedState((prev) =>
                        prev === s.value ? '' : s.value,
                      )
                      setSelectedLga('')
                    }}
                  >
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">LGA</label>
              <div className="mt-1 flex flex-wrap gap-2 max-h-24 overflow-auto">
                {lgaOptions.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Select a state
                  </span>
                )}
                {lgaOptions.map((l: string) => (
                  <Badge
                    key={l}
                    variant={selectedLga === l ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedLga((prev) => (prev === l ? '' : l))
                    }
                  >
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Command>
          <CommandInput
            placeholder="Search centers by name, address, state, or LGA..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No centers found.</CommandEmpty>
            <CommandGroup>
              {filteredCenters.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.centerName}
                  onSelect={() => {
                    onChange?.(c.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex w-full items-start gap-3">
                    <div className="mt-1">
                      {value === c.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <MapPin className="h-4 w-4 opacity-60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.centerName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.address}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.lga}, {c.state}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default CenterCombobox
