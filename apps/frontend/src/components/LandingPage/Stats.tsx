import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'

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
  const stats = [
    { id: 1, end: 7532, label: 'People Screened' },
    { id: 2, end: 1020, label: 'Sponsored Screenings this month' },
    { id: 3, end: 18, label: 'Partner NGOs' },
  ]

  return (
    <div className="wrapper grid grid-cols-1 lg:grid-cols-3 gap-8 py-20 bg-neutral-100">
      {stats.map((stat) => (
        <StatItem key={stat.id} end={stat.end} label={stat.label} />
      ))}
    </div>
  )
}
