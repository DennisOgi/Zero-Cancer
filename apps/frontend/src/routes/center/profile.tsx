import { CenterProfilePage } from '@/components/CenterPages/CenterProfile.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/center/profile')({
  component: CenterProfilePage,
})
