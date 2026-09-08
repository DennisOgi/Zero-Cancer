import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import * as agentApi from '@/services/agent-network.service'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

function SavingsPaymentStatusPage() {
  const navigate = useNavigate()
  const search = Route.useSearch() as { ref?: string }
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  )
  const [message, setMessage] = useState('Verifying your savings deposit...')

  useEffect(() => {
    const run = async () => {
      if (!search.ref) {
        setStatus('error')
        setMessage('No payment reference was provided.')
        return
      }
      try {
        await agentApi.verifySavingsDeposit(search.ref)
        toast.success('Deposit confirmed')
        setStatus('success')
        setMessage('Deposit successful. Taking you back to your savings plan.')
        setTimeout(() => navigate({ to: '/patient/savings' }), 1400)
      } catch (error: any) {
        setStatus('error')
        setMessage(error?.response?.data?.error || 'Verification failed')
      }
    }
    run()
  }, [search.ref, navigate])

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card className={status === 'error' ? 'border-red-200' : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            )}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            {status === 'loading' && 'Verifying payment'}
            {status === 'success' && 'Deposit confirmed'}
            {status === 'error' && 'Deposit not confirmed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {search.ref ? (
            <p className="text-xs text-muted-foreground">
              Reference: {search.ref}
            </p>
          ) : null}
          {status === 'error' ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/patient/savings' })}
              >
                Back to savings
              </Button>
              <Button
                className="bg-pink-600 hover:bg-pink-700 text-white"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/patient/savings/payment-status')({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === 'string' ? search.ref : undefined,
  }),
  component: SavingsPaymentStatusPage,
})
