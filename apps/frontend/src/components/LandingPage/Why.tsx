import screening from '@/assets/images/screening.png'
import sponsored from '@/assets/images/sponsored.png'
import vaccinated from '@/assets/images/vaccinated.png'

export default function Why() {
  return (
    <div className="wrapper py-20 flex flex-col items-center space-y-8">
      <h1 className="text-4xl lg:text-5xl  font-bold text-center">
        Why Zerocaner?
      </h1>
      <p className="text-center max-w-3xl">
        Zerocancer empowers Africans with early detection, education, and
        support—fighting cancer with awareness, technology, and accessible
        healthcare solutions.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 w-full">
        <div className="h-72 bg-green-200 w-full rounded-2xl p-6 space-y-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Get Vaccinated</h2>
            <p className="max-w-2xs text-sm text-neutral-500">
              Protect yourself against HPV and other cancer-related risks.
            </p>
          </div>
          <div className="flex justify-end">
            <img src={vaccinated} alt="Vaccination" className="w-24" />
          </div>
        </div>
        <div className="h-72 bg-blue-200 w-full rounded-2xl p-6 space-y-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Book a Screening</h2>
            <p className="max-w-2xs text-sm text-neutral-500">
              Find a cancer screening center near you
            </p>
          </div>
          <div className="flex justify-end">
            <img src={screening} alt="Screening" className="w-56" />
          </div>
        </div>
        <div className="h-72 bg-purple-200 w-full rounded-2xl p-6 space-y-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Get Sponsored</h2>
            <p className="max-w-2xs text-sm text-neutral-500">
              Can’t afford it? Join our free screening list
            </p>
          </div>
          <div className="flex justify-end">
            <img src={sponsored} alt="Sponsored" className="w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
