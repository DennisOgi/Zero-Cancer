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
  Calendar,
  CheckCircle,
  Loader2,
  MapPin,
  Stethoscope,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface PatientPaymentStatusPageProps {
  paymentRef: string
}

export function PatientPaymentStatusPage({
  paymentRef,
}: PatientPaymentStatusPageProps) {
  const navigate = useNavigate()
  const [redirectTimer, setRedirectTimer] = useState(5)

  const {
    data: paymentData,
    isLoading,
    error,
    refetch,
  } = useQuery(useVerifyPayment(paymentRef))

  const payment = paymentData?.data
  console.log(payment, 1112)

  // Auto-redirect timer for successful payments
  useEffect(() => {
    if (payment?.status === 'success' && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer((prev) => prev - 1)
      }, 1000)

      if (redirectTimer === 1) {
        navigate({ to: '/patient/appointments' })
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
              or try booking again.
            </p>
            <Button onClick={() => navigate({ to: '/patient/book' })}>
              Book New Appointment
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
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Verifying Payment</h3>
            <p className="text-gray-600 mb-4">
              Please wait while we confirm your appointment payment...
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
              Payment Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We couldn't verify your payment at this time. This might be a
              temporary issue.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => navigate({ to: '/patient/appointments' })}>
                View Appointments
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
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Payment Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We couldn't find a payment with this reference. Please check your
              payment confirmation email or contact support.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Reference: {paymentRef}
            </div>
            <Button onClick={() => navigate({ to: '/patient/book' })}>
              Book New Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (payment.status === 'success') {
    const paymentContext = payment.context //as any
    const isAppointmentBooking = paymentContext?.type === 'appointment_booking'
    const appointmentData = isAppointmentBooking
      ? paymentContext?.appointment
      : null

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Appointment Booked Successfully! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 mb-2">
                ₦{payment.amount.toLocaleString()}
              </div>
              <p className="text-gray-600">
                Your appointment has been confirmed and paid for
              </p>
            </div>

            {/* Payment Details */}
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
                <span>
                  {new Date(
                    payment.paidAt || payment.transactionDate,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <span>Appointment Booking</span>
              </div>
            </div>

            {/* Appointment Details */}
            {appointmentData && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-700" />
                  <span className="font-medium text-blue-900">
                    Appointment Details
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    <span>{appointmentData.screeningTypeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{appointmentData.centerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(
                        appointmentData.appointmentDateTime,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-blue-900 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>
                    Your appointment has been scheduled. You can manage or
                    reschedule it from the appointments page.
                  </span>
                </div>
              </div>
            )}

            {/* Auto-redirect notice */}
            <div className="text-center text-sm text-gray-500">
              Redirecting to appointments in {redirectTimer} seconds...
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate({ to: '/patient/appointments' })}
                className="flex-1"
              >
                View Appointments
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/patient/book' })}
              >
                Book Another Screening
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Abandoned / Failed / Pending states reuse common UI
  const statusTitle =
    payment.status === 'failed'
      ? 'Payment Failed'
      : payment.status === 'abandoned'
        ? 'Payment Cancelled'
        : 'Payment Pending'
  const statusIcon =
    payment.status === 'failed' ? (
      <XCircle className="h-5 w-5" />
    ) : payment.status === 'abandoned' ? (
      <AlertTriangle className="h-5 w-5" />
    ) : (
      <Calendar className="h-5 w-5" />
    )

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card
        className={
          payment.status === 'pending'
            ? 'border-yellow-200'
            : payment.status === 'failed'
              ? 'border-red-200'
              : 'border-orange-200'
        }
      >
        <CardHeader>
          <CardTitle
            className={
              payment.status === 'pending'
                ? 'flex items-center gap-2 text-yellow-600'
                : payment.status === 'failed'
                  ? 'flex items-center gap-2 text-red-600'
                  : 'flex items-center gap-2 text-orange-600'
            }
          >
            {statusIcon}
            {statusTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {payment.status === 'pending'
              ? "Your payment is still being processed. We'll update the status automatically."
              : payment.status === 'failed'
                ? 'Your payment could not be processed. Your card was not charged.'
                : 'You cancelled the payment process. No charges were made to your card.'}
          </p>

          {payment.status !== 'pending' && (
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
          )}

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
