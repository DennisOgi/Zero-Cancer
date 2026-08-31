import { PatientBookScreeningPage } from '@/components/PatientPage/Book/PatientBookScreening.page'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const bookSearchSchema = z.object({
  savingsPlanId: z.string().optional(),
})

export const Route = createFileRoute('/patient/book/')({
  validateSearch: bookSearchSchema,
  component: RouteComponent,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useAllScreeningTypes())
  },
})

function RouteComponent() {
  const { savingsPlanId } = Route.useSearch()
  return <PatientBookScreeningPage savingsPlanId={savingsPlanId} />
}
