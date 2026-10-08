import { EventsGalleryPage } from '@/components/Events/EventsGallery.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/events/')({
  component: EventsRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search?.page ?? 1) || 1,
  }),
})

function EventsRoute() {
  const { page } = Route.useSearch()
  return <EventsGalleryPage page={page} />
}
