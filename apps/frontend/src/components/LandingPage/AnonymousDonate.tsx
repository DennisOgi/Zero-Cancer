import heroImage from '@/assets/images/hero.png'
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
import { useDonateAnonymous } from '@/services/providers/donor.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Checkbox } from '../shared/ui/checkbox'

// This local form schema resolves the type conflicts with react-hook-form
// by using a simple boolean for `wantsReceipt` and handling validation locally.
const formSchema = z
  .object({
    amount: z.number().min(100, 'Minimum donation is ₦100'),
    message: z.string().optional(),
    wantsReceipt: z.boolean(),
    email: z.string().email().optional(),
  })
  .refine(
    (data) => {
      if (data.wantsReceipt && !data.email) {
        return false
      }
      return true
    },
    {
      message: 'Email is required when requesting receipt',
      path: ['email'],
    },
  )

type TFormSchema = z.infer<typeof formSchema>

export default function AnonymousDonate() {
  const donateMutation = useDonateAnonymous()

  const form = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 20000,
      wantsReceipt: false,
      message: '',
    },
  })

  const wantsReceipt = form.watch('wantsReceipt')

  const onSubmit = async (values: TFormSchema) => {
    donateMutation.mutate(values, {
      onSuccess: (data) => {
        if (data?.data?.authorizationUrl) {
          window.location.href = data.data.authorizationUrl
        } else {
          toast.error('Could not initiate payment. Please try again.')
        }
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.error ||
            'An error occurred. Please try again.',
        )
      },
    })
  }

  return (
    <div className="bg-black text-white py-12 md:py-20 wrapper">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Column: Form */}
        <div className="px-4">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Your Donation Can Save a Life
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Your donation can help someone get screened for cancer early —
            before it's too late.
          </p>
          <div className="w-full h-px bg-gray-700 my-8"></div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">
                      Amount (NGN)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 20000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="bg-gray-800 border-gray-700 text-white h-14 text-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wantsReceipt"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-gray-600 data-[state=checked]:bg-pink-600"
                      />
                    </FormControl>
                    <FormLabel className="text-gray-300 font-normal">
                      I want a receipt for my donation
                    </FormLabel>
                  </FormItem>
                )}
              />

              {wantsReceipt && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          {...field}
                          className="bg-gray-800 border-gray-700 text-white h-14 text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white h-14 text-lg font-bold"
                disabled={donateMutation.isPending}
              >
                {donateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Donate Now'
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Column: Image */}
        <div className="hidden md:flex justify-end items-center h-full">
          <img
            src={heroImage}
            alt="A person getting screened for cancer"
            className="rounded-lg object-cover w-9/10 h-full"
          />
        </div>
      </div>
    </div>
  )
}
