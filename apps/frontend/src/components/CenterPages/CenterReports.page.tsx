import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { Textarea } from '@/components/shared/ui/textarea'
import {
  createScreeningReport,
  fetchEligibleReportAppointments,
  fetchReportStaff,
  fetchReportTaxonomy,
  fetchReportTemplate,
  saveScreeningReportPdf,
} from '@/services/screening-report.service'
import { generatePdfBlobFromHtml, uploadReportPdfBlob } from '@/lib/report-pdf'
import {
  buildScreeningReportWhatsAppMessage,
  openWhatsAppShare,
} from '@/lib/whatsapp-link'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileText, Loader2, MessageCircle, Printer, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'

type TaxonomyCategory = {
  id: string
  label: string
  active: boolean
  tests: Array<{
    id: string
    label: string
    active: boolean
    subTests?: Array<{ id: string; label: string; active: boolean }>
  }>
}

export default function CenterReportsPage() {
  const previewRef = useRef<HTMLIFrameElement>(null)
  const [categoryId, setCategoryId] = useState('')
  const [testTypeId, setTestTypeId] = useState('')
  const [subTestId, setSubTestId] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [outcome, setOutcome] = useState<'POSITIVE' | 'NEGATIVE' | ''>('')
  const [signedByStaffId, setSignedByStaffId] = useState('')
  const [signedByName, setSignedByName] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [title, setTitle] = useState('')
  const [sampleType, setSampleType] = useState('')
  const [resultText, setResultText] = useState('')
  const [interpretation, setInterpretation] = useState('')
  const [advise, setAdvise] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [remarks, setRemarks] = useState('')
  const [disclaimer, setDisclaimer] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [savedReportId, setSavedReportId] = useState('')
  const [savedAccessToken, setSavedAccessToken] = useState('')
  const [savedPdfUrl, setSavedPdfUrl] = useState('')
  const [savedPatientName, setSavedPatientName] = useState('')
  const [savedPatientPhone, setSavedPatientPhone] = useState('')
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const { data: authData } = useQuery(useAuthUser())
  const centerName = authData?.data?.user?.fullName || 'your screening center'

  const { data: taxonomyData, isLoading: taxonomyLoading, isError: taxonomyError } = useQuery({
    queryKey: ['reportTaxonomy'],
    queryFn: fetchReportTaxonomy,
    retry: 1,
  })

  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    isError: appointmentsError,
    refetch: refetchEligiblePatients,
  } = useQuery({
    queryKey: ['eligibleReportAppointments'],
    queryFn: () => fetchEligibleReportAppointments(),
  })

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedPatientSearch(patientSearch.trim().toLowerCase()),
      200,
    )
    return () => clearTimeout(timer)
  }, [patientSearch])

  useEffect(() => {
    setTestTypeId('')
    setSubTestId('')
    setPatientId('')
    setAppointmentId('')
  }, [categoryId])

  useEffect(() => {
    setSubTestId('')
    setPatientId('')
    setAppointmentId('')
  }, [testTypeId])

  const { data: staffData } = useQuery({
    queryKey: ['reportStaff'],
    queryFn: fetchReportStaff,
  })

  const taxonomy = (taxonomyData?.data?.taxonomy || []) as TaxonomyCategory[]
  const selectedCategory = taxonomy.find((item) => item.id === categoryId)
  const selectedTest = selectedCategory?.tests.find((item) => item.id === testTypeId)
  const allEligiblePatients =
    appointmentsData?.data?.patients ||
    appointmentsData?.data?.appointments ||
    []
  const eligiblePatients = useMemo(() => {
    if (!debouncedPatientSearch) return allEligiblePatients
    return allEligiblePatients.filter((row: any) => {
      const name = String(
        row.patientName || row.patient?.fullName || '',
      ).toLowerCase()
      const phone = String(row.phone || row.patient?.phone || '').toLowerCase()
      return (
        name.includes(debouncedPatientSearch) ||
        phone.includes(debouncedPatientSearch)
      )
    })
  }, [allEligiblePatients, debouncedPatientSearch])
  const staff = staffData?.data?.staff || []

  const selectedPatient = useMemo(
    () =>
      eligiblePatients.find(
        (item: any) =>
          (item.patientId || item.patient?.id) === patientId ||
          (item.appointmentId || item.id) === appointmentId,
      ),
    [eligiblePatients, patientId, appointmentId],
  )
  const selectedPatientName =
    selectedPatient?.patientName || selectedPatient?.patient?.fullName
  const selectedPatientPhone =
    selectedPatient?.phone || selectedPatient?.patient?.phone

  const handleSelectPatient = (value: string) => {
    const row = eligiblePatients.find(
      (item: any) =>
        (item.patientId || item.patient?.id || item.appointmentId || item.id) ===
        value,
    )
    setPatientId(row?.patientId || row?.patient?.id || value)
    setAppointmentId(row?.appointmentId || '')
  }

  const canLoadTemplate =
    categoryId && testTypeId && outcome && (!selectedTest?.subTests?.length || subTestId)

  useEffect(() => {
    if (!canLoadTemplate) return

    fetchReportTemplate({
      category: categoryId,
      testType: testTypeId,
      subTest: subTestId || undefined,
      outcome: outcome as 'POSITIVE' | 'NEGATIVE',
    })
      .then((response) => {
        const template = response.data.template
        setTitle(template.title)
        setSampleType(template.sampleType)
        setResultText(template.resultText)
        setInterpretation(template.interpretation)
        setAdvise(template.advise)
        setRemarks(template.remarks)
        setDisclaimer(template.disclaimer)
      })
      .catch(() => toast.error('Could not load report template for this selection'))
  }, [canLoadTemplate, categoryId, testTypeId, subTestId, outcome])

  const createMutation = useMutation({
    mutationFn: createScreeningReport,
    onSuccess: (response) => {
      setSavedReportId(response.data.report.id)
      setSavedAccessToken(response.data.report.accessToken || '')
      setPreviewHtml(response.data.html)
      setSavedPdfUrl('')
      setSavedPatientName(selectedPatientName || '')
      setSavedPatientPhone(selectedPatientPhone || '')
      toast.success('Report saved successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to save report')
    },
  })

  const ensurePdfUploaded = async (reportId: string, html: string) => {
    if (savedPdfUrl) return savedPdfUrl

    let blob: Blob
    try {
      blob = await generatePdfBlobFromHtml(html)
    } catch {
      throw new Error('Could not generate PDF from report preview')
    }

    let uploaded: { secure_url: string; public_id: string }
    try {
      uploaded = await uploadReportPdfBlob(blob, reportId)
    } catch {
      throw new Error(
        'Could not upload PDF. Check Cloudinary config and ensure the upload preset allows raw/PDF files.',
      )
    }

    await saveScreeningReportPdf(reportId, {
      pdfUrl: uploaded.secure_url,
      pdfCloudinaryId: uploaded.public_id,
    })
    setSavedPdfUrl(uploaded.secure_url)
    return uploaded.secure_url
  }

  const whatsappPatientName = savedPatientName || selectedPatientName
  const whatsappPatientPhone = savedPatientPhone || selectedPatientPhone

  const handleOpenWhatsapp = async () => {
    if (!savedReportId || !previewHtml) {
      toast.error('Save the report before sharing on WhatsApp')
      return
    }

    if (!whatsappPatientPhone) {
      toast.error('Patient has no WhatsApp number on file')
      return
    }

    setIsPublishing(true)
    let pdfUrl = savedPdfUrl
    try {
      pdfUrl = await ensurePdfUploaded(savedReportId, previewHtml)
    } catch (error: any) {
      toast.warning(
        error?.message ||
          'PDF upload failed — sharing report with online view link only.',
      )
    }

    const appOrigin = window.location.origin
    const publicReportLink = savedAccessToken
      ? `${appOrigin}/reports/view/${savedAccessToken}`
      : `${appOrigin}/patient/reports/${savedReportId}`

    const message = buildScreeningReportWhatsAppMessage({
      patientName: whatsappPatientName || 'there',
      centerName,
      resultText,
      pdfLink: pdfUrl || undefined,
      publicReportLink,
    })

    const opened = openWhatsAppShare(whatsappPatientPhone, message)
    setIsPublishing(false)

    if (!opened) {
      toast.error(
        'Invalid patient WhatsApp number. Use international format e.g. +2348000000000',
      )
      return
    }

    toast.success('WhatsApp opened — tap Send to deliver the report to the patient')
  }

  const handleDownloadPdf = async () => {
    if (!savedReportId || !previewHtml) {
      toast.error('Save the report before downloading the PDF')
      return
    }

    setIsDownloadingPdf(true)
    try {
      const pdfUrl = await ensurePdfUploaded(savedReportId, previewHtml)
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `screening-report-${savedReportId}.pdf`
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('PDF ready — download started')
    } catch (error: any) {
      toast.error(error?.message || 'Could not generate or upload PDF')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleSave = () => {
    if (!categoryId || !testTypeId) {
      toast.error('Select screening category and test')
      return
    }

    if (selectedTest?.subTests?.length && !subTestId) {
      toast.error('Select a sub-test (e.g. Oncoproteins)')
      return
    }

    if (!patientId || !outcome) {
      toast.error('Select a patient and result outcome')
      return
    }

    if (!signedByName.trim()) {
      toast.error('Enter the name of the person who performed the test')
      return
    }

    createMutation.mutate({
      patientId,
      appointmentId: appointmentId || undefined,
      reportCategory: categoryId as any,
      reportTestType: testTypeId as any,
      reportSubTest: subTestId ? (subTestId as any) : undefined,
      resultOutcome: outcome as any,
      title,
      sampleType,
      resultText,
      interpretation,
      advise,
      conclusion,
      remarks,
      disclaimer,
      signedByStaffId: signedByStaffId || undefined,
      signedByName: signedByName.trim(),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Screening Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Create structured Mobilab HPV reports for patients at your center.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Report setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {taxonomyLoading ? (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading report types...
              </div>
            ) : taxonomyError || taxonomy.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Could not load report categories. Make sure you are logged in as a
                center and the backend is running, then refresh the page.
              </div>
            ) : (
              <>
                <div>
                  <Label>Screening category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxonomy.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id}
                          disabled={!category.active}
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Screening test</Label>
                  <Select
                    value={testTypeId}
                    onValueChange={setTestTypeId}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select test" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedCategory?.tests || []).map((test) => (
                        <SelectItem key={test.id} value={test.id} disabled={!test.active}>
                          {test.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTest?.subTests?.length ? (
                  <div>
                    <Label>Sub-test</Label>
                    <Select value={subTestId} onValueChange={setSubTestId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select sub-test" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTest.subTests.map((subTest) => (
                          <SelectItem
                            key={subTest.id}
                            value={subTest.id}
                            disabled={!subTest.active}
                          >
                            {subTest.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div>
                  <Label htmlFor="patient-search">Search patient</Label>
                  <Input
                    id="patient-search"
                    className="mt-1"
                    placeholder="Filter by name or phone..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value)
                      setPatientId('')
                      setAppointmentId('')
                    }}
                  />
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <Link to="/center/register-patient">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Register / enroll patient
                      </Link>
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Shows patients assigned to your center or with visits here.
                  </p>
                </div>

                <div>
                  <Label>Patient name</Label>
                  <Select
                    value={patientId}
                    onValueChange={handleSelectPatient}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading patients...
                        </SelectItem>
                      ) : appointmentsError ? (
                        <SelectItem value="error" disabled>
                          Failed to load patients — refresh and try again
                        </SelectItem>
                      ) : eligiblePatients.length === 0 ? (
                        <SelectItem value="none" disabled>
                          {debouncedPatientSearch
                            ? 'No matching patients'
                            : 'No patients at your center yet'}
                        </SelectItem>
                      ) : (
                        eligiblePatients.map((row: any) => {
                          const id =
                            row.patientId ||
                            row.patient?.id ||
                            row.appointmentId ||
                            row.id
                          const name =
                            row.patientName ||
                            row.patient?.fullName ||
                            'Patient'
                          const phone = row.phone || row.patient?.phone
                          return (
                            <SelectItem key={id} value={id}>
                              {name}
                              {phone ? ` — ${phone}` : ''}
                            </SelectItem>
                          )
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {appointmentsError ? (
                    <Button
                      type="button"
                      variant="link"
                      className="mt-1 h-auto p-0 text-xs"
                      onClick={() => refetchEligiblePatients()}
                    >
                      Retry loading patients
                    </Button>
                  ) : null}
                  {!appointmentsLoading &&
                  !appointmentsError &&
                  allEligiblePatients.length === 0 ? (
                    <p className="mt-2 text-xs text-amber-700">
                      Register or enroll a patient first, then return here to
                      create their report.
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label>Result</Label>
                  <Select
                    value={outcome}
                    onValueChange={(value) =>
                      setOutcome(value as 'POSITIVE' | 'NEGATIVE')
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEGATIVE">Negative</SelectItem>
                      <SelectItem value="POSITIVE">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="signedByName">Signed by (name) *</Label>
                  <Input
                    id="signedByName"
                    className="mt-1"
                    placeholder="Name of person who performed the test"
                    value={signedByName}
                    onChange={(e) => setSignedByName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Quick pick from staff (optional)</Label>
                  <Select
                    value={signedByStaffId}
                    onValueChange={(value) => {
                      setSignedByStaffId(value)
                      const member = staff.find((item: any) => item.id === value)
                      if (member?.label) setSignedByName(member.label.split(' (')[0])
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPatientName ? (
                <p className="text-sm text-muted-foreground">
                  Patient: <span className="font-medium text-foreground">{selectedPatientName}</span>
                </p>
              ) : null}

              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sampleType">Sample</Label>
                <Input
                  id="sampleType"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="resultText">Result</Label>
                <Input
                  id="resultText"
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="interpretation">Interpretation</Label>
                <Textarea
                  id="interpretation"
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="advise">Advise</Label>
                <Textarea
                  id="advise"
                  value={advise}
                  onChange={(e) => setAdvise(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="conclusion">Conclusion</Label>
                <Textarea
                  id="conclusion"
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="disclaimer">Disclaimer</Label>
                <Textarea
                  id="disclaimer"
                  value={disclaimer}
                  onChange={(e) => setDisclaimer(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSave} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save & Preview'
                  )}
                </Button>
                {savedReportId ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                    >
                      {isDownloadingPdf ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="mr-2 h-4 w-4" />
                      )}
                      Download PDF
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleOpenWhatsapp}
                      disabled={isPublishing}
                    >
                      {isPublishing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="mr-2 h-4 w-4" />
                      )}
                      Open in WhatsApp
                    </Button>
                  </>
                ) : null}
              </div>
              {savedReportId ? (
                <p className="text-xs text-muted-foreground">
                  Opens WhatsApp with a pre-filled message to the patient&apos;s number.
                  You must tap Send in WhatsApp to deliver the report.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {previewHtml ? (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe
                  ref={previewRef}
                  title="Report preview"
                  srcDoc={previewHtml}
                  className="min-h-[720px] w-full rounded-xl border bg-white"
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
