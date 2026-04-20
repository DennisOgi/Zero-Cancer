import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { useVerifyPayment } from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Gift,
  Loader2,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface CampaignPaymentStatusPageProps {
  campaignId: string
  paymentRef: string
}

export function CampaignPaymentStatusPage({
  campaignId,
  paymentRef,
}: CampaignPaymentStatusPageProps) {
  const navigate = useNavigate()
  const [redirectTimer, setRedirectTimer] = useState(5)

  const {
    data: paymentData,
    isLoading,
    error,
    refetch,
  } = useQuery(useVerifyPayment(paymentRef))

  const payment = paymentData?.data

  // Auto-redirect timer for successful payments
  useEffect(() => {
    if (payment?.status === 'success' && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer(redirectTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (payment?.status === 'success' && redirectTimer === 0) {
      navigate({
        to: '/donor/campaigns/$campaignId',
        params: { campaignId },
      })
    }
  }, [payment?.status, redirectTimer, navigate, campaignId])

  // Handle missing payment reference
  if (!paymentRef) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Invalid Payment Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              No payment reference was provided. Please check your payment link.
            </p>
            <Button
              onClick={() =>
                navigate({
                  to: '/donor/campaigns/$campaignId',
                  params: { campaignId },
                })
              }
            >
              Back to Campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
            <p className="text-gray-600">
              Please wait while we confirm your transaction.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              We couldn't verify your payment right now. This might be a
              temporary issue.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
              <Button
                onClick={() =>
                  navigate({
                    to: '/donor/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
              >
                Back to Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Payment Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We couldn't find any payment with this reference.
            </p>
            <Button
              onClick={() =>
                navigate({
                  to: '/donor/campaigns/$campaignId',
                  params: { campaignId },
                })
              }
            >
              Back to Campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (payment.status === 'success') {
    const peopleHelped = Math.floor(payment.amount / 2500)

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <Gift className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800 mb-2">
              Thank You for Your Generosity!
            </CardTitle>
            <p className="text-green-700">
              Your payment was successful and you're now helping save lives.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <h3 className="font-semibold text-gray-800 mb-3">
                Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Donated:</span>
                  <span className="font-semibold">
                    ₦{payment.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">People You're Helping:</span>
                  <span className="font-semibold text-green-600">
                    ~{peopleHelped} {peopleHelped === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-xs">{payment.reference}</span>
                </div>
              </div>
            </div>

            {/* Impact Message */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Your Impact</h4>
              <p className="text-blue-700 text-sm">
                {peopleHelped === 1
                  ? 'Your donation will sponsor a complete cervical cancer screening for a woman in need.'
                  : `Your donation will sponsor complete cervical cancer screenings for ${peopleHelped} women in underserved communities.`}{' '}
                Early detection saves lives, and you're making that possible.
              </p>
            </div>

            {/* Auto-redirect notice */}
            <div className="text-center p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">
                Redirecting to campaign details in{' '}
                <span className="font-bold text-blue-600">{redirectTimer}</span>{' '}
                seconds...
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate({
                    to: '/donor/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
                className="mr-2"
              >
                Go Now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRedirectTimer(0)}
              >
                Cancel Redirect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Failed state
  if (payment.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your payment could not be processed. Your card was not charged.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Amount:</span>
                <span>₦{payment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono">{payment.reference}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: '/donor/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/donor/campaigns' })}
              >
                All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Abandoned state
  if (payment.status === 'abandoned') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Payment Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You cancelled the payment process. No charges were made to your
              card.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: '/donor/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/donor/campaigns' })}
              >
                All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending state
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            Payment Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your payment is still being processed. We'll update the status
            automatically.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono">{payment.reference}</span>
            </div>
          </div>

          <Button
            onClick={() => refetch()}
            variant="outline"
            className="w-full"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Check Status Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
