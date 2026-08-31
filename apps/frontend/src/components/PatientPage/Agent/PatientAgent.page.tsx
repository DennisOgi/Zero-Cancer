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
import * as agentApi from '@/services/agent-network.service'
import { useQuery } from '@tanstack/react-query'
import { Copy, Loader2, Share2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function PatientAgentPage() {
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['agent-me'],
    queryFn: agentApi.getAgentMe,
  })
  const [activating, setActivating] = useState(false)
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [bank, setBank] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  })
  const [inviteName, setInviteName] = useState('')
  const [invitePhone, setInvitePhone] = useState('')

  const payload = data?.data
  const agent = payload?.agent

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

  const onCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Copied')
  }

  const onInvite = async () => {
    try {
      const res: any = await agentApi.createAgentInvite({
        inviteName: inviteName || undefined,
        invitePhone: invitePhone || undefined,
      })
      toast.success('Invite created')
      if (res?.data?.shareUrl) await onCopy(res.data.shareUrl)
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Invite failed')
    }
  }

  const onSaveBank = async () => {
    try {
      await agentApi.updateAgentBank(bank)
      toast.success('Bank details saved')
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not save bank')
    }
  }

  const onCashout = async () => {
    const amount = Number(cashoutAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    try {
      await agentApi.agentCashout(amount)
      toast.success('Cashout submitted')
      setCashoutAmount('')
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Cashout failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load agent hub</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">Become an agent</h1>
        <p className="text-muted-foreground">
          After you complete a screening, invite friends and sponsors. Earn ₦
          {payload?.config?.screenCommissionFlat?.toLocaleString() || 500} when
          someone you refer completes screening (if they allow it), and{' '}
          {payload?.config?.sponsorCommissionPercent || 5}% when a sponsor you
          invite funds women on the waitlist.
        </p>
        <Button onClick={onActivate} disabled={activating}>
          {activating ? 'Activating...' : 'Activate agent account'}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent hub</h1>
        <p className="text-muted-foreground">
          Share your code, earn when referred women screen or sponsors fund seats.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Referral code</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-lg font-bold">
              {agent.referralCode}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => onCopy(agent.referralCode)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ₦{Number(payload?.wallet?.balance || 0).toLocaleString()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Screened referrals</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {payload?.stats?.screenedCount || 0}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share / invite
          </CardTitle>
          <CardDescription>
            Friends can register with your code. They choose whether you earn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => onCopy(payload?.shareUrl || '')}
            >
              Copy link
            </Button>
            <a
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              href={`https://wa.me/?text=${payload?.whatsappText || ''}`}
              target="_blank"
              rel="noreferrer"
            >
              Share on WhatsApp
            </a>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Invitee name</Label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div>
              <Label>Invitee phone</Label>
              <Input
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={onInvite}>Create personal invite</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank details & cashout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Bank name</Label>
              <Input
                value={bank.bankName}
                onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
              />
            </div>
            <div>
              <Label>Bank code</Label>
              <Input
                value={bank.bankCode}
                onChange={(e) => setBank({ ...bank, bankCode: e.target.value })}
              />
            </div>
            <div>
              <Label>Account number</Label>
              <Input
                value={bank.accountNumber}
                onChange={(e) =>
                  setBank({ ...bank, accountNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Account name</Label>
              <Input
                value={bank.accountName}
                onChange={(e) =>
                  setBank({ ...bank, accountName: e.target.value })
                }
              />
            </div>
          </div>
          <Button variant="outline" onClick={onSaveBank}>
            Save bank details
          </Button>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Cashout amount (₦)</Label>
              <Input
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                type="number"
              />
            </div>
            <Button onClick={onCashout}>Cash out</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent commissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(payload?.commissions || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No commissions yet.</p>
          )}
          {(payload?.commissions || []).map((c: any) => (
            <div
              key={c.id}
              className="flex items-center justify-between border-b py-2 text-sm"
            >
              <span>
                {c.sourceType} · {c.status}
              </span>
              <span className="font-semibold">
                ₦{Number(c.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
