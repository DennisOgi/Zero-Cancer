import { FacilityChoicePage } from '@/components/Boarding/FacilityChoice.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/select-center')({
  component: FacilityChoicePage,
})
