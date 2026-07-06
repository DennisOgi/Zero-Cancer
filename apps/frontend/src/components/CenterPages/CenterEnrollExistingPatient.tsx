import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  centerEnrollExistingPatient,
  searchCenterPatients,
} from '@/services/screening-report.service'
import { getCenterMyServices } from '@/services/center.service'
import { QueryKeys } from '@/services/keys'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, MessageCircle, Search, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  buildEnrollmentRequestWhatsAppMessage,
  openWhatsAppShare,
} from '@/lib/whatsapp-link'

type PatientResult = {
  id: string
  fullName: string
  email: string
  phone?: string | null
}

export function CenterEnrollExistingPatient() {
  const { data: servicesData, isLoading: screeningTypesLoading } = useQuery({
    queryKey: ['centerMyServices'],
    queryFn: getCenterMyServices,
  })
  const screeningTypes = (servicesData?.data?.services || []).map((service) => ({
    id: service.screeningTypeId,
    name: service.name,
  }))

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [screeningTypeId, setScreeningTypeId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enrolledPatient, setEnrolledPatient] = useState<PatientResult | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [lastScreeningName, setLastScreeningName] = useState('')
  const queryClient = useQueryClient()
  const { data: authData } = useQuery(useAuthUser())
  const centerName = authData?.data?.user?.fullName || 'Your center'
  const loginUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : 'https://zerocancer.africa/login'

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchData, isFetching, isError: searchError } = useQuery({
    queryKey: ['centerPatientSearch', debouncedQuery],
    queryFn: () => searchCenterPatients(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  })

  const patients: PatientResult[] = searchData?.data?.patients || []
  const selectedPatient = patients.find((p) => p.id === selectedPatientId)
  const selectedScreeningName =
    screeningTypes.find((type) => type.id === screeningTypeId)?.name || ''

  const openEnrollmentWhatsApp = (patient: PatientResult, screeningName: string) => {
    if (!patient.phone) {
      toast.error('This patient has no phone number on file.')
      return false
    }
    const message = buildEnrollmentRequestWhatsAppMessage({
      patientName: patient.fullName,
      centerName,
      screeningName,
      loginUrl,
      expiresInDays: 7,
    })
    const opened = openWhatsAppShare(patient.phone, message)
    if (!opened) {
      toast.error('Could not open WhatsApp. Check the patient phone number.')
    }
    return opened
  }

  const handleEnroll = async () => {
    if (!selectedPatientId || !screeningTypeId) {
      toast.error('Select a patient and screening service')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await centerEnrollExistingPatient({
        patientId: selectedPatientId,
        screeningTypeId,
      })

      if (response.ok) {
        const patient = response.data?.patient as PatientResult
        const screeningName = selectedScreeningName
        setEnrolledPatient(patient)
        setPendingApproval(!!response.data?.pendingApproval)
        setLastScreeningName(screeningName)
        queryClient.invalidateQueries({ queryKey: [QueryKeys.centerEnrollmentRequests] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.centerPatientsOverview] })
        const requestCreated = response.data?.requestCreated !== false
        toast.success(
          response.data?.pendingApproval
            ? requestCreated
              ? 'Enrollment request sent. Ask the patient to approve in their portal.'
              : 'A pending enrollment request already exists for this patient.'
            : response.data?.waitlistCreated
              ? 'Patient added to the platform waitlist'
              : 'Patient is already on the waitlist for this screening',
        )
        if (response.data?.pendingApproval && requestCreated && patient) {
          openEnrollmentWhatsApp(patient, screeningName)
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to enroll patient')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (enrolledPatient) {
    return (
      <Card className={`max-w-2xl ${pendingApproval ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`h-6 w-6 ${pendingApproval ? 'text-amber-600' : 'text-green-600'}`} />
            <CardTitle className={pendingApproval ? 'text-amber-900' : 'text-green-900'}>
              {pendingApproval
                ? 'Enrollment Request Sent'
                : 'Patient Enrolled on Waitlist'}
            </CardTitle>
          </div>
          <CardDescription className={pendingApproval ? 'text-amber-700' : 'text-green-700'}>
            {pendingApproval
              ? `${enrolledPatient.fullName} was notified in the app. Use WhatsApp to ask them to log in and approve the request.`
              : `${enrolledPatient.fullName} is on the platform-wide donor matching waitlist.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {pendingApproval && enrolledPatient.phone ? (
            <Button
              onClick={() =>
                openEnrollmentWhatsApp(enrolledPatient, lastScreeningName)
              }
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Send on WhatsApp
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              setEnrolledPatient(null)
              setPendingApproval(false)
              setLastScreeningName('')
            }}
          >
            Enroll Another Patient
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Enroll Existing Patient
        </CardTitle>
        <CardDescription>
          Search for a patient already registered on ZeroCancer by name or phone
          number. They must approve before being enrolled under your center.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="patient-search">Search by name or phone number</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="patient-search"
              className="pl-9"
              placeholder="e.g. Jane Doe or 08012345678"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedPatientId('')
              }}
            />
          </div>
          {debouncedQuery.length >= 2 && isFetching ? (
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </p>
          ) : null}
        </div>

        {patients.length > 0 ? (
          <div>
            <Label>Select patient</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.fullName}
                    {patient.phone ? ` — ${patient.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : searchError ? (
          <p className="text-sm text-red-600">Search failed. Please try again.</p>
        ) : debouncedQuery.length >= 2 && !isFetching ? (
          <p className="text-sm text-muted-foreground">No patients found.</p>
        ) : null}

        {selectedPatient ? (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{selectedPatient.fullName}</p>
            <p className="text-muted-foreground">{selectedPatient.email}</p>
            {selectedPatient.phone ? (
              <p className="text-muted-foreground">WhatsApp: {selectedPatient.phone}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <Label>Screening service (waitlist)</Label>
          <Select value={screeningTypeId} onValueChange={setScreeningTypeId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select screening type" />
            </SelectTrigger>
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
        </div>

        <Button
          onClick={handleEnroll}
          disabled={isSubmitting || !selectedPatientId || !screeningTypeId}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enrolling...
            </>
          ) : (
            'Send Enrollment Request'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
