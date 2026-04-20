import {
  centers,
  useCenterStaffForgotPassword,
} from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  centerStaffForgotPasswordSchema,
  type TCenterStaffForgotPasswordParams,
} from '@zerocancer/shared/schemas/centerStaff.schema'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../shared/ui/button'
import { Combobox } from '../shared/ui/combobox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../shared/ui/form'
import { Input } from '../shared/ui/input'

export function StaffForgotPasswordForm() {
  const {
    data: centersData,
    isLoading: centersLoading,
    isError,
  } = useQuery(
    centers({
      page: 1,
      pageSize: 100,
      status: 'ACTIVE',
    }),
  )

  const navigate = useNavigate()

  const centersList = centersData?.data?.centers || []
  const centerOptions = centersList.map((center) => ({
    value: center.id,
    label: center.centerName,
  }))

  const forgotForm = useForm<TCenterStaffForgotPasswordParams>({
    resolver: zodResolver(centerStaffForgotPasswordSchema),
    defaultValues: {
      centerId: '',
      email: '',
    },
  })

  const forgotPasswordMutation = useCenterStaffForgotPassword()

  function onForgotSubmit(values: TCenterStaffForgotPasswordParams) {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => {
        toast.success(
          'Password reset link sent to your email. You will be redirected to the login page.',
        )
        navigate({ to: '/staff/login', replace: true })
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.error || 'Failed to send reset email.',
        )
      },
    })
  }

  return (
    <div className="w-full max-w-md space-y-6 mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Reset Password</h2>
        <p className="text-muted-foreground">
          Enter your center ID and email to receive a password reset link.
        </p>
      </div>

      <Form {...forgotForm}>
        <form
          onSubmit={forgotForm.handleSubmit(onForgotSubmit)}
          className="space-y-4"
        >
          <FormField
            control={forgotForm.control}
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
            control={forgotForm.control}
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

          <Button
            type="submit"
            className="w-full"
            disabled={forgotPasswordMutation.status === 'pending'}
          >
            {forgotPasswordMutation.status === 'pending' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>
      </Form>
      <Button
        variant="link"
        className="w-full"
        onClick={() => navigate({ to: '/staff/login' })}
      >
        Back to Login
      </Button>
    </div>
  )
}
