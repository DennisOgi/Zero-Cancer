import { CenterSignupPage } from '@/components/AuthPages/SignupPage/CenterSignup.page'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/sign-up/center')({
  component: RouteComponent,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useAllScreeningTypes())
  },
})

function RouteComponent() {
  return <CenterSignupPage />
}
