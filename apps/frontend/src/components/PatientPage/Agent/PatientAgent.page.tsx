import peopleIcon from '@/assets/images/people.png'
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
import * as agentApi from '@/services/agent-network.service'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  Copy,
  Home,
  Loader2,
  Share2,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

function naira(amount: number) {
  return formatCurrency(Number(amount || 0)).replace(/\.00$/, '')
}

function shareUrlForCode(code?: string, fallback?: string) {
  if (!code) return fallback || ''
  if (typeof window === 'undefined') return fallback || ''
  return `${window.location.origin}/sign-up/patient?ref=${encodeURIComponent(code)}`
}

function commissionLabel(sourceType?: string) {
  switch (sourceType) {
    case 'HOME_SCREEN':
      return 'Home screening'
    case 'SPONSOR_CAMPAIGN':
      return 'Sponsor campaign'
    case 'SCREEN':
      return 'Center screening'
    default:
      return sourceType || 'Commission'
  }
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case 'AVAILABLE':
    case 'SCREENED':
    case 'ACTIVE':
    case 'SUCCESS':
      return 'border-transparent bg-emerald-100 text-emerald-800'
    case 'ACCEPTED':
    case 'PROCESSING':
    case 'PENDING':
      return 'border-transparent bg-amber-100 text-amber-800'
    case 'VOID':
    case 'FAILED':
    case 'SUSPENDED':
      return 'border-transparent bg-rose-100 text-rose-800'
    default:
      return 'border-transparent bg-slate-100 text-slate-700'
  }
}

