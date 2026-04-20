import center from '@/assets/images/center.png'
import donor from '@/assets/images/donor.png'
import health from '@/assets/images/health.png'
import patients from '@/assets/images/patients.png'
import screening from '@/assets/images/screening.png'
import treatment from '@/assets/images/treatment.png'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-aria-components'

export default function How() {
  return (
    <div className="wrapper py-20 flex flex-col items-center gap-8">
      <h2 className="text-4xl lg:text-5xl font-bold text-center">
        How would you like to get involved.
      </h2>
      <p className="text-muted-foreground text-center">
        Zerocancer supports many people in the fight against cancer. Choose your
        role to get started.
      </p>

      <div className="hidden lg:grid grid-cols-1 md:grid-cols-6 md:grid-rows-6 gap-4 h-auto md:h-[900px] w-full">
        <div className="md:col-span-4 md:row-span-2 bg-blue-100 rounded-2xl p-8 flex justify-between">
          <div>
            <h3 className="text-2xl font-bold">Patients</h3>
            <p className="text-muted-foreground mt-2">
              Book a cancer screening or get sponsored.
            </p>
            <Link href="sign-up">
              <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
                <ArrowRight />
              </button>
            </Link>
          </div>
          <div className="mt-auto">
            <img src={patients} alt="Patients" className="w-64" />
          </div>
        </div>
        <div className="md:col-span-2 md:row-span-2 md:col-start-5 bg-blue-100 rounded-2xl p-8">
          <h3 className="text-2xl font-bold">Health Worker</h3>
          <p className="text-muted-foreground mt-2">
            Refer patients or access their results.
          </p>
          <Link href="sign-up">
            <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
              <ArrowRight />
            </button>
          </Link>
          <div className="mt-4 flex justify-end">
            <img src={health} alt="Health Worker" className="w-48" />
          </div>
        </div>
        <div className="md:col-span-2 md:row-span-4 md:row-start-3 bg-blue-100 rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold">Donor</h3>
            <p className="text-muted-foreground mt-2">
              Sponsor someone's screening and track your impact.
            </p>
            <Link href="sign-up">
              <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
                <ArrowRight />
              </button>
            </Link>
          </div>
          <img src={donor} alt="Donor" className="w-96" />
        </div>
        <div className="md:col-span-2 md:row-span-2 md:col-start-3 md:row-start-3 bg-blue-100 rounded-2xl p-8">
          <h3 className="text-2xl font-bold">Vaccination Center</h3>
          <p className="text-muted-foreground mt-2">
            Manage vaccinations, patients, and reporting.
          </p>
          <Link href="sign-up">
            <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
              <ArrowRight />
            </button>
          </Link>
          <img
            src={center}
            alt="Vaccination Center"
            className="w-48 mt-2 ml-auto"
          />
        </div>
        <div className="md:col-span-2 md:row-span-2 md:col-start-5 md:row-start-3 bg-blue-100 rounded-2xl p-8">
          <h3 className="text-2xl font-bold">Treatment Facilities</h3>
          <p className="text-muted-foreground mt-2">
            Refer patients or access their results.
          </p>
          <Link href="sign-up">
            <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
              <ArrowRight />
            </button>
          </Link>
          <img
            src={treatment}
            alt="Treatment Facilities"
            className="w-48 mt-2 ml-auto"
          />
        </div>
        <div className="md:col-span-4 md:row-span-2 md:col-start-3 md:row-start-5 bg-blue-100 rounded-2xl p-8">
          <h3 className="text-2xl font-bold">Screening Center</h3>
          <p className="text-muted-foreground mt-2">
            Manage appointments and upload screening results.
          </p>
          <Link href="sign-up">
            <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
              <ArrowRight />
            </button>
          </Link>
          <img
            src={screening}
            alt="Screening Center"
            className="w-64 ml-auto"
          />
        </div>
      </div>

      <div className="grid lg:hidden w-full gap-4">
        <div className="bg-blue-100 rounded-2xl p-8 flex justify-between items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Patients</h3>
            <p className="text-muted-foreground mt-2">
              Book a cancer screening or get sponsored.
            </p>
            <Link href="sign-up">
              <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
                <ArrowRight />
              </button>
            </Link>
          </div>
          <img src={patients} alt="Patients" className="w-32" />
        </div>
        <div className="bg-blue-100 rounded-2xl p-8 flex justify-between items-center gap-4">
          <img src={donor} alt="Donor" className="w-32" />
          <div>
            <h3 className="text-2xl font-bold">Donor</h3>
            <p className="text-muted-foreground mt-2">
              Sponsor someone's screening and track your impact.
            </p>
            <Link href="sign-up">
              <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
                <ArrowRight />
              </button>
            </Link>
          </div>
        </div>
        <div className="bg-blue-100 rounded-2xl p-8 flex justify-between items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Vaccination Center</h3>
            <p className="text-muted-foreground mt-2">
              Manage screenings, patients, and reporting.
            </p>
            <Link href="sign-up">
              <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
                <ArrowRight />
              </button>
            </Link>
          </div>
          <img src={center} alt="Vaccination Center" className="w-32" />
        </div>
        <div className="bg-blue-100 rounded-2xl p-8 flex flex-row-reverse justify-between items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Health Worker</h3>
            <p className="text-muted-foreground mt-2">
              Refer patients or access their results.
            </p>
            <Link href="sign-up">
              <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
                <ArrowRight />
              </button>
            </Link>
          </div>
          <img src={health} alt="Health Worker" className="w-32" />
        </div>
        <div className="bg-blue-100 rounded-2xl p-8 flex  justify-between items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Treatment Facilities</h3>
            <p className="text-muted-foreground mt-2">
              Refer patients or access their results.
            </p>
            <Link href="sign-up">
              <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
                <ArrowRight />
              </button>
            </Link>
          </div>
          <img src={treatment} alt="Treatment Facilities" className="w-32" />
        </div>
        <div className="bg-blue-100 rounded-2xl p-8 flex flex-row-reverse justify-between items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">Screening Center</h3>
            <p className="text-muted-foreground mt-2">
              Manage appointments and upload screening results.
            </p>
            <Link href="sign-up">
              <button className="mt-4 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary/90 transition-all duration-300">
                <ArrowRight />
              </button>
            </Link>
          </div>
          <img src={screening} alt="Screening Center" className="w-32" />
        </div>
      </div>
    </div>
  )
}
