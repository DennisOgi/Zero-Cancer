import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
} from '@/components/shared/ui/card'
import { fetchPublicScreeningReport } from '@/services/screening-report.service'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Printer } from 'lucide-react'
import { useRef } from 'react'

export function PublicReportViewPage({ token }: { token: string }) {
  const previewRef = useRef<HTMLIFrameElement>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['publicScreeningReport', token],
    queryFn: () => fetchPublicScreeningReport(token),
  })

  const html = data?.data?.html || ''
  const report = data?.data?.report
  const center = data?.data?.center

  const handlePrint = () => {
    const iframe = previewRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            This report link is invalid or has expired. Contact your screening
            center if you need a new copy.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">ZeroCancer screening report</p>
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          {center ? (
            <p className="text-muted-foreground mt-1">
              From {center.centerName}
              {center.whatsappNumber ? ` · WhatsApp: ${center.whatsappNumber}` : ''}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {report.pdfUrl ? (
            <Button asChild variant="outline">
              <a href={report.pdfUrl} target="_blank" rel="noreferrer">
                Download PDF
              </a>
            </Button>
          ) : null}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <iframe
            ref={previewRef}
            title="Screening report"
            srcDoc={html}
            className="min-h-[800px] w-full rounded-xl border-0 bg-white"
          />
        </CardContent>
      </Card>
    </div>
  )
}
