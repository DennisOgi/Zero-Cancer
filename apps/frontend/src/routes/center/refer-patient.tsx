import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/center/refer-patient')({
  beforeLoad: () => {
    throw redirect({ to: '/center' })
  },
})
