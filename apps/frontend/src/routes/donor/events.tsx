import { EventWorkspace } from '@/components/Events/EventWorkspace'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/donor/events')({
  component: DonorEventsRoute,
})

function DonorEventsRoute() {
  return <EventWorkspace actorLabel="donor account" />
}
