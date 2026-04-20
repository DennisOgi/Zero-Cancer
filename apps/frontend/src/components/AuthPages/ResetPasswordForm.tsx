import { useResetPassword } from '@/services/providers/auth.provider'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../shared/ui/button'
import PasswordInput from '../shared/ui/password-input'

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const resetPassword = useResetPassword()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('Invalid or missing token.')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    resetPassword.mutate(
      { token, password },
      {
        onSuccess: () => {
          toast.success(
            'Password reset successful! You will be redirected to the login page now',
          )
          setTimeout(() => {
            navigate({ to: '/login', replace: true })
          }, 1500)
        },
        onError: () => toast.error('Failed to reset password.'),
      },
    )
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-xl mx-auto mt-16 p-6 bg-white rounded shadow ">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            placeholder="Enter new password"
            value={password}
            onChange={setPassword}
          />
          <PasswordInput
            placeholder="Confirm new password"
            value={confirm}
            onChange={setConfirm}
          />
          <Button
            type="submit"
            disabled={resetPassword.isPending}
            className="w-full"
          >
            {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
