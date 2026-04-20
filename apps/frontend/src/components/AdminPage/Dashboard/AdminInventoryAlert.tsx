import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowUpRight, Store } from 'lucide-react'

export function AdminInventoryAlert({
  lowStockProducts,
}: {
  lowStockProducts: number
}) {
  if (lowStockProducts <= 0) return null

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Inventory Alert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-orange-700 mb-3">
          {lowStockProducts} products are running low on stock and need
          restocking.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/store">
            <Store className="h-4 w-4 mr-2" />
            Manage Inventory
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default AdminInventoryAlert
