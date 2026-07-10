import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024 // 10MB unsigned upload limit

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
      setTimeout(resolve, 400)
    })

    // Wait for letterhead images (center logo) so they render before capture
    const images = Array.from(doc.images)
    await Promise.all(
      images.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(resolve, 1500)
              }),
      ),
    )

    // scale 1.5 + JPEG keeps typical reports well under Cloudinary's 10MB limit
    const canvas = await html2canvas(doc.body, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const pageWidth = 595.28 // A4 width in pt
    const pageHeight = 841.89
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const qualities = [0.82, 0.7, 0.58, 0.48]
    let blob: Blob | null = null

    for (const quality of qualities) {
      const imgData = canvas.toDataURL('image/jpeg', quality)
      const attempt = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true,
      })

      let offsetY = 0
      attempt.addImage(imgData, 'JPEG', 0, offsetY, imgWidth, imgHeight)
      offsetY += pageHeight

      while (offsetY < imgHeight) {
        attempt.addPage()
        attempt.addImage(imgData, 'JPEG', 0, -offsetY, imgWidth, imgHeight)
        offsetY += pageHeight
      }

      const candidate = attempt.output('blob')
      blob = candidate
      if (candidate.size <= CLOUDINARY_MAX_BYTES - 50_000) break
    }

    if (!blob) throw new Error('Could not generate PDF')
    return blob
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

  if (blob.size > CLOUDINARY_MAX_BYTES) {
    throw new Error(
      `Report PDF is too large to upload (${Math.round(blob.size / 1024 / 1024)}MB). Try again or contact support.`,
    )
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
