import CenterDetailPage from '@/components/CenterPages/CenterDetail.page'
import { centerById } from '@/services/providers/center.provider'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/centers/$centerId')({
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(centerById(params.centerId))
  },
  component: CenterDetailPage,
})
