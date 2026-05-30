import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { NIGERIA_STATES_LGAS, getLGAsForState } from '@/data/nigeria-locations'
import { donorWaitlistPatients } from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Heart, Loader2, Users } from 'lucide-react'
import { useState } from 'react'

export function FundPatientsPage() {
  const navigate = useNavigate()
  const [state, setState] = useState('')
  const [lga, setLga] = useState('')
  const [serviceType, setServiceType] = useState<
    'vaccination' | 'screening' | 'treatment' | ''
  >('')
  const [lgas, setLgas] = useState<string[]>([])

  const { data, isLoading } = useQuery(
    donorWaitlistPatients({
      page: 1,
      pageSize: 50,
      state: state || undefined,
      lga: lga || undefined,
      serviceType: serviceType || undefined,
    }),
  )

  const patients = data?.data?.patients || []

  const handleFundPatient = (patientId: string, screeningTypeId: string) => {
    navigate({
      to: '/donor/campaigns/create',
      search: {
        targetIndividualId: patientId,
        screeningTypeId,
      },
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Fund Patients</h1>
        <p className="mt-1 text-gray-500">
          Sponsor an individual on the waiting list, or create a group campaign
          to reach many patients at once.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-pink-100 bg-pink-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-pink-600" />
              Fund an individual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Browse patients waiting for screening, vaccination, or treatment
              and create a targeted campaign for someone specific.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Fund a group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Target patients by state, LGA, age, gender, or screening type.
            </p>
            <Button asChild className="w-full">
              <Link to="/donor/campaigns/create">Create group campaign</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patients on the waiting list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              value={serviceType}
              onValueChange={(value) =>
                setServiceType(value as 'vaccination' | 'screening' | 'treatment')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vaccination">Vaccination</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={state}
              onValueChange={(value) => {
                setState(value)
                setLga('')
                setLgas(getLGAsForState(value))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIA_STATES_LGAS.map((location) => (
                  <SelectItem key={location.state} value={location.state}>
                    {location.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={lga} onValueChange={setLga} disabled={!state}>
              <SelectTrigger>
                <SelectValue placeholder="All LGAs" />
              </SelectTrigger>
              <SelectContent>
                {lgas.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
              No patients match these filters right now.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="p-4 font-semibold">Patient</th>
                    <th className="p-4 font-semibold">Service needed</th>
                    <th className="p-4 font-semibold">Location</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patients.map((patient) => (
                    <tr key={patient.waitlistId} className="hover:bg-gray-50/80">
                      <td className="p-4 font-medium">{patient.label}</td>
                      <td className="p-4">{patient.screeningTypeName}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {patient.city ? `${patient.city}, ` : ''}
                        {patient.state}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleFundPatient(
                              patient.patientId,
                              patient.screeningTypeId,
                            )
                          }
                        >
                          Fund patient
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FundPatientsPage
