import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { useVerifyCheckInCode } from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifyCheckInCodeSchema } from '@zerocancer/shared/schemas/appointment.schema'
import { AlertCircle, QrCode, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { CenterVerifyCodeForm } from './CenterVerifyCodeForm'
import { CenterVerifyCodeResult } from './CenterVerifyCodeResult'

type FormData = z.infer<typeof verifyCheckInCodeSchema>

interface CenterVerifyCodePageProps {
  codeFromUrl?: string
}

export function CenterVerifyCodePage({
  codeFromUrl = '',
}: CenterVerifyCodePageProps) {
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean
    appointmentId?: string
    message?: string
  } | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(verifyCheckInCodeSchema),
    defaultValues: {
      checkInCode: codeFromUrl,
    },
  })

  // Submit form on mount if verification code exist
  useEffect(() => {
    if (codeFromUrl) form.handleSubmit(onSubmit)()
  }, [codeFromUrl])

  const verifyMutation = useVerifyCheckInCode()

  const onSubmit = (values: FormData) => {
    setVerificationResult(null)

    verifyMutation.mutate(values, {
      onSuccess: (response) => {
        const result = response.data
        setVerificationResult(result)

        if (result.valid) {
          toast.success(result.message || 'Check-in verified successfully!')
          form.reset() // Clear the form on successful verification
        } else {
          toast.error(result.message || 'Invalid check-in code')
        }
      },
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.error || 'Failed to verify check-in code'
        toast.error(errorMessage)
        setVerificationResult({
          valid: false,
          message: errorMessage,
        })
      },
    })
  }

  const handleClearResult = () => {
    setVerificationResult(null)
    form.reset()
  }

  const isLoading = verifyMutation.status === 'pending'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Verify Patient Check-in</h1>
        <p className="text-muted-foreground">
          Enter a patient's check-in code to verify their appointment and update
          their status.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Verification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Enter Check-in Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CenterVerifyCodeForm
              form={form}
              isLoading={isLoading}
              onSubmit={onSubmit}
              onClear={handleClearResult}
              showClear={Boolean(verificationResult || form.getValues().checkInCode)}
            />
          </CardContent>
        </Card>

        {/* Verification Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Verification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CenterVerifyCodeResult verificationResult={verificationResult} />
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            How to Use Check-in Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-medium">Patient Provides Code</h4>
              <p className="text-sm text-muted-foreground">
                Ask the patient for their 6-8 digit check-in code from their
                appointment confirmation
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-green-600">2</span>
              </div>
              <h4 className="font-medium">Enter & Verify</h4>
              <p className="text-sm text-muted-foreground">
                Type the code into the form above and click "Verify Code" to
                validate
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-medium">Update Status</h4>
              <p className="text-sm text-muted-foreground">
                If valid, the appointment status will be automatically updated
                to "In Progress"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
