import { Input } from '@/components/shared/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import { Search } from 'lucide-react'

interface CenterStaffFiltersProps {
  filter: string
  onFilterChange: (value: string) => void
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function CenterStaffFilters({
  filter,
  onFilterChange,
  searchTerm,
  onSearchChange,
}: CenterStaffFiltersProps) {
  return (
    <div className="flex justify-between items-center">
      <Tabs value={filter} onValueChange={onFilterChange}>
        <TabsList>
          <TabsTrigger value="All Staff">All Staff</TabsTrigger>
          <TabsTrigger value="Active">Active</TabsTrigger>
          <TabsTrigger value="Invited">Invited</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by staff name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  )
}
