import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import { Input } from '@/components/shared/ui/input'
import { centers } from '@/services/providers/center.provider'
import { useBookSelfPayAppointment } from '@/services/providers/patient.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
// Use the new shared components for consistency
import CenterCombobox from './components/CenterCombobox'
import SchedulePicker from './components/SchedulePicker'

// Zod schema for form validation
const bookingSchema = z.object({
  screeningTypeId: z.string().min(1, 'Screening type is required'),
  centerId: z.string().min(1, 'Center ID is required'),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  paymentReference: z.string().optional(),
})

type FormData = z.infer<typeof bookingSchema>

interface PatientPayBookingPageProps {
  screeningTypeId?: string
}

export function PatientPayBookingPage({
  screeningTypeId,
}: PatientPayBookingPageProps) {
  const navigate = useNavigate()

  const form = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      screeningTypeId: screeningTypeId || '',
      centerId: '',
      appointmentDate: '',
      appointmentTime: '',
      paymentReference: '',
    },
  })

  // Fetch centers for the dropdown
  const {
    data: centersData,
    isLoading: centersLoading,
    error: centersError,
  } = useQuery(
    centers({
      page: 1,
      pageSize: 100,
      status: 'ACTIVE',
    }),
  )

  // Filter centers that offer the selected screening service
  const availableCenters =
    centersData?.data?.centers?.filter((center) => {
      if (!screeningTypeId) return true // Show all if no service selected
      return center.services?.some((service) => service.id === screeningTypeId)
    }) || []

  const bookSelfPayAppointmentMutation = useBookSelfPayAppointment()

  function onSubmit(values: FormData) {
    const paymentReference =
      values.paymentReference ||
      'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    // Combine date and time into a single datetime
    const appointmentDateTime = new Date(values.appointmentDate)
    const [hours, minutes] = values.appointmentTime.split(':')
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const formattedValues = {
      screeningTypeId: values.screeningTypeId,
      centerId: values.centerId,
      paymentReference,
      appointmentDateTime: appointmentDateTime.toISOString(),
    }

    bookSelfPayAppointmentMutation.mutate(formattedValues, {
      onSuccess: (data) => {
        if (data.data.payment?.authorizationUrl) {
          toast.success('Appointment created! Redirecting to payment...')
          window.location.href = data.data.payment.authorizationUrl
        } else {
          toast.success('Appointment booked successfully!')
          navigate({ to: '/patient/appointments' })
        }
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            'Booking failed',
        )
      },
    })
  }

  if (centersLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading available centers...</span>
        </div>
      </div>
    )
  }

  if (centersError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Centers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">
              There was an error loading centers.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Error: {centersError?.message || 'Unknown error'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/patient/book' })}
              >
                Back to Booking
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header to align with donation flow */}
      <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-6 rounded-lg border">
        <h1 className="text-2xl font-bold mb-1">Book a Self-Pay Appointment</h1>
        <p className="text-gray-600">
          Select a center and schedule a time that works for you. You will be
          redirected to pay securely if required.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {!screeningTypeId && (
            <Card>
              <CardHeader>
                <CardTitle>Screening Type</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="screeningTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screening Type ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter screening type ID"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Center Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Health Center</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="centerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Available Centers ({availableCenters.length} options)
                    </FormLabel>
                    <FormControl>
                      <CenterCombobox
                        centers={availableCenters}
                        value={field.value}
                        onChange={(id) => field.onChange(id)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Date and Time Selection */}
          {form.watch('centerId') && (
            <SchedulePicker
              date={form.watch('appointmentDate')}
              onDateChange={(v) =>
                form.setValue('appointmentDate', v, { shouldValidate: true })
              }
              time={form.watch('appointmentTime')}
              onTimeChange={(v) =>
                form.setValue('appointmentTime', v, { shouldValidate: true })
              }
            />
          )}

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 cursor-pointer"
              disabled={bookSelfPayAppointmentMutation.isPending}
            >
              {bookSelfPayAppointmentMutation.isPending && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              {bookSelfPayAppointmentMutation.isPending
                ? 'Booking...'
                : 'Book Appointment'}
            </Button>

            {/* CTA: Link to donation-based options */}
            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={() => navigate({ to: '/patient/book' })}
            >
              Prefer a sponsored screening? See donation options
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
