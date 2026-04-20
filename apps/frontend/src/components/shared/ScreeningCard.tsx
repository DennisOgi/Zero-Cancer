import { Button } from '@/components/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shared/ui/dialog'
import {
  useCheckWaitlistStatus,
  useJoinWaitlist,
  useLeaveWaitlist,
} from '@/services/providers/patient.provider'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { TScreeningType } from '@zerocancer/shared/types'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface ScreeningCardProps {
  name: string
  description: string
  onBookNow: () => void
  onJoinWaitlist: () => void
  onLeaveWaitlist: () => void
  onBookWithDonation: () => void
  isWaitlisted?: boolean
  hasUsableDonation?: boolean
  isBooking?: boolean
  isJoiningWaitlist?: boolean
  isLeavingWaitlist?: boolean
  isBookingWithDonation?: boolean
}

function ScreeningCardUI({
  name,
  description,
  onBookNow,
  onJoinWaitlist,
  onLeaveWaitlist,
  onBookWithDonation,
  isWaitlisted,
  hasUsableDonation,
  isBooking,
  isJoiningWaitlist,
  isLeavingWaitlist,
  isBookingWithDonation,
}: ScreeningCardProps) {
  return (
    <div className="bg-white relative rounded-xl p-6 flex items-center justify-between shadow-sm border border-gray-100">
      {hasUsableDonation && (
        <div className="absolute -top-3 -right-3">
          <span className="inline-block rounded-full bg-pink-100 text-pink-700 text-xs font-semibold px-4 py-2 shadow border border-pink-200">
            Allocated
          </span>
        </div>
      )}
      <div>
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className="text-gray-500 mt-1">{description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-5">
          {hasUsableDonation ? (
            <Button
              onClick={onBookWithDonation}
              className="bg-pink-600 hover:bg-pink-700 text-white cursor-pointer  py-2 px-6 rounded-lg flex items-center gap-2"
              disabled={isBookingWithDonation || isBooking}
            >
              {isBookingWithDonation
                ? 'Selecting Center...'
                : 'Book with Donation'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onBookNow}
              className="bg-pink-600 hover:bg-pink-700 text-white cursor-pointer  py-2 px-6 rounded-lg flex items-center gap-2"
              disabled={isBooking || isBookingWithDonation}
            >
              {isBooking ? 'Booking...' : 'Book Now'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {isWaitlisted ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600  py-2 px-6 rounded-lg cursor-pointer"
                  disabled={isLeavingWaitlist}
                >
                  {hasUsableDonation
                    ? 'Cancel'
                    : isLeavingWaitlist
                      ? 'Leaving...'
                      : 'Leave Waitlist'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    You are about to leave the waitlist. You will lose your
                    current position.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button
                    className="bg-red-500 hover:bg-red-600"
                    onClick={onLeaveWaitlist}
                  >
                    Continue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-blue-50 hover:text-primary/80  py-2 px-6 rounded-lg cursor-pointer"
              onClick={onJoinWaitlist}
              disabled={isJoiningWaitlist}
            >
              {isJoiningWaitlist ? 'Joining...' : 'Join Waitlist'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ScreeningCard({
  screeningType,
  handlePayAndBook,
}: {
  screeningType: TScreeningType
  handlePayAndBook: (id: string) => void
}) {
  const navigate = useNavigate()
  const joinWaitlistMutation = useJoinWaitlist()
  const leaveWaitlistMutation = useLeaveWaitlist()
  const { data: waitlistStatus, isLoading: isCheckingWaitlist } = useQuery(
    useCheckWaitlistStatus(screeningType.id),
  )

  const hasUsableDonation =
    !!waitlistStatus?.data?.waitlist?.allocation?.id &&
    !!!waitlistStatus?.data?.waitlist?.allocation.claimedAt

  if (screeningType.name == 'Colorectal Cancer Screening')
    console.log('waitlistStatus of screening', waitlistStatus)

  const handleJoinWaitlist = (screeningId: string) => {
    joinWaitlistMutation.mutate(
      { screeningTypeId: screeningId },
      {
        onSuccess: () => {
          toast.success('You have been added to the waitlist')
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.error ||
              'Failed to join waitlist. Please try again.',
          )
        },
      },
    )
  }

  const handleLeaveWaitlist = () => {
    const waitlistId = waitlistStatus?.data?.waitlist?.id
    if (!waitlistId) {
      toast.error('Cannot leave waitlist without a waitlist ID.')
      return
    }
    leaveWaitlistMutation.mutate(
      { waitlistId },
      {
        onSuccess: () => {
          toast.success('You have been removed from the waitlist')
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.error ||
              'Failed to leave waitlist. Please try again.',
          )
        },
      },
    )
  }

  const handleBookWithDonation = (screeningId: string) => {
    const allocation = waitlistStatus?.data?.waitlist?.allocation
    if (!allocation) {
      toast.error('No allocation found. Please contact support.')
      return
    }

    // Navigate to dedicated center selection page for donation-based bookings
    navigate({
      to: '/patient/book/centers',
      search: {
        allocationId: allocation.id,
        screeningTypeId: screeningId,
      },
    })
  }

  return (
    <ScreeningCardUI
      name={screeningType.name}
      description={screeningType.description || 'No description available.'}
      onBookNow={() => handlePayAndBook(screeningType.id)}
      onJoinWaitlist={() => handleJoinWaitlist(screeningType.id)}
      onLeaveWaitlist={handleLeaveWaitlist}
      onBookWithDonation={() => handleBookWithDonation(screeningType.id)}
      hasUsableDonation={hasUsableDonation}
      isWaitlisted={waitlistStatus?.data?.inWaitlist}
      isJoiningWaitlist={joinWaitlistMutation.isPending}
      isLeavingWaitlist={leaveWaitlistMutation.isPending}
      isBooking={isCheckingWaitlist}
    />
  )
}
