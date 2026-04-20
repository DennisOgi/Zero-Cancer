import { AdminCentersPage } from '@/components/AdminPage/Centers/AdminCenters.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/centers')({
  component: AdminCentersPage,
})
