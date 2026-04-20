import React from 'react'

interface EmailVerificationNotificationProps {
  email: string
  showVerify: boolean
  profileType: string
  resendVerificationMutation: {
    mutate: (params: { email: string; profileType: string }) => Promise<void>
    isPending: boolean
  }
}

const EmailVerificationNotification: React.FC<
  EmailVerificationNotificationProps
> = ({ email, showVerify, profileType, resendVerificationMutation }) => {
  if (!showVerify) return null

  return (
    <div>
      <div className="space-y-4">
        <p className="text-center text-lg">
          A <span className="text-primary">verification link</span> has been
          sent to <b>{email}</b>. Please check your email and verify your
          account.
        </p>
        <div className="text-center text-lg">Didn't receive an email?</div>
        <div className="flex justify-center">
          <button
            onClick={() =>
              resendVerificationMutation.mutate({ email, profileType })
            }
            className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer"
            disabled={resendVerificationMutation.isPending}
          >
            {resendVerificationMutation.isPending
              ? 'Resending...'
              : 'Resend Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationNotification
