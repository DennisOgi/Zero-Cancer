import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { useForgotPassword } from '@/services/providers/auth.provider'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ForgotPasswordForm() {
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const forgotPasswordMutation = useForgotPassword()

  const onBack = () => {
    // Navigate back to the login page
    window.history.back()
  }

  useEffect(() => {
    if (forgotPasswordMutation.status === 'error') {
      let msg = 'Failed to send reset email.'
      if (isAxiosError(forgotPasswordMutation.error)) {
        const data = forgotPasswordMutation.error.response?.data
        if (data && typeof data === 'object') {
          msg = JSON.stringify(data)
        }
      }
      toast.error(msg)
    }
  }, [forgotPasswordMutation.status, forgotPasswordMutation.error])

  function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    forgotPasswordMutation.mutate(forgotEmail, {
      onSuccess: () => setForgotSent(true),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Forgot Password</h2>
        <p className="text-muted-foreground">
          Enter your email to receive a password reset link.
        </p>
      </div>
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <Input
          type="email"
          placeholder="john.doe@example.com"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          required
        />
        <Button
          type="submit"
          className="w-full"
          disabled={forgotPasswordMutation.status === 'pending'}
        >
          {forgotPasswordMutation.status === 'pending'
            ? 'Sending...'
            : 'Send Reset Link'}
        </Button>
        {forgotSent && (
          <div className="text-green-600 text-sm">
            Reset link sent! Check your email.
          </div>
        )}
      </form>
      <Button variant="link" className="w-full" onClick={onBack}>
        Back to Login
      </Button>
    </div>
  )
}
