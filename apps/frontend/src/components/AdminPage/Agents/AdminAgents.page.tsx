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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { formatCurrency } from '@/lib/utils'
import * as agentApi from '@/services/agent-network.service'
import { useQuery } from '@tanstack/react-query'
import { Home, Loader2, PiggyBank, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'

function naira(amount: number) {
  return formatCurrency(Number(amount || 0)).replace(/\.00$/, '')
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case 'ACTIVE':
    case 'AVAILABLE':
    case 'READY':
    case 'SUCCESS':
      return 'border-transparent bg-emerald-100 text-emerald-800'
    case 'PROCESSING':
    case 'PENDING':
      return 'border-transparent bg-amber-100 text-amber-800'
    case 'SUSPENDED':
    case 'VOID':
    case 'FAILED':
    case 'CANCELLED':
      return 'border-transparent bg-rose-100 text-rose-800'
    default:
      return 'border-transparent bg-slate-100 text-slate-700'
  }
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

export function AdminAgentsPage() {
  const { data, isLoading, refetch, isError } = useQuery({
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
  const activeAgents = agents.filter((agent: any) => agent.status === 'ACTIVE')
  const availableCommissions = commissions.filter(
    (commission: any) => commission.status === 'AVAILABLE',
  )

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
      <div className="flex min-h-[320px] items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading agents...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Could not load agents</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agents & referrals</h1>
        <p className="text-muted-foreground mt-1">
          Review agent accounts, commissions, and save-to-screen plans.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active agents</p>
                <p className="text-xl font-bold">{activeAgents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-pink-600" />
              <div>
                <p className="text-sm text-muted-foreground">Center commission</p>
                <p className="text-xl font-bold">
                  {naira(config?.screenCommissionFlat || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-muted-foreground">Home commission</p>
                <p className="text-xl font-bold">
                  {naira(config?.homeScreenCommissionFlat || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Savings plans</p>
                <p className="text-xl font-bold">{savings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents ({agents.length})</CardTitle>
          <CardDescription>
            Sponsor commission is {config?.sponsorCommissionPercent || 5}% of
            funded campaign amount. {availableCommissions.length} commissions
            currently available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No agents have activated yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Earned</TableHead>
                  <TableHead>Paid out</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent: any) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="font-medium">
                        {agent.user?.fullName || 'Unknown user'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {agent.user?.email || agent.userId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {agent.referralCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(agent.status)}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{naira(agent.totalEarned || 0)}</TableCell>
                    <TableCell>{naira(agent.totalPaidOut || 0)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAgent(agent.id, agent.status)}
                      >
                        {agent.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commissions</CardTitle>
          <CardDescription>Latest 200 commission records</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commissions recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission: any) => (
                  <TableRow key={commission.id}>
                    <TableCell>{commissionLabel(commission.sourceType)}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(commission.status)}>
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{naira(commission.amount)}</TableCell>
                    <TableCell className="text-right">
                      {commission.status !== 'VOID' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => voidCommission(commission.id)}
                        >
                          Void
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Savings plans ({savings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {savings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No savings plans yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Saved</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savings.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Badge className={statusBadgeClass(plan.status)}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{naira(plan.savedAmount)}</TableCell>
                    <TableCell>{naira(plan.targetAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
