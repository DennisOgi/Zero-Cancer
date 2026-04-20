import { createFileRoute } from '@tanstack/react-router'
import AboutPage from '@/components/AboutPage/About.page'

export const Route = createFileRoute('/(public)/about')({
  component: AboutPage,
})
