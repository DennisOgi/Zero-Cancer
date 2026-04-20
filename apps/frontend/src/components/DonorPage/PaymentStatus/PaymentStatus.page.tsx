import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { QueryKeys } from '@/services/keys'
import { useVerifyPayment } from '@/services/providers/donor.provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Home,
  Loader2,
  PartyPopper,
  Printer,
  Share2,
  XCircle,
} from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface PaymentStatusPageProps {
  paymentRef: string
  campaignId: string
}

// --- UI Components for different states ---

function StatusCard({
  status,
  title,
  message,
  onRetry,
}: {
  status: 'loading' | 'error' | 'pending' | 'failed' | 'abandoned'
  title?: string
  message?: string
  onRetry?: () => void
}) {
  const navigate = useNavigate()
  const iconMap = {
    loading: <Loader2 className="h-12 w-12 animate-spin text-blue-600" />,
    error: <XCircle className="h-12 w-12 text-red-500" />,
    pending: <Clock className="h-12 w-12 text-yellow-500" />,
    failed: <XCircle className="h-12 w-12 text-red-500" />,
    abandoned: <AlertTriangle className="h-12 w-12 text-gray-500" />,
  }

  const titleMap = {
    loading: 'Verifying Payment...',
    error: title || 'Verification Failed',
    pending: 'Payment Pending',
    failed: 'Payment Failed',
    abandoned: 'Payment Abandoned',
  }

  const messageMap = {
    loading: 'Please wait while we confirm your transaction.',
    error: message || 'There was an error verifying your payment.',
    pending:
      'Your payment is still being processed. We will update this page automatically.',
    failed: 'Your payment could not be completed. Please try again.',
    abandoned: 'The payment was not completed.',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardContent className="p-8">
          <div className="mb-4">{iconMap[status]}</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            {titleMap[status]}
          </h2>
          <p className="text-gray-600 mb-6">{messageMap[status]}</p>
          <div className="flex gap-4 justify-center">
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Check Again
              </Button>
            )}
            <Button onClick={() => navigate({ to: '/donor/campaigns' })}>
              Back to Campaigns
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({
  label,
  value,
  className = '',
}: {
  label: string
  value: string | React.ReactNode
  className?: string
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <p className="text-gray-600">{label}</p>
      <p className={`font-medium text-gray-800 ${className}`}>{value}</p>
    </div>
  )
}

export function PaymentStatusPage({
  paymentRef,
  campaignId,
}: PaymentStatusPageProps) {
  const queryClient = useQueryClient()

  const {
    data: paymentData,
    isLoading,
    error,
    refetch,
  } = useQuery(useVerifyPayment(paymentRef))

  const payment = paymentData?.data

  // Invalidate queries on successful payment to refresh dashboard/campaign data
  useEffect(() => {
    if (payment?.status === 'success') {
      toast.success('Payment confirmed! Your data is being updated.')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.donorCampaigns] })
      if (campaignId) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.donorCampaign, campaignId],
        })
      }
    }
  }, [payment?.status, queryClient, campaignId])

  // Handle missing reference
  if (!paymentRef) {
    return (
      <StatusCard
        status="error"
        title="Invalid Payment Reference"
        message="No payment reference was provided. Please check your payment link or try again."
      />
    )
  }

  // Loading state
  if (isLoading) {
    return <StatusCard status="loading" />
  }

  // Error state
  if (error) {
    return (
      <StatusCard
        status="error"
        title="Payment Verification Failed"
        message="We couldn't verify your payment at this time. This might be a temporary issue."
        onRetry={refetch}
      />
    )
  }

  if (!payment) {
    return (
      <StatusCard
        status="error"
        title="Payment Not Found"
        message="We couldn't find any payment with this reference. Please check your payment details."
      />
    )
  }

  // Success state - show detailed success page
  if (payment.status === 'success') {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(amount)
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-lg">
          <CardHeader className="text-center bg-green-50 border-b border-green-200">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full ml-2">
                <PartyPopper className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              Payment Successful!
            </CardTitle>
            <p className="text-green-700 mt-2">
              Thank you for your generous contribution to cancer screening!
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Payment Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-2">
                Payment Details
              </h3>
              <InfoRow label="Amount" value={formatCurrency(payment.amount)} />
              <InfoRow label="Reference" value={payment.reference} />
              <InfoRow
                label="Date"
                value={new Date(payment.transactionDate).toLocaleDateString()}
              />
              <InfoRow
                label="Status"
                value={
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Confirmed
                  </Badge>
                }
              />
            </div>

            {/* Campaign Details */}
            {/* {payment.campaign && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 border-b pb-2">
                  Campaign Information
                </h3>
                <InfoRow label="Campaign" value={payment.campaign.title} />
                <InfoRow
                  label="People you're helping"
                  value={`~${Math.floor(payment.amount / 2500)} people`}
                />
              </div>
            )} */}

            {/* Impact Message */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Your Impact</h4>
              <p className="text-blue-700 text-sm">
                Your donation will help sponsor cervical cancer screenings for
                women in underserved communities. Each screening costs
                approximately ₦2,500 and can save lives through early detection.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled
              >
                <Share2 className="h-4 w-4" />
                Share Impact
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campaignId ? (
                <Button asChild className="flex items-center gap-2">
                  <Link
                    to="/donor/campaigns/$campaignId"
                    params={{ campaignId }}
                  >
                    View Campaign
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild className="flex items-center gap-2">
                  <Link to="/donor/campaigns">
                    View All Campaigns
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <Link to="/donor">
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending and Failed states
  return <StatusCard status={payment.status} onRetry={refetch} />
}
