import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  fetchPatientScreeningReport,
  fetchPatientScreeningReports,
} from '@/services/screening-report.service'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FileText, Loader2, Printer } from 'lucide-react'
import { useRef } from 'react'

export function PatientReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['patientScreeningReports'],
    queryFn: fetchPatientScreeningReports,
  })

  const reports = data?.data?.reports || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Screening Reports</h1>
        <p className="text-muted-foreground mt-1">
          View reports sent by your screening center after completed appointments.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reports yet. Reports appear here after your center completes your
            screening and sends your results.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report: any) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>
                      {new Date(report.createdAt).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      report.resultOutcome === 'POSITIVE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {report.resultOutcome}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {report.resultText}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/patient/reports/$reportId" params={{ reportId: report.id }}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function PatientReportDetailPage({ reportId }: { reportId: string }) {
  const previewRef = useRef<HTMLIFrameElement>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['patientScreeningReport', reportId],
    queryFn: () => fetchPatientScreeningReport(reportId),
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
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Report not found or you do not have access to view it.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/patient/reports">← Back to reports</Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          {center ? (
            <p className="text-muted-foreground mt-1">
              From {center.centerName}
              {center.whatsappNumber
                ? ` · WhatsApp: ${center.whatsappNumber}`
                : ''}
            </p>
          ) : null}
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
            title="Screening report"
            srcDoc={html}
            className="min-h-[800px] w-full rounded-xl border-0 bg-white"
          />
        </CardContent>
      </Card>
    </div>
  )
}
