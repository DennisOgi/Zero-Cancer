import { Button } from '@/components/shared/ui/button'
import { Link } from '@tanstack/react-router'

interface QuickAction {
  label: string
  link: string
  icon: string
  isPrimary?: boolean
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.isPrimary ? 'default' : 'outline'}
          className="h-24 flex-col gap-2"
          asChild
        >
          <Link to={action.link}>
            <img src={action.icon} alt={action.label} className="h-8 w-8" />
            <span>{action.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  )
}
