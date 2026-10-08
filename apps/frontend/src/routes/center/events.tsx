import { EventWorkspace } from '@/components/Events/EventWorkspace'
import { useAuthUser } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/center/events')({
  component: CenterEventsRoute,
  beforeLoad: async ({ context }) => {
    const user = context.queryClient.getQueryData(['authUser']) as
      | { data?: { user?: { profile?: string } } }
      | undefined
    if (user?.data?.user?.profile === 'CENTER_STAFF') {
      throw redirect({ to: '/center' })
    }
  },
})

function CenterEventsRoute() {
  const { data } = useQuery(useAuthUser())
  if (data?.data?.user?.profile === 'CENTER_STAFF') {
    return null
  }
  return <EventWorkspace actorLabel="health facility" />
}
