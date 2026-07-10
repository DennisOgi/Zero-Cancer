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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import { Input } from '@/components/shared/ui/input'
import PhoneInputComponent from '@/components/shared/ui/phone-input'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  centerProfile,
  useUpdateCenterProfile,
} from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { updateCenterProfileSchema } from '@zerocancer/shared/schemas/center.schema'
import { Building2, Loader2, MessageCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type * as RPNInput from 'react-phone-number-input'
import { toast } from 'sonner'
import { z } from 'zod'

type ProfileFormData = z.infer<typeof updateCenterProfileSchema>

export function CenterProfilePage() {
  const { data: authData } = useQuery(useAuthUser())
  const isAdmin = authData?.data?.user?.profile === 'CENTER'

  const { data, isLoading, isError, refetch } = useQuery(centerProfile())
  const updateMutation = useUpdateCenterProfile()
  const profile = data?.data

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(updateCenterProfileSchema),
    defaultValues: {
      whatsappNumber: '',
      phone: '',
      address: '',
    },
  })

  useEffect(() => {
    if (!profile) return
    form.reset({
      whatsappNumber: profile.whatsappNumber || profile.phone || '',
      phone: profile.phone || profile.whatsappNumber || '',
      address: profile.address || '',
    })
  }, [profile, form])

  const onSubmit = (values: ProfileFormData) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('WhatsApp number updated')
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.error || 'Failed to update center profile',
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

  if (isError || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load center profile</CardTitle>
          <CardDescription>Please try again.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Center profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the WhatsApp number used for patient communication and report
          sharing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {profile.centerName}
          </CardTitle>
          <CardDescription>
            {profile.email}
            {profile.status ? ` · ${profile.status}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">State</p>
            <p className="font-medium">{profile.state || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">LGA</p>
            <p className="font-medium">{profile.lga || 'Not set'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium">{profile.address || 'Not set'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp contact
          </CardTitle>
          <CardDescription>
            This number appears on screening reports and is used when staff open
            WhatsApp to message patients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp number</FormLabel>
                      <FormControl>
                        <PhoneInputComponent
                          value={field.value as RPNInput.Value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Use international format, e.g. +2348012345678
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Center address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">
                {profile.whatsappNumber || profile.phone || 'Not set'}
              </p>
              <p className="text-sm text-muted-foreground">
                Only the center admin account can update this number.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
