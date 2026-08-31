import { AdminAgentsPage } from '@/components/AdminPage/Agents/AdminAgents.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/agents')({
  component: AdminAgentsPage,
})
