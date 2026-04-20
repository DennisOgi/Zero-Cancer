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
import { Link, useNavigate } from '@tanstack/react-router'
import {
  loginSchema,
  type TLoginParams,
} from '@zerocancer/shared/schemas/auth.schema'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Spinner from '../../shared/Spinner'
import RoleSelection from './RoleSelection'

export default function LoginForm() {
  const [role, setRole] = useState<'patient' | 'donor' | 'center'>('patient')
  const queryClient = useQueryClient()
  const loginMutation = useLogin()
  const resendVerificationMutation = useResendVerification()
  const navigate = useNavigate()

  const form = useForm<TLoginParams>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'testdonor3@example.com',
      password: 'demo789',
    },
  })

  function onSubmit(values: TLoginParams) {
    loginMutation.mutate(
      {
        params: {
          email: values.email,
          password: values.password,
        },
        actor: role,
      },
      {
        onSuccess: () => {
          toast.success('Login successful')

          queryClient.fetchQuery(useAuthUser()).then((data) => {
            const userProfile = data?.data?.user?.profile.toLowerCase()
            navigate({ to: `/${userProfile}` })
          })
        },
        onError: (error) => {
          if (error.response?.data?.err_code === 'email_not_verified') {
            toast.error(
              'User not verified. Please check your email for verification code.',
            )

            resendVerificationMutation.mutate(
              {
                email: values.email,
                profileType: role,
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
          } else if (error.response?.data?.err_code === 'invalid_credentials') {
            toast.error('Invalid email or password. Please try again.')
          } else if (error.response?.data?.err_code === 'invalid_actor') {
            toast.error(
              "Seems like you're trying to log in with the wrong profile type. Please select the correct role for your account.",
            )
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
          Select your role to access your account.
        </p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Login as...</label>
        <RoleSelection
          selectedRoles={['patient', 'donor', 'center']}
          field={{
            value: role,
            onChange: (value: string) => setRole(value as 'patient' | 'donor' | 'center'),
            name: 'role',
            onBlur: () => {},
            ref: () => {},
          }}
        />
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

          <div className="flex justify-end">
            <Link
              className=" text-primary cursor-pointer"
              to="/forgot-password"
            >
              Forgot Password?
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
        </form>
      </Form>
    </div>
  )
}
