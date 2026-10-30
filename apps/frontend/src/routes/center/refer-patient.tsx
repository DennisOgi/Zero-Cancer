import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy mock path removed — clinician invites are on Earnings */
export const Route = createFileRoute('/center/refer-patient')({
  beforeLoad: () => {
    throw redirect({ to: '/center' })
  },
})
