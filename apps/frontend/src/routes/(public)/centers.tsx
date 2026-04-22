import CentersSearchPage from '@/components/CentersPage/CentersSearch.page'
import { centers } from '@/services/providers/center.provider'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const centersSearchSchema = z.object({
  state: z.string().optional(),
  lga: z.string().optional(),
})

export const Route = createFileRoute('/(public)/centers')({
  validateSearch: centersSearchSchema,
  loader: ({ context: { queryClient }, location }) => {
    const search = centersSearchSchema.parse(location.search)
    return queryClient.ensureQueryData(
      centers({
        state: search.state,
        lga: search.lga,
        pageSize: 50,
      })
    )
  },
  component: CentersSearchPage,
})
