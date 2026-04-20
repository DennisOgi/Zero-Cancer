import { createFileRoute } from '@tanstack/react-router'

import AdminDashboardPage from '@/components/AdminPage/Dashboard/AdminDashboard.page'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})
