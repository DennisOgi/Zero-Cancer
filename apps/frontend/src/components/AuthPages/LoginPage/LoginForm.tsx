import { Button } from '@/components/shared/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import { Input } from '@/components/shared/ui/input'
import PasswordInput from '@/components/shared/ui/password-input'
import {
  useAuthUser,
  useLogin,
  useResendVerification,
} from '@/services/providers/auth.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  loginSchema,
  type TLoginParams,
} from '@zerocancer/shared/schemas/auth.schema'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Spinner from '../../shared/Spinner'

export default function LoginForm() {
  const queryClient = useQueryClient()
  const loginMutation = useLogin()
  const resendVerificationMutation = useResendVerification()
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/login' })

  const form = useForm<TLoginParams>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(values: TLoginParams) {
    loginMutation.mutate(
      {
        params: {
          email: values.email,
          password: values.password,
        },
      },
      {
        onSuccess: () => {
          toast.success('Login successful')

          queryClient.fetchQuery(useAuthUser()).then((data) => {
            const user = data?.data?.user
            const userProfile = user?.profile.toLowerCase()

            if (search.redirect) {
              window.location.href = search.redirect
              return
            }

            if (userProfile === 'patient' && user?.mustChangePassword) {
              navigate({ to: '/patient/change-password' })
              return
            }

            if (userProfile === 'center' || userProfile === 'center_staff') {
              navigate({ to: '/center' })
              return
            }

            navigate({ to: `/${userProfile}` })
          })
        },
        onError: (error) => {
          const errCode = error.response?.data?.err_code
          if (errCode === 'needs_facility_pick') {
            toast.message(
              'This email is used at multiple facilities. Sign in with your facility below.',
            )
            navigate({
              to: '/staff/login',
              search: { email: values.email },
            })
            return
          }
          if (errCode === 'email_not_verified') {
            toast.error(
              'User not verified. Please check your email for verification code.',
            )

            resendVerificationMutation.mutate(
              {
                email: values.email,
                profileType: 'patient',
              },
              {
                onSuccess: () => {
                  toast.success('Verification code resent successfully!')
                },
                onError: () => {
                  toast.error(
                    'Failed to resend verification code. Please try again.',
                  )
                },
              },
            )
            return
          }
          if (errCode === 'invalid_credentials') {
            toast.error('Invalid email or password. Please try again.')
            return
          }

          toast.error(
            error.response?.data?.error || 'Login failed. Please try again.',
          )
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Login</h2>
        <p className="text-muted-foreground">
          Enter your email and password. We&apos;ll take you to the right
          dashboard for your account.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Enter your password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Link className="text-primary cursor-pointer" to="/forgot-password">
              Forgot Password?
            </Link>
            <Link
              className="text-muted-foreground cursor-pointer text-sm"
              to="/forgot-password-center"
            >
              Facility reset
            </Link>
          </div>

          <Button
            type="submit"
            disabled={
              loginMutation.status === 'pending' ||
              loginMutation.status === 'success'
            }
            className="w-full flex items-center justify-center gap-2"
          >
            {loginMutation.status === 'pending' && <Spinner />}
            Login
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Facility staff with accounts at multiple centers?{' '}
            <Link to="/staff/login" className="text-primary underline">
              Choose facility
            </Link>
          </p>
        </form>
      </Form>
    </div>
  )
}
