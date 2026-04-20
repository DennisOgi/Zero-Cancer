import ScreeningCard from '@/components/shared/ScreeningCard'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { RotateCwIcon } from 'lucide-react'
import BookHeader from './BookHeader'

export function PatientBookScreeningPage() {
  const navigate = useNavigate()
  const {
    data: screeningTypesData,
    isLoading: screeningTypesLoading,
    error: screeningTypesError,
    refetch,
    isFetching,
  } = useQuery(useAllScreeningTypes())

  const handlePayAndBook = (screeningId: string) => {
    navigate({
      to: '/patient/book/pay',
      search: { screeningTypeId: screeningId },
    })
  }

  return (
    <div className="space-y-8">
      <BookHeader
        title="Book Screening"
        description="Choose a screening type to book an appointment or join the waitlist."
        action={
          <button
            type="button"
            className={`flex items-center gap-2 px-3 py-2 rounded-md border bg-muted hover:bg-muted/80 transition`}
            onClick={() => refetch()}
          >
            <RotateCwIcon
              size={18}
              className={`${isFetching ? 'animate-spin' : ''}`}
            />
            Reload (to be removed later)
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {screeningTypesLoading ? (
          <p>Loading screenings...</p>
        ) : screeningTypesError ? (
          <p>Error loading screenings.</p>
        ) : (
          (screeningTypesData?.data || []).map((screeningType) => (
            <ScreeningCard
              key={screeningType.id}
              screeningType={screeningType}
              handlePayAndBook={handlePayAndBook}
            />
          ))
        )}
      </div>
    </div>
  )
}
