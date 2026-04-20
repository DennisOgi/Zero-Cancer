import { Button } from '@/components/shared/ui/button'

export default function ActionButtons() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* TODO: Add navigation links */}
      <Button>Book Screening</Button>
      <Button variant="outline">View Result</Button>
      <Button variant="outline">Refer Loved One</Button>
    </div>
  )
}
