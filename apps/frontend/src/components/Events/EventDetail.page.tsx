import { publicEventById } from '@/services/providers/event.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

export function EventDetailPage({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useQuery(publicEventById(eventId))
  const event = data?.data

  if (isLoading) {
    return (
      <div className="wrapper py-20 text-center text-muted-foreground">
        Loading event...
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="wrapper py-20 text-center">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link to="/events" className="mt-4 inline-block text-primary">
          Back to gallery
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="wrapper max-w-4xl py-16">
        <Link to="/events" className="text-sm font-medium text-primary">
          ← All events
        </Link>
        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-primary">
          {event.publisherType === 'CENTER' ? 'Health facility' : 'Donor'} ·{' '}
          {event.publisherName}
        </p>
        <h1 className="mt-3 text-4xl font-bold">{event.title}</h1>
        <img
          src={event.coverImageUrl}
          alt={event.title}
          className="mt-8 max-h-[480px] w-full rounded-2xl object-cover"
        />
        <p className="mt-8 whitespace-pre-wrap text-lg leading-relaxed text-gray-700">
          {event.body}
        </p>
        {event.imageUrls?.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {event.imageUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="h-56 w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
