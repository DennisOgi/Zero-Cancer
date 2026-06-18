import { useState } from 'react'
import { Button } from '@/components/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shared/ui/dialog'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { formatCurrency } from '@/lib/utils'
import { AlertCircleIcon, CheckCircleIcon, WalletIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as walletService from '@/services/wallet.service'

interface CashoutRequestDialogProps {
  currentBalance: number
  centerId: string
  disabled?: boolean
  variant?: 'default' | 'secondary' | 'outline'
}

export function CashoutRequestDialog({
  currentBalance,
  centerId,
  disabled = false,
  variant = 'default',
}: CashoutRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const queryClient = useQueryClient()

  const TRANSACTION_FEE = 10
  const MIN_CASHOUT = 1000

  const requestedAmount = parseFloat(amount) || 0
  const netAmount = requestedAmount > 0 ? requestedAmount - TRANSACTION_FEE : 0
  const isValidAmount =
    requestedAmount >= MIN_CASHOUT && requestedAmount <= currentBalance

  const cashoutMutation = useMutation({
    mutationFn: async (data: { amount: number; fee: number }) => {
      const response = await walletService.requestCashout(centerId, data)
      return response.data
    },
    onSuccess: () => {
      // Invalidate wallet queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['centerWallet', centerId] })
      queryClient.invalidateQueries({ queryKey: ['centerWalletStats', centerId] })
      queryClient.invalidateQueries({ queryKey: ['centerWalletTransactions', centerId] })
      queryClient.invalidateQueries({ queryKey: ['centerCashouts', centerId] })

      toast.success('Cashout requested successfully!', {
        description: `${formatCurrency(netAmount)} will be transferred to your bank account within 24-48 hours.`,
      })

      setOpen(false)
      setAmount('')
    },
    onError: (error: any) => {
      toast.error('Failed to request cashout', {
        description: error.message || 'Please try again or contact support if the issue persists.',
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidAmount) {
      toast.error('Invalid amount', {
        description: `Amount must be between ₦${MIN_CASHOUT.toLocaleString()} and ${formatCurrency(currentBalance)}`,
      })
      return
    }

    cashoutMutation.mutate({
      amount: requestedAmount,
      fee: TRANSACTION_FEE,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size="lg"
          disabled={disabled}
          className="gap-2"
        >
          <WalletIcon className="h-5 w-5" />
          Request Cashout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-primary" />
            Request Cashout
          </DialogTitle>
          <DialogDescription>
            Transfer funds from your wallet to your registered bank account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Current Balance */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Available Balance
              </p>
              <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Cashout Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  min={MIN_CASHOUT}
                  max={currentBalance}
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: {formatCurrency(MIN_CASHOUT)} • Maximum:{' '}
                {formatCurrency(currentBalance)}
              </p>
            </div>

            {/* Fee Breakdown */}
            {requestedAmount > 0 && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requested Amount</span>
                  <span className="font-medium">
                    {formatCurrency(requestedAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction Fee</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(TRANSACTION_FEE)}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="font-semibold">You'll Receive</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatCurrency(netAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Validation Messages */}
            {requestedAmount > 0 && !isValidAmount && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircleIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  {requestedAmount < MIN_CASHOUT && (
                    <p className="text-destructive">
                      Amount must be at least {formatCurrency(MIN_CASHOUT)}
                    </p>
                  )}
                  {requestedAmount > currentBalance && (
                    <p className="text-destructive">
                      Amount exceeds available balance
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Success Info */}
            {requestedAmount > 0 && isValidAmount && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Ready to process</p>
                  <p className="text-xs mt-1">
                    Funds will be transferred within 24-48 hours
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={cashoutMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValidAmount || cashoutMutation.isPending}
              className="gap-2"
            >
              {cashoutMutation.isPending ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <WalletIcon className="h-4 w-4" />
                  Confirm Cashout
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
