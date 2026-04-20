import { AdminResultsPage } from '@/components/AdminPage/Results/AdminResults.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/results')({
  component: AdminResultsPage,
})
