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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  kitShopCatalog,
  type TKitProductId,
} from '@zerocancer/shared'
import { useAuthUser } from '@/services/providers/auth.provider'
import type { TEoiInvoice, TKitOrder } from '@/services/kit.service'
import {
  kitOrders,
  kitStats,
  kitsList,
  useCancelKitOrder,
  useCreateKitOrder,
  useKitOrderInvoice,
} from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2, Package, Printer, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

type OrderGroup = {
  key: string
  invoiceNumber: string | null
  lines: TKitOrder[]
  requestedAt: string
  status: string
  canCancel: boolean
  reviewNotes?: string | null
}

export const kitOrderStatusStyle: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-blue-100 text-blue-900',
  SHIPPED: 'bg-indigo-100 text-indigo-900',
  DELIVERED: 'bg-emerald-100 text-emerald-900',
  REJECTED: 'bg-red-100 text-red-900',
  CANCELLED: 'bg-slate-100 text-slate-700',
}

const kitOrderStatusHint: Record<string, string> = {
  PENDING: 'Expression of Interest — awaiting confirmation',
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

const CATALOG = kitShopCatalog()

const STATUS_RANK: Record<string, number> = {
  PENDING: 1,
  APPROVED: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  REJECTED: 5,
  CANCELLED: 6,
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function groupKitOrders(orders: TKitOrder[]): OrderGroup[] {
  const map = new Map<string, OrderGroup>()
  for (const order of orders) {
    const key = order.invoiceNumber || order.id
    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        key,
        invoiceNumber: order.invoiceNumber || null,
        lines: [order],
        requestedAt: order.requestedAt,
        status: order.status,
        canCancel: order.status === 'PENDING',
        reviewNotes: order.reviewNotes,
      })
      continue
    }
    existing.lines.push(order)
    existing.canCancel = existing.canCancel && order.status === 'PENDING'
    if (
      (STATUS_RANK[order.status] || 0) > (STATUS_RANK[existing.status] || 0)
    ) {
      existing.status = order.status
    }
    if (!existing.reviewNotes && order.reviewNotes) {
      existing.reviewNotes = order.reviewNotes
    }
  }
  return Array.from(map.values())
}

function printEoiInvoice(invoice: TEoiInvoice) {
  const linesHtml = invoice.lines
    .map(
      (line) =>
        `<tr>
            <td style="padding:8px;border-bottom:1px solid #ddd;vertical-align:top">${escapeHtml(line.name)}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;white-space:nowrap">${line.quantity} ${escapeHtml(line.unitLabel || '')}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd;font-weight:600;color:#92400e">${escapeHtml(line.priceDisplay || invoice.priceNote)}</td>
          </tr>`,
    )
    .join('')
  const html = `<!doctype html>
<html><head><title>${escapeHtml(invoice.invoiceNumber)} — Expression of Interest</title>
<style>
  body{font-family:Arial,sans-serif;color:#111;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:20px;margin:0 0 8px}
  .muted{color:#555;font-size:13px}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th{text-align:left;padding:8px;border-bottom:2px solid #111;font-size:13px}
  .price-box{border:1px solid #f59e0b;background:#fffbeb;padding:12px;margin:16px 0;border-radius:8px}
  .footer{border-top:1px solid #ddd;margin-top:20px;padding-top:12px;font-size:14px}
</style></head><body>
  <h1>${escapeHtml(invoice.title)}</h1>
  <p class="muted">Invoice No: ${escapeHtml(invoice.invoiceNumber)}</p>
  <p class="muted">Date: ${escapeHtml(new Date(invoice.issuedAt).toLocaleString())}</p>
  <h2 style="font-size:15px;margin:20px 0 8px">Order</h2>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
    <tbody>${linesHtml}</tbody>
  </table>
  <div class="price-box"><strong>Price</strong><div>${escapeHtml(invoice.priceNote)}</div></div>
  <div class="footer">
    <p><strong>${escapeHtml(invoice.footerNote)}</strong></p>
    <p style="margin-top:12px"><strong>Buyer</strong></p>
    <p>${escapeHtml(invoice.buyer.name)}</p>
    ${invoice.buyer.email ? `<p>${escapeHtml(invoice.buyer.email)}</p>` : ''}
    ${invoice.buyer.phone ? `<p>${escapeHtml(invoice.buyer.phone)}</p>` : ''}
    ${invoice.buyer.address ? `<p>${escapeHtml(invoice.buyer.address)}</p>` : ''}
  </div>
</body></html>`

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900')
  if (popup) {
    popup.document.write(html)
    popup.document.close()
    popup.focus()
    popup.print()
    return
  }

  // Fallback when pop-ups are blocked: hidden iframe print
  const iframe = document.createElement('iframe')
  iframe.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden',
  )
  document.body.appendChild(iframe)
  const frameDoc = iframe.contentWindow?.document
  if (!frameDoc) {
    document.body.removeChild(iframe)
    toast.error('Could not open the print dialog. Allow pop-ups and try again.')
    return
  }
  frameDoc.open()
  frameDoc.write(html)
  frameDoc.close()
  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()
  window.setTimeout(() => {
    document.body.removeChild(iframe)
  }, 1000)
}

