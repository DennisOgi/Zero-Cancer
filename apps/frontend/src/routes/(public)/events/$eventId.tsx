import { EventDetailPage } from '@/components/Events/EventDetail.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/events/$eventId')({
  component: EventDetailRoute,
})

function EventDetailRoute() {
  const { eventId } = Route.useParams()
  return <EventDetailPage eventId={eventId} />
}
