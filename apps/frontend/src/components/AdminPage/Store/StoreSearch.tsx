import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Search } from 'lucide-react'

export interface StoreSearchProps {
  search: string
  setSearch: (v: string) => void
  onClear: () => void
}

export default function StoreSearch({
  search,
  setSearch,
  onClear,
}: StoreSearchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Product Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
