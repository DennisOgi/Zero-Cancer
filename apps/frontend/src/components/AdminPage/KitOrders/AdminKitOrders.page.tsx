import { kitOrderStatusStyle } from '@/components/CenterPages/CenterKits.page'
import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import { Textarea } from '@/components/shared/ui/textarea'
import {
  adminKitOrders,
  useUpdateAdminKitOrder,
} from '@/services/providers/center.provider'
import type { TAdminKitOrder } from '@/services/kit.service'
import { kitProductById } from '@zerocancer/shared'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Clock3,
  Loader2,
  Package,
  Phone,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

type Action = 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'REJECTED'

const actionsFor: Record<string, Action[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['SHIPPED', 'DELIVERED', 'REJECTED'],
  SHIPPED: ['DELIVERED'],
}

const actionLabel: Record<Action, string> = {
  APPROVED: 'Approve',
  SHIPPED: 'Mark shipped',
  DELIVERED: 'Mark delivered',
  REJECTED: 'Reject',
}

const tabs = ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'ALL'] as const

const STATUS_RANK: Record<string, number> = {
  PENDING: 1,
  APPROVED: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  REJECTED: 5,
  CANCELLED: 6,
}

type OrderGroup = {
  key: string
  invoiceNumber: string | null
  center: TAdminKitOrder['center']
  requestedAt: string
  requestedBy: string
  status: string
  lines: TAdminKitOrder[]
  facilityNote: string | null
  reviewNotes: string[]
}

function productLabel(order: TAdminKitOrder) {
  const catalog = kitProductById(order.kitProduct)
  return (
    catalog?.shortName ||
    order.kitProductName ||
    order.kitProduct ||
    order.screeningTypeName ||
    'Product'
  )
}

function productFullName(order: TAdminKitOrder) {
  const catalog = kitProductById(order.kitProduct)
  return catalog?.name || order.kitProductName || order.kitProduct || null
}

function facilityNoteFromReason(reason?: string | null) {
  if (!reason?.trim()) return null
  // Auto-generated EOI summary — not useful as a "notes" dump in the admin UI
  if (/^Expression of Interest\s+EOI-/i.test(reason.trim())) return null
  return reason.trim()
}

function groupOrders(orders: TAdminKitOrder[]): OrderGroup[] {
  const map = new Map<string, OrderGroup>()
  for (const order of orders) {
    const key = order.invoiceNumber || order.id
    const existing = map.get(key)
    const note = facilityNoteFromReason(order.reason)
    if (!existing) {
      map.set(key, {
        key,
        invoiceNumber: order.invoiceNumber || null,
        center: order.center,
        requestedAt: order.requestedAt,
        requestedBy: order.requestedBy,
        status: order.status,
        lines: [order],
        facilityNote: note,
        reviewNotes: order.reviewNotes ? [order.reviewNotes] : [],
      })
      continue
    }
    existing.lines.push(order)
    if (!existing.facilityNote && note) existing.facilityNote = note
    if (
      order.reviewNotes &&
      !existing.reviewNotes.includes(order.reviewNotes)
    ) {
      existing.reviewNotes.push(order.reviewNotes)
    }
    if (
      (STATUS_RANK[order.status] || 0) > (STATUS_RANK[existing.status] || 0)
    ) {
      existing.status = order.status
    }
  }
  return Array.from(map.values())
}

