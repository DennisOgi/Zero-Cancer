import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/shared/ui/button'
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
import PasswordInput from '@/components/shared/ui/password-input'
import PhoneInputComponent from '@/components/shared/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { useCenterRegistration } from '@/services/providers/register.provider'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import statesData from '@zerocancer/shared/constants/states.json'
import { centerSchema } from '@zerocancer/shared/schemas/register.schema'
import * as RPNInput from 'react-phone-number-input'
import { toast } from 'sonner'

type FormData = z.infer<typeof centerSchema>

type ScreeningCenterFormProps = {
  onSubmitSuccess: (data: FormData) => void
}

export default function ScreeningCenterForm({
  onSubmitSuccess,
}: ScreeningCenterFormProps) {
  const mutation = useCenterRegistration()
  const [selectedState, setSelectedState] = useState<string>('')
  const [localGovernments, setLocalGovernments] = useState<
    Array<{ name: string; id: number }>
  >([])
  const navigate = useNavigate()

  // Fetch available screening types from the backend
  const { data: screeningTypesResponse, isLoading: isLoadingScreeningTypes } =
    useQuery(useAllScreeningTypes())

  const form = useForm<FormData>({
    resolver: zodResolver(centerSchema),
    defaultValues: {
      centerName: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      state: '',
      localGovernment: '',
      services: [],
    },
  })

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName)
    form.setValue('state', stateName)
    form.setValue('localGovernment', '') // Reset local government when state changes

    // Find the selected state and get its local governments
    const selectedStateData = statesData.find(
      (item) => item.state.name === stateName,
    )
    if (selectedStateData) {
      setLocalGovernments(selectedStateData.state.locals)
    } else {
      setLocalGovernments([])
    }
  }

  function onSubmit(values: FormData) {
    console.log('Screening Center form submitted:', values)
    mutation.mutate(values, {
      onSuccess: (data) => {
        console.log('Registration successful:', data)
        onSubmitSuccess(values)
        toast.success('Registration successful! Redirecting to login...')
        setTimeout(() => {
          navigate({ to: '/login', replace: true })
        }, 1500)
      },
      onError: (error) => {
        console.error('Registration failed:', error)
        // Display error message to the use. Use intuitive messages
        toast.error(
          // 'Registration failed. Please check your details and try again.',
          error.response?.data?.error ||
            'Registration failed. Please try again.',
          {
            description: error.response?.data?.error || 'An error occurred.',
          },
        )
      },
    })
  }

  // Get screening types for the services selection
  const screeningTypes = screeningTypesResponse?.data || []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="centerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Center Name</FormLabel>
              <FormControl>
                <Input placeholder="Hope Medical Center" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="contact@hopemedical.com"
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

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <PhoneInputComponent
                  value={field.value as RPNInput.Value}
                  onChange={field.onChange}
                />
              </FormControl>
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
                <Input placeholder="123 Healthway, Ikeja" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services Offered</FormLabel>
              <FormDescription>
                Select all services offered at your center.
              </FormDescription>
              {isLoadingScreeningTypes ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  {screeningTypes.map((screeningType) => (
                    <Button
                      type="button"
                      key={screeningType.id}
                      variant={
                        field.value.includes(screeningType.id)
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() => {
                        const currentServices = field.value
                        const newServices = currentServices.includes(
                          screeningType.id,
                        )
                          ? currentServices.filter(
                              (s) => s !== screeningType.id,
                            )
                          : [...currentServices, screeningType.id]
                        field.onChange(newServices)
                      }}
                    >
                      {screeningType.name}
                    </Button>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="state"
          render={() => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <Select onValueChange={handleStateChange} value={selectedState}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statesData.map((item) => (
                    <SelectItem key={item.state.id} value={item.state.name}>
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
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedState}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedState
                          ? 'Select a local government'
                          : 'Select a state first'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {localGovernments.map((local) => (
                    <SelectItem key={local.id} value={local.name}>
                      {local.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full flex items-center justify-center gap-2"
          disabled={mutation.isPending}
        >
          {mutation.isPending && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          )}
          Create Account
        </Button>
      </form>
    </Form>
  )
}
