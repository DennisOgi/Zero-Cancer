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
import { Textarea } from '@/components/shared/ui/textarea'
import PhoneInputComponent from '@/components/shared/ui/phone-input'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  centerProfile,
  useUpdateCenterProfile,
} from '@/services/providers/center.provider'
import { FileUploadService } from '@/services/upload.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { updateCenterProfileSchema } from '@zerocancer/shared/schemas/center.schema'
import { Building2, Loader2, MessageCircle, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(updateCenterProfileSchema),
    defaultValues: {
      whatsappNumber: '',
      phone: '',
      address: '',
      logoUrl: '',
      reportFooterText: '',
      brandColor: '',
    },
  })

  useEffect(() => {
    if (!profile) return
    form.reset({
      whatsappNumber: profile.whatsappNumber || profile.phone || '',
      phone: profile.phone || profile.whatsappNumber || '',
      address: profile.address || '',
      logoUrl: profile.logoUrl || '',
      reportFooterText: profile.reportFooterText || '',
      brandColor: profile.brandColor || '',
    })
  }, [profile, form])

  const onSubmit = (values: ProfileFormData) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Center profile updated')
        refetch()
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.error || 'Failed to update center profile',
        )
      },
    })
  }

  const onLogoSelected = async (file: File | undefined) => {
    if (!file || !profile?.id) return
    setUploadingLogo(true)
    try {
      const uploadService = FileUploadService.getInstance()
      const [result] = await uploadService.uploadFiles([file], {
        folder: `center-logos/${profile.id}/logo-${Date.now()}`,
        allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
        maxFileSize: 5,
      })
      if (result.status !== 'completed' || !result.url) {
        throw new Error(result.error || 'Logo upload failed')
      }
      form.setValue('logoUrl', result.url, { shouldDirty: true })
      toast.success('Logo uploaded — save changes to apply it to reports')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Logo upload failed')
    } finally {
      setUploadingLogo(false)
    }
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

  const logoPreview = form.watch('logoUrl')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Center profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage WhatsApp contact details and the branded letterhead used on
          screening reports.
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

                <div className="border-t pt-4">
                  <h3 className="mb-1 flex items-center gap-2 font-semibold">
                    <Palette className="h-4 w-4" />
                    Report branding
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Logo and footer appear on PDF screening reports for this
                    center.
                  </p>

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Letterhead logo</FormLabel>
                        <div className="flex flex-wrap items-center gap-4">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Center logo preview"
                              className="h-16 max-w-[160px] object-contain"
                            />
                          ) : null}
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              disabled={uploadingLogo}
                              onChange={(e) =>
                                onLogoSelected(e.target.files?.[0])
                              }
                            />
                            <Input
                              placeholder="Or paste logo image URL"
                              {...field}
                            />
                          </div>
                        </div>
                        <FormDescription>
                          PNG, JPG, WebP, or SVG. Recommended transparent
                          background.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportFooterText"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Report footer text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g. Ikeja Medical Center — Excellence in community screening"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Shown in the branded footer under the signature.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandColor"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Brand accent color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Input
                              type="color"
                              className="h-10 w-14 cursor-pointer p-1"
                              value={
                                /^#[0-9A-Fa-f]{6}$/.test(field.value || '')
                                  ? field.value
                                  : '#1f5b8c'
                              }
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                            <Input
                              placeholder="#1f5b8c"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Used for letterhead and footer rules on the report.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updateMutation.isPending || uploadingLogo}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-medium">
                  {profile.whatsappNumber || profile.phone || 'Not set'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Only the center admin account can update contact and branding.
                </p>
              </div>
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt="Center logo"
                  className="h-16 max-w-[160px] object-contain"
                />
              ) : null}
              {profile.reportFooterText ? (
                <p className="text-sm">{profile.reportFooterText}</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
