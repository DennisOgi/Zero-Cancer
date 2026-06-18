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
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { NIGERIA_STATES_LGAS, getLGAsForState } from '@/data/nigeria-locations'
import {
  aggregateWaitlistByCancerCategory,
  CANCER_TYPE_OPTIONS,
  type CancerTypeKey,
  waitlistCategoryBadgeStyles,
} from '@/lib/waitlist-cancer-types'
import { allWaitlists } from '@/services/providers/waitlist.provider'

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
  const [waitlistState, setWaitlistState] = useState('')
  const [waitlistLga, setWaitlistLga] = useState('')
  const [waitlistCancerType, setWaitlistCancerType] =
    useState<CancerTypeKey>('cervical')
  const [waitlistLgas, setWaitlistLgas] = useState<string[]>([])

  const { data: waitlistResponse, isLoading: isWaitlistLoading } = useQuery(
    allWaitlists({
      page: 1,
      pageSize: 100,
      demandOrder: 'desc',
      state: waitlistState || undefined,
      lga: waitlistLga || undefined,
    }),
  )

  const waitlistRows = useMemo(
    () =>
      aggregateWaitlistByCancerCategory(
        waitlistResponse?.data?.waitlists || [],
        waitlistCancerType,
      ),
    [waitlistResponse?.data?.waitlists, waitlistCancerType],
  )

  const totalPatientsWaiting = useMemo(
    () => waitlistRows.reduce((sum, row) => sum + row.patientsWaiting, 0),
    [waitlistRows],
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
            <div className="p-6 border-b border-gray-800 flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-white">Patient Waiting List</h3>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-gray-400 text-sm">
                    Real time demands for cancer prevention and treatment
                  </p>
                  <Select
                    value={waitlistCancerType}
                    onValueChange={(value) =>
                      setWaitlistCancerType(value as CancerTypeKey)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 text-white shrink-0">
                      <SelectValue placeholder="Type of cancer" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANCER_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <button 
                onClick={() => setIsWaitlistOpen(false)}
                className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-all cursor-pointer shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-left">
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    State
                  </label>
                  <Select
                    value={waitlistState}
                    onValueChange={(value) => {
                      setWaitlistState(value)
                      setWaitlistLga('')
                      setWaitlistLgas(getLGAsForState(value))
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIA_STATES_LGAS.map((location) => (
                        <SelectItem key={location.state} value={location.state}>
                          {location.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    LGA
                  </label>
                  <Select
                    value={waitlistLga}
                    onValueChange={setWaitlistLga}
                    disabled={!waitlistState}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="All LGAs" />
                    </SelectTrigger>
                    <SelectContent>
                      {waitlistLgas.map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isWaitlistLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-650 mb-2" />
                  <p className="text-gray-400 text-sm">Loading active waiting list...</p>
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
                          <th className="p-4 font-semibold">Type of Cancer</th>
                          <th className="p-4 font-semibold">Category</th>
                          <th className="p-4 font-semibold text-right">Patients Waiting</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {waitlistRows.map((row) => (
                          <tr
                            key={row.category}
                            className="hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="p-4 font-medium text-gray-200">
                              {row.cancerTypeLabel}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${waitlistCategoryBadgeStyles[row.category]}`}
                              >
                                {row.category}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="bg-pink-900/40 text-pink-400 px-3 py-1 rounded-full text-sm font-semibold border border-pink-500/20">
                                {row.patientsWaiting}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPatientsWaiting === 0 && (
                    <p className="text-center text-sm text-gray-500">
                      No patients are currently waiting for{' '}
                      {waitlistRows[0]?.cancerTypeLabel.toLowerCase()} services
                      in the selected area.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex flex-col gap-3 border-t border-gray-800 p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-400">
                Donors{' '}
                <Link
                  to="/sign-up/donor"
                  className="font-medium text-pink-400 underline"
                >
                  sign up
                </Link>{' '}
                to fund individual patients or groups.
              </p>
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
