import PatientForm from '@/components/AuthPages/SignupPage/PatientForm'
import { ACCESS_TOKEN_KEY } from '@/services/keys'
import { lookupReferral } from '@/services/agent-network.service'
import { getCenterById } from '@/services/center.service'
import { waitingListPreview } from '@/services/providers/waiting-list.provider'
import { boardingPreview } from '@/services/providers/boarding.provider'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { TPatientRegisterResponse } from '@zerocancer/shared/types'
import { toast } from 'sonner'
import { z } from 'zod'
import { patientSchema } from '@zerocancer/shared/schemas/register.schema'
import { useEffect, useMemo, useState } from 'react'

type FormData = z.infer<typeof patientSchema>

const FACILITY_CENTER_KEY = 'zerocancer_facility_center'

export function PatientSignupPage({
  referralCode,
  facilityCenterId,
  listToken,
  inviteToken,
}: {
  referralCode?: string
  facilityCenterId?: string
  listToken?: string
  inviteToken?: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const storedRef =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('zerocancer_ref') || undefined
      : undefined
  const storedFacility =
    typeof window !== 'undefined'
      ? sessionStorage.getItem(FACILITY_CENTER_KEY) || undefined
      : undefined
  const storedInvite =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('zerocancer_invite') || undefined
      : undefined

  const code = (referralCode || storedRef || '').trim()
  const centerId = (facilityCenterId || storedFacility || '').trim()
  const boardToken = (inviteToken || storedInvite || '').trim()

  useEffect(() => {
    if (referralCode) sessionStorage.setItem('zerocancer_ref', referralCode)
  }, [referralCode])

  useEffect(() => {
    if (facilityCenterId)
      sessionStorage.setItem(FACILITY_CENTER_KEY, facilityCenterId)
  }, [facilityCenterId])

  useEffect(() => {
    if (inviteToken) sessionStorage.setItem('zerocancer_invite', inviteToken)
  }, [inviteToken])

  const { data: referralLookup } = useQuery({
    queryKey: ['referral-lookup', code],
    queryFn: () => lookupReferral(code),
    enabled: code.length > 2,
    retry: false,
  })

  const { data: facilityLookup, isError: facilityLookupError } = useQuery({
    queryKey: ['facility-invite', centerId],
    queryFn: () => getCenterById(centerId),
    enabled: centerId.length > 10,
    retry: false,
  })

  const listCode = (listToken || '').trim()
  const { data: listPreview, isError: listPreviewError } = useQuery(
    waitingListPreview(listCode || undefined),
  )
  const waitingList = listPreview?.data
  const { data: boardPreview } = useQuery(boardingPreview(boardToken || undefined))
  const boarding = boardPreview?.data

  const referrerLabel = useMemo(() => {
    const payload = (referralLookup as any)?.data
    return (
      payload?.referrerName ||
      payload?.inviteName ||
      payload?.agentCode ||
      code
    )
  }, [referralLookup, code])
  const lookup = (referralLookup as any)?.data
  const boundCenter = lookup?.boundCenter
  const screenAnywhere = lookup?.type === 'nurse' || lookup?.screenAnywhere
  const [facilityDismissed, setFacilityDismissed] = useState(false)
  const facility = (facilityLookup as any)?.data
  const facilityName = facility?.centerName as string | undefined
  const facilityUsable =
    !!facility &&
    String(facility.status || '').toUpperCase() === 'ACTIVE' &&
    (facility.services?.length || 0) > 0
  const facilityUnavailable =
    !!centerId && (facilityLookupError || (!!facility && !facilityUsable))
  const activeFacilityId =
    centerId && facilityUsable && !facilityDismissed ? centerId : undefined

  useEffect(() => {
    if (facilityUnavailable || facilityDismissed)
      sessionStorage.removeItem(FACILITY_CENTER_KEY)
  }, [facilityUnavailable, facilityDismissed])

  const handleFormSubmit = (
    _values: FormData,
    response: TPatientRegisterResponse,
  ) => {
    sessionStorage.removeItem('zerocancer_ref')
    sessionStorage.removeItem(FACILITY_CENTER_KEY)
    sessionStorage.removeItem('zerocancer_invite')
    const token = response.data?.token
    if (token) {
      queryClient.setQueryData([ACCESS_TOKEN_KEY], token)
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
    }

    const recommendedCenters = response.data?.recommendedCenters || []
    const assignedCenter = response.data?.assignedCenter || null

    if (response.data?.needsFacilityChoice) {
      toast.success('Account created. Choose a health facility next.')
      navigate({ to: '/patient/select-center', replace: true })
      return
    }

    if (assignedCenter) {
      toast.success(
        `Account created! You've been registered at ${assignedCenter.centerName} in ${assignedCenter.lga}, ${assignedCenter.state}.`,
      )
      navigate({ to: '/patient', replace: true })
      return
    }

    toast.success('Account created successfully')

    const state = response.data?.state || _values.state
    const lga = response.data?.localGovernment || _values.localGovernment

    sessionStorage.setItem(
      'patientSignupCenters',
      JSON.stringify({ recommendedCenters, assignedCenter }),
    )

    if (recommendedCenters.length > 0) {
      navigate({
        to: '/sign-up/patient/centers',
        search: { state, lga },
      })
      return
    }

    navigate({ to: '/patient', replace: true })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/sign-up"
          className="text-gray-600 hover:text-gray-800 px-4 py-1 bg-blue-100 rounded-lg cursor-pointer"
        >
          Back
        </Link>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Create your patient account</h1>
        <p className="text-sm text-muted-foreground">
          Register with your location so we can connect you to the nearest
          health facility for vaccination, screening, and treatment.
        </p>
        {activeFacilityId && facilityName ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <p className="font-medium">
              You&apos;ll be registered at {facilityName}
            </p>
            <p className="mt-0.5 text-emerald-900/80">
              {facility?.lga && facility?.state
                ? `${facility.lga}, ${facility.state}. `
                : ''}
              This health facility invited you.
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-emerald-800 underline underline-offset-2"
              onClick={() => setFacilityDismissed(true)}
            >
              Not near you? Choose another facility
            </button>
          </div>
        ) : null}
        {facilityDismissed && facilityName ? (
          <div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-800">
            We&apos;ll match you with a health facility near the location you
            enter below.
          </div>
        ) : null}
        {facilityUnavailable ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {facilityName
              ? `${facilityName} isn't taking new registrations right now.`
              : "This invite link isn't valid."}{' '}
            We&apos;ll match you with a health facility near you instead.
          </div>
        ) : null}
        {boarding?.type === 'SCREEN' ? (
          <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-900">
            <p className="font-medium">{boarding.inviterName} invited you to get screened</p>
            <p className="mt-0.5 text-pink-800/80">
              After you register we will ask you to join their hospital if you
              live in the same city, or pick the nearest facility.
            </p>
          </div>
        ) : null}
        {waitingList ? (
          <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-900">
            <p className="font-medium">Joining {waitingList.name}</p>
            <p className="mt-0.5 text-pink-800/80">
              {waitingList.description ||
                `After you register, you will be added to this waiting list${
                  waitingList.screeningTypeName
                    ? ` for ${waitingList.screeningTypeName}`
                    : ''
                } so a donor can sponsor you.`}
              {waitingList.targetGender === 'FEMALE'
                ? ' This list is for women.'
                : waitingList.targetGender === 'MALE'
                  ? ' This list is for men.'
                  : ''}
            </p>
          </div>
        ) : null}
        {listCode && listPreviewError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This waiting-list invite is not valid. You can still create an
            account and join the public waitlist.
          </div>
        ) : null}
        {code ? (
          <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-900">
            <p className="font-medium">Referred by {referrerLabel}</p>
            <p className="mt-0.5 text-pink-800/80">
              {screenAnywhere
                ? `You can screen at any ZeroCancer health facility, including one near you. You can still choose whether ${referrerLabel} earns a commission.`
                : boundCenter
                  ? `You'll be assigned to ${boundCenter.centerName} for screening. You can still choose whether ${referrerLabel} earns a commission.`
                  : 'We will attach this invite to your account. When you book, you can choose whether they earn a commission.'}
            </p>
          </div>
        ) : null}
      </div>
      <PatientForm
        onSubmitSuccess={handleFormSubmit}
        referralCode={code || undefined}
        facilityCenterId={activeFacilityId}
        listToken={waitingList ? listCode : undefined}
        inviteToken={boardToken || undefined}
      />
    </div>
  )
}