export function CenterKitsPage() {
  const { data: authData } = useQuery(useAuthUser())
  const canOrder = authData?.data?.user?.profile === 'CENTER'
  const cancelOrder = useCancelKitOrder()
  const loadInvoice = useKitOrderInvoice()
  const { data: statsData, isLoading: statsLoading } = useQuery(kitStats())
  const { data: kitsData, isLoading: kitsLoading } = useQuery(
    kitsList({ page: 1, pageSize: 20 }),
  )
  const { data: ordersData, isLoading: ordersLoading } = useQuery(kitOrders())
  const createOrder = useCreateKitOrder()

  const [cart, setCart] = useState<CartLine[]>(() =>
    CATALOG.map((product) => ({
      kitProduct: product.id,
      quantity: product.minQuantity,
      selected: false,
    })),
  )
  const [notes, setNotes] = useState('')
  const [invoice, setInvoice] = useState<TEoiInvoice | null>(null)

  const stats = statsData?.data
  const kits = kitsData?.data?.kits || []
  const orders = ordersData?.data?.orders || []
  const orderGroups = useMemo(() => groupKitOrders(orders), [orders])

  const selectedLines = useMemo(
    () => cart.filter((line) => line.selected && line.quantity > 0),
    [cart],
  )

  const updateLine = (id: TKitProductId, patch: Partial<CartLine>) => {
    setCart((current) =>
      current.map((line) =>
        line.kitProduct === id ? { ...line, ...patch } : line,
      ),
    )
  }

  const onCheckout = async () => {
    if (selectedLines.length === 0) {
      toast.error('Select at least one device or kit before checkout')
      return
    }
    for (const line of selectedLines) {
      const product = CATALOG.find((item) => item.id === line.kitProduct)
      const min = product?.minQuantity || 1
      if (line.quantity < min) {
        toast.error(
          `${product?.shortName || 'Product'}: minimum order is ${min} ${product?.unitLabel || 'units'}`,
        )
        return
      }
    }
    try {
      const result = (await createOrder.mutateAsync({
        items: selectedLines.map((line) => ({
          kitProduct: line.kitProduct,
          quantity: line.quantity,
        })),
        notes: notes.trim() || undefined,
      })) as {
        ok?: boolean
        message?: string
        data?: { invoice?: TEoiInvoice }
      }

      setCart((current) =>
        current.map((line) => ({
          ...line,
          selected: false,
          quantity:
            CATALOG.find((p) => p.id === line.kitProduct)?.minQuantity || 1,
        })),
      )
      setNotes('')
      if (result?.data?.invoice) {
        setInvoice(result.data.invoice)
      }
      toast.success(
        result?.message ||
          'Expression of Interest submitted. You will be contacted later.',
      )
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          'Could not submit Expression of Interest',
      )
    }
  }

  const openInvoice = async (group: OrderGroup) => {
    if (!group.invoiceNumber) {
      toast.error('This older order has no Expression of Interest invoice')
      return
    }
    try {
      const result = await loadInvoice.mutateAsync(group.invoiceNumber)
      if (result?.data?.invoice) {
        setInvoice(result.data.invoice)
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || 'Could not open invoice',
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 lg:p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Kits and Devices</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Shop screening devices and kits. Select products, check out once, and
          receive an Expression of Interest invoice — prices are confirmed when
          ZeroCancer contacts you.
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
                Shop — Kits and Devices
              </CardTitle>
              <CardDescription>
                Choose from the devices and kits catalogue below. Checkout
                generates an Expression of Interest (no prices yet).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {CATALOG.map((product) => {
                  const line = cart.find(
                    (item) => item.kitProduct === product.id,
                  ) || {
                    kitProduct: product.id,
                    quantity: product.minQuantity,
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
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {product.description}
                              {'bundleNote' in product && product.bundleNote
                                ? ` · ${product.bundleNote}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Label
                              htmlFor={`qty-${product.id}`}
                              className="text-xs text-muted-foreground"
                            >
                              Qty ({product.unitLabel})
                            </Label>
                            <Input
                              id={`qty-${product.id}`}
                              type="number"
                              min={product.minQuantity}
                              max={10000}
                              disabled={!line.selected}
                              className="h-9 w-28"
                              value={line.quantity}
                              onChange={(event) =>
                                updateLine(product.id, {
                                  quantity: Number(event.target.value) || 0,
                                })
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              Min {product.minQuantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedLines.length > 0 ? (
                <div className="rounded-xl border bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <ShoppingCart className="h-4 w-4" />
                    Checkout ({selectedLines.length}{' '}
                    {selectedLines.length === 1 ? 'product' : 'products'})
                  </div>
                  <ul className="space-y-1 text-sm">
                    {selectedLines.map((line) => {
                      const product = CATALOG.find(
                        (item) => item.id === line.kitProduct,
                      )
                      return (
                        <li key={line.kitProduct}>
                          {product?.shortName || line.kitProduct} ×{' '}
                          {line.quantity} {product?.unitLabel}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="kit-notes">Notes (optional)</Label>
                <Input
                  id="kit-notes"
                  placeholder="Delivery preference or special request"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-primary text-white"
                onClick={onCheckout}
                disabled={createOrder.isPending || selectedLines.length === 0}
              >
                {createOrder.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Checkout — Expression of Interest
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Need kits or devices?
              </CardTitle>
              <CardDescription>
                Ask your facility admin to place an Expression of Interest
                order. You can view stock and orders here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your orders</CardTitle>
            <CardDescription>
              Expressions of Interest and fulfilment status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
              </div>
            ) : orderGroups.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              orderGroups.map((group) => (
                <div
                  key={group.key}
                  className="rounded-lg border px-3 py-2.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {group.invoiceNumber || 'Order'}
                        {group.lines.length > 1
                          ? ` · ${group.lines.length} items`
                          : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.requestedAt
                          ? new Date(group.requestedAt).toLocaleDateString()
                          : ''}
                        {' · '}
                        {kitOrderStatusHint[group.status] || group.status}
                      </p>
                      {group.reviewNotes ? (
                        <p className="mt-0.5 text-xs text-slate-700">
                          ZeroCancer: {group.reviewNotes}
                        </p>
                      ) : null}
                    </div>
                    <Badge
                      className={`border-transparent ${
                        kitOrderStatusStyle[group.status] ||
                        'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {group.status}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {group.lines.map((line) => (
                      <li key={line.id}>
                        {line.kitProductName || line.kitProduct || 'Device / kit'}{' '}
                        × {line.requestedQuantity}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2">
                    {group.invoiceNumber ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadInvoice.isPending}
                        onClick={() => openInvoice(group)}
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        View invoice
                      </Button>
                    ) : null}
                    {canOrder && group.canCancel ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={cancelOrder.isPending}
                        onClick={() =>
                          cancelOrder.mutate(group.lines[0].id, {
                            onSuccess: () =>
                              toast.success(
                                'Expression of Interest cancelled',
                              ),
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
              No devices or kits in inventory yet. Place an Expression of
              Interest above when you are ready.
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
                      'Supply'}
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

      <Dialog
        open={Boolean(invoice)}
        onOpenChange={(open) => {
          if (!open) setInvoice(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto print:max-w-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Expression of Interest Invoice
            </DialogTitle>
            <DialogDescription>
              Prices are not listed. ZeroCancer will contact you to confirm.
            </DialogDescription>
          </DialogHeader>

          {invoice ? (
            <div id="eoi-invoice" className="space-y-4 text-sm">
              <div className="border-b pb-3">
                <p className="text-lg font-bold">{invoice.title}</p>
                <p className="text-muted-foreground">
                  Invoice No: {invoice.invoiceNumber}
                </p>
                <p className="text-muted-foreground">
                  Date:{' '}
                  {new Date(invoice.issuedAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div>
                <p className="mb-2 font-semibold">Order</p>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 pr-2 font-medium">Item</th>
                      <th className="py-2 pr-2 font-medium">Qty</th>
                      <th className="py-2 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line) => (
                      <tr key={line.kitProduct} className="border-b align-top">
                        <td className="py-2 pr-2">{line.name}</td>
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {line.quantity} {line.unitLabel || ''}
                        </td>
                        <td className="py-2 font-medium text-amber-800">
                          {line.priceDisplay || invoice.priceNote}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="font-semibold text-amber-950">Price</p>
                <p className="text-amber-900">{invoice.priceNote}</p>
              </div>

              <div className="space-y-1 border-t pt-3">
                <p className="font-medium">{invoice.footerNote}</p>
                <p className="pt-2 font-semibold">Buyer</p>
                <p>{invoice.buyer.name}</p>
                {invoice.buyer.email ? <p>{invoice.buyer.email}</p> : null}
                {invoice.buyer.phone ? <p>{invoice.buyer.phone}</p> : null}
                {invoice.buyer.address ? <p>{invoice.buyer.address}</p> : null}
              </div>
            </div>
          ) : null}

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setInvoice(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (invoice) printEoiInvoice(invoice)
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
