import CheckInQR from '@/components/CheckInQR'
import { ResultViewer } from '@/components/ResultViewer'
import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/shared/ui/dialog'
import { Separator } from '@/components/shared/ui/separator'
import { usePatientAppointmentById } from '@/services/providers/patient.provider'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  AlertCircleIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  QrCodeIcon,
  UserCheckIcon,
} from 'lucide-react'

interface PatientAppointmentDetailsPageProps {
  appointmentId: string
}

export function PatientAppointmentDetailsPage({
  appointmentId,
}: PatientAppointmentDetailsPageProps) {
  const appointmentQuery = useSuspenseQuery(
    usePatientAppointmentById(appointmentId),
  )
  const appointment = appointmentQuery.data.data

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const QRCodeDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start sm:w-auto">
          <QrCodeIcon className="mr-2 h-4 w-4" />
          Show QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center space-y-4 p-6">
          <h3 className="text-lg font-semibold">Check-in QR Code</h3>
          <CheckInQR
            checkInCode={appointment.checkInCode || 'NO_CODE'}
            size={200}
          />
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-mono font-bold text-2xl bg-slate-200 p-2 rounded-md">
              {appointment.checkInCode}
            </p>
            {appointment.checkInCodeExpiresAt && (
              <p className="mt-1">
                Expires:{' '}
                {format(new Date(appointment.checkInCodeExpiresAt), 'PPp')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment Details
            </h1>
            <p className="text-muted-foreground">
              {appointment.screeningType?.name} Screening
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.replace('_', ' ')}
            </Badge>
            {appointment.isDonation && (
              <Badge variant="secondary">Donation-Based</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Appointment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(appointment.appointmentDateTime),
                        'PPPP',
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.appointmentDateTime), 'p')}
                    </p>
                  </div>
                </div>
              </div>

              {appointment.screeningType?.description && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Screening Description
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.screeningType.description}
                  </p>
                </div>
              )}

              {appointment.cancellationReason && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircleIcon className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Cancellation Reason
                      </p>
                      <p className="text-sm text-red-600">
                        {appointment.cancellationReason}
                      </p>
                      {appointment.cancellationDate && (
                        <p className="text-xs text-red-500 mt-1">
                          Cancelled on{' '}
                          {format(
                            new Date(appointment.cancellationDate),
                            'PPp',
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Center Information */}
          {appointment.center && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Health Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    {appointment.center.centerName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {appointment.center.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.center.lga}, {appointment.center.state}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {appointment.center.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${appointment.center.phoneNumber}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {appointment.center.phoneNumber}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${appointment.center.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {appointment.center.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          {appointment.transaction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Amount</p>
                    <p className="text-lg font-semibold">
                      ₦{appointment.transaction.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge
                      className={getPaymentStatusColor(
                        appointment.transaction.status,
                      )}
                    >
                      {appointment.transaction.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.transaction.paymentChannel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reference</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {appointment.transaction.paymentReference}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {appointment.result && (
            <ResultViewer appointmentId={appointment.id} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointment.status === 'SCHEDULED' && <QRCodeDialog />}

              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link to="/patient/appointments">View All Appointments</Link>
              </Button>

              {appointment.center && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <a
                    href={`https://maps.google.com?q=${encodeURIComponent(
                      appointment.center.address +
                        ', ' +
                        appointment.center.lga +
                        ', ' +
                        appointment.center.state,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPinIcon className="mr-2 h-4 w-4" />
                    Get Directions
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Verification Status */}
          {/* {appointment.verification && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Identity Verified</span>
                    <Badge
                      variant={
                        appointment.verification.identityVerified
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {appointment.verification.identityVerified
                        ? 'Verified'
                        : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Eligibility Checked</span>
                    <Badge
                      variant={
                        appointment.verification.eligibilityVerified
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {appointment.verification.eligibilityVerified
                        ? 'Verified'
                        : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )} */}
        </div>
      </div>
    </div>
  )
}
