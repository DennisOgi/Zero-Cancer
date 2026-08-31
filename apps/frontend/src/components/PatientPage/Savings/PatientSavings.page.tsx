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
import * as agentApi from '@/services/agent-network.service'
import * as screeningTypeService from '@/services/screeningType.service'
import { useQuery } from '@tanstack/react-query'
import { Loader2, PiggyBank } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'

export function PatientSavingsPage() {
  const navigate = useNavigate()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['savings-plans'],
    queryFn: agentApi.listSavingsPlans,
  })
  const { data: typesData } = useQuery({
    queryKey: ['screening-types-savings'],
    queryFn: () => screeningTypeService.fetchScreeningTypes({ page: 1, pageSize: 50 }),
  })

  const [screeningTypeId, setScreeningTypeId] = useState('')
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>(
    {},
  )
  const [creating, setCreating] = useState(false)

  const plans = data?.data?.plans || []
  const minDeposit = data?.data?.minDeposit || 500
  const screeningTypes = useMemo(() => {
    const list = (typesData as any)?.data || []
    return Array.isArray(list) ? list : list?.items || list?.screeningTypes || []
  }, [typesData])

  const onCreate = async () => {
    if (!screeningTypeId) {
      toast.error('Select a screening type')
      return
    }
    setCreating(true)
    try {
      await agentApi.createSavingsPlan({ screeningTypeId })
      toast.success('Savings plan created')
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
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PiggyBank className="h-8 w-8" /> Save to screen
        </h1>
        <p className="text-muted-foreground">
          Save in small deposits until you can book. Minimum deposit ₦
          {Number(minDeposit).toLocaleString()}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start a savings plan</CardTitle>
          <CardDescription>
            Choose the screening you are saving toward.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Screening type</Label>
            <Select value={screeningTypeId} onValueChange={setScreeningTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select screening" />
              </SelectTrigger>
              <SelectContent>
                {screeningTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create plan'}
          </Button>
        </CardContent>
      </Card>

      {plans.map((plan: any) => {
        const progress = Math.min(
          100,
          Math.round(
            (Number(plan.savedAmount) / Number(plan.targetAmount || 1)) * 100,
          ),
        )
        return (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                Plan · {plan.status}
              </CardTitle>
              <CardDescription>
                Saved ₦{Number(plan.savedAmount).toLocaleString()} of ₦
                {Number(plan.targetAmount).toLocaleString()} ({progress}%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 rounded bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {plan.status === 'ACTIVE' || plan.status === 'READY' ? (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Deposit amount (₦)</Label>
                    <Input
                      type="number"
                      value={depositAmounts[plan.id] || ''}
                      onChange={(e) =>
                        setDepositAmounts({
                          ...depositAmounts,
                          [plan.id]: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button onClick={() => onDeposit(plan.id)}>Deposit</Button>
                </div>
              ) : null}
              {plan.status === 'READY' ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate({
                      to: '/patient/book/pay',
                      search: { savingsPlanId: plan.id },
                    })
                  }
                >
                  Book with savings
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
