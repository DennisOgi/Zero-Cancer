import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as RPNInput from 'react-phone-number-input'
import { z } from 'zod'

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
import PhoneInputComponent from '@/components/shared/ui/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import statesData from '@zerocancer/shared/constants/states.json'
import { patientSchema } from '@zerocancer/shared/schemas/register.schema'

import { Calendar as ShadCalendar } from '@/components/shared/ui/calendar'
import { Label as ShadLabel } from '@/components/shared/ui/label'
import {
  Popover as ShadPopover,
  PopoverContent as ShadPopoverContent,
  PopoverTrigger as ShadPopoverTrigger,
} from '@/components/shared/ui/popover'
import { usePatientRegistration } from '@/services/providers/register.provider'
import { ChevronDownIcon } from 'lucide-react'
import { toast } from 'sonner'

type FormData = z.infer<typeof patientSchema>

type PatientFormProps = {
  onSubmitSuccess: (data: FormData) => void
}

export default function PatientForm({ onSubmitSuccess }: PatientFormProps) {
  const [selectedState, setSelectedState] = useState<string>('')
  const [localGovernments, setLocalGovernments] = useState<
    Array<{ name: string; id: number }>
  >([])

  const mutation = usePatientRegistration()

  const formSchema = patientSchema

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      state: '',
      localGovernment: '',
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
    // Ensure dateOfBirth is properly formatted as ISO string
    const formattedValues = {
      ...values,
      dateOfBirth: values.dateOfBirth
        ? new Date(values.dateOfBirth).toISOString()
        : values.dateOfBirth,
    }

    mutation.mutate(formattedValues, {
      onSuccess: (data) => {
        onSubmitSuccess(formattedValues)
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.error ||
            'Registration failed. Please try again.',
          {
            description: error.response?.data?.error || 'An error occurred.',
          },
        )
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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

        {/* Phone, State, Local Government, Gender in a 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <FormField
              control={form.control}
              name="phone"
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
          </div>
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <div>
                    <ShadPopover>
                      <ShadPopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date"
                          className="w-full justify-between font-normal"
                        >
                          {field.value
                            ? new Date(field.value).toLocaleDateString()
                            : 'Select date'}
                          <ChevronDownIcon />
                        </Button>
                      </ShadPopoverTrigger>
                      <ShadPopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <ShadCalendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          captionLayout="dropdown"
                          onSelect={(date: Date | undefined) => {
                            field.onChange(date ? date.toISOString() : '')
                          }}
                        />
                      </ShadPopoverContent>
                    </ShadPopover>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <FormField
              control={form.control}
              name="state"
              render={() => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select
                    onValueChange={handleStateChange}
                    value={selectedState}
                  >
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
          </div>
          <div>
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
          </div>
          <div>
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
