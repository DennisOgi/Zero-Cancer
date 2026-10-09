import { EmailVerificationPage } from '@/components/AuthPages/EmailVerificationPage'
import DonorForm from '@/components/AuthPages/SignupPage/DonorForm'
import { boardingPreview } from '@/services/providers/boarding.provider'
import { ACCESS_TOKEN_KEY } from '@/services/keys'
import type { TDonorRegisterResponse } from '@zerocancer/shared/types'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function DonorSignupPage() {
  const donationIntent = useSearch({ from: '/(auth)/sign-up/donor' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showVerify, setShowVerify] = useState(false)
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const inviteToken =
    donationIntent.invite ||
    (typeof window !== 'undefined'
      ? sessionStorage.getItem('zerocancer_invite') || undefined
      : undefined)
  const hasDonationIntent =
    !!donationIntent.amount || donationIntent.monitor === 'true' || donationIntent.choose === 'true'

  useEffect(() => {
    if (donationIntent.invite)
      sessionStorage.setItem('zerocancer_invite', donationIntent.invite)
  }, [donationIntent.invite])

  const { data: boardPreview } = useQuery(boardingPreview(inviteToken))
  const boarding = boardPreview?.data

  const handleFormSubmit = (
    data: { email?: string },
    response: TDonorRegisterResponse,
  ) => {
    if (data && data.email) {
      setEmail(data.email)
    }
    const token = response.data?.token
    if (token) {
      sessionStorage.removeItem('zerocancer_invite')
      queryClient.setQueryData([ACCESS_TOKEN_KEY], token)
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
      toast.success('Welcome. You can fund a waiting list or create one for your event.')
      navigate({ to: '/donor/waiting-lists', replace: true })
      return
    }
    setShowVerify(true)
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Verification email resent!')
    } catch (err) {
      toast.error('Failed to resend email.')
    } finally {
      setIsResending(false)
    }
  }

  if (showVerify) {
    return (
      <EmailVerificationPage
        email={email}
        onResend={handleResend}
        isResending={isResending}
      />
    )
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
      {boarding?.type === 'CELEBRANT' ? (
        <div className="rounded-xl border border-pink-200 bg-pink-50 p-4 text-sm text-pink-900">
          <p className="font-semibold">{boarding.inviterName} invited you to sponsor screening</p>
          <p className="mt-1">
            After you create this account you can fund women already waiting, a
            church or CWO list, or start a waiting list tagged to your event.
          </p>
        </div>
      ) : null}
      {hasDonationIntent && (
        <div className="rounded-xl border border-pink-100 bg-pink-50 p-4 text-sm text-pink-900">
          <p className="font-semibold">Complete your donor account to continue</p>
          <p className="mt-1">
            We'll keep your donation preference attached to this signup so you
            can monitor impact or choose a beneficiary after verification.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {donationIntent.amount && (
              <span className="rounded-full bg-white px-3 py-1">
                Amount: ₦{Number(donationIntent.amount).toLocaleString()}
              </span>
            )}
            {donationIntent.monitor === 'true' && (
              <span className="rounded-full bg-white px-3 py-1">
                Monitor donation
              </span>
            )}
            {donationIntent.choose === 'true' && (
              <span className="rounded-full bg-white px-3 py-1">
                Choose beneficiary
              </span>
            )}
          </div>
        </div>
      )}
      <DonorForm
        onSubmitSuccess={handleFormSubmit}
        initialEmail={donationIntent.email}
        inviteToken={inviteToken}
      />
    </div>
  )
}
