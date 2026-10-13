import { PatientSavingsPage } from '@/components/PatientPage/Savings/PatientSavings.page'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  screeningTypeId: z.string().optional(),
  centerId: z.string().optional(),
  targetAmount: z.coerce.number().optional(),
})

export const Route = createFileRoute('/patient/savings')({
  validateSearch: searchSchema,
  component: () => {
    const search = Route.useSearch()
    return (
      <PatientSavingsPage
        initialScreeningTypeId={search.screeningTypeId}
        initialCenterId={search.centerId}
        initialTargetAmount={search.targetAmount}
      />
    )
  },
})
