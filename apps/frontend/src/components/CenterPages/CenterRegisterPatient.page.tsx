import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { NIGERIA_STATES_LGAS as nigeriaStates } from '@/data/nigeria-locations'
import { zodResolver } from '@hookform/resolvers/zod'
import { getCenterMyServices } from '@/services/center.service'
import { QueryKeys } from '@/services/keys'
import { centerRegisterAndEnrollPatient } from '@/services/screening-report.service'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { patientSchema } from '@zerocancer/shared/schemas/register.schema'
import { Loader2, UserPlus, CheckCircle2, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import * as RPNInput from 'react-phone-number-input'
import PhoneInputComponent from '@/components/shared/ui/phone-input'
import { CenterEnrollExistingPatient } from '@/components/CenterPages/CenterEnrollExistingPatient'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import {
  buildEnrollmentRequestWhatsAppMessage,
  buildWalkInRegistrationWhatsAppMessage,
  openWhatsAppShare,
} from '@/lib/whatsapp-link'
import { useAuthUser } from '@/services/providers/auth.provider'

// Schema for walk-in patient (password is auto-generated)
const walkInPatientSchema = patientSchema.omit({ password: true }).extend({
  screeningTypeId: z.string().uuid('Select a screening service'),
})

type WalkInPatientFormData = z.infer<typeof walkInPatientSchema>

export function CenterRegisterPatientPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authUserQuery = useQuery(useAuthUser())
  const centerName = authUserQuery.data?.data?.user?.fullName || 'Your screening center'
  const { data: servicesData, isLoading: screeningTypesLoading } = useQuery({
    queryKey: ['centerMyServices'],
    queryFn: getCenterMyServices,
  })
  const screeningTypes = (servicesData?.data?.services || []).map((service) => ({
    id: service.screeningTypeId,
    name: service.name,
  }))
  const [selectedState, setSelectedState] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredPatient, setRegisteredPatient] = useState<{
    fullName: string
    email: string
    tempPassword?: string
    whatsappNumber: string
    isNewPatient: boolean
    pendingApproval?: boolean
    screeningName?: string
  } | null>(null)

  const loginUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : 'https://zerocancer.africa/login'

  const openPatientWhatsApp = (patient: {
    fullName: string
    email: string
    tempPassword?: string
    whatsappNumber: string
    isNewPatient: boolean
    pendingApproval?: boolean
    screeningName?: string
  }) => {
    const message = patient.pendingApproval
      ? buildEnrollmentRequestWhatsAppMessage({
          patientName: patient.fullName,
          centerName,
          screeningName: patient.screeningName || 'screening',
          loginUrl,
          expiresInDays: 7,
        })
      : buildWalkInRegistrationWhatsAppMessage({
          patientName: patient.fullName,
          centerName,
          email: patient.email,
          temporaryPassword: patient.isNewPatient ? patient.tempPassword : undefined,
          loginUrl,
          screeningName: patient.screeningName,
        })
    const opened = openWhatsAppShare(patient.whatsappNumber, message)
    if (!opened) {
      toast.error('Could not open WhatsApp. Check the patient phone number.')
    }
    return opened
  }

  const form = useForm<WalkInPatientFormData>({
    resolver: zodResolver(walkInPatientSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: undefined,
      state: '',
      localGovernment: '',
      screeningTypeId: '',
    },
  })

  const selectedStateData = nigeriaStates.find((s) => s.state === selectedState)

  const onSubmit = async (data: WalkInPatientFormData) => {
    const tempPassword = `ZC${Math.random().toString(36).slice(2, 10).toUpperCase()}`

    setIsSubmitting(true)
    try {
      const response = await centerRegisterAndEnrollPatient({
        fullName: data.fullName,
        email: data.email,
        whatsappNumber: data.phone,
        password: tempPassword,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        state: data.state,
        localGovernment: data.localGovernment,
        screeningTypeId: data.screeningTypeId,
      })

      if (response.ok) {
        const patientRecord = {
          fullName: data.fullName,
          email: data.email,
          tempPassword: response.data?.isNewPatient ? tempPassword : undefined,
          whatsappNumber: data.phone,
          isNewPatient: Boolean(response.data?.isNewPatient),
          pendingApproval: Boolean(response.data?.pendingApproval),
          screeningName: response.data?.screeningName,
        }
        setRegisteredPatient(patientRecord)
        const waitlistMsg = response.data?.pendingApproval
          ? 'Existing patient found. An enrollment request was sent for their approval.'
          : response.data?.waitlistCreated
            ? 'Patient registered and added to the platform waitlist'
            : 'Patient registered — already on the waitlist for this screening'
        toast.success(waitlistMsg)
        queryClient.invalidateQueries({ queryKey: [QueryKeys.centerEnrollmentRequests] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.centerPatientsOverview] })
        openPatientWhatsApp(patientRecord)
        form.reset()
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to register patient')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (registeredPatient) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRegisteredPatient(null)}
          >
            ← Register Another Patient
          </Button>
        </div>

        <Card
          className={
            registeredPatient.pendingApproval
              ? 'border-amber-200 bg-amber-50'
              : 'border-green-200 bg-green-50'
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`h-6 w-6 ${
                  registeredPatient.pendingApproval
                    ? 'text-amber-600'
                    : 'text-green-600'
                }`}
              />
              <CardTitle
                className={
                  registeredPatient.pendingApproval
                    ? 'text-amber-900'
                    : 'text-green-900'
                }
              >
                {registeredPatient.pendingApproval
                  ? 'Enrollment Request Sent'
                  : 'Patient Registered & Enrolled on Waitlist'}
              </CardTitle>
            </div>
            <CardDescription
              className={
                registeredPatient.pendingApproval
                  ? 'text-amber-700'
                  : 'text-green-700'
              }
            >
              {registeredPatient.pendingApproval
                ? 'This patient already has an account. They were notified in the app — use WhatsApp to ask them to log in and approve.'
                : registeredPatient.isNewPatient
                  ? 'The patient has been registered and enrolled on the waitlist.'
                  : 'The patient has been enrolled on the waitlist under your center.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-200 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Patient Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {registeredPatient.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-mono text-gray-900">
                  {registeredPatient.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Patient WhatsApp</p>
                <p className="text-lg font-mono text-gray-900">
                  {registeredPatient.whatsappNumber}
                </p>
              </div>
              {registeredPatient.isNewPatient && registeredPatient.tempPassword ? (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Temporary Password
                </p>
                <p className="text-lg font-mono font-bold text-blue-600">
                  {registeredPatient.tempPassword}
                </p>
              </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  registeredPatient && openPatientWhatsApp(registeredPatient)
                }
                className="flex-1"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Send on WhatsApp
              </Button>
              {registeredPatient.isNewPatient && registeredPatient.tempPassword ? (
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${registeredPatient.email}\nPassword: ${registeredPatient.tempPassword}`,
                  )
                  toast.success('Credentials copied to clipboard!')
                }}
                variant="outline"
                className="flex-1"
              >
                Copy Credentials
              </Button>
              ) : null}
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="flex-1"
              >
                Print
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Patient Waitlist</h1>
        <p className="text-muted-foreground mt-2">
          Register new walk-in patients or enroll existing patients on the platform
          waitlist under your center.
        </p>
      </div>

      <Tabs defaultValue="register">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">Register New Patient</TabsTrigger>
          <TabsTrigger value="enroll">Enroll Existing Patient</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Patient Information
          </CardTitle>
          <CardDescription>
            Fill in the patient's details to create their account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Patient will use this to log in
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number *</FormLabel>
                        <FormControl>
                          <PhoneInputComponent
                            value={field.value as RPNInput.Value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Used to send screening reports to the patient (e.g. +234...)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Waitlist enrollment</h3>
                <FormField
                  control={form.control}
                  name="screeningTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screening service *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select screening service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {screeningTypesLoading ? (
                            <SelectItem value="__loading" disabled>
                              Loading services...
                            </SelectItem>
                          ) : screeningTypes.length === 0 ? (
                            <SelectItem value="__empty" disabled>
                              No screening services available
                            </SelectItem>
                          ) : (
                            screeningTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedState(value)
                            form.setValue('localGovernment', '')
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nigeriaStates.map((state) => (
                              <SelectItem key={state.state} value={state.state}>
                                {state.state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="localGovernment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Government *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedState}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select LGA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedStateData?.lgas.map((lga) => (
                              <SelectItem key={lga} value={lga}>
                                {lga}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select state first
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/center' })}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register Patient
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="enroll" className="mt-6">
          <CenterEnrollExistingPatient />
        </TabsContent>
      </Tabs>
    </div>
  )
}
