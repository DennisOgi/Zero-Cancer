import PatientForm from '@/components/AuthPages/SignupPage/PatientForm'
import { persistAccessToken } from '@/lib/access-token'
import { persistBoardingVideoProgress } from '@/lib/persist-boarding-videos'
import {
  clearReferralIntent,
  readReferralIntent,
} from '@/lib/referral-intent'
import { useAuthUser } from '@/services/providers/auth.provider'
import { lookupReferral } from '@/services/agent-network.service'
import { getCenterById } from '@/services/center.service'
import { joinWaitlist } from '@/services/patient.service'
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
  // Facility invites bind the patient when the center is ACTIVE.
  // Services are not required for assignment — patients can still book later.
  const facilityUsable =
    !!facility && String(facility.status || '').toUpperCase() === 'ACTIVE'
  const activeFacilityId =
    centerId && facilityUsable && !facilityDismissed ? centerId : undefined

  useEffect(() => {
    if (facilityLookupError || facilityDismissed)
      sessionStorage.removeItem(FACILITY_CENTER_KEY)
  }, [facilityLookupError, facilityDismissed])

  const handleFormSubmit = async (
    _values: FormData,
    response: TPatientRegisterResponse,
  ) => {
    const referralIntent = readReferralIntent()
    sessionStorage.removeItem('zerocancer_ref')
    sessionStorage.removeItem(FACILITY_CENTER_KEY)
    sessionStorage.removeItem('zerocancer_invite')
    const token = response.data?.token
    if (token) {
      persistAccessToken(queryClient, token)
      await persistBoardingVideoProgress()
      await queryClient.fetchQuery(useAuthUser()).catch(() => null)
    }

    const recommendedCenters = response.data?.recommendedCenters || []
    const assignedCenter = response.data?.assignedCenter || null
    const intentCenterId =
      referralIntent?.centerId || assignedCenter?.id || activeFacilityId

    if (referralIntent?.intent && referralIntent.screeningTypeId) {
      clearReferralIntent()
      if (referralIntent.intent === 'pay_now') {
        toast.success('Account created. Continue to pay and book your screening.')
        navigate({
          to: '/patient/book/pay',
          search: {
            screeningTypeId: referralIntent.screeningTypeId,
            centerId: intentCenterId,
            referralCode: referralIntent.code,
          },
          replace: true,
        })
        return
      }
      if (referralIntent.intent === 'pay_later') {
        toast.success('Account created. Start saving toward your screening.')
        navigate({
          to: '/patient/savings',
          search: {
            screeningTypeId: referralIntent.screeningTypeId,
            centerId: intentCenterId,
            targetAmount: referralIntent.price,
          },
          replace: true,
        })
        return
      }
      if (referralIntent.intent === 'waitlist') {
        try {
          await joinWaitlist({
            screeningTypeId: referralIntent.screeningTypeId,
            centerId: intentCenterId || undefined,
          })
          toast.success(
            `You're on the waitlist${
              referralIntent.screeningName
                ? ` for ${referralIntent.screeningName}`
                : ''
            }. A donor can sponsor you next.`,
          )
        } catch (error: any) {
          toast.error(
            error?.response?.data?.error ||
              'Account created, but joining the waitlist failed. You can join from Book Screening.',
          )
        }
        navigate({ to: '/patient', replace: true })
        return
      }
    }

    if (response.data?.needsFacilityChoice) {
      toast.success('Account created. Choose a health facility next.')
      navigate({ to: '/patient/select-center', replace: true })
      return
    }

    if (assignedCenter || centerId) {
      toast.success(
        assignedCenter
          ? `Account created! You've been registered at ${assignedCenter.centerName} in ${assignedCenter.lga}, ${assignedCenter.state}.`
          : 'Account created. Opening your patient dashboard.',
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
        <p className="text-sm text-muted-foreground">
          Welcome to Zerocancer Africa where we partner to eliminate cervical
          cancer from the continent.
        </p>
        <h1 className="text-2xl font-bold">Create your patient account</h1>
        <p className="text-sm text-muted-foreground">
          Register with your location so we can connect you to the nearest
          health facility for vaccination, screening, and treatment.
        </p>
        {facilityName && !facilityDismissed && !facilityLookupError && facilityUsable ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
              Health facility invite
            </p>
            <p className="mt-1 font-medium">
              {facilityName} invited you to register
            </p>
            <p className="mt-0.5 text-emerald-900/80">
              {facility?.lga && facility?.state
                ? `${facility.lga}, ${facility.state}. `
                : ''}
              You will be registered under this health facility after you create
              your account.
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
        {facilityName && !facilityDismissed && !facilityLookupError && !facilityUsable ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">
              Health facility invite
            </p>
            <p className="mt-1 font-medium">
              {facilityName} invited you to register
            </p>
            <p className="mt-0.5 text-amber-900/80">
              This facility is not accepting new registrations through this
              link right now. Register with your location and we&apos;ll match
              you with a health facility near you instead.
            </p>
          </div>
        ) : null}
        {facilityDismissed && facilityName ? (
          <div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-800">
            We&apos;ll match you with a health facility near the location you
            enter below.
          </div>
        ) : null}
        {facilityLookupError && centerId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This facility invite link isn&apos;t valid. We&apos;ll match you
            with a health facility near you instead.
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
        ) : boarding?.type === 'CELEBRANT' ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This invite is for a celebrant or donor. Create a donor account
            instead — this patient signup will not use the invite.
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
            <p className="mt-2 text-pink-900/90">
              It is advisable to attach your picture when joining the Waiting
              List. Patients with profile pictures are more likely to be funded
              for screening before those without it.
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
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-800/80">
              {lookup?.type === 'nurse'
                ? lookup?.referrerRole === 'DOCTOR'
                  ? 'Doctor invite'
                  : lookup?.referrerRole === 'NURSE'
                    ? 'Nurse invite'
                    : 'Health worker invite'
                : 'Referral invite'}
            </p>
            <p className="mt-1 font-medium">
              {referrerLabel} invited you to get screened
            </p>
            <p className="mt-0.5 text-pink-800/80">
              {screenAnywhere
                ? `You can screen at any ZeroCancer health facility, including one near you. You can still choose whether ${referrerLabel} earns a commission.`
                : boundCenter
                  ? `You'll be assigned to ${boundCenter.centerName} for screening. You can still choose whether ${referrerLabel} earns a commission.`
                  : 'We will attach this invite to your account. When you book, you can choose whether they earn a commission.'}
            </p>
            {boundCenter?.centerName && screenAnywhere ? (
              <p className="mt-1 text-pink-900/90">
                Their facility is {boundCenter.centerName}.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <PatientForm
        onSubmitSuccess={handleFormSubmit}
        referralCode={code || undefined}
        facilityCenterId={activeFacilityId}
        hideReferralField={Boolean(activeFacilityId)}
        listToken={waitingList ? listCode : undefined}
        inviteToken={boardToken || undefined}
      />
    </div>
  )
}
