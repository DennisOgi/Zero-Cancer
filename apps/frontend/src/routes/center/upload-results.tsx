import { CenterUploadResultsPage } from '@/components/CenterPages/CenterUploadResults.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/upload-results')({
  component: CenterUploadResultsPage,
})
