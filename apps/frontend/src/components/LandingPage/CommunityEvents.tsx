import { featuredEvents } from '@/services/providers/event.provider'
import type { TCommunityEvent } from '@zerocancer/shared/types'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, Images } from 'lucide-react'

function formatEventDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function publisherLabel(event: TCommunityEvent) {
  return event.publisherType === 'CENTER' ? 'Health facility' : 'Donor'
}

function EventMeta({
  event,
  light = false,
}: {
  event: TCommunityEvent
  light?: boolean
}) {
  const date = formatEventDate(event.createdAt)
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-wide ${
        light ? 'text-white/80' : 'text-primary'
      }`}
    >
      <span>
        {publisherLabel(event)} · {event.publisherName}
      </span>
      {date ? (
        <span className="inline-flex items-center gap-1 normal-case tracking-normal">
          <CalendarDays className="h-3.5 w-3.5" />
          {date}
        </span>
      ) : null}
    </p>
  )
}

function EventCard({
  event,
  featured = false,
}: {
  event: TCommunityEvent
  featured?: boolean
}) {
  const extraPhotos = event.imageUrls?.length || 0

  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className={`group relative isolate overflow-hidden rounded-3xl bg-neutral-900 shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        featured ? 'min-h-[360px] md:min-h-[460px]' : 'min-h-[280px]'
      }`}
    >
      <img
        src={event.coverImageUrl}
        alt={event.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      <div className="relative flex h-full flex-col justify-end p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {event.featured ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-neutral-900">
              Featured
            </span>
          ) : null}
          {extraPhotos > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Images className="h-3.5 w-3.5" />
              {extraPhotos + 1} photos
            </span>
          ) : null}
        </div>
        <EventMeta event={event} light />
        <h3
          className={`mt-2 font-bold text-white ${
            featured
              ? 'text-2xl leading-tight sm:text-3xl lg:text-4xl'
              : 'text-lg leading-snug sm:text-xl'
          }`}
        >
          {event.title}
        </h3>
        <p
          className={`mt-2 text-sm text-white/80 ${
            featured ? 'line-clamp-3 max-w-2xl sm:text-base' : 'line-clamp-2'
          }`}
        >
          {event.body}
        </p>
      </div>
    </Link>
  )
}

export default function CommunityEvents() {
  const { data } = useQuery({
    ...featuredEvents(),
    retry: 1,
    staleTime: 60_000,
  })
  const events = data?.data?.events || []

  // Stay off the landing page until approved events exist.
  if (events.length === 0) return null

  const [hero, ...rest] = events
  const sideEvents = rest.slice(0, 4)

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#fff5fb_48%,#ffffff_100%)]">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />

      <div className="wrapper relative py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Images className="h-4 w-4" />
            Community gallery
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight lg:text-5xl">
            Events & programmes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Outreach days, charity work, and screening programmes shared by
            donors and health facilities across ZeroCancer.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <div
            className={`grid gap-4 ${
              sideEvents.length > 0
                ? 'lg:grid-cols-5 lg:grid-rows-2'
                : 'grid-cols-1'
            }`}
          >
            <div
              className={
                sideEvents.length > 0
                  ? 'lg:col-span-3 lg:row-span-2'
                  : 'col-span-full'
              }
            >
              <EventCard event={hero} featured />
            </div>
            {sideEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="lg:col-span-2">
                <EventCard event={event} />
              </div>
            ))}
          </div>

          {sideEvents.length > 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {sideEvents.slice(2).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-md transition hover:bg-primary/90 hover:shadow-lg"
          >
            See the full gallery
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
