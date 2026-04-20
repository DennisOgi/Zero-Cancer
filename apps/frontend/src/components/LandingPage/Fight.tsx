import early from '@/assets/images/early.png'
import referred from '@/assets/images/referred.png'
import support from '@/assets/images/support.png'

export default function Fight() {
  return (
    <div className="wrapper py-20 flex flex-col items-center space-y-8">
      <h1 className="text-4xl lg:text-5xl  font-bold text-center">
        How We Help You Fight Cancer
      </h1>
      <p className="text-center max-w-3xl">
        From screening to treatment, we guide you every step of the way.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 w-full">
        <div className="h-72 bg-blue-200 w-full rounded-2xl p-6 space-y-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Early Diagnosis</h2>
            <p className="max-w-2xs text-sm text-neutral-500">
              We help you get screened for common cancers.
            </p>
          </div>
          <div className="flex justify-end">
            <img src={early} alt="Early" className="w-48" />
          </div>
        </div>
        <div className="h-72 bg-purple-200 w-full rounded-2xl p-6 space-y-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Treatment Support</h2>
            <p className="max-w-2xs text-sm text-neutral-500">
              We connect you to trusted hospitals and care.
            </p>
          </div>
          <div className="flex justify-end">
            <img src={support} alt="Support" className="w-36" />
          </div>
        </div>
        <div className="h-72 bg-green-200 w-full rounded-2xl p-6 space-y-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Get Referred</h2>
            <p className="max-w-2xs text-sm text-neutral-500">
              Need more help? We link you to the right experts.
            </p>
          </div>
          <div className="flex justify-end">
            <img src={referred} alt="Referred" className="w-42" />
          </div>
        </div>
      </div>
    </div>
  )
}
