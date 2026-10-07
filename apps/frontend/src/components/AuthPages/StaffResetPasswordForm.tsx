import { Button } from '@/components/shared/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import PasswordInput from '@/components/shared/ui/password-input'
import { useCenterStaffResetPassword } from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { centerStaffResetPasswordSchema } from '@zerocancer/shared/schemas/centerStaff.schema'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const resetFormSchema = centerStaffResetPasswordSchema
  .extend({ confirmPassword: z.string().min(8, 'Confirm your password') })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetForm = z.infer<typeof resetFormSchema>

export function StaffResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate()
  const resetMutation = useCenterStaffResetPassword()
  const form = useForm<ResetForm>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  })

  if (!token || token.length < 10) {
    return (
      <div className="w-full max-w-md space-y-4 mx-auto">
        <h2 className="text-3xl font-bold">Reset link not valid</h2>
        <p className="text-muted-foreground">
          This password reset link is incomplete. Request a new one.
        </p>
        <Button asChild className="w-full">
          <Link to="/staff/forgot-password">Request a new link</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = (values: ResetForm) =>
    resetMutation.mutate(
      { token: values.token, password: values.password },
      {
        onSuccess: () => {
          toast.success('Password updated. Sign in with your new password.')
          navigate({ to: '/staff/login', replace: true })
        },
        onError: (error: any) =>
          toast.error(
            error?.response?.data?.error ||
              'This reset link is invalid or has expired.',
          ),
      },
    )

  return (
    <div className="w-full max-w-md space-y-6 mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Set a new password</h2>
        <p className="text-muted-foreground">
          Choose a new password for your health facility staff account.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput {...field} placeholder="At least 8 characters" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput {...field} placeholder="Repeat your password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
            {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </Form>
    </div>
  )
}
