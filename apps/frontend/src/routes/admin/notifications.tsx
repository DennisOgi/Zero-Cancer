import { AdminNotificationsPage } from '@/components/AdminPage/Notifications/AdminNotifications.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/notifications')({
  component: AdminNotificationsPage,
})
