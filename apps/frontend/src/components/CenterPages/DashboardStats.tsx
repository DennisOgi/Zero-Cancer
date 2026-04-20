import { Card, CardContent } from '@/components/shared/ui/card'
import { cn } from '@/lib/utils'

interface StatCardData {
  title: string
  value: string | number
  description: string
  icon: string
  color: string
}

interface DashboardStatsProps {
  stats: StatCardData[]
  isLoading?: boolean
}

export function DashboardStats({
  stats,
  isLoading = false,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className={cn('border-0', stat.color)}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-white rounded-full">
              <img src={stat.icon} alt={stat.title} className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold">
                {isLoading ? '...' : stat.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
