import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { useDonorRegistration } from '@/services/providers/register.provider'
import { donorSchema } from '@zerocancer/shared/schemas/register.schema'
import * as RPNInput from 'react-phone-number-input'
import { toast } from 'sonner'

type FormData = z.infer<typeof donorSchema>

type DonorFormProps = {
  onSubmitSuccess: (data: FormData) => void
}

export default function DonorForm({ onSubmitSuccess }: DonorFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      organization: '',
    },
  })

  const mutation = useDonorRegistration()

  function onSubmit(values: FormData) {
    mutation.mutate(values, {
      onSuccess: (data) => {
        onSubmitSuccess(values)
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
        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Your Company LLC" {...field} />
              </FormControl>
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
