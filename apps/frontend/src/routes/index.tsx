import LandingPage from '@/components/LandingPage/LandingPage.component'
import { useAuthUser } from '@/services/providers/auth.provider'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(useAuthUser())
  }
})

function App() {
  return <LandingPage />
}
