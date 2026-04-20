import { AdminUsersPage } from '@/components/AdminPage/Users/AdminUsers.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})
