import { BoardingVideoLibrary } from '@/components/Boarding/BoardingVideos'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/learn')({
  component: LearnPage,
})

function LearnPage() {
  return (
    <div className="wrapper py-16">
      <h1 className="text-4xl font-bold">How ZeroCancer works</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Five short films. Skip them when you are invited, watch them later here
        or from your dashboard.
      </p>
      <div className="mt-10">
        <BoardingVideoLibrary />
      </div>
    </div>
  )
}
