import { PatientCenterSelectionPage } from '@/components/PatientPage/Book/PatientCenterSelection.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/book/centers')({
  component: () => {
    const search = Route.useSearch()
    return (
      <PatientCenterSelectionPage
        allocationId={search.allocationId}
        screeningTypeId={search.screeningTypeId}
      />
    )
  },
  validateSearch: (search) => ({
    allocationId: search.allocationId as string | undefined,
    screeningTypeId: search.screeningTypeId as string | undefined,
  }),
})
