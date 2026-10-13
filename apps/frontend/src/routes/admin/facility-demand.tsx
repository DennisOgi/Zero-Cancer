import { AdminFacilityDemandPage } from '@/components/AdminPage/Demand/AdminFacilityDemand.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/facility-demand')({
  component: AdminFacilityDemandPage,
})
