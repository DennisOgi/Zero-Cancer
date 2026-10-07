import { AdminKitOrdersPage } from '@/components/AdminPage/KitOrders/AdminKitOrders.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/kit-orders')({
  component: AdminKitOrdersPage,
})
