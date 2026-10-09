import { BOARDING_VIDEOS, type BoardingVideoStep } from '@/lib/boarding-videos'
import { Button } from '@/components/shared/ui/button'
import { Check, Play } from 'lucide-react'
import { useState } from 'react'

function StepMedia({ step }: { step: BoardingVideoStep }) {
  const [failed, setFailed] = useState(false)
  if (step.src && !failed) {
    return (
      <video
        key={step.src}
        src={step.src}
        controls
        autoPlay
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div className="flex h-full flex-col justify-end bg-gradient-to-br from-rose-700 via-fuchsia-700 to-indigo-800 p-6 text-white">
      <p className="text-xs uppercase tracking-[0.2em] text-white/70">{step.kicker}</p>
      <p className="mt-2 max-w-md text-2xl font-semibold leading-snug">{step.title}</p>
      {step.facts?.map((fact) => (
        <div key={fact.label} className="mt-4 rounded-xl bg-white/10 p-4 backdrop-blur">
          <p className="text-lg font-bold">{fact.label}</p>
          <p className="mt-1 text-sm text-white/80">{fact.detail}</p>
        </div>
      ))}
    </div>
  )
}

export function BoardingVideoPlayer({
  variant = 'page',
  onFinished,
}: {
  variant?: 'page' | 'embed'
  onFinished?: (skipped: boolean) => void
}) {
  const [index, setIndex] = useState(0)
  const step = BOARDING_VIDEOS[index]
  const last = index === BOARDING_VIDEOS.length - 1

  const goNext = (skippedAll = false) => {
    if (skippedAll || last) {
      onFinished?.(skippedAll || false)
      return
    }
    setIndex((value) => value + 1)
  }

  return (
    <div className={variant === 'page' ? 'space-y-5' : 'space-y-4'}>
      <div className="flex gap-1.5">
        {BOARDING_VIDEOS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= index ? 'bg-pink-500' : 'bg-white/20'
            }`}
            aria-label={item.title}
          />
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
        <div className="aspect-video">
          <StepMedia step={step} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
          {step.kicker} of {BOARDING_VIDEOS.length}
        </p>
        <h2 className="text-2xl font-bold text-white">{step.title}</h2>
        <p className="text-sm leading-relaxed text-white/70">{step.summary}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="bg-pink-500 hover:bg-pink-400" onClick={() => goNext(false)}>
          {last ? 'Create my account' : 'Next'}
        </Button>
        <Button
          variant="ghost"
          className="text-white/80 hover:bg-white/10 hover:text-white"
          onClick={() => goNext(true)}
        >
          Skip videos
        </Button>
        {!last ? (
          <Button
            variant="ghost"
            className="text-white/50 hover:bg-white/10 hover:text-white"
            onClick={() => goNext(false)}
          >
            Skip this one
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function BoardingVideoLibrary() {
  const [current, setCurrent] = useState(BOARDING_VIDEOS[0])
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
        <div className="aspect-video">
          <StepMedia step={current} />
        </div>
      </div>
      <div className="space-y-3">
        {BOARDING_VIDEOS.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setCurrent(step)}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
              current.id === step.id
                ? 'border-primary bg-primary/5'
                : 'border-transparent bg-white hover:border-primary/30'
            }`}
          >
            <span className="mt-0.5 rounded-full bg-pink-100 p-2 text-pink-700">
              {current.id === step.id ? (
                <Play className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wide text-pink-600">
                {step.kicker}
              </span>
              <span className="block font-semibold">{step.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {step.summary}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
