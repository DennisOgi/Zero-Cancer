import { createFileRoute } from '@tanstack/react-router'
import { CenterStaffPage } from '@/components/CenterPages/CenterStaff.page'

export const Route = createFileRoute('/center/staff')({
  component: CenterStaffPage,
})
