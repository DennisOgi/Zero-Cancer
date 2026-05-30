import FundPatientsPage from '@/components/DonorPage/FundPatients.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/donor/fund')({
  component: FundPatientsPage,
})
