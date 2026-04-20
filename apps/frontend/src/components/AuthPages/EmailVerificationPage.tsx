import React from 'react'

interface EmailVerificationPageProps {
  email: string
  onResend: () => Promise<void> | void
  isResending: boolean
}

export function EmailVerificationPage({
  email,
  onResend,
  isResending,
}: EmailVerificationPageProps) {
  return (
    <div className="">
      <div className="space-y-4">
        <p className="text-center text-lg">
          A <span className="text-primary">verification link</span> has been
          sent to <b>{email}</b>. Please check your email and verify your
          account.
        </p>
        <div className="text-center text-lg">Didn't receive an email?</div>
        <div className="flex justify-center">
          <button
            onClick={onResend}
            className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer"
            disabled={isResending}
          >
            {isResending ? 'Resending...' : 'Resend Email'}
          </button>
        </div>
      </div>
    </div>
  )
}
