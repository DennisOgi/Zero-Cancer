import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/shared/ui/button'
import { Combobox } from '@/components/shared/ui/combobox'
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
  centers,
  useCenterStaffLogin,
} from '@/services/providers/center.provider'
import { useQuery } from '@tanstack/react-query'
import {
  centerStaffLoginSchema,
  type TCenterStaffLoginParams,
} from '@zerocancer/shared/schemas/centerStaff.schema'
import { Loader2 } from 'lucide-react'

export function StaffLoginForm() {
  const navigate = useNavigate()

  const {
    data: centersData,
    isLoading: centersLoading,
    isError,
  } = useQuery(
    centers({
      page: 1,
      pageSize: 100, // Get a large number to show all available centers
      status: 'ACTIVE', // Only show active centers
    }),
  )

  const centersList = centersData?.data?.centers || []
  const centerOptions = centersList.map((center) => ({
    value: center.id,
    label: center.centerName,
  }))

  const loginForm = useForm<TCenterStaffLoginParams>({
    resolver: zodResolver(centerStaffLoginSchema),
    defaultValues: {
      centerId: '',
      email: '',
      password: '',
    },
  })

  const loginMutation = useCenterStaffLogin()

  function onLoginSubmit(values: TCenterStaffLoginParams) {
    loginMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Login successful')

        queryClient.fetchQuery(useAuthUser()).then((data) => {
          const userProfile = data?.data?.user?.profile.toLowerCase()
          navigate({ to: `/center` })
        })
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.error || 'Login failed. Please try again.',
        )
      },
    })
  }

  return (
    // <div className="flex h-screen p-2">
    // <div className="flex-1 p-4 lg:p-6 flex justify-center">
    <div className="w-full max-w-md space-y-6 mx-auto">
      {/* <div className="space-y-6"> */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Screening Center Portal</h2>
        <p className="text-muted-foreground">
          Sign in to access your center's staff portal.
        </p>
      </div>

      <Form {...loginForm}>
        <form
          onSubmit={loginForm.handleSubmit(onLoginSubmit)}
          className="space-y-4"
        >
          <FormField
            control={loginForm.control}
            name="centerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Center</FormLabel>
                <FormControl>
                  <Combobox
                    options={centerOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    placeholder="Select center"
                    searchPlaceholder="Search centers..."
                    emptyStateMessage={
                      centersLoading
                        ? 'Loading...'
                        : isError
                          ? 'Failed to load centers.'
                          : 'No center found.'
                    }
                    disabled={centersLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={loginForm.control}
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
            control={loginForm.control}
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
              className="text-primary cursor-pointer hover:underline"
              to="/staff/forgot-password"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loginMutation.status === 'pending'}
            className="w-full flex items-center justify-center gap-2"
          >
            {loginMutation.status === 'pending' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          For patients and donors:{' '}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Use Main Login
          </Link>
        </p>
      </div>
      {/* </div> */}
    </div>
    // </div>
  )
}
