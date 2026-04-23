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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { Textarea } from '@/components/shared/ui/textarea'
import { NIGERIA_STATES_LGAS as nigeriaStates } from '@/data/nigeria-locations'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { UserPlus, CheckCircle2, Send, Copy, Phone, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Referral schema
const referralSchema = z.object({
  patientName: z.string().min(2, 'Patient name must be at least 2 characters'),
  patientPhone: z.string().min(7, 'Please enter a valid phone number'),
  patientEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  referralReason: z.string().min(10, 'Please provide a detailed reason for referral'),
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
  referredTo: z.string().min(1, 'Please select a facility to refer to'),
  state: z.string().min(1, 'Please select a state'),
  lga: z.string().min(1, 'Please select a local government'),
  notes: z.string().optional(),
})

type ReferralFormData = z.infer<typeof referralSchema>

// Mock facilities - in production, this would come from an API
const mockFacilities = [
  { id: '1', name: 'Lagos University Teaching Hospital', type: 'HOSPITAL', state: 'Lagos', lga: 'Lagos Island' },
  { id: '2', name: 'National Hospital Abuja', type: 'HOSPITAL', state: 'FCT', lga: 'Municipal' },
  { id: '3', name: 'University College Hospital Ibadan', type: 'HOSPITAL', state: 'Oyo', lga: 'Ibadan North' },
  { id: '4', name: 'Port Harcourt Specialist Hospital', type: 'HOSPITAL', state: 'Rivers', lga: 'Port Harcourt' },
  { id: '5', name: 'Kano Cancer Treatment Center', type: 'SPECIALIST', state: 'Kano', lga: 'Kano Municipal' },
]

export function CenterReferPatientPage() {
  const navigate = useNavigate()
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedLga, setSelectedLga] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referralSuccess, setReferralSuccess] = useState<{
    patientName: string
    referralCode: string
    facilityName: string
    urgency: string
  } | null>(null)

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      referralReason: '',
      urgency: 'ROUTINE',
      referredTo: '',
      state: '',
      lga: '',
      notes: '',
    },
  })

  const selectedStateData = nigeriaStates.find((s) => s.state === selectedState)
  const filteredFacilities = mockFacilities.filter(
    (f) => (!selectedState || f.state === selectedState) && (!selectedLga || f.lga === selectedLga)
  )

  const onSubmit = async (data: ReferralFormData) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Generate referral code
      const referralCode = `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      
      const facility = mockFacilities.find((f) => f.id === data.referredTo)
      
      setReferralSuccess({
        patientName: data.patientName,
        referralCode,
        facilityName: facility?.name || 'Unknown Facility',
        urgency: data.urgency,
      })
      
      toast.success('Referral created successfully!')
      form.reset()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create referral')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyReferralCode = () => {
    if (referralSuccess) {
      navigator.clipboard.writeText(referralSuccess.referralCode)
      toast.success('Referral code copied to clipboard!')
    }
  }

  const printReferral = () => {
    window.print()
  }

  if (referralSuccess) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReferralSuccess(null)}
          >
            ← Create Another Referral
          </Button>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-900">
                Referral Created Successfully!
              </CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Patient has been referred to the selected facility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-200 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Patient Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {referralSuccess.patientName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Referral Code</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-mono font-bold text-blue-600">
                    {referralSuccess.referralCode}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyReferralCode}
                    className="h-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Share this code with the patient and receiving facility
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Referred To
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {referralSuccess.facilityName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Urgency Level</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    referralSuccess.urgency === 'EMERGENCY'
                      ? 'bg-red-100 text-red-800'
                      : referralSuccess.urgency === 'URGENT'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {referralSuccess.urgency}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-medium mb-2">
                Next Steps:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Share the referral code with the patient</li>
                <li>• Patient should present the code at the receiving facility</li>
                <li>• Receiving facility will access patient records using the code</li>
                <li>• Follow up with patient within 48 hours</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={copyReferralCode}
                variant="outline"
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </Button>
              <Button
                onClick={printReferral}
                variant="outline"
                className="flex-1"
              >
                Print Referral
              </Button>
              <Button
                onClick={() => setReferralSuccess(null)}
                className="flex-1"
              >
                <Send className="mr-2 h-4 w-4" />
                New Referral
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Refer Patient</h1>
        <p className="text-muted-foreground mt-2">
          Refer a patient to another facility for specialized care or treatment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Referral Information
          </CardTitle>
          <CardDescription>
            Complete the form below to create a patient referral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Patient Information</h3>

                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="+234 800 000 0000"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Referral Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Referral Details</h3>

                <FormField
                  control={form.control}
                  name="referralReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Referral *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the medical reason for this referral..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide detailed information about why the patient needs referral
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ROUTINE">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              <span>Routine - Within 2 weeks</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="URGENT">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-orange-500 rounded-full" />
                              <span>Urgent - Within 48 hours</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="EMERGENCY">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-red-500 rounded-full" />
                              <span>Emergency - Immediate attention</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Receiving Facility */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Receiving Facility</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedState(value)
                            setSelectedLga('')
                            form.setValue('lga', '')
                            form.setValue('referredTo', '')
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nigeriaStates.map((state) => (
                              <SelectItem key={state.state} value={state.state}>
                                {state.state}
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
                    name="lga"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local Government *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedLga(value)
                            form.setValue('referredTo', '')
                          }}
                          value={field.value}
                          disabled={!selectedState}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select LGA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedStateData?.lgas.map((lga) => (
                              <SelectItem key={lga} value={lga}>
                                {lga}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select state first
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="referredTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedState || !selectedLga}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredFacilities.length > 0 ? (
                            filteredFacilities.map((facility) => (
                              <SelectItem key={facility.id} value={facility.id}>
                                <div>
                                  <div className="font-medium">{facility.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {facility.type} • {facility.lga}, {facility.state}
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              No facilities found in selected location
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select state and LGA first to see available facilities
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  📋 Referral Process:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• A unique referral code will be generated</li>
                  <li>• Share the code with the patient and receiving facility</li>
                  <li>• Patient presents the code at the receiving facility</li>
                  <li>• Receiving facility accesses patient records using the code</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/center' })}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Referral...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Create Referral
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
