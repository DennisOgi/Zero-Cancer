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
import { useScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Search, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type PatientResult = {
  id: string
  fullName: string
  email: string
  phone?: string | null
}

export function CenterEnrollExistingPatient() {
  const { data: screeningTypesData, isLoading: screeningTypesLoading } = useQuery(
    useScreeningTypes({ page: 1, pageSize: 100 }),
  )
  const screeningTypes = Array.isArray(screeningTypesData?.data)
    ? screeningTypesData.data
    : []

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [screeningTypeId, setScreeningTypeId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enrolledPatient, setEnrolledPatient] = useState<PatientResult | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchData, isFetching } = useQuery({
    queryKey: ['centerPatientSearch', debouncedQuery],
    queryFn: () => searchCenterPatients(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  })

  const patients: PatientResult[] = searchData?.data?.patients || []
  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

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
        setEnrolledPatient(patient)
        toast.success(
          response.data?.waitlistCreated
            ? 'Patient added to the platform waitlist'
            : 'Patient is already on the waitlist for this screening',
        )
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to enroll patient')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (enrolledPatient) {
    return (
      <Card className="border-green-200 bg-green-50 max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-900">Patient Enrolled on Waitlist</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            {enrolledPatient.fullName} is on the platform-wide donor matching waitlist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setEnrolledPatient(null)}>
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
          Search for a patient already registered on ZeroCancer and add them to the
          waitlist under your center.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="patient-search">Search by name or email</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="patient-search"
              className="pl-9"
              placeholder="e.g. Jane Doe or jane@example.com"
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
                    {patient.fullName} — {patient.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            'Add to Waitlist'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
