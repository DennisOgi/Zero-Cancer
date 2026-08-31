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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { centers } from '@/services/providers/center.provider'
import { useBookSelfPayAppointment } from '@/services/providers/patient.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useEffect, useMemo } from 'react'
// Use the new shared components for consistency
import { Input } from '@/components/shared/ui/input'
import { Textarea } from '@/components/shared/ui/textarea'
import { Checkbox } from '@/components/shared/ui/checkbox'
import * as agentApi from '@/services/agent-network.service'
import CenterCombobox from './components/CenterCombobox'
import SchedulePicker from './components/SchedulePicker'

// Zod schema for form validation
const bookingSchema = z
  .object({
    screeningTypeId: z.string().min(1, 'Screening type is required'),
    centerId: z.string().min(1, 'Center ID is required'),
    appointmentDate: z.string().min(1, 'Appointment date is required'),
    appointmentTime: z.string().min(1, 'Appointment time is required'),
    isHomeVisit: z.boolean().optional(),
    homeAddress: z.string().optional(),
    referralCode: z.string().optional(),
    commissionAllowed: z.boolean().optional(),
    savingsPlanId: z.string().optional(),
  })
  .refine((data) => !data.isHomeVisit || (data.homeAddress || '').trim().length >= 5, {
    message: 'Home address is required for a home screening',
    path: ['homeAddress'],
  })

type FormData = z.infer<typeof bookingSchema>

interface PatientPayBookingPageProps {
  screeningTypeId?: string
  centerId?: string
  savingsPlanId?: string
  referralCode?: string
}

export function PatientPayBookingPage({
  screeningTypeId,
  centerId,
  savingsPlanId,
  referralCode,
}: PatientPayBookingPageProps) {
  const navigate = useNavigate()

  const form = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      screeningTypeId: screeningTypeId || '',
      centerId: centerId || '',
      appointmentDate: '',
      appointmentTime: '',
      isHomeVisit: false,
      homeAddress: '',
      referralCode: referralCode || '',
      commissionAllowed: true,
      savingsPlanId: savingsPlanId || '',
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

  const availableServices = useMemo(() => {
    const serviceMap = new Map<string, { id: string; name: string; price: number }>()
    centersData?.data?.centers?.forEach((center) => {
      center.services?.forEach((service) => {
        if (!serviceMap.has(service.id)) {
          serviceMap.set(service.id, service)
        }
      })
    })
    return Array.from(serviceMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [centersData])

  // Filter centers that offer the selected screening service
  const availableCenters =
    centersData?.data?.centers?.filter((center) => {
      if (centerId && center.id !== centerId) return false
      const selectedServiceId = form.watch('screeningTypeId') || screeningTypeId
      if (!selectedServiceId) return true
      return center.services?.some((service) => service.id === selectedServiceId)
    }) || []

  useEffect(() => {
    if (centerId) {
      form.setValue('centerId', centerId)
    }
    if (screeningTypeId) {
      form.setValue('screeningTypeId', screeningTypeId)
    }
    if (savingsPlanId) {
      form.setValue('savingsPlanId', savingsPlanId)
    }
    if (referralCode) {
      form.setValue('referralCode', referralCode)
    }
  }, [centerId, form, referralCode, savingsPlanId, screeningTypeId])

  const { data: savingsData } = useQuery({
    queryKey: ['savings-plans-booking'],
    queryFn: agentApi.listSavingsPlans,
  })
  const readyPlans = ((savingsData as any)?.data?.plans || []).filter(
    (plan: any) => plan.status === 'READY',
  )

  const bookSelfPayAppointmentMutation = useBookSelfPayAppointment()

  function onSubmit(values: FormData) {
    const appointmentDateTime = new Date(values.appointmentDate)
    const [hours, minutes] = values.appointmentTime.split(':')
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const formattedValues = {
      screeningTypeId: values.screeningTypeId,
      centerId: values.centerId,
      appointmentDateTime: appointmentDateTime.toISOString(),
      isHomeVisit: values.isHomeVisit || false,
      homeAddress: values.isHomeVisit ? values.homeAddress : undefined,
      referralCode: values.referralCode?.trim() || undefined,
      commissionAllowed: values.commissionAllowed,
      savingsPlanId: values.savingsPlanId || undefined,
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
                      <FormLabel>Screening or vaccination service</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableServices.length === 0 ? (
                            <SelectItem value="__none" disabled>
                              No services available yet
                            </SelectItem>
                          ) : (
                            availableServices.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} (from ₦
                                {service.price.toLocaleString()})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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

          <Card>
            <CardHeader>
              <CardTitle>Home screening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isHomeVisit"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <div>
                      <FormLabel>Request a home visit</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        A home screening includes a visit surcharge. Your
                        referrer earns a higher commission if you allow it.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              {form.watch('isHomeVisit') ? (
                <FormField
                  control={form.control}
                  name="homeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Street, area, landmark, city"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referral and savings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral code (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ZC..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commissionAllowed"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value !== false}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <div>
                      <FormLabel>
                        Allow my referrer to earn a screening commission
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        You can turn this off. It does not change what you pay.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              {readyPlans.length > 0 ? (
                <FormField
                  control={form.control}
                  name="savingsPlanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pay from savings plan</FormLabel>
                      <Select
                        value={field.value || '__none'}
                        onValueChange={(value) =>
                          field.onChange(value === '__none' ? '' : value)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Do not use savings" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none">Do not use savings</SelectItem>
                          {readyPlans.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              Saved ₦
                              {Number(plan.savedAmount).toLocaleString()} / ₦
                              {Number(plan.targetAmount).toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </CardContent>
          </Card>

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
