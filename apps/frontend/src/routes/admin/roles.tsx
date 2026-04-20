import { AdminRolesPage } from '@/components/AdminPage/Roles/AdminRoles.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/roles')({
  component: AdminRolesPage,
})
