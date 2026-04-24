import { CenterNotificationsPage } from '@/components/CenterPages/CenterNotifications.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/notifications')({
  component: CenterNotificationsPage,
})