export function PatientAgentPage() {
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['agent-me'],
    queryFn: agentApi.getAgentMe,
  })
  const [activating, setActivating] = useState(false)
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [inviting, setInviting] = useState(false)
  const [savingBank, setSavingBank] = useState(false)
  const [cashingOut, setCashingOut] = useState(false)
  const [bank, setBank] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  })
  const [inviteName, setInviteName] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [lastInviteUrl, setLastInviteUrl] = useState('')

  const payload = data?.data
  const agent = payload?.agent
  const config = payload?.config
  const eligible = payload?.eligible !== false
  const boundCenter = payload?.boundCenter
  const payoutProvider = config?.payoutProvider || 'FLUTTERWAVE'

  useEffect(() => {
    if (!agent) return
    setBank({
      bankName: agent.bankName || '',
      bankCode: agent.bankCode || '',
      accountNumber: agent.accountNumber || '',
      accountName: agent.accountName || '',
    })
  }, [
    agent?.id,
    agent?.bankName,
    agent?.bankCode,
    agent?.accountNumber,
    agent?.accountName,
  ])

  const displayShareUrl = useMemo(
    () => shareUrlForCode(agent?.referralCode, payload?.shareUrl),
    [agent?.referralCode, payload?.shareUrl],
  )

  const onActivate = async () => {
    setActivating(true)
    try {
      await agentApi.activateAgent()
      toast.success('You are now a ZeroCancer agent')
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not activate')
    } finally {
      setActivating(false)
    }
  }

  const onCopy = async (text: string, label = 'Copied') => {
    if (!text) {
      toast.error('Nothing to copy yet')
      return
    }
    await navigator.clipboard.writeText(text)
    toast.success(label)
  }

  const onInvite = async () => {
    setInviting(true)
    try {
      const res: any = await agentApi.createAgentInvite({
        inviteName: inviteName || undefined,
        invitePhone: invitePhone || undefined,
      })
      const url =
        res?.data?.shareUrl || shareUrlForCode(res?.data?.inviteCode)
      setLastInviteUrl(url)
      toast.success('Personal invite created')
      if (url) await onCopy(url, 'Invite link copied')
      setInviteName('')
      setInvitePhone('')
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Invite failed')
    } finally {
      setInviting(false)
    }
  }

  const onSaveBank = async () => {
    setSavingBank(true)
    try {
      await agentApi.updateAgentBank(bank)
      toast.success('Bank details saved')
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not save bank')
    } finally {
      setSavingBank(false)
    }
  }

  const onCashout = async () => {
    const amount = Number(cashoutAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setCashingOut(true)
    try {
      await agentApi.agentCashout(amount)
      toast.success('Cashout submitted')
      setCashoutAmount('')
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Cashout failed')
    } finally {
      setCashingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading your agent hub...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Could not load Earn / Refer</CardTitle>
          <CardDescription>
            Check that the backend is running, then try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (!agent) {
    const screenPay = naira(config?.screenCommissionFlat || 500)
    const homePay = naira(config?.homeScreenCommissionFlat || 1000)
    const sponsorPct = config?.sponsorCommissionPercent || 5

    const steps = [
      {
        title: 'Complete your screening',
        body: 'Pay or save to screen first. Agent tools unlock after a completed appointment.',
      },
      {
        title: 'Invite friends and sponsors',
        body: 'Share your code. Friends can screen at a center or at home. Sponsors can fund women on the waitlist.',
      },
      {
        title: 'They choose. You earn.',
        body: `They decide whether you earn. Center screens pay ${screenPay}. Home visits pay ${homePay}. Sponsors pay ${sponsorPct}%.`,
      },
    ]

    return (
      <div className="space-y-6">
        <div className="bg-white p-4 lg:p-6 rounded-lg">
          <h1 className="text-3xl font-bold">Earn / Refer</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Invite friends and sponsors. Earn when they screen or fund other
            women — if they allow it.
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-pink-50 to-blue-50 border p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 space-y-4">
              <Badge
                className={
                  eligible
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                }
              >
                {eligible ? 'Ready to activate' : 'Screening required first'}
              </Badge>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Become a ZeroCancer agent
              </h2>
              <p className="text-gray-600 max-w-2xl leading-relaxed">
                After you are screened, you can talk to friends, women who can
                afford home visits, and organizations that sponsor others. Your
                wallet grows when they complete a screening or fund the
                waitlist.
              </p>
              {eligible ? (
                <Button
                  onClick={onActivate}
                  disabled={activating}
                  size="lg"
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {activating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {activating ? 'Activating...' : 'Activate agent account'}
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    <Link to="/patient/book">
                      Book a screening first
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/patient/savings">Or save toward a screen</Link>
                  </Button>
                </div>
              )}
            </div>
            <img
              src={peopleIcon}
              alt=""
              className="hidden lg:block h-28 w-28 object-contain opacity-90"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-pink-100">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                <Users className="h-5 w-5 text-pink-600" />
              </div>
              <CardTitle className="text-base">Friends who screen</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Earn {screenPay} when someone you refer completes a center
              screening and allows your commission.
            </CardContent>
          </Card>
          <Card className="border-pink-100">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                <Home className="h-5 w-5 text-pink-600" />
              </div>
              <CardTitle className="text-base">Home visits</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Earn {homePay} when a referred woman completes a home screening.
            </CardContent>
          </Card>
          <Card className="border-pink-100">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                <Building2 className="h-5 w-5 text-pink-600" />
              </div>
              <CardTitle className="text-base">Sponsors</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Earn {sponsorPct}% when a sponsor you invite funds women on the
              waitlist.
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>
              One referral level. They choose whether you earn. You cash out to
              your bank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    )
  }

  const referrals = payload?.referrals || []
  const commissions = payload?.commissions || []

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 lg:p-6 rounded-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Earn / Refer</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {boundCenter
                ? `Invite women to screen at ${boundCenter.centerName}. You earn when they complete screening there.`
                : 'Share your code, then cash out when referred women screen or sponsors fund seats.'}
            </p>
          </div>
          <Badge className="w-fit border-transparent bg-emerald-100 text-emerald-800">
            Agent active
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral code</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <code className="rounded-md bg-pink-50 px-2.5 py-1 text-lg font-bold tracking-wide text-pink-800">
              {agent.referralCode}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => onCopy(agent.referralCode, 'Code copied')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {naira(payload?.wallet?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to cash out
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Screened referrals
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payload?.stats?.screenedCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {payload?.stats?.referralCount || referrals.length} invites sent
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-pink-600" /> Invite friends
          </CardTitle>
          <CardDescription>
            {boundCenter
              ? `They register with your link and are assigned to ${boundCenter.centerName}. You earn when they complete screening there, if they allow it.`
              : 'They register with your link, then choose whether you earn when they book.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value={displayShareUrl} className="bg-muted/40" />
            <Button
              variant="outline"
              onClick={() => onCopy(displayShareUrl, 'Link copied')}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
            <Button
              asChild
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  boundCenter
                    ? `Join me at ${boundCenter.centerName} for cervical cancer screening. Use my code ${agent.referralCode}: ${displayShareUrl}`
                    : `Join me on ZeroCancer for cervical cancer screening. Use my code ${agent.referralCode}: ${displayShareUrl}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Share on WhatsApp
              </a>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Invitee name</Label>
              <Input
                id="invite-name"
                placeholder="Adaeze"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-phone">Invitee phone</Label>
              <Input
                id="invite-phone"
                placeholder="0803..."
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={onInvite} disabled={inviting} variant="outline">
            {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create personal invite
          </Button>
          {lastInviteUrl ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Personal invite ready.{' '}
              <button
                type="button"
                className="underline font-medium"
                onClick={() => onCopy(lastInviteUrl, 'Invite link copied')}
              >
                Copy it again
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bank details & cashout</CardTitle>
            <CardDescription>
              {payoutProvider === 'FLUTTERWAVE'
                ? 'Flutterwave verifies your Nigerian bank account and pays commissions into it.'
                : 'Save a Nigerian bank account, then withdraw your commissions.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bank-name">Bank name</Label>
                <Input
                  id="bank-name"
                  placeholder="GTBank"
                  value={bank.bankName}
                  onChange={(e) =>
                    setBank({ ...bank, bankName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank-code">Bank code</Label>
                <Input
                  id="bank-code"
                  placeholder="058"
                  value={bank.bankCode}
                  onChange={(e) =>
                    setBank({ ...bank, bankCode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-number">Account number</Label>
                <Input
                  id="account-number"
                  placeholder="0123456789"
                  value={bank.accountNumber}
                  onChange={(e) =>
                    setBank({ ...bank, accountNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-name">Account name</Label>
                <Input
                  id="account-name"
                  placeholder="As shown on account"
                  value={bank.accountName}
                  onChange={(e) =>
                    setBank({ ...bank, accountName: e.target.value })
                  }
                />
              </div>
            </div>
            <Button variant="outline" onClick={onSaveBank} disabled={savingBank}>
              {savingBank && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save bank details
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 border-t pt-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="cashout-amount">Cashout amount (₦)</Label>
                <Input
                  id="cashout-amount"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  type="number"
                  min="1"
                  placeholder="500"
                />
              </div>
              <Button
                onClick={onCashout}
                disabled={cashingOut}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {cashingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cash out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent invites</CardTitle>
            <CardDescription>People you have asked to join.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {referrals.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No invites yet. Copy your link or create a personal invite.
              </div>
            ) : (
              referrals.slice(0, 8).map((referral: any) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {referral.inviteName ||
                        referral.invitePhone ||
                        referral.inviteCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referral.inviteCode}
                    </p>
                  </div>
                  <Badge className={statusBadgeClass(referral.status)}>
                    {referral.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent commissions</CardTitle>
          <CardDescription>
            Credits appear after a referred screening is completed, or after a
            sponsor payment confirms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              No commissions yet. Share your code to start earning.
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map((commission: any) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div>
                    <p className="font-medium">
                      {commissionLabel(commission.sourceType)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {commission.note || 'Referral commission'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">{naira(commission.amount)}</p>
                    <Badge className={statusBadgeClass(commission.status)}>
                      {commission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
