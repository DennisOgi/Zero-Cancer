import { EmailVerificationPage } from '@/components/AuthPages/EmailVerificationPage'
import DonorForm from '@/components/AuthPages/SignupPage/DonorForm'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

export function DonorSignupPage() {
  const [showVerify, setShowVerify] = useState(false)
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)

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
      <DonorForm onSubmitSuccess={handleFormSubmit} />
    </div>
  )
}
