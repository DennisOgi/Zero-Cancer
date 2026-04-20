import screening from '@/assets/images/screening.png'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'

export default function Find() {
  return (
    <div className="wrapper py-20 grid md:grid-cols-2 gap-10 items-center">
      <div className="space-y-6">
        <h2 className="text-4xl lg:text-5xl font-bold">
          Find a Screening Center Near You
        </h2>
        <p className="text-muted-foreground">
          Search for cancer screening centers and order test kits easily,
          wherever you are.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="state" className="text-sm font-medium">
              Select state
            </label>
            <Select>
              <SelectTrigger id="state" className="w-full">
                <SelectValue placeholder="Lagos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lagos">Lagos</SelectItem>
                <SelectItem value="abuja">Abuja</SelectItem>
                <SelectItem value="rivers">Rivers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="lga" className="text-sm font-medium">
              Select local government
            </label>
            <Select>
              <SelectTrigger id="lga" className="w-full">
                <SelectValue placeholder="Surulere" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="surulere">Surulere</SelectItem>
                <SelectItem value="ikeja">Ikeja</SelectItem>
                <SelectItem value="lekki">Lekki</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <button className="px-8 py-2 bg-secondary text-white rounded-lg">
          Find Centers
        </button>
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center text-center bg-gray-100 p-8 rounded-lg h-[550px] ">
        <img src={screening} alt="Screening Center" className="w-64" />
        <p className="text-muted-foreground mt-4">
          Use the search tool on the left to explore available screening centers
          in your area.
        </p>
      </div>
    </div>
  )
}
