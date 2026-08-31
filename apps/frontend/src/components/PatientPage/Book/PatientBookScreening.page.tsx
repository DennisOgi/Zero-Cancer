import ScreeningCard from '@/components/shared/ScreeningCard'
import { usePatientEligibleScreeningTypes } from '@/services/providers/patient-screening.provider'
import { useNavigate } from '@tanstack/react-router'
import BookHeader from './BookHeader'

export function PatientBookScreeningPage({
  savingsPlanId,
}: {
  savingsPlanId?: string
}) {
  const navigate = useNavigate()
  const {
    screenings: eligibleScreenings,
    hasGender,
    isLoading: screeningTypesLoading,
    isError: screeningTypesError,
  } = usePatientEligibleScreeningTypes()

  const handlePayAndBook = (screeningId: string) => {
    navigate({
      to: '/patient/book/pay',
      search: { screeningTypeId: screeningId, savingsPlanId },
    })
  }

  return (
    <div className="space-y-8">
      <BookHeader
        title="Book Screening"
        description="Choose a screening type to book an appointment or join the waitlist."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {screeningTypesLoading ? (
          <p>Loading screenings...</p>
        ) : screeningTypesError ? (
          <p>Error loading screenings.</p>
        ) : !hasGender ? (
          <p className="text-muted-foreground">
            Your profile is missing gender information. Contact support to update
            your profile before booking screenings.
          </p>
        ) : eligibleScreenings.length === 0 ? (
          <p className="text-muted-foreground">
            No screenings are available for your profile yet. Contact support if
            this looks wrong.
          </p>
        ) : (
          eligibleScreenings.map((screeningType) => (
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
