import { Button } from '@/components/shared/ui/button'
import { anniversaryContacts } from '@/services/providers/boarding.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CalendarHeart } from 'lucide-react'

export function AnniversaryReminderBanner({
  invitePath,
}: {
  invitePath: '/patient/invite' | '/donor/invite'
}) {
  const { data } = useQuery(anniversaryContacts())
  const dueSoon = (data?.data?.contacts || []).filter((row) => row.dueSoon)
  if (dueSoon.length === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-2 text-amber-950">
        <CalendarHeart className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">
            {dueSoon.length === 1
              ? `${dueSoon[0].name}'s date is coming up`
              : `${dueSoon.length} birthday or anniversary reminders`}
          </p>
          <p className="text-sm text-amber-900">
            We remind you here. Open Invite and send the WhatsApp yourself.
          </p>
        </div>
      </div>
      <Button asChild size="sm">
        <Link to={invitePath}>Open Invite</Link>
      </Button>
    </div>
  )
}
