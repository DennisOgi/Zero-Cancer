import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import * as agentApi from '@/services/agent-network.service'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'

export function AdminAgentsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-agents'],
    queryFn: agentApi.adminListAgents,
  })
  const { data: commissionsData, refetch: refetchCommissions } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: agentApi.adminListCommissions,
  })
  const { data: savingsData } = useQuery({
    queryKey: ['admin-savings'],
    queryFn: agentApi.adminListSavings,
  })

  const agents = data?.data?.agents || []
  const config = data?.data?.config
  const commissions = commissionsData?.data || []
  const savings = savingsData?.data || []

  const toggleAgent = async (id: string, status: string) => {
    try {
      if (status === 'ACTIVE') await agentApi.adminSuspendAgent(id)
      else await agentApi.adminActivateAgent(id)
      toast.success('Agent updated')
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Update failed')
    }
  }

  const voidCommission = async (id: string) => {
    try {
      await agentApi.adminVoidCommission(id)
      toast.success('Commission voided')
      refetchCommissions()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Void failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" /> Agents & referrals
        </h1>
        <p className="text-muted-foreground">
          Screen commission ₦{config?.screenCommissionFlat?.toLocaleString()} ·
          Home ₦{config?.homeScreenCommissionFlat?.toLocaleString()} · Sponsor{' '}
          {config?.sponsorCommissionPercent}%
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents ({agents.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {agents.map((a: any) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm"
            >
              <div>
                <div className="font-medium">
                  {a.user?.fullName || a.userId} · {a.referralCode}
                </div>
                <div className="text-muted-foreground">
                  {a.status} · earned ₦{Number(a.totalEarned || 0).toLocaleString()} ·
                  paid ₦{Number(a.totalPaidOut || 0).toLocaleString()}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleAgent(a.id, a.status)}
              >
                {a.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commissions</CardTitle>
          <CardDescription>Latest 200</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {commissions.map((c: any) => (
            <div
              key={c.id}
              className="flex items-center justify-between border-b py-2 text-sm"
            >
              <span>
                {c.sourceType} · {c.status} · ₦
                {Number(c.amount).toLocaleString()}
              </span>
              {c.status !== 'VOID' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => voidCommission(c.id)}
                >
                  Void
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Savings plans ({savings.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {savings.map((p: any) => (
            <div key={p.id} className="border-b py-2 text-sm">
              {p.status}: ₦{Number(p.savedAmount).toLocaleString()} / ₦
              {Number(p.targetAmount).toLocaleString()}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
