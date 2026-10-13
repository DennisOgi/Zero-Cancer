import { CenterAvailabilityPage } from '@/components/CenterPages/CenterAvailability.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/availability')({
  component: CenterAvailabilityPage,
})
