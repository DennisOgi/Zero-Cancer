import { Calendar, CheckCircle, XCircle } from 'lucide-react'

interface VerificationResult {
  valid: boolean
  appointmentId?: string
  message?: string
}

interface CenterVerifyCodeResultProps {
  verificationResult: VerificationResult | null
}

export function CenterVerifyCodeResult({ verificationResult }: CenterVerifyCodeResultProps) {
  if (!verificationResult) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {/* Placeholder icon can be customized by parent if needed */}
        <svg className="h-12 w-12 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M16 8a6 6 0 0 0-8 0"></path><line x1="8.5" y1="12" x2="8.5" y2="12"></line><line x1="15.5" y1="12" x2="15.5" y2="12"></line></svg>
        <p>Enter a check-in code to see verification results</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center gap-3 p-4 rounded-lg ${
          verificationResult.valid
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        {verificationResult.valid ? (
          <CheckCircle className="h-6 w-6 text-green-600" />
        ) : (
          <XCircle className="h-6 w-6 text-red-600" />
        )}
        <div>
          <h3 className="font-semibold">
            {verificationResult.valid ? 'Verification Successful' : 'Verification Failed'}
          </h3>
          <p className="text-sm">
            {verificationResult.message || (verificationResult.valid ? 'Check-in code is valid' : 'Check-in code is invalid')}
          </p>
        </div>
      </div>

      {verificationResult.valid && verificationResult.appointmentId && (
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-gray-900">Appointment Details</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Appointment ID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{verificationResult.appointmentId}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
