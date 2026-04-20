import AdminWaitlistPanel from '@/components/AdminPage/Waitlist/AdminWaitlistPanel'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/waitlist')({
  component: AdminWaitlist,
})

function AdminWaitlist() {
  return (
    <div className="space-y-6">
      <AdminWaitlistPanel />
    </div>
  )
}
