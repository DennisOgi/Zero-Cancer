import { InviteHubPage } from '@/components/Boarding/InviteHub.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/invite')({
  component: InviteHubPage,
})
