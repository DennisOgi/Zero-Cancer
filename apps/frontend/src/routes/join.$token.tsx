import { JoinBoardingPage } from '@/components/Boarding/JoinBoarding.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/join/$token')({
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useParams()
  return <JoinBoardingPage token={token} />
}
