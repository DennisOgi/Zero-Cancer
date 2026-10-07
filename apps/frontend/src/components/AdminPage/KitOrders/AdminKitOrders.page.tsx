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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import { Textarea } from '@/components/shared/ui/textarea'
import {
  adminKitOrders,
  useUpdateAdminKitOrder,
} from '@/services/providers/center.provider'
import type { TAdminKitOrder } from '@/services/kit.service'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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
  const pendingCount = pendingData?.data?.orders?.length || 0
  const totalKits = useMemo(
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
              ? `Delivered. ${added} kits added to ${active.order.center?.centerName || 'the facility'}'s inventory.`
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
      <div>
        <h1 className="text-3xl font-bold">Kit orders</h1>
        <p className="text-muted-foreground">
          Screening kits health facilities have ordered from ZeroCancer.
          Approve, ship and deliver them here. Delivered kits go straight into
          the facility&apos;s inventory.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Waiting for review</CardDescription>
            <CardTitle className="text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orders in this view</CardDescription>
            <CardTitle className="text-2xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kits in this view</CardDescription>
            <CardTitle className="text-2xl">{totalKits}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Kit</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No kit orders here.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-medium">
                        {order.center?.centerName || 'Unknown facility'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[order.center?.lga, order.center?.state]
                          .filter(Boolean)
                          .join(', ')}
                        {order.center?.phone ? ` · ${order.center.phone}` : ''}
                      </p>
                    </TableCell>
                    <TableCell>{order.screeningTypeName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {order.requestedQuantity}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.requestedAt).toLocaleDateString()}
                      <p className="text-xs text-muted-foreground">
                        {order.requestedBy}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                      {order.reason}
                      {order.reviewNotes ? (
                        <p className="text-xs text-slate-700">
                          You: {order.reviewNotes}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border-transparent ${kitOrderStatusStyle[order.status] || ''}`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(actionsFor[order.status] || []).map((action) => (
                          <Button
                            key={action}
                            size="sm"
                            variant={action === 'REJECTED' ? 'outline' : 'default'}
                            onClick={() => open(order, action)}
                          >
                            {actionLabel[action]}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {active ? actionLabel[active.action] : ''}:{' '}
              {active?.order.requestedQuantity} × {active?.order.screeningTypeName}
            </DialogTitle>
            <DialogDescription>
              For {active?.order.center?.centerName}. The facility sees the
              new status and your note on their Kits page.
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
                <Label htmlFor="kit-serials">
                  Kit serial numbers (optional)
                </Label>
                <Textarea
                  id="kit-serials"
                  rows={4}
                  placeholder={`Paste ${active.order.requestedQuantity} serial numbers, one per line. Leave empty to generate them.`}
                  value={serials}
                  onChange={(e) => setSerials(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Nurses use these serials when completing a screening.
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="kit-notes">
                Note to the facility {active?.action === 'REJECTED' ? '' : '(optional)'}
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
              variant={active?.action === 'REJECTED' ? 'destructive' : 'default'}
            >
              {updateOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {active ? actionLabel[active.action] : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
