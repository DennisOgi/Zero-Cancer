import health from '@/assets/images/health.png'
import location from '@/assets/images/location.png'
import awaiting from '@/assets/images/notification.png'
import sponsored from '@/assets/images/sponsored.png'
import { Card } from '@/components/shared/ui/card'

function StatCard({
  title,
  value,
  unit,
  icon,
  color,
  loading,
}: {
  title: string
  value: number
  unit: string
  icon: string
  color: string
  loading: boolean
}) {
  return (
    <Card className={`p-4 ${color}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <img src={icon} alt={title} className="w-8 h-8" />
      </div>
      {loading ? (
        <div className="h-8 w-1/2 bg-gray-300/50 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      )}
      <p className="text-sm text-gray-500">{unit}</p>
    </Card>
  )
}

export function DonorStatsGrid({
  patientsHelped,
  completed = 0,
  awaitingCount = 0,
  locationsImpacted,
  loading,
}: {
  patientsHelped: number
  completed?: number
  awaitingCount?: number
  locationsImpacted: number
  loading: boolean
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Patients Helped"
        value={patientsHelped}
        unit="People"
        icon={sponsored}
        color="bg-pink-100"
        loading={loading}
      />
      <StatCard
        title="Completed Screening"
        value={completed}
        unit="People"
        icon={health}
        color="bg-purple-100"
        loading={loading}
      />
      <StatCard
        title="Awaiting Screening"
        value={awaitingCount}
        unit="People"
        icon={awaiting}
        color="bg-blue-100"
        loading={loading}
      />
      <StatCard
        title="Locations Impacted"
        value={locationsImpacted}
        unit="States"
        icon={location}
        color="bg-green-100"
        loading={loading}
      />
    </div>
  )
}

export default DonorStatsGrid