export function AdminKitOrdersPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('PENDING')
  const { data, isLoading } = useQuery(
    adminKitOrders(tab === 'ALL' ? undefined : { status: tab }),
  )
  const { data: pendingData } = useQuery(adminKitOrders({ status: 'PENDING' }))
  const updateOrder = useUpdateAdminKitOrder()

  const [active, setActive] = useState<{
    order: TAdminKitOrder
    action: Action
  } | null>(null)
  const [notes, setNotes] = useState('')
  const [tracking, setTracking] = useState('')
  const [batch, setBatch] = useState('')
  const [serials, setSerials] = useState('')

  const orders = data?.data?.orders || []
  const groups = useMemo(() => groupOrders(orders), [orders])
  const pendingCount = pendingData?.data?.orders?.length || 0
  const totalUnits = useMemo(
    () => orders.reduce((sum, o) => sum + (o.requestedQuantity || 0), 0),
    [orders],
  )

  const open = (order: TAdminKitOrder, action: Action) => {
    setActive({ order, action })
    setNotes('')
    setTracking('')
    setBatch('')
    setSerials('')
  }

  const submit = () => {
    if (!active) return
    const serialNumbers = serials
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    updateOrder.mutate(
      {
        id: active.order.id,
        status: active.action,
        reviewNotes: notes.trim() || undefined,
        trackingNumber: tracking.trim() || undefined,
        batchNumber: batch.trim() || undefined,
        serialNumbers: serialNumbers.length ? serialNumbers : undefined,
      },
      {
        onSuccess: (res) => {
          const added = res?.data?.kitsAdded || 0
          toast.success(
            active.action === 'DELIVERED'
              ? `Delivered. ${added} items added to ${active.order.center?.centerName || 'the facility'}'s inventory.`
              : `Order ${actionLabel[active.action].toLowerCase()}`,
          )
          setActive(null)
        },
        onError: (error: any) =>
          toast.error(error?.response?.data?.error || 'Could not update order'),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#0b2c5f] to-[#163a73] px-5 py-6 text-white lg:px-7">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/70">
            Procurement
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Kits and Devices orders
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-white/80">
            Review Expressions of Interest, confirm pricing with the facility,
            then approve, ship, and deliver. Delivered items go into facility
            inventory.
          </p>
        </div>
        <div className="grid grid-cols-1 divide-y border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Waiting for review
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {pendingCount}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              EOIs in this view
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {groups.length}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Line items / units
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {orders.length} / {totalUnits}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="h-auto flex-wrap gap-1 bg-slate-100 p-1">
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t} className="px-3 py-1.5">
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
              {t === 'PENDING' && pendingCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {pendingCount}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Expressions of Interest...
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No Expressions of Interest in this view.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card
              key={group.key}
              className="overflow-hidden border-slate-200 shadow-sm"
            >
              <CardHeader className="space-y-3 border-b bg-slate-50/80 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">
                        {group.center?.centerName || 'Unknown facility'}
                      </CardTitle>
                      <Badge
                        className={`border-transparent ${
                          kitOrderStatusStyle[group.status] ||
                          'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {group.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                        <Package className="h-3.5 w-3.5" />
                        {group.invoiceNumber || 'Single-line order'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(group.requestedAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {[group.center?.lga, group.center?.state]
                          .filter(Boolean)
                          .join(', ') || 'Location n/a'}
                      </span>
                      {group.center?.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {group.center.phone}
                        </span>
                      ) : null}
                    </CardDescription>
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 text-right text-xs text-muted-foreground shadow-sm ring-1 ring-slate-200">
                    <p className="font-medium text-slate-900">
                      {group.lines.length}{' '}
                      {group.lines.length === 1 ? 'line' : 'lines'}
                    </p>
                    <p>
                      {group.lines.reduce(
                        (sum, line) => sum + line.requestedQuantity,
                        0,
                      )}{' '}
                      units
                    </p>
                  </div>
                </div>
                {group.facilityNote ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">
                      Facility note:{' '}
                    </span>
                    {group.facilityNote}
                  </div>
                ) : null}
                {group.reviewNotes.length > 0 ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-950">
                    <span className="font-medium">Your notes: </span>
                    {group.reviewNotes.join(' · ')}
                  </div>
                ) : null}
              </CardHeader>

              <CardContent className="divide-y p-0">
                {group.lines.map((order) => {
                  const fullName = productFullName(order)
                  const short = productLabel(order)
                  return (
                    <div
                      key={order.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{short}</p>
                        {fullName && fullName !== short ? (
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {fullName}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-slate-600">
                          Qty{' '}
                          <span className="font-semibold text-slate-900">
                            {order.requestedQuantity}
                          </span>
                          <span className="mx-2 text-slate-300">·</span>
                          <Badge
                            className={`border-transparent ${
                              kitOrderStatusStyle[order.status] ||
                              'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {(actionsFor[order.status] || []).map((action) => (
                          <Button
                            key={action}
                            size="sm"
                            variant={
                              action === 'REJECTED' ? 'outline' : 'default'
                            }
                            onClick={() => open(order, action)}
                          >
                            {actionLabel[action]}
                          </Button>
                        ))}
                        {(actionsFor[order.status] || []).length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No actions
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {active ? actionLabel[active.action] : ''}:{' '}
              {active?.order.requestedQuantity} ×{' '}
              {active ? productLabel(active.order) : ''}
            </DialogTitle>
            <DialogDescription>
              For {active?.order.center?.centerName}
              {active?.order.invoiceNumber
                ? ` · ${active.order.invoiceNumber}`
                : ''}
              . The facility sees the new status and your note on Kits and
              Devices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {active?.action === 'SHIPPED' || active?.action === 'DELIVERED' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="kit-tracking">Tracking number</Label>
                  <Input
                    id="kit-tracking"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kit-batch">Batch number</Label>
                  <Input
                    id="kit-batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {active?.action === 'DELIVERED' ? (
              <div className="space-y-1.5">
                <Label htmlFor="kit-serials">Serial numbers (optional)</Label>
                <Textarea
                  id="kit-serials"
                  rows={4}
                  placeholder={`Paste ${active.order.requestedQuantity} serial numbers, one per line. Leave empty to generate them.`}
                  value={serials}
                  onChange={(e) => setSerials(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Staff use these serials when completing a screening.
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="kit-notes">
                Note to the facility{' '}
                {active?.action === 'REJECTED' ? '' : '(optional)'}
              </Label>
              <Textarea
                id="kit-notes"
                rows={2}
                placeholder={
                  active?.action === 'APPROVED'
                    ? 'e.g. Price ₦X per kit, pay to account Y, delivery in 5 days'
                    : active?.action === 'REJECTED'
                      ? 'Reason for rejecting'
                      : ''
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Back
            </Button>
            <Button
              onClick={submit}
              disabled={
                updateOrder.isPending ||
                (active?.action === 'REJECTED' && !notes.trim())
              }
              variant={
                active?.action === 'REJECTED' ? 'destructive' : 'default'
              }
            >
              {updateOrder.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {active ? actionLabel[active.action] : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
