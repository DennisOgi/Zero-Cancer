import logoBlue from '@/assets/images/logo-blue.svg'
import logoBlueSvg from '@/assets/images/logo-blue.svg?raw'
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
import {
  FileText,
  Loader2,
  Package,
  Printer,
  ShoppingCart,
} from 'lucide-react'
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

const kindStyle: Record<string, string> = {
  device: 'bg-sky-100 text-sky-900',
  kit: 'bg-violet-100 text-violet-900',
  bundle: 'bg-amber-100 text-amber-900',
}

const kindLabel: Record<string, string> = {
  device: 'Device',
  kit: 'Kit',
  bundle: 'Bundle',
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

/** Inline logo so print/PDF never depends on a network image load. */
const LOGO_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  logoBlueSvg,
)}`

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
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top">${escapeHtml(line.name)}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;white-space:nowrap">${line.quantity} ${escapeHtml(line.unitLabel || '')}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#92400e">${escapeHtml(line.priceDisplay || invoice.priceNote)}</td>
          </tr>`,
    )
    .join('')
  const html = `<!doctype html>
<html><head><title>${escapeHtml(invoice.invoiceNumber)} — Expression of Interest</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:36px;max-width:740px;margin:0 auto}
  .brand{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:2px solid #0b2c5f;padding-bottom:16px;margin-bottom:20px}
  .brand img{height:56px;width:auto;display:block}
  .brand-meta{text-align:right;font-size:12px;color:#64748b;line-height:1.5}
  h1{font-size:22px;margin:0 0 6px;color:#0b2c5f}
  .muted{color:#64748b;font-size:13px;margin:0}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th{text-align:left;padding:10px 8px;border-bottom:2px solid #0b2c5f;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#334155}
  .price-box{border:1px solid #f59e0b;background:#fffbeb;padding:14px;margin:18px 0;border-radius:10px}
  .footer{border-top:1px solid #e2e8f0;margin-top:22px;padding-top:14px;font-size:14px}
  .buyer{margin-top:12px}
</style></head><body>
  <div class="brand">
    <img src="${LOGO_DATA_URI}" alt="ZeroCancer" width="146" height="80" />
    <div class="brand-meta">
      <div><strong>ZeroCancer Africa</strong></div>
      <div>Expression of Interest</div>
      <div>${escapeHtml(invoice.invoiceNumber)}</div>
    </div>
  </div>
  <h1>${escapeHtml(invoice.title)}</h1>
  <p class="muted">Date: ${escapeHtml(new Date(invoice.issuedAt).toLocaleString())}</p>
  <h2 style="font-size:15px;margin:24px 0 8px;color:#0b2c5f">Order</h2>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
    <tbody>${linesHtml}</tbody>
  </table>
  <div class="price-box"><strong>Price</strong><div>${escapeHtml(invoice.priceNote)}</div></div>
  <div class="footer">
    <p><strong>${escapeHtml(invoice.footerNote)}</strong></p>
    <div class="buyer">
      <p><strong>Buyer</strong></p>
      <p>${escapeHtml(invoice.buyer.name)}</p>
      ${invoice.buyer.email ? `<p>${escapeHtml(invoice.buyer.email)}</p>` : ''}
      ${invoice.buyer.phone ? `<p>${escapeHtml(invoice.buyer.phone)}</p>` : ''}
      ${invoice.buyer.address ? `<p>${escapeHtml(invoice.buyer.address)}</p>` : ''}
    </div>
  </div>
</body></html>`

  const popup = window.open(
    '',
    '_blank',
    'noopener,noreferrer,width=800,height=900',
  )
  if (popup) {
    popup.document.write(html)
    popup.document.close()
    popup.focus()
    popup.print()
    return
  }

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
  }, 500)
}

