import patientImage from '@/assets/images/patients.png'
import screeningImage from '@/assets/images/screening.png'
import sponsorImage from '@/assets/images/sponsored.png'
import { useNavigate } from '@tanstack/react-router'

export default function UserTypeSelection() {
  const navigate = useNavigate()

  const handleTypeSelect = (type: 'patient' | 'donor' | 'center') => {
    navigate({ to: `/sign-up/${type}` })
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Who are you signing up as?</h2>
      <div className="flex gap-4 flex-wrap">
        <div
          className="bg-green-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-green-300 transition-colors duration-300"
          onClick={() => handleTypeSelect('patient')}
        >
          <h3 className="text-2xl font-bold mb-12 w-full">Patient</h3>
          <img
            src={patientImage}
            alt="patient"
            className="h-40 w-auto object-contain"
          />
        </div>
        <div
          className="bg-purple-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-purple-300 transition-colors duration-300"
          onClick={() => handleTypeSelect('donor')}
        >
          <h3 className="text-2xl font-bold mb-12 w-full">Donor</h3>
          <img
            src={sponsorImage}
            alt="donor"
            className="h-40 w-auto object-contain"
          />
        </div>
        <div
          className="bg-blue-200 p-4 rounded-lg cursor-pointer flex-1 min-w-[200px] flex flex-col items-center hover:bg-blue-300 transition-colors duration-300"
          onClick={() => handleTypeSelect('center')}
        >
          <h3 className="text-2xl font-bold mb-12 w-full">
            Screening Center
          </h3>
          <img
            src={screeningImage}
            alt="screening center"
            className="h-40 w-auto object-contain"
          />
        </div>
      </div>
    </div>
  )
} 