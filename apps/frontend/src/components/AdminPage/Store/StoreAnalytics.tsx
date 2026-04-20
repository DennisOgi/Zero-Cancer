import { Card, CardContent } from '@/components/shared/ui/card'
import { AlertTriangle, Boxes, DollarSign, Package } from 'lucide-react'

export interface StoreAnalyticsProps {
  totalProducts: number
  totalValue: number
  totalStock: number
  outOfStockProducts: number
  lowStockProducts: number
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export default function StoreAnalytics({
  totalProducts,
  totalValue,
  totalStock,
  outOfStockProducts,
  lowStockProducts,
}: StoreAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="flex items-center p-6">
          <Package className="h-8 w-8 text-blue-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">
              Total Products
            </p>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center p-6">
          <DollarSign className="h-8 w-8 text-green-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center p-6">
          <Boxes className="h-8 w-8 text-purple-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">
              Total Stock
            </p>
            <p className="text-2xl font-bold">{totalStock}</p>
            <p className="text-xs text-muted-foreground">units</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center p-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">
              Stock Alerts
            </p>
            <p className="text-2xl font-bold">
              {outOfStockProducts + lowStockProducts}
            </p>
            <p className="text-xs text-muted-foreground">
              {outOfStockProducts} out, {lowStockProducts} low
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
