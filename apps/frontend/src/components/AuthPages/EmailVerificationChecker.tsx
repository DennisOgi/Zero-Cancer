import { useVerifyEmail } from '@/services/providers/auth.provider'
import { useNavigate } from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import { useEffect } from 'react'
import { toast } from 'sonner'

function EmailVerificationChecker({ token }: { token: string }) {
  const verifyEmail = useVerifyEmail()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      verifyEmail.mutate(token, {
        onSuccess: () => {
          toast.success(
            'Your email has been verified! You will be redirected to the login page now',
          )
          setTimeout(() => {
            navigate({ to: '/login', replace: true })
          }, 1500)
        },
        onError: (error: unknown) => {
          const err = error as AxiosError<any>
          if (err?.response?.data?.error) {
            toast.error(err.response.data.error)
          } else {
            toast.error(
              'Verification failed. The link may be invalid or expired.',
            )
          }
        },
      })
    }
  }, [token])

  if (!token) {
    return (
      <div className="text-center text-lg mt-8">
        No verification token provided.
      </div>
    )
  }

  if (verifyEmail.isPending) {
    return (
      <div className="text-center text-lg mt-8">Verifying your email...</div>
    )
  }

  if (verifyEmail.isSuccess) {
    return (
      <div className="text-center text-lg mt-8 text-green-600">
        Your email has been successfully verified! You can now log in.
      </div>
    )
  }

  if (verifyEmail.isError) {
    const err = verifyEmail.error as AxiosError<any>
    return (
      <div className="text-center text-lg mt-8 text-red-600">
        {err?.response?.data?.error ||
          'Verification failed. The link may be invalid or expired.'}
      </div>
    )
  }

  return null
}

export default EmailVerificationChecker
