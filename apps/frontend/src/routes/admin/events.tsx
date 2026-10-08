import { AdminEventsPage } from '@/components/AdminPage/Events/AdminEvents.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/events')({
  component: AdminEventsPage,
})
