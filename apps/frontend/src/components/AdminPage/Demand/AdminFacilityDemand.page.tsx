import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { cityFacilityDemand } from '@/services/providers/boarding.provider'
import { useQuery } from '@tanstack/react-query'
import { Loader2, MapPin } from 'lucide-react'

export function AdminFacilityDemandPage() {
  const { data, isLoading } = useQuery(cityFacilityDemand())
  const demands = data?.data?.demands || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">City facility demand</h1>
        <p className="mt-1 text-muted-foreground">
          People who asked to wait until a facility opens in their city. There
          is no WhatsApp or email send yet — use this list for outreach.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Demand ({demands.length})
          </CardTitle>
          <CardDescription>
            WAIT means they have no local facility. OTHER_CITY_NOTIFY means they
            joined a facility elsewhere and still want one at home.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Choice</TableHead>
                <TableHead>Joined elsewhere</TableHead>
                <TableHead>Recorded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : demands.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No city demand recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                demands.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium">{row.fullName || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {[row.email, row.phone].filter(Boolean).join(' · ')}
                      </p>
                    </TableCell>
                    <TableCell>
                      {row.lga}, {row.state}
                    </TableCell>
                    <TableCell>{row.choice}</TableCell>
                    <TableCell>{row.assignedCenterName || '—'}</TableCell>
                    <TableCell>
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
