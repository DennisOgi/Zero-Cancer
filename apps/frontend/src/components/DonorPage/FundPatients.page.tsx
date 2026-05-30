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
import { Input } from '@/components/shared/ui/input'
import { NIGERIA_STATES_LGAS, getLGAsForState } from '@/data/nigeria-locations'
import {
  communityGroups,
  donorWaitlistPatients,
} from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Heart, Loader2, Search, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export function FundPatientsPage() {
  const navigate = useNavigate()
  const [state, setState] = useState('')
  const [lga, setLga] = useState('')
  const [serviceType, setServiceType] = useState<
    'vaccination' | 'screening' | 'treatment' | ''
  >('')
  const [lgas, setLgas] = useState<string[]>([])
  const [groupSearch, setGroupSearch] = useState('')
  const [debouncedGroupSearch, setDebouncedGroupSearch] = useState('')

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedGroupSearch(groupSearch.trim()),
      300,
    )
    return () => clearTimeout(timeout)
  }, [groupSearch])

  const { data, isLoading } = useQuery(
    donorWaitlistPatients({
      page: 1,
      pageSize: 50,
      state: state || undefined,
      lga: lga || undefined,
      serviceType: serviceType || undefined,
    }),
  )

  const { data: groupsData, isLoading: groupsLoading } = useQuery(
    communityGroups({
      page: 1,
      pageSize: 50,
      search: debouncedGroupSearch || undefined,
    }),
  )

  const patients = data?.data?.patients || []
  const groups = groupsData?.data?.groups || []

  const handleFundPatient = (patientId: string, screeningTypeId: string) => {
    navigate({
      to: '/donor/campaigns/create',
      search: {
        targetIndividualId: patientId,
        screeningTypeId,
      },
    })
  }

  const handleFundGroup = (groupId: string, groupName: string) => {
    navigate({
      to: '/donor/campaigns/create',
      search: {
        targetGroupId: groupId,
        groupName,
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
              Choose an existing community group below, or target patients by
              state, LGA, age, gender, or screening type.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/donor/campaigns/create">
                Create custom group campaign
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Existing community groups */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Community groups
            </CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                placeholder="Search groups..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {groupsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
              {debouncedGroupSearch
                ? `No groups match "${debouncedGroupSearch}".`
                : 'No community groups are available yet.'}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-semibold text-gray-900">
                    {group.name}
                  </p>
                  <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {group.description || 'A community group on the platform.'}
                  </p>
                  <Button
                    className="mt-4 bg-secondary text-white hover:bg-secondary/90"
                    onClick={() => handleFundGroup(group.id, group.name)}
                  >
                    Fund this group
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
