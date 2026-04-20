import { CenterVerifyCodePage } from '@/components/CenterPages/CenterVerifyCode.page'
import { createFileRoute } from '@tanstack/react-router'
import { fallback, zodValidator } from '@tanstack/zod-adapter'
import { verifyCheckInCodeSchema } from '@zerocancer/shared/schemas/appointment.schema'

export const Route = createFileRoute('/center/verify-code')({
  component: RouteComponent,
  validateSearch: zodValidator(
    fallback(verifyCheckInCodeSchema.partial(), {
      checkInCode: '',
    }).default({ checkInCode: '' }),
  ),
})

function RouteComponent() {
  const { checkInCode } = Route.useSearch()
  return <CenterVerifyCodePage codeFromUrl={checkInCode} />
}
