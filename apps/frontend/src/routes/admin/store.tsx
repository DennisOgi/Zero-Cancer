import { AdminStorePage } from '@/components/AdminPage/Store/AdminStore.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/store')({
  component: AdminStorePage,
})
