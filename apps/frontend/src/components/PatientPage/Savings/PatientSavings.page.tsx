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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { formatCurrency } from '@/lib/utils'
import * as agentApi from '@/services/agent-network.service'
import * as screeningTypeService from '@/services/screeningType.service'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Loader2, PiggyBank } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

function naira(amount: number) {
  return formatCurrency(Number(amount || 0)).replace(/\.00$/, '')
}

function planBadgeClass(status?: string) {
  switch (status) {
    case 'READY':
      return 'border-transparent bg-emerald-100 text-emerald-800'
    case 'USED':
    case 'COMPLETED':
      return 'border-transparent bg-slate-100 text-slate-700'
    case 'CANCELLED':
      return 'border-transparent bg-rose-100 text-rose-800'
    default:
      return 'border-transparent bg-amber-100 text-amber-800'
  }
}

export function PatientSavingsPage() {
  const navigate = useNavigate()
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['savings-plans'],
    queryFn: agentApi.listSavingsPlans,
  })
  const { data: typesData } = useQuery({
    queryKey: ['screening-types-savings'],
    queryFn: () =>
      screeningTypeService.fetchScreeningTypes({ page: 1, pageSize: 50 }),
  })

  const [screeningTypeId, setScreeningTypeId] = useState('')
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>(
    {},
  )
  const [creating, setCreating] = useState(false)
  const [depositingId, setDepositingId] = useState<string | null>(null)

  const plans = data?.data?.plans || []
  const minDeposit = data?.data?.minDeposit || 500
  const screeningTypes = useMemo(() => {
    const list = (typesData as any)?.data || []
    return Array.isArray(list) ? list : list?.items || list?.screeningTypes || []
  }, [typesData])

  const typeNameById = useMemo(() => {
    return Object.fromEntries(
      screeningTypes.map((type: any) => [type.id, type.name]),
    )
  }, [screeningTypes])

  const onCreate = async () => {
    if (!screeningTypeId) {
      toast.error('Select a screening type')
      return
    }
    setCreating(true)
    try {
      await agentApi.createSavingsPlan({ screeningTypeId })
      toast.success('Savings plan created')
      setScreeningTypeId('')
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not create plan')
    } finally {
      setCreating(false)
    }
  }

  const onDeposit = async (planId: string) => {
    const amount = Number(depositAmounts[planId] || 0)
    if (!amount) {
      toast.error('Enter deposit amount')
      return
    }
    setDepositingId(planId)
    try {
      const res: any = await agentApi.depositSavings(planId, amount)
      const url = res?.data?.authorizationUrl
      if (url) {
        window.location.href = url
      } else {
        toast.error('No payment URL returned')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Deposit failed')
    } finally {
      setDepositingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading savings plans...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Could not load savings</CardTitle>
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
        <h1 className="text-3xl font-bold">Save to screen</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Put money aside in small deposits until you can book. Minimum deposit{' '}
          {naira(minDeposit)}.
        </p>
      </div>

      <div className="rounded-2xl border bg-gradient-to-r from-pink-50 to-blue-50 p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">
              Cannot pay all at once?
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Create a plan for the screening you want, deposit when you can,
              then book once your balance covers the price.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 bg-white"
            onClick={() =>
              document
                .getElementById('create-savings-plan')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Start saving
          </Button>
        </div>
      </div>

      <Card id="create-savings-plan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-pink-600" />
            Start a savings plan
          </CardTitle>
          <CardDescription>
            Choose the screening you are saving toward. You can deposit anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Screening type</Label>
            <Select value={screeningTypeId} onValueChange={setScreeningTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select screening" />
              </SelectTrigger>
              <SelectContent>
                {screeningTypes.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No screening types available
                  </SelectItem>
                ) : (
                  screeningTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={onCreate}
            disabled={creating}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {creating ? 'Creating...' : 'Create plan'}
          </Button>
        </CardContent>
      </Card>

      {plans.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
            <PiggyBank className="h-6 w-6 text-pink-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            No savings plans yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Create a plan above, then add deposits until you are ready to book.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan: any) => {
            const progress = Math.min(
              100,
              Math.round(
                (Number(plan.savedAmount) / Number(plan.targetAmount || 1)) *
                  100,
              ),
            )
            const screeningName =
              typeNameById[plan.screeningTypeId] || 'Screening plan'
            return (
              <Card key={plan.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-lg">{screeningName}</CardTitle>
                    <CardDescription>
                      Saved {naira(plan.savedAmount)} of{' '}
                      {naira(plan.targetAmount)} ({progress}%)
                    </CardDescription>
                  </div>
                  <Badge className={planBadgeClass(plan.status)}>
                    {plan.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-pink-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {plan.status === 'ACTIVE' || plan.status === 'READY' ? (
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`deposit-${plan.id}`}>
                          Deposit amount (₦)
                        </Label>
                        <Input
                          id={`deposit-${plan.id}`}
                          type="number"
                          min={minDeposit}
                          placeholder={String(minDeposit)}
                          value={depositAmounts[plan.id] || ''}
                          onChange={(e) =>
                            setDepositAmounts({
                              ...depositAmounts,
                              [plan.id]: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        onClick={() => onDeposit(plan.id)}
                        disabled={depositingId === plan.id}
                        variant="outline"
                      >
                        {depositingId === plan.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Deposit
                      </Button>
                    </div>
                  ) : null}
                  {plan.status === 'READY' ? (
                    <Button
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                      onClick={() =>
                        navigate({
                          to: '/patient/book/pay',
                          search: { savingsPlanId: plan.id },
                        })
                      }
                    >
                      Book with savings
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
