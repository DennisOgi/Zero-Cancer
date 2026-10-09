import { InviteHubPage } from '@/components/Boarding/InviteHub.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/donor/invite')({
  component: InviteHubPage,
})
