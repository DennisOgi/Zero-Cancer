import { ReferralLandingPage } from '@/components/Referral/ReferralLanding.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/r/$code')({
  component: RouteComponent,
})

function RouteComponent() {
  const { code } = Route.useParams()
  return <ReferralLandingPage code={code} />
}
