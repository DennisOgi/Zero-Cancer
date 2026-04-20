import { EmailVerificationPage } from '@/components/AuthPages/EmailVerificationPage'
import PatientForm from '@/components/AuthPages/SignupPage/PatientForm'
import { useResendVerification } from '@/services/providers/auth.provider'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

export function PatientSignupPage() {
  const [showVerify, setShowVerify] = useState(false)
  const [email, setEmail] = useState('')
  const resendVerificationMutation = useResendVerification()

  const handleFormSubmit = (data: any) => {
    if (data && data.email) {
      setEmail(data.email)
    }
    setShowVerify(true)
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address not found. Please try registering again.')
      return
    }

    const resendPromise = new Promise((resolve, reject) => {
      resendVerificationMutation.mutate(
        {
          email,
          profileType: 'PATIENT',
        },
        {
          onSuccess: (data) => {
            resolve(data)
          },
          onError: (error: any) => {
            reject(error)
          },
        },
      )
    })

    toast.promise(resendPromise, {
      loading: 'Resending verification email...',
      success: 'Verification email resent successfully!',
      error: (error: any) => {
        return (
          error.response?.data?.error ||
          'Failed to resend verification email. Please try again.'
        )
      },
    })
  }

  if (showVerify) {
    return (
      <EmailVerificationPage
        email={email}
        onResend={handleResend}
        isResending={resendVerificationMutation.isPending}
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
      <PatientForm onSubmitSuccess={handleFormSubmit} />
    </div>
  )
}
