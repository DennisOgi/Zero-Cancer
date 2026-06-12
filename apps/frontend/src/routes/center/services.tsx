import { CenterServicesPage } from '@/components/CenterPages/CenterServices.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/services')({
  component: CenterServicesPage,
})
