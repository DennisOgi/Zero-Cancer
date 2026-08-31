import { PatientAgentPage } from '@/components/PatientPage/Agent/PatientAgent.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/agent')({
  component: PatientAgentPage,
})
