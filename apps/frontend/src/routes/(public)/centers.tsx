import CentersSearchPage from '@/components/CentersPage/CentersSearch.page'
import { centers } from '@/services/providers/center.provider'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const centersSearchSchema = z.object({
  state: z.string().optional(),
  lga: z.string().optional(),
  serviceType: z
    .enum(['vaccination', 'screening', 'treatment'])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/(public)/centers')({
  validateSearch: centersSearchSchema,
  loader: ({ context: { queryClient }, location }) => {
    const search = centersSearchSchema.parse(location.search)
    void queryClient.prefetchQuery(
      centers({
        state: search.state,
        lga: search.lga,
        serviceType: search.serviceType,
        pageSize: 50,
      }),
    ).catch((error) => {
      console.error('Centers route prefetch failed', {
        filters: search,
        error,
      })
    })

    return search
  },
  component: CentersSearchPage,
})
