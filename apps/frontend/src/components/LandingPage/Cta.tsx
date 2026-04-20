import cta from '@/assets/images/cta.png'

export default function Cta() {
  return (
    <div className="bg-primary my-20">
      <div className="wrapper py-20 flex flex-col lg:flex-row items-center justify-between gap-8 text-white">
        <div className="lg:w-1/2 text-center lg:text-left">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Ready to take control of your health?
          </h2>
          <p className="mt-4">
            Join thousands of Nigerians already getting screened, referred, or
            sponsored.
          </p>
          <div className="mt-8 flex flex-col items-center lg:items-start gap-4">
            <button className="bg-secondary px-8 py-3 rounded-lg font-semibold">
              Create A Free Account
            </button>
            <p className="text-sm">13,520 Nigerians have already joined.</p>
          </div>
        </div>
        <div className="hidden lg:block lg:w-1/2">
          <img src={cta} alt="Doctor with patient" className="h-80 ml-auto" />
        </div>
      </div>
    </div>
  )
}
