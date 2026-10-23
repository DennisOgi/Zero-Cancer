import { createFileRoute, redirect } from '@tanstack/react-router'

/** Short facility invite: /c/{uuid} → patient signup with that center. */
function normalizeCenterId(raw: string): string | null {
  const compact = raw.trim().replace(/[^a-fA-F0-9]/g, '')
  if (compact.length !== 32) return null
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join('-')
}

export const Route = createFileRoute('/c/$centerId')({
  beforeLoad: ({ params }) => {
    const center = normalizeCenterId(params.centerId)
    throw redirect({
      to: '/sign-up/patient',
      search: center ? { center } : {},
    })
  },
  component: () => null,
})
