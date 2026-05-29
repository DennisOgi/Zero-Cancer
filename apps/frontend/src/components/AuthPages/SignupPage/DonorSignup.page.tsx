import { EmailVerificationPage } from '@/components/AuthPages/EmailVerificationPage'
import DonorForm from '@/components/AuthPages/SignupPage/DonorForm'
import { Link, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

export function DonorSignupPage() {
  const donationIntent = useSearch({ from: '/(auth)/sign-up/donor' })
  const [showVerify, setShowVerify] = useState(false)
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const hasDonationIntent =
    !!donationIntent.amount || donationIntent.monitor === 'true' || donationIntent.choose === 'true'

  const handleFormSubmit = (data: any) => {
    if (data && data.email) {
      setEmail(data.email)
    }
    setShowVerify(true)
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      // TODO: Replace with actual resend verification email API call
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
      />
    </div>
  )
}
