import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/shared/ui/alert'
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
import { Input } from '@/components/shared/ui/input'
import PasswordInput from '@/components/shared/ui/password-input'
import {
  useCreateCenterStaffPassword,
  validateStaffInvite,
} from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  createCenterStaffPasswordSchema,
  type TCreateCenterStaffPasswordParams,
} from '@zerocancer/shared/schemas/centerStaff.schema'
import {
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle,
  Shield,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type CreatePasswordForm = TCreateCenterStaffPasswordParams & {
  confirmPassword: string
}

const createPasswordFormSchema = createCenterStaffPasswordSchema
  .extend({
    confirmPassword: z.string().min(8, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const roleIntro = (role?: string) =>
  role === 'ADMIN'
    ? 'a facility admin'
    : role === 'NURSE'
      ? 'a nurse'
      : 'a staff member'

const roleAbilities = (role?: string) => {
  const shared = [
    'Verify patient check-ins',
    'Upload screening results',
    'Manage facility appointments',
  ]
  if (role === 'ADMIN')
    return [...shared, 'Invite and manage nurses & staff', 'Order screening kits']
  if (role === 'NURSE')
    return [
      'Register and screen patients',
      ...shared,
      'Share your own referral link and earn privately',
    ]
  return shared
}

export function CreateStaffPassword({ token }: { token: string }) {
  const navigate = useNavigate()
  const [isSuccess, setIsSuccess] = useState(false)

  // Validate staff invite token and get center details
  const staffInviteQuery = useQuery(validateStaffInvite(token))

  const createPasswordMutation = useCreateCenterStaffPassword()
  const invite = staffInviteQuery.data?.data
  const goToLogin = () =>
    navigate({
      to: '/staff/login',
      search: { center: invite?.centerId, email: invite?.email || undefined },
    })

  const form = useForm<CreatePasswordForm>({
    resolver: zodResolver(createPasswordFormSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: CreatePasswordForm) => {
    try {
      await createPasswordMutation.mutateAsync({
        token: data.token,
        password: data.password,
      })

      setIsSuccess(true)
      toast.success('Password created successfully!')

      setTimeout(goToLogin, 3000)
    } catch (error: any) {
      console.error('Create password error:', error)
      const errorMessage =
        error?.response?.data?.error ||
        'Failed to create password. Please try again.'
      toast.error(errorMessage)

      // If token is invalid/expired, show specific error
      if (error?.response?.status === 400 || error?.response?.status === 401) {
        form.setError('token', {
          message:
            'Invalid or expired invitation link. Please contact your center administrator.',
        })
      }
    }
  }

  const inviteRejected =
    !isSuccess && !!invite && invite.isValid === false
  if (
    !token ||
    token.length < 10 ||
    staffInviteQuery.isError ||
    inviteRejected
  ) {
    const isExpired = !!invite?.isExpired
    const errorMessage = isExpired
      ? `This invitation to ${invite?.centerName || 'the facility'} has expired.`
      : invite
        ? 'This invitation has already been used or was cancelled. If you already set a password, sign in instead.'
        : 'The invitation link appears to be invalid or incomplete.'

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">
              {isExpired ? 'Invitation Expired' : 'Invalid Invitation Link'}
            </CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>What to do next</AlertTitle>
              <AlertDescription>
                Ask your health facility admin to resend your invitation from
                the Nurses &amp; staff page. Make sure you&apos;re using the
                complete link from your invitation email.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={goToLogin}
            >
              Go to staff sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state while validating token
  if (staffInviteQuery.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-xl">Validating Invitation</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation link...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">
              Welcome to the Team!
            </CardTitle>
            <CardDescription>
              Your staff account has been successfully created.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Account Created Successfully</AlertTitle>
              <AlertDescription>
                You can now login to access the staff portal. You'll be
                redirected to the login page in a moment.
              </AlertDescription>
            </Alert>

            <Button onClick={goToLogin} className="w-full">
              Continue to Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main password creation form
  const centerDetails = staffInviteQuery.data?.data

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Create Your Staff Account</CardTitle>
          <CardDescription>
            Welcome! Please create a secure password to complete your staff
            account setup for <strong>{centerDetails?.centerName}</strong>.
          </CardDescription>
        </CardHeader>

        {/* Center Information Card */}
        {centerDetails && (
          <div className="mx-6 mb-4 p-4 bg-blue-50 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <Building className="w-5 h-5 text-blue-600" />
              <div className="text-sm font-medium text-gray-900">
                Joining {centerDetails.centerName}
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                {centerDetails.centerAddress}
              </div>
              {centerDetails.email ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  Signing in as {centerDetails.email}
                </div>
              ) : null}
            </div>
          </div>
        )}

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Hidden token field */}
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} type="hidden" />
                    </FormControl>
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
                        {...field}
                        placeholder="Enter a secure password"
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        placeholder="Confirm your password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createPasswordMutation.isPending}
              >
                {createPasswordMutation.isPending
                  ? 'Creating Account...'
                  : 'Create Staff Account'}
              </Button>
            </form>
          </Form>

          {/* Information about staff access */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              As {roleIntro(centerDetails?.role)}, you&apos;ll be able to:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {roleAbilities(centerDetails?.role).map((ability) => (
                <li key={ability} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {ability}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
