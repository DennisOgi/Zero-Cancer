import { PatientNotificationsPage } from '@/components/PatientPage/Notifications/PatientNotifications.page'
import { useNotifications } from '@/services/providers/notification.provider'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/notifications')({
  component: PatientNotificationsPage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useNotifications())
  },
})
