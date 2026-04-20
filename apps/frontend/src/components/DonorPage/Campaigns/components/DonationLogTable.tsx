import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
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
import { MoreHorizontal } from 'lucide-react'

export interface DonationLogItem {
  amount: string
  sponsored: number
  date: string
  status: string
}

export default function DonationLogTable({
  items,
  title = 'Donation Log',
}: {
  items: DonationLogItem[]
  title?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount Donated</TableHead>
              <TableHead>Sponsored Patients</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((log, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{log.amount}</TableCell>
                <TableCell>{log.sponsored}</TableCell>
                <TableCell>{log.date}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
