import * as agentApi from '@/services/agent-network.service'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

function SavingsPaymentStatusPage() {
  const navigate = useNavigate()
  const search = Route.useSearch() as { ref?: string }
  const [status, setStatus] = useState('Verifying payment...')

  useEffect(() => {
    const run = async () => {
      if (!search.ref) {
        setStatus('Missing payment reference')
        return
      }
      try {
        await agentApi.verifySavingsDeposit(search.ref)
        toast.success('Deposit confirmed')
        setStatus('Deposit successful. Redirecting...')
        setTimeout(() => navigate({ to: '/patient/savings' }), 1200)
      } catch (error: any) {
        setStatus(error?.response?.data?.error || 'Verification failed')
      }
    }
    run()
  }, [search.ref, navigate])

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p>{status}</p>
    </div>
  )
}

export const Route = createFileRoute('/patient/savings/payment-status')({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === 'string' ? search.ref : undefined,
  }),
  component: SavingsPaymentStatusPage,
})
