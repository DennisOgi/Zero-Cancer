import patientImage from '@/assets/images/patients.png'
import screeningImage from '@/assets/images/screening.png'
import sponsorImage from '@/assets/images/sponsored.png'
import { Link } from '@tanstack/react-router'

export default function SignUpFlow() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Sign up as?</h2>
      <div className="flex gap-4 flex-wrap">
        <Link
          to="/sign-up/patient"
          preload="render"
          className="bg-green-200 p-4 rounded-lg flex-1 min-w-[200px] flex flex-col items-center hover:bg-green-300 transition-colors duration-300 cursor-pointer"
        >
          <h3 className="text-2xl font-bold mb-12 w-full">Patient</h3>
          <img
            src={patientImage}
            alt="patient"
            className="h-40 w-auto object-contain"
          />
        </Link>
        <Link
          to="/sign-up/center"
          preload="render"
          className="bg-blue-200 p-4 rounded-lg flex-1 min-w-[200px] flex flex-col items-center hover:bg-blue-300 transition-colors duration-300 cursor-pointer"
        >
          <h3 className="text-2xl font-bold mb-12 w-full">Screening Center</h3>
          <img
            src={screeningImage}
            alt="screening center"
            className="h-40 w-auto object-contain"
          />
        </Link>

        <Link
          to="/sign-up/donor"
          preload="render"
          className="bg-purple-200 p-4 rounded-lg flex-1 min-w-[200px] flex flex-col items-center hover:bg-purple-300 transition-colors duration-300 cursor-pointer"
        >
          <h3 className="text-2xl font-bold mb-12 w-full">Donor</h3>
          <img
            src={sponsorImage}
            alt="donor"
            className="h-40 w-auto object-contain"
          />
        </Link>
      </div>
    </div>
  )
}
