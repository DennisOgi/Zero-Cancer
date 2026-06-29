import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
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
import PhoneInputComponent from '@/components/shared/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  useAuthUser,
  useUpdatePatientProfile,
} from '@/services/providers/auth.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import statesData from '@zerocancer/shared/constants/states.json'
import { updatePatientProfileSchema } from '@zerocancer/shared/schemas/register.schema'
import { format } from 'date-fns'
import { Loader2, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type ProfileFormData = z.infer<typeof updatePatientProfileSchema>

export function PatientProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [localGovernments, setLocalGovernments] = useState<
    Array<{ name: string; id: number }>
  >([])

  const { data: authData, isLoading } = useQuery(useAuthUser())
  const updateMutation = useUpdatePatientProfile()
  const user = authData?.data?.user

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(updatePatientProfileSchema),
    defaultValues: {
      phone: '',
      state: '',
      localGovernment: '',
    },
  })

  useEffect(() => {
    if (!user) return
    form.reset({
      phone: user.phone || '',
      state: user.state || '',
      localGovernment: user.localGovernment || '',
    })
    if (user.state) {
      const stateData = statesData.find((item) => item.state.name === user.state)
      setLocalGovernments(stateData?.state.locals || [])
    }
  }, [user, form])

  const handleStateChange = (stateName: string) => {
    form.setValue('state', stateName)
    form.setValue('localGovernment', '')
    const stateData = statesData.find((item) => item.state.name === stateName)
    setLocalGovernments(stateData?.state.locals || [])
  }

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Profile updated successfully')
        setIsEditing(false)
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || 'Failed to update profile')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Unable to load profile. Please log in again.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          View and update your account details.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {user.photoUrl && (
            <div className="flex items-center gap-4 pb-4 border-b">
              <img
                src={user.photoUrl}
                alt={user.fullName}
                className="h-20 w-20 rounded-full object-cover border"
              />
              <div>
                <p className="text-sm text-muted-foreground">Profile Photo</p>
                <p className="font-medium">{user.fullName}</p>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{user.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">
                {user.gender?.toLowerCase() || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">
                {user.dateOfBirth
                  ? format(new Date(user.dateOfBirth), 'dd MMM yyyy')
                  : 'Not set'}
              </p>
            </div>
          </div>

          {isEditing ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 pt-4 border-t"
              >
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone / WhatsApp</FormLabel>
                      <FormControl>
                        <PhoneInputComponent
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handleStateChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statesData.map((item) => (
                            <SelectItem
                              key={item.state.id}
                              value={item.state.name}
                            >
                              {item.state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="localGovernment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Government</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!form.watch('state')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select LGA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {localGovernments.map((lga) => (
                            <SelectItem key={lga.id} value={lga.name}>
                              {lga.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      form.reset({
                        phone: user.phone || '',
                        state: user.state || '',
                        localGovernment: user.localGovernment || '',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">State</p>
                <p className="font-medium">{user.state || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Local Government
                </p>
                <p className="font-medium">
                  {user.localGovernment || 'Not set'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
