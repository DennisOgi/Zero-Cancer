import { featuredEvents } from '@/services/providers/event.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Images } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function CommunityEvents() {
  const { data, isLoading } = useQuery(featuredEvents())
  const events = data?.data?.events || []
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track || events.length < 3) return

    let frame = 0
    let paused = false
    const onEnter = () => (paused = true)
    const onLeave = () => (paused = false)
    track.addEventListener('mouseenter', onEnter)
    track.addEventListener('mouseleave', onLeave)

    const step = () => {
      if (!paused && track.scrollWidth > track.clientWidth) {
        track.scrollLeft += 0.5
        const half = track.scrollWidth / 2
        if (track.scrollLeft >= half) track.scrollLeft -= half
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('mouseenter', onEnter)
      track.removeEventListener('mouseleave', onLeave)
    }
  }, [events.length])

  if (!isLoading && events.length === 0) return null

  const marquee = events.length ? [...events, ...events] : []

  return (
    <section className="bg-neutral-50">
      <div className="wrapper py-16 md:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Images className="h-4 w-4" />
              Community stories
            </span>
            <h2 className="mt-4 text-3xl font-bold lg:text-4xl">
              Events & programmes
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Outreach, charity work, and screening programmes shared by donors
              and health facilities across the platform.
            </p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          >
            See more
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div ref={trackRef} className="mt-8 flex gap-5 overflow-x-hidden pb-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 w-[280px] shrink-0 animate-pulse rounded-2xl bg-gray-200"
                />
              ))
            : marquee.map((event, index) => (
                <Link
                  key={`${event.id}-${index}`}
                  to="/events/$eventId"
                  params={{ eventId: event.id }}
                  className="w-[280px] shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-[300px]"
                >
                  <img
                    src={event.coverImageUrl}
                    alt={event.title}
                    className="h-40 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      {event.publisherType === 'CENTER'
                        ? 'Health facility'
                        : 'Donor'}{' '}
                      · {event.publisherName}
                    </p>
                    <h3 className="line-clamp-2 font-semibold">{event.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {event.body}
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}
