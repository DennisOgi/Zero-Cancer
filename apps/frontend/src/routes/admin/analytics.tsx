import { AdminAnalyticsPage } from '@/components/AdminPage/Analytics/AdminAnalytics.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/analytics')({
  component: AdminAnalyticsPage,
})
