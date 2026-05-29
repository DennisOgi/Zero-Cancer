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
import { useQuery } from '@tanstack/react-query'
import { allWaitlists } from '@/services/providers/waitlist.provider'
import { useState } from 'react'

// This local form schema resolves the type conflicts with react-hook-form
// by using simple booleans for checkboxes and handling validation locally.
const formSchema = z
  .object({
    amount: z.number().min(100, 'Minimum donation is ₦100'),
    message: z.string().optional(),
    wantsReceipt: z.boolean().default(false),
    monitorDonation: z.boolean().default(false),
    chooseBeneficiary: z.boolean().default(false),
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
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  
  const { data: waitlistResponse, isLoading: isWaitlistLoading } = useQuery(
    allWaitlists({ page: 1, pageSize: 50, demandOrder: 'desc' })
  )

  const donateMutation = useDonateAnonymous()

  const form = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 20000,
      wantsReceipt: false,
      monitorDonation: false,
      chooseBeneficiary: false,
      message: '',
    },
  })

  const wantsReceipt = form.watch('wantsReceipt')
  const monitorDonation = form.watch('monitorDonation')
  const chooseBeneficiary = form.watch('chooseBeneficiary')
  const requiresAccount = monitorDonation || chooseBeneficiary

  const onSubmit = async (values: TFormSchema) => {
    if (requiresAccount) {
      const queryParams = new URLSearchParams({
        amount: String(values.amount),
        monitor: String(values.monitorDonation),
        choose: String(values.chooseBeneficiary),
        ...(values.email ? { email: values.email } : {}),
      }).toString()
      
      toast.info('Redirecting you to create a Donor Account to enable tracking & targeting features...')
      setTimeout(() => {
        window.location.href = `/sign-up/donor?${queryParams}`
      }, 1500)
      return
    }

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
    <div id="donate-section" className="bg-black text-white py-12 md:py-20 wrapper">
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
                    <FormLabel className="text-gray-300 font-normal cursor-pointer">
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

              <FormField
                control={form.control}
                name="monitorDonation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-gray-600 data-[state=checked]:bg-pink-600"
                      />
                    </FormControl>
                    <FormLabel className="text-gray-300 font-normal cursor-pointer">
                      Monitor how my donation is used <span className="text-pink-500 text-xs ml-1">(Requires Donor Account)</span>
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chooseBeneficiary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-gray-600 data-[state=checked]:bg-pink-600"
                      />
                    </FormControl>
                    <FormLabel className="text-gray-300 font-normal cursor-pointer">
                      Choose the beneficiary of my donation <span className="text-pink-500 text-xs ml-1">(Requires Donor Account)</span>
                    </FormLabel>
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white h-14 text-lg font-bold transition-all shadow-lg hover:shadow-pink-600/20"
                  disabled={donateMutation.isPending}
                >
                  {donateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : requiresAccount ? (
                    'Create Donor Account & Donate'
                  ) : (
                    'Donate Now'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsWaitlistOpen(true)}
                    className="text-pink-400 hover:text-pink-350 text-sm font-semibold transition-all hover:underline cursor-pointer"
                  >
                    View Patient Waiting List
                  </button>
                </div>
              </div>
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

      {isWaitlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 text-white">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">Patient Waiting List</h3>
                <p className="text-gray-400 text-sm mt-1">Real-time demand for cancer screenings and vaccinations</p>
              </div>
              <button 
                onClick={() => setIsWaitlistOpen(false)}
                className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-left">
              {isWaitlistLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-650 mb-2" />
                  <p className="text-gray-400 text-sm">Loading active waiting list...</p>
                </div>
              ) : !waitlistResponse?.data?.waitlists || waitlistResponse.data.waitlists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No active waitlist entries found.</p>
                  <p className="text-gray-500 text-sm mt-2">All patients have been successfully matched with sponsors!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl text-sm text-blue-300">
                    💡 <strong>Did you know?</strong> Patients on this list are matched automatically with sponsors once a donation or campaign is created.
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                          <th className="p-4 font-semibold">Service Type</th>
                          <th className="p-4 font-semibold text-right">Patients Waiting</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {waitlistResponse.data.waitlists.map((item: any) => (
                          <tr key={item.screeningTypeId} className="hover:bg-gray-800/30 transition-colors">
                            <td className="p-4 font-medium text-gray-200">{item.screeningType?.name}</td>
                            <td className="p-4 text-right">
                              <span className="bg-pink-900/40 text-pink-400 px-3 py-1 rounded-full text-sm font-semibold border border-pink-500/20">
                                {item.pendingCount}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-800 flex justify-end">
              <Button 
                onClick={() => setIsWaitlistOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 h-11 text-sm font-medium transition-all"
              >
                Close View
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
