import { formatCurrency } from '@/lib/utils'
import { BarChart3Icon } from 'lucide-react'

interface EarningsChartProps {
  data?: {
    today: number
    thisWeek: number
    thisMonth: number
    totalEarnings: number
  }
  isLoading?: boolean
}

export function EarningsChart({ data, isLoading }: EarningsChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <BarChart3Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No data available</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(data.today, data.thisWeek, data.thisMonth)
  const chartData = [
    { label: 'Today', value: data.today, color: 'bg-blue-500' },
    { label: 'This Week', value: data.thisWeek, color: 'bg-purple-500' },
    { label: 'This Month', value: data.thisMonth, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Simple Bar Chart */}
      <div className="space-y-4">
        {chartData.map((item) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="font-bold">{formatCurrency(item.value)}</span>
              </div>
              <div className="h-8 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all duration-500 ease-out flex items-center justify-end pr-3`}
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 20 && (
                    <span className="text-xs font-medium text-white">
                      {percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Earnings</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(data.totalEarnings)}
          </span>
        </div>
      </div>
    </div>
  )
}
