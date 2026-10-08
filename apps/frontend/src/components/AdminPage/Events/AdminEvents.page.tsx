import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Textarea } from '@/components/shared/ui/textarea'
import {
  adminEvents,
  useReviewEvent,
} from '@/services/providers/event.provider'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

const statusStyle: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-emerald-100 text-emerald-900',
  REJECTED: 'bg-red-100 text-red-900',
}

export function AdminEventsPage() {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>(
    'PENDING',
  )
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const { data, isLoading, refetch } = useQuery(
    adminEvents({ page: 1, status: status || undefined }),
  )
  const review = useReviewEvent()
  const events = data?.data?.events || []

  const onReview = async (
    id: string,
    nextStatus: 'APPROVED' | 'REJECTED',
    featured = false,
  ) => {
    try {
      await review.mutateAsync({
        id,
        status: nextStatus,
        featured,
        rejectionReason: reasonById[id],
      })
      toast.success(
        nextStatus === 'APPROVED' ? 'Event approved' : 'Event rejected',
      )
      refetch()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not update event')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event posts</h1>
        <p className="text-muted-foreground">
          Approve donor and health facility stories before they appear on the
          homepage and gallery.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map((value) => (
          <Button
            key={value || 'ALL'}
            size="sm"
            variant={status === value ? 'default' : 'outline'}
            onClick={() => setStatus(value)}
          >
            {value || 'All'}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data?.data?.total || 0} posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground">No events in this filter.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <img
                    src={event.coverImageUrl}
                    alt={event.title}
                    className="h-36 w-full rounded-lg object-cover lg:w-56"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge className={statusStyle[event.status]}>
                        {event.status}
                      </Badge>
                      {event.featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.publisherType === 'CENTER'
                        ? 'Health facility'
                        : 'Donor'}{' '}
                      · {event.publisherName}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{event.body}</p>
                    {event.status === 'PENDING' && (
                      <div className="space-y-3 pt-2">
                        <Textarea
                          placeholder="Rejection reason (optional)"
                          value={reasonById[event.id] || ''}
                          onChange={(change) =>
                            setReasonById((current) => ({
                              ...current,
                              [event.id]: change.target.value,
                            }))
                          }
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => onReview(event.id, 'APPROVED')}
                            disabled={review.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onReview(event.id, 'APPROVED', true)}
                            disabled={review.isPending}
                          >
                            Approve & feature
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onReview(event.id, 'REJECTED')}
                            disabled={review.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
