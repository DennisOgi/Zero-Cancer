import { DonorWaitingListsPage } from '@/components/DonorPage/WaitingLists/DonorWaitingLists.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/donor/waiting-lists')({
  component: DonorWaitingListsPage,
})
