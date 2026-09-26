import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  centerMyServices,
  kitOrders,
  kitStats,
  kitsList,
  useCreateKitOrder,
} from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export function CenterKitsPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery(kitStats())
  const { data: kitsData, isLoading: kitsLoading } = useQuery(
    kitsList({ page: 1, pageSize: 20 }),
  )
  const { data: ordersData, isLoading: ordersLoading } = useQuery(kitOrders())
  const { data: servicesData } = useQuery(centerMyServices())
  const createOrder = useCreateKitOrder()

  const [screeningTypeId, setScreeningTypeId] = useState('')
  const [quantity, setQuantity] = useState('50')
  const [notes, setNotes] = useState('')

  const stats = statsData?.data
  const kits = kitsData?.data?.kits || []
  const orders = ordersData?.data?.orders || []
  const services = useMemo(() => {
    const list = (servicesData as any)?.data?.services || []
    return list as Array<{ screeningTypeId: string; name: string }>
  }, [servicesData])

  const onOrder = async () => {
    const qty = Number(quantity)
    if (!screeningTypeId) {
      toast.error('Select which kit / screening type you need')
      return
    }
    if (!qty || qty < 1) {
      toast.error('Enter a valid quantity')
      return
    }
    try {
      await createOrder.mutateAsync({
        screeningTypeId,
        quantity: qty,
        notes: notes.trim() || undefined,
      })
      toast.success('Kit order submitted. Pricing and delivery will follow.')
      setNotes('')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not submit kit order')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 lg:p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Kits</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Order screening kits from ZeroCancer for this health facility, and
          see the stock you already have. Pricing and payment will be confirmed
          when you place an order.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Available', value: stats?.AVAILABLE },
          { label: 'Used', value: stats?.USED },
          { label: 'Damaged', value: stats?.DAMAGED },
          { label: 'Total', value: stats?.TOTAL },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{item.value ?? 0}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order kits
            </CardTitle>
            <CardDescription>
            Place an order with ZeroCancer. Price, payment, and delivery are
            confirmed after you submit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Screening / kit type</Label>
              <Select value={screeningTypeId} onValueChange={setScreeningTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem
                      key={service.screeningTypeId}
                      value={service.screeningTypeId}
                    >
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {services.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add screening services under Services before ordering kits.
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kit-qty">Quantity</Label>
              <Input
                id="kit-qty"
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kit-notes">Notes (optional)</Label>
              <Input
                id="kit-notes"
                placeholder="Delivery preference or urgency"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="bg-primary text-white"
              onClick={onOrder}
              disabled={createOrder.isPending}
            >
              {createOrder.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit kit order
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your kit orders</CardTitle>
            <CardDescription>
              Pending requests waiting for ZeroCancer fulfillment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No kit orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div>
                    <p className="font-medium">
                      {order.screeningTypeName || 'Kit'} ×{' '}
                      {order.requestedQuantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.requestedAt
                        ? new Date(order.requestedAt).toLocaleString()
                        : ''}
                    </p>
                  </div>
                  <Badge className="border-transparent bg-amber-100 text-amber-900">
                    {order.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent inventory</CardTitle>
          <CardDescription>
            Serial numbers currently or recently held by this facility.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {kitsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading kits...
            </div>
          ) : kits.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              No kits in inventory yet. Order kits above when you are ready.
            </div>
          ) : (
            kits.map((kit) => (
              <div
                key={kit.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div>
                  <p className="font-medium font-mono text-sm">
                    {kit.serialNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kit.screeningType?.name || 'Screening kit'}
                    {kit.batchNumber ? ` · batch ${kit.batchNumber}` : ''}
                  </p>
                </div>
                <Badge
                  className={
                    kit.status === 'AVAILABLE'
                      ? 'border-transparent bg-emerald-100 text-emerald-800'
                      : 'border-transparent bg-slate-100 text-slate-800'
                  }
                >
                  {kit.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
