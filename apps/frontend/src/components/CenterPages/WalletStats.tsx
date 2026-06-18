import { Card, CardContent } from '@/components/shared/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'

interface StatCardData {
  title: string
  value: string | number
  description: string
  icon: string
  color: string
  trend?: string | null
}

interface WalletStatsProps {
  stats: StatCardData[]
  isLoading?: boolean
}

export function WalletStats({ stats, isLoading = false }: WalletStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className={cn('border-0 relative overflow-hidden', stat.color)}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <img src={stat.icon} alt={stat.title} className="h-6 w-6" />
              </div>
              {stat.trend && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                    stat.trend.startsWith('+')
                      ? 'bg-green-500/10 text-green-700'
                      : 'bg-red-500/10 text-red-700'
                  )}
                >
                  {stat.trend.startsWith('+') ? (
                    <TrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <TrendingDownIcon className="h-3 w-3" />
                  )}
                  {stat.trend}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-24 h-8 bg-muted animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
