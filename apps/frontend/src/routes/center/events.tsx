import { EventWorkspace } from '@/components/Events/EventWorkspace'
import { isFacilityAdminUser } from '@/lib/center-access'
import { useAuthUser } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/center/events')({
  component: CenterEventsRoute,
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    if (!isFacilityAdminUser(auth?.data?.user)) {
      throw redirect({ to: '/center' })
    }
  },
})

function CenterEventsRoute() {
  const { data } = useQuery(useAuthUser())
  if (!isFacilityAdminUser(data?.data?.user)) {
    return null
  }
  return <EventWorkspace actorLabel="health facility" />
}
