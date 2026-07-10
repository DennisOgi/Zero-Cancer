import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import PasswordInput from '@/components/shared/ui/password-input'
import {
  useAuthUser,
  useChangePassword,
} from '@/services/providers/auth.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  changePasswordSchema,
  type TChangePasswordParams,
} from '@zerocancer/shared/schemas/auth.schema'
import { KeyRound, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { data: authData, isLoading } = useQuery(useAuthUser())
  const changePassword = useChangePassword()
  const mustChange = Boolean(authData?.data?.user?.mustChangePassword)

  const form = useForm<TChangePasswordParams>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (values: TChangePasswordParams) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        toast.success('Password updated successfully')
        navigate({ to: '/patient', replace: true })
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.error || 'Failed to update password',
        )
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {mustChange ? 'Set a new password' : 'Change password'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {mustChange
            ? 'For your security, please replace the temporary password from your center before continuing.'
            : 'Update the password you use to sign in to ZeroCancer.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            New password must be at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {mustChange ? 'Temporary password' : 'Current password'}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Enter current password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Enter new password"
                      />
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
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Confirm new password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-2">
                {!mustChange && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate({ to: '/patient/profile' })}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending ? 'Saving...' : 'Update password'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
