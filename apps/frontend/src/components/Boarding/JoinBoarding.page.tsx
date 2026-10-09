import { BoardingVideoPlayer } from '@/components/Boarding/BoardingVideos'
import { BOARDING_SKIP_KEY } from '@/lib/boarding-videos'
import { getBoardingPreview } from '@/services/boarding.service'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { HeartHandshake, Stethoscope } from 'lucide-react'

export function JoinBoardingPage({ token }: { token: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['boarding-preview', token],
    queryFn: () => getBoardingPreview(token),
    retry: false,
  })
  const preview = data?.data
  const isCelebrant = preview?.type === 'CELEBRANT'

  const finish = (skipped: boolean) => {
    sessionStorage.setItem(BOARDING_SKIP_KEY, skipped ? '1' : '0')
    sessionStorage.setItem('zerocancer_invite', token)
    const path = isCelebrant
      ? `/sign-up/donor?invite=${encodeURIComponent(token)}`
      : `/sign-up/patient?invite=${encodeURIComponent(token)}`
    window.location.assign(path)
  }

  return (
    <div className="min-h-screen bg-[#140414] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-wide text-white/80">
            ZeroCancer
          </Link>
          {preview ? (
            <button
              type="button"
              className="text-sm text-white/60 hover:text-white"
              onClick={() => finish(true)}
            >
              Skip to account
            </button>
          ) : (
            <span className="text-sm text-white/30">Skip to account</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-white/60">
            Opening your invite…
          </div>
        ) : isError || !preview ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="text-2xl font-bold">This invite is no longer valid</h1>
            <p className="mt-2 text-white/70">You can still create an account and join ZeroCancer.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/sign-up/patient" className="rounded-full bg-pink-500 px-5 py-2 text-sm font-medium">
                Get screened
              </Link>
              <Link to="/sign-up/donor" className="rounded-full border border-white/20 px-5 py-2 text-sm">
                Sponsor someone
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-3xl border border-pink-400/20 bg-gradient-to-r from-pink-500/20 to-indigo-500/10 p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-pink-500/20 p-3">
                  {isCelebrant ? (
                    <HeartHandshake className="h-6 w-6 text-pink-200" />
                  ) : (
                    <Stethoscope className="h-6 w-6 text-pink-200" />
                  )}
                </span>
                <div>
                  <p className="text-sm text-pink-200">
                    {isCelebrant ? 'Celebrant / donor invite' : 'Screening invite'}
                  </p>
                  <h1 className="mt-1 text-3xl font-bold leading-tight">
                    {preview.inviterName} invited you
                    {isCelebrant
                      ? ' to sponsor women waiting for screening'
                      : ' to get screened'}
                  </h1>
                  {preview.waitingListName ? (
                    <p className="mt-2 text-sm text-white/70">
                      Tagged list: {preview.waitingListName}
                    </p>
                  ) : null}
                  {preview.inviterHospital ? (
                    <p className="mt-1 text-sm text-white/70">
                      Their facility: {preview.inviterHospital}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <BoardingVideoPlayer onFinished={finish} />
          </>
        )}
      </div>
    </div>
  )
}
