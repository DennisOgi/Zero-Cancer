import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Checkbox } from '@/components/shared/ui/checkbox'
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
  kitProductLabel,
  kitProductsForScreening,
  type TKitProductId,
} from '@zerocancer/shared'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  centerMyServices,
  kitOrders,
  kitStats,
  kitsList,
  useCancelKitOrder,
  useCreateKitOrder,
} from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Package, ShoppingCart, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export const kitOrderStatusStyle: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-blue-100 text-blue-900',
  SHIPPED: 'bg-indigo-100 text-indigo-900',
  DELIVERED: 'bg-emerald-100 text-emerald-900',
  REJECTED: 'bg-red-100 text-red-900',
  CANCELLED: 'bg-slate-100 text-slate-700',
}

const kitOrderStatusHint: Record<string, string> = {
  PENDING: 'Waiting for ZeroCancer to confirm',
  APPROVED: 'Confirmed, preparing delivery',
  SHIPPED: 'On the way',
  DELIVERED: 'Delivered and added to your inventory',
  REJECTED: 'Not approved',
  CANCELLED: 'Cancelled by your facility',
}

type CartLine = {
  kitProduct: TKitProductId
  quantity: number
  selected: boolean
}

export function CenterKitsPage() {
  const { data: authData } = useQuery(useAuthUser())
  const canOrder = authData?.data?.user?.profile === 'CENTER'
  const cancelOrder = useCancelKitOrder()
  const { data: statsData, isLoading: statsLoading } = useQuery(kitStats())
  const { data: kitsData, isLoading: kitsLoading } = useQuery(
    kitsList({ page: 1, pageSize: 20 }),
  )
  const { data: ordersData, isLoading: ordersLoading } = useQuery(kitOrders())
  const { data: servicesData } = useQuery(centerMyServices())
  const createOrder = useCreateKitOrder()

  const [screeningTypeId, setScreeningTypeId] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [notes, setNotes] = useState('')

  const stats = statsData?.data
  const kits = kitsData?.data?.kits || []
  const orders = ordersData?.data?.orders || []
  const services = useMemo(() => {
    const list = (servicesData as any)?.data?.services || []
    return list as Array<{ screeningTypeId: string; name: string }>
  }, [servicesData])
  const selectedService = services.find(
    (service) => service.screeningTypeId === screeningTypeId,
  )
  const catalog = kitProductsForScreening(selectedService?.name)

  useEffect(() => {
    const products = kitProductsForScreening(selectedService?.name)
    setCart(
      products.map((product) => ({
        kitProduct: product.id,
        quantity: product.id === 'TRUSCREEN_DEVICE' ? 1 : 50,
        selected: false,
      })),
    )
  }, [screeningTypeId, selectedService?.name])

  const selectedLines = cart.filter((line) => line.selected && line.quantity > 0)
  const cartCount = selectedLines.reduce((sum, line) => sum + line.quantity, 0)

  const updateLine = (id: TKitProductId, patch: Partial<CartLine>) => {
    setCart((current) =>
      current.map((line) =>
        line.kitProduct === id ? { ...line, ...patch } : line,
      ),
    )
  }

  const onCheckout = async () => {
    if (!screeningTypeId) {
      toast.error('Select a screening type')
      return
    }
    if (catalog.length && selectedLines.length === 0) {
      toast.error('Choose at least one device or kit before checkout')
      return
    }
    if (selectedLines.some((line) => !line.quantity || line.quantity < 1)) {
      toast.error('Enter a valid quantity for each selected item')
      return
    }
    try {
      const result = await createOrder.mutateAsync({
        screeningTypeId,
        items: selectedLines.map((line) => ({
          kitProduct: line.kitProduct,
          quantity: line.quantity,
        })),
        notes: notes.trim() || undefined,
      })
      setCart((current) =>
        current.map((line) => ({ ...line, selected: false })),
      )
      setNotes('')
      toast.success(
        (result as any)?.message ||
          'Order submitted. Pricing and delivery will follow.',
      )
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || 'Could not submit devices & kits order',
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 lg:p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Devices and Kits</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Order screening devices and kits from ZeroCancer for this health
          facility. Select multiple items, set quantities, then check out once.
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
        {canOrder ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order devices and kits
              </CardTitle>
              <CardDescription>
                Pick one or more products for cervical screening, then submit a
                single checkout. Price and delivery are confirmed after you
                order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Screening type</Label>
                <Select
                  value={screeningTypeId}
                  onValueChange={setScreeningTypeId}
                >
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
                    Add screening services under Services before ordering.
                  </p>
                ) : null}
              </div>

              {catalog.length > 0 ? (
                <div className="space-y-3">
                  <Label>Choose products</Label>
                  <div className="space-y-2">
                    {catalog.map((product) => {
                      const line = cart.find(
                        (item) => item.kitProduct === product.id,
                      ) || {
                        kitProduct: product.id,
                        quantity: 1,
                        selected: false,
                      }
                      return (
                        <div
                          key={product.id}
                          className={`rounded-xl border p-3 transition-colors ${
                            line.selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={line.selected}
                              onCheckedChange={(checked) =>
                                updateLine(product.id, {
                                  selected: checked === true,
                                })
                              }
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div>
                                <p className="font-medium leading-snug">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {product.shortName}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor={`qty-${product.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Qty
                                </Label>
                                <Input
                                  id={`qty-${product.id}`}
                                  type="number"
                                  min={1}
                                  max={500}
                                  disabled={!line.selected}
                                  className="h-9 w-24"
                                  value={line.quantity}
                                  onChange={(event) =>
                                    updateLine(product.id, {
                                      quantity: Number(event.target.value) || 0,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : screeningTypeId ? (
                <p className="text-sm text-muted-foreground">
                  No catalogue products for this screening type yet. You can
                  still note a quantity in the notes field after contacting
                  ZeroCancer.
                </p>
              ) : null}

              {selectedLines.length > 0 ? (
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <ShoppingCart className="h-4 w-4" />
                    Checkout summary ({selectedLines.length}{' '}
                    {selectedLines.length === 1 ? 'item' : 'items'}, {cartCount}{' '}
                    units)
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {selectedLines.map((line) => (
                      <li
                        key={line.kitProduct}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          {kitProductLabel(line.kitProduct)} × {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() =>
                            updateLine(line.kitProduct, { selected: false })
                          }
                          aria-label="Remove from checkout"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

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
                className="w-full bg-primary text-white"
                onClick={onCheckout}
                disabled={createOrder.isPending || !screeningTypeId}
              >
                {createOrder.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedLines.length > 1
                  ? `Checkout ${selectedLines.length} products`
                  : 'Checkout order'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Need more devices or kits?
              </CardTitle>
              <CardDescription>
                Ask your facility admin to place an order. You can see stock and
                orders for this facility here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your orders</CardTitle>
            <CardDescription>
              Track each device or kit line from request to delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div>
                    <p className="font-medium">
                      {order.kitProductName ||
                        order.screeningTypeName ||
                        'Device / kit'}{' '}
                      × {order.requestedQuantity}
                    </p>
                    {order.kitProductName && order.screeningTypeName ? (
                      <p className="text-xs text-muted-foreground">
                        {order.screeningTypeName}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {order.requestedAt
                        ? new Date(order.requestedAt).toLocaleDateString()
                        : ''}
                      {' · '}
                      {kitOrderStatusHint[order.status] || order.status}
                    </p>
                    {order.reviewNotes ? (
                      <p className="mt-0.5 text-xs text-slate-700">
                        ZeroCancer: {order.reviewNotes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {canOrder && order.status === 'PENDING' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={cancelOrder.isPending}
                        onClick={() =>
                          cancelOrder.mutate(order.id, {
                            onSuccess: () => toast.success('Order cancelled'),
                            onError: (error: any) =>
                              toast.error(
                                error?.response?.data?.error ||
                                  'Could not cancel order',
                              ),
                          })
                        }
                      >
                        Cancel
                      </Button>
                    ) : null}
                    <Badge
                      className={`border-transparent ${
                        kitOrderStatusStyle[order.status] ||
                        'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </div>
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
              <Loader2 className="h-4 w-4 animate-spin" /> Loading inventory...
            </div>
          ) : kits.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              No devices or kits in inventory yet. Place an order above when you
              are ready.
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
                    {kit.kitProductName ||
                      kit.screeningType?.name ||
                      'Screening supply'}
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
