import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'
import { allWaitlists } from '@/services/providers/waitlist.provider'
import { useQuery } from '@tanstack/react-query'

const StatItem = ({
  end,
  label,
  suffix = '',
}: {
  end: number
  label: string
  suffix?: string
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <div
      ref={ref}
      className="px-6 py-8 bg-white rounded-xl border-l-secondary border-l-4 space-y-3"
    >
      <h2 className="text-5xl font-bold">
        {inView ? <CountUp end={end} duration={2.75} /> : '0'}
        {suffix}
      </h2>
      <p className="text-neutral-500 text-sm">{label}</p>
    </div>
  )
}

export default function Stats() {
  const { data: waitlistData } = useQuery(
    allWaitlists({ page: 1, pageSize: 50, demandOrder: 'desc' }),
  )
  const waitingListCount = waitlistData?.data?.waitlists
    ? waitlistData.data.waitlists.reduce(
      (total, item) => total + item.pendingCount,
      0,
    )
    : 1250

  const stats = [
    { id: 1, end: 7532, label: 'People Screened' },
    { id: 2, end: 1020, label: 'Sponsored Screenings this month' },
    { id: 3, end: waitingListCount, label: 'Patients on Waiting List' },
    { id: 4, end: 18, label: 'Partner NGOs' },
  ]

  return (
    <div className="wrapper grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-20 bg-neutral-100">
      {stats.map((stat) => (
        <StatItem key={stat.id} end={stat.end} label={stat.label} />
      ))}
    </div>
  )
}
