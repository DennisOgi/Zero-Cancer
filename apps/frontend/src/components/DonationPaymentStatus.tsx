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
  CheckCircle,
  Clock,
  Heart,
  Home,
  Loader2,
  Mail,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export type DonationPaymentStatusProps = {
  paymentRef: string
  type?: string
}

export function DonationPaymentStatus({ paymentRef }: DonationPaymentStatusProps) {
  const navigate = useNavigate()
  const [redirectTimer, setRedirectTimer] = useState(8)

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
        setRedirectTimer((prev) => prev - 1)
      }, 1000)

      if (redirectTimer === 1) {
        navigate({ to: '/' })
      }

      return () => clearTimeout(timer)
    }
  }, [payment?.status, redirectTimer, navigate])

  // Handle missing reference
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
              No payment reference was provided. Please check your payment link
              or try again.
            </p>
            <Button onClick={() => navigate({ to: '/' })}>Return to Home</Button>
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
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Verifying Your Donation</h3>
            <p className="text-gray-600 mb-4">
              Please wait while we confirm your donation with our payment
              provider...
            </p>
            <div className="text-sm text-gray-500">Reference: {paymentRef}</div>
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
              Donation Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We couldn't verify your donation at this time. This might be a
              temporary issue.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => navigate({ to: '/' })}>Return to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Donation Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We couldn't find a donation with this reference. Please check your
              confirmation email or contact support.
            </p>
            <div className="text-sm text-gray-500 mb-4">Reference: {paymentRef}</div>
            <Button onClick={() => navigate({ to: '/' })}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (payment.status === 'success') {
    const isAnonymous = payment.context?.type === 'anonymous_donation'
    const wantsReceipt = isAnonymous ? (payment.context as any)?.wantsReceipt : false
    const message = isAnonymous ? (payment.context as any)?.message : null

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Thank You for Your Donation!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-10 w-10 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-green-700 mb-2">
                ₦{payment.amount.toLocaleString()}
              </div>
              <p className="text-gray-600">Your generous donation has been processed successfully</p>
            </div>

            {/* Donation Details */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono">{payment.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="capitalize">{payment.channel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(payment.paidAt || payment.transactionDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <span>Anonymous Donation</span>
              </div>
            </div>

            {/* Personal Message */}
            {message && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Your Message:</h4>
                <p className="text-sm text-blue-800 italic">"{message}"</p>
              </div>
            )}

            {/* Receipt Info */}
            {wantsReceipt && (
              <div className="bg-amber-50 rounded-lg p-4 flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Receipt Notification</h4>
                  <p className="text-sm text-amber-800">A receipt has been sent to your email address for tax purposes.</p>
                </div>
              </div>
            )}

            {/* Impact Message */}
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <h4 className="font-semibold text-purple-900 mb-2">Your Impact</h4>
              <p className="text-sm text-purple-800">
                Your donation will help provide cancer screening services to patients who cannot afford them. You're making a real difference in the fight against cancer!
              </p>
            </div>

            {/* Auto-redirect notice */}
            <div className="text-center text-sm text-gray-500">Redirecting to home page in {redirectTimer} seconds...</div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button onClick={() => navigate({ to: '/' })} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = 'mailto:support@zerocancer.africa?subject=Donation Inquiry')}
              >
                Contact Us
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
              Donation Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Your donation could not be processed. Your card was not charged.</p>

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
              <Button onClick={() => navigate({ to: '/' })} className="flex-1">
                Try Donating Again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = 'mailto:support@zerocancer.africa?subject=Donation Issue')}
              >
                Contact Support
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
              Donation Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">You cancelled the donation process. No charges were made to your card.</p>

            <div className="text-center py-4">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Your support still means the world to us. Consider donating when you're ready.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => navigate({ to: '/' })} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/' })}>
                Return Home
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
            Donation Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your donation is still being processed. We'll update the status automatically.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono">{payment.reference}</span>
            </div>
          </div>

          <Button onClick={() => refetch()} variant="outline" className="w-full">
            <Loader2 className="h-4 w-4 mr-2" />
            Check Status Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
