import { PatientBookScreeningPage } from '@/components/PatientPage/Book/PatientBookScreening.page'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/book/')({
  component: PatientBookScreeningPage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useAllScreeningTypes())
  },
})