export function CenterKitsPage() {
  const { data: authData } = useQuery(useAuthUser())
  const user = authData?.data?.user
  const isFacilityAdmin =
    user?.profile === 'CENTER' || user?.staffRole === 'ADMIN'
  const isClinicalStaff =
    user?.profile === 'CENTER_STAFF' &&
    (user?.staffRole === 'DOCTOR' || user?.staffRole === 'NURSE')
  const canOrder = isFacilityAdmin || isClinicalStaff
  const orderScopeLabel = isFacilityAdmin
    ? 'facility'
    : 'personal'
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
      toast.error(error?.response?.data?.error || 'Could not open invoice')
    }
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#0b2c5f] to-[#163a73] px-5 py-6 text-white lg:px-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/70">
                Procurement
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Kits and Devices
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                {isClinicalStaff
                  ? 'Place a personal Expression of Interest for kits you need. Facility-wide orders stay with your admin.'
                  : 'Select products from the catalogue, check out once, and receive an Expression of Interest invoice. Prices are confirmed when ZeroCancer contacts you.'}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
              <p className="font-medium">
                {orderScopeLabel === 'personal'
                  ? 'Personal EOI'
                  : 'Facility EOI'}
              </p>
              <p className="text-white/75">No prices · For Confirmation</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y border-t border-slate-100 md:grid-cols-4 md:divide-y-0">
          {[
            { label: 'Available', value: stats?.AVAILABLE },
            { label: 'Used', value: stats?.USED },
            { label: 'Damaged', value: stats?.DAMAGED },
            { label: 'Total', value: stats?.TOTAL },
          ].map((item) => (
            <div key={item.label} className="px-4 py-4 lg:px-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              {statsLoading ? (
                <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {item.value ?? 0}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        {canOrder ? (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="h-5 w-5 text-primary" />
                Catalogue
              </CardTitle>
              <CardDescription>
                Tick what you need, set quantities, then submit one Expression
                of Interest.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 lg:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {CATALOG.map((product) => {
                  const line = cart.find(
                    (item) => item.kitProduct === product.id,
                  ) || {
                    kitProduct: product.id,
                    quantity: product.minQuantity,
                    selected: false,
                  }
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() =>
                        updateLine(product.id, { selected: !line.selected })
                      }
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        line.selected
                          ? 'border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
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
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="space-y-1.5">
                            <Badge
                              className={`border-transparent ${
                                kindStyle[product.kind] ||
                                'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {kindLabel[product.kind] || product.kind}
                            </Badge>
                            <p className="font-semibold leading-snug text-slate-900">
                              {product.shortName}
                            </p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.description}
                              {'bundleNote' in product && product.bundleNote
                                ? ` · ${product.bundleNote}`
                                : ''}
                            </p>
                          </div>
                          <div
                            className="flex flex-wrap items-center gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
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
                              className="h-9 w-24 bg-white"
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
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Need kits or devices?
              </CardTitle>
              <CardDescription>
                Doctors and nurses can submit personal kit requests. Facility
                admins place facility-wide Expressions of Interest.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle>Your orders</CardTitle>
              <CardDescription>
                Expressions of Interest and fulfilment status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {ordersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
                </div>
              ) : orderGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-muted-foreground">
                  No orders yet. Select products from the catalogue to get
                  started.
                </div>
              ) : (
                orderGroups.map((group) => (
                  <div
                    key={group.key}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {group.invoiceNumber || 'Order'}
                          {group.lines.length > 1
                            ? ` · ${group.lines.length} items`
                            : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {group.requestedAt
                            ? new Date(group.requestedAt).toLocaleDateString()
                            : ''}
                          {' · '}
                          {kitOrderStatusHint[group.status] || group.status}
                        </p>
                        {group.reviewNotes ? (
                          <p className="mt-1 text-xs text-slate-700">
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
                    <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      {group.lines.map((line) => (
                        <li
                          key={line.id}
                          className="flex items-start justify-between gap-3"
                        >
                          <span className="leading-snug">
                            {line.kitProductName ||
                              line.kitProduct ||
                              'Device / kit'}
                          </span>
                          <span className="shrink-0 font-medium text-slate-900">
                            × {line.requestedQuantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
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

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle>Recent inventory</CardTitle>
              <CardDescription>
                Serial numbers currently or recently held by this facility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {kitsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading
                  inventory...
                </div>
              ) : kits.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-muted-foreground">
                  No devices or kits in inventory yet.
                </div>
              ) : (
                kits.map((kit) => (
                  <div
                    key={kit.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">
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
        </div>
      </div>

      {canOrder && selectedLines.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:left-60 xl:left-72">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Ready to submit · {selectedLines.length}{' '}
                {selectedLines.length === 1 ? 'product' : 'products'}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {selectedLines
                  .map((line) => {
                    const product = CATALOG.find(
                      (item) => item.id === line.kitProduct,
                    )
                    return `${product?.shortName || line.kitProduct} × ${line.quantity}`
                  })
                  .join(' · ')}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 w-full bg-white sm:w-64"
              />
              <Button
                className="h-10 shrink-0 bg-primary px-5 text-white"
                onClick={onCheckout}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Checkout — Expression of Interest
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <img
                  src={logoBlue}
                  alt="ZeroCancer"
                  className="h-12 w-auto"
                />
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-semibold text-slate-900">
                    ZeroCancer Africa
                  </p>
                  <p>Expression of Interest</p>
                  <p className="font-mono">{invoice.invoiceNumber}</p>
                </div>
              </div>

              <div>
                <p className="text-lg font-bold text-[#0b2c5f]">
                  {invoice.title}
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
                <p className="mb-2 font-semibold text-[#0b2c5f]">Order</p>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-[#0b2c5f]">
                      <th className="py-2 pr-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Item
                      </th>
                      <th className="py-2 pr-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Qty
                      </th>
                      <th className="py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line) => (
                      <tr key={line.kitProduct} className="border-b align-top">
                        <td className="py-2.5 pr-2">{line.name}</td>
                        <td className="whitespace-nowrap py-2.5 pr-2">
                          {line.quantity} {line.unitLabel || ''}
                        </td>
                        <td className="py-2.5 font-medium text-amber-800">
                          {line.priceDisplay || invoice.priceNote}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
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
