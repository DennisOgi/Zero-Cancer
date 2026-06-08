import { fetchScreeningReport } from '@/services/screening-report.service'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2, Printer } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
} from '@/components/shared/ui/card'

function CenterReportPreviewPage() {
  const { reportId } = Route.useParams()
  const previewRef = useRef<HTMLIFrameElement>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['centerScreeningReport', reportId],
    queryFn: () => fetchScreeningReport(reportId),
  })

  const html = data?.data?.html || ''

  const handlePrint = () => {
    const iframe = previewRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data?.data?.report) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Report not found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/center/reports">← Back to reports</Link>
          </Button>
          <h1 className="text-2xl font-bold">{data.data.report.title}</h1>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Download / Print PDF
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <iframe
            ref={previewRef}
            title="Report preview"
            srcDoc={html}
            className="min-h-[800px] w-full rounded-xl border-0 bg-white"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/center/reports_/$reportId/preview')({
  component: CenterReportPreviewPage,
})
