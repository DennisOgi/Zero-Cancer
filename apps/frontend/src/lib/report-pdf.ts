import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function generatePdfBlobFromHtml(html: string): Promise<Blob> {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-10000px'
  iframe.style.top = '0'
  iframe.style.width = '794px'
  iframe.style.height = '1123px'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  try {
    const doc = iframe.contentDocument
    if (!doc) throw new Error('Could not initialize PDF preview')

    doc.open()
    doc.write(html)
    doc.close()

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve()
      setTimeout(resolve, 300)
    })

    const canvas = await html2canvas(doc.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let offsetY = 0
    pdf.addImage(imgData, 'PNG', 0, offsetY, imgWidth, imgHeight)
    offsetY += pageHeight

    while (offsetY < imgHeight) {
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -offsetY, imgWidth, imgHeight)
      offsetY += pageHeight
    }

    return pdf.output('blob')
  } finally {
    document.body.removeChild(iframe)
  }
}

export async function uploadReportPdfBlob(
  blob: Blob,
  reportId: string,
): Promise<{ secure_url: string; public_id: string }> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary upload is not configured')
  }

  const file = new File([blob], `screening-report-${reportId}.pdf`, {
    type: 'application/pdf',
  })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('public_id', `screening-reports/${reportId}`)

  // PDFs upload as image/auto on Cloudinary (not raw) with a standard unsigned preset
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData },
  )

  if (!response.ok) {
    let detail = ''
    try {
      const err = await response.json()
      detail = err?.error?.message ? `: ${err.error.message}` : ''
    } catch {
      /* ignore */
    }
    throw new Error(`Failed to upload report PDF${detail}`)
  }

  return response.json()
}
