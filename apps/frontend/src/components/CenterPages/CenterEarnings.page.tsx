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
import { formatCurrency } from '@/lib/utils'
import {
  staffEarnings,
  useStaffCashout,
  useUpdateStaffBank,
} from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import { Copy, Loader2, Share2, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

function naira(amount: number) {
  return formatCurrency(Number(amount || 0)).replace(/\.00$/, '')
}

function commissionTitle(sourceType?: string, note?: string) {
  if (
    sourceType === 'NURSE_DIRECT_SCREEN' ||
    sourceType === 'NURSE_DIRECT_HOME_SCREEN'
  ) {
    return sourceType === 'NURSE_DIRECT_HOME_SCREEN'
      ? 'Your invite — home screening (any center)'
      : 'Your invite — screened at any center'
  }
  if (sourceType === 'PATIENT_REFERRAL_SCREEN') {
    return 'Hospital upline — a woman you registered referred someone here'
  }
  return note || 'Referral commission'
}

export function CenterEarningsPage() {
  const { data, isLoading, isError, refetch } = useQuery(staffEarnings())
  const updateBank = useUpdateStaffBank()
  const cashout = useStaffCashout()
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [bank, setBank] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  })

  const payload = data?.data
  const staff = payload?.staff
  const wallet = payload?.wallet
  const commissions = payload?.commissions || []
  const referrals = payload?.referrals || []
  const screenPay = naira(payload?.config?.screenCommissionFlat || 500)
  const homePay = naira(payload?.config?.homeScreenCommissionFlat || 1000)
  const uplinePay = naira(payload?.config?.nurseReferralCommissionFlat || 300)

  useEffect(() => {
    if (!staff) return
    setBank({
      bankName: staff.bankName || '',
      bankCode: staff.bankCode || '',
      accountNumber: staff.accountNumber || '',
      accountName: staff.accountName || '',
    })
  }, [
    staff?.id,
    staff?.bankName,
    staff?.bankCode,
    staff?.accountNumber,
    staff?.accountName,
  ])

  const onCopy = async (value?: string | null, message = 'Copied') => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success(message)
    } catch {
      toast.error('Could not copy')
    }
  }

  const onSaveBank = async () => {
    try {
      await updateBank.mutateAsync(bank)
      toast.success('Bank details verified with Flutterwave')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not save bank details')
    }
  }

  const onCashout = async () => {
    const amount = Number(cashoutAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    try {
      await cashout.mutateAsync(amount)
      toast.success('Cashout submitted via Flutterwave')
      setCashoutAmount('')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Cashout failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading earnings...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load earnings</CardTitle>
          <CardDescription>
            This page is private to nurses. Facility administrators cannot view
            it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 lg:p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Your referral earnings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Private to you — the facility administrator cannot see this wallet.
          Share your code with anyone, including people who live outside this
          hospital&apos;s area. You earn {screenPay} when they complete
          screening at any ZeroCancer center, or {homePay} for a home screening.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          You also earn {uplinePay} when a woman you registered at this hospital
          refers someone who screens here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {naira(wallet?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Ready to cash out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {naira(staff?.totalEarned || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {naira(staff?.totalPaidOut || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Invite anyone, any center
          </CardTitle>
          <CardDescription>
            People you invite are not tied to this hospital. They can screen
            wherever is closest to them, and you still earn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="rounded-md bg-pink-50 px-2.5 py-1 text-lg font-bold tracking-wide text-pink-800">
              {staff?.referralCode || '—'}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(staff?.referralCode, 'Code copied')}
              disabled={!staff?.referralCode}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy code
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onCopy(payload?.shareMessage || payload?.shareUrl, 'Link copied')
              }
              disabled={!payload?.shareUrl}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy share message
            </Button>
          </div>
          {payload?.shareUrl ? (
            <p className="break-all text-xs text-muted-foreground">
              {payload.shareUrl}
            </p>
          ) : null}
          {referrals.length > 0 ? (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">People you invited</p>
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{referral.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {referral.inviteCode}
                    </p>
                  </div>
                  <Badge className="border-transparent bg-slate-100 text-slate-800">
                    {referral.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No invites yet. Share your code with women outside this area too.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bank details & cashout</CardTitle>
            <CardDescription>
              Flutterwave verifies your Nigerian account, then pays commissions
              into it. This is not visible to the facility administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="staff-bank-name">Bank name</Label>
                <Input
                  id="staff-bank-name"
                  placeholder="GTBank"
                  value={bank.bankName}
                  onChange={(e) =>
                    setBank({ ...bank, bankName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-bank-code">Bank code</Label>
                <Input
                  id="staff-bank-code"
                  placeholder="058"
                  value={bank.bankCode}
                  onChange={(e) =>
                    setBank({ ...bank, bankCode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-account-number">Account number</Label>
                <Input
                  id="staff-account-number"
                  placeholder="0123456789"
                  value={bank.accountNumber}
                  onChange={(e) =>
                    setBank({ ...bank, accountNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-account-name">Account name</Label>
                <Input
                  id="staff-account-name"
                  placeholder="As shown on account"
                  value={bank.accountName}
                  onChange={(e) =>
                    setBank({ ...bank, accountName: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onSaveBank}
              disabled={updateBank.isPending}
            >
              {updateBank.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save bank details
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 border-t pt-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="staff-cashout">Cashout amount (₦)</Label>
                <Input
                  id="staff-cashout"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  type="number"
                  min="100"
                  placeholder="500"
                />
              </div>
              <Button
                onClick={onCashout}
                disabled={cashout.isPending}
                className="bg-primary text-white"
              >
                {cashout.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cash out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent commissions</CardTitle>
            <CardDescription>
              Direct invites pay after screening at any center. Upline rewards
              pay only when the screening is at this hospital.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {commissions.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No commissions yet. Share your code, or register patients who
                later invite others here.
              </div>
            ) : (
              commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div>
                    <p className="font-medium">
                      {commissionTitle(commission.sourceType, commission.note)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {commission.note || 'Nurse referral reward'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">{naira(commission.amount)}</p>
                    <Badge className="border-transparent bg-emerald-100 text-emerald-800">
                      {commission.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
