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
import { CheckCircle, QrCode, Scan } from 'lucide-react'

interface CenterVerifyCodeFormProps {
  form: any
  isLoading: boolean
  onSubmit: (values: any) => void
  onClear: () => void
  showClear: boolean
}

export function CenterVerifyCodeForm({
  form,
  isLoading,
  onSubmit,
  onClear,
  showClear,
}: CenterVerifyCodeFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="checkInCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Check-in Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter 6-8 digit code..."
                  {...field}
                  disabled={isLoading}
                  className="font-mono text-lg tracking-wider"
                  autoComplete="off"
                  maxLength={20}
                />
              </FormControl>
              <FormDescription>
                The patient should provide this code from their appointment confirmation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Code
              </>
            )}
          </Button>

          {showClear && (
            <Button type="button" variant="outline" onClick={onClear} disabled={isLoading}>
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Future QR Scanner Option */}
      <div className="mt-6 pt-6 border-t">
        <Button variant="outline" disabled className="w-full" title="QR scanning feature coming soon">
          <Scan className="h-4 w-4 mr-2" />
          Scan QR Code (Coming Soon)
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          QR code scanning will be available in a future update
        </p>
      </div>
    </Form>
  )
}
