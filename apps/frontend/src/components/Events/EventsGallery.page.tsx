import { publicEvents } from '@/services/providers/event.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

export function EventsGalleryPage({ page }: { page: number }) {
  const { data, isLoading } = useQuery(
    publicEvents({ page, pageSize: 12 }),
  )
  const events = data?.data?.events || []
  const totalPages = data?.data?.totalPages || 1

  return (
    <div className="min-h-screen bg-white">
      <div className="wrapper py-16">
        <h1 className="text-4xl font-bold">Events & programmes</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Approved stories from donors and health facilities: outreach days,
          charity work, and community screening programmes.
        </p>

        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="mt-10 text-muted-foreground">
            No approved events yet. Check back after donors and facilities share
            their programmes.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                to="/events/$eventId"
                params={{ eventId: event.id }}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
              >
                <img
                  src={event.coverImageUrl}
                  alt={event.title}
                  className="h-48 w-full object-cover"
                />
                <div className="space-y-2 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {event.publisherType === 'CENTER'
                      ? 'Health facility'
                      : 'Donor'}{' '}
                    · {event.publisherName}
                  </p>
                  <h2 className="text-lg font-semibold">{event.title}</h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {event.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNum) => (
                <Link
                  key={pageNum}
                  to="/events"
                  search={{ page: pageNum }}
                  className={`rounded-md px-4 py-2 ${
                    pageNum === page
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </Link>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}
