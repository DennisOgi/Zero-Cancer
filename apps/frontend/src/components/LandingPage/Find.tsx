import screening from '@/assets/images/screening.png'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { NIGERIA_STATES_LGAS, getLGAsForState } from '@/data/nigeria-locations'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export default function Find() {
  const navigate = useNavigate()
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedLGA, setSelectedLGA] = useState<string>('')
  const [lgas, setLgas] = useState<string[]>([])

  const handleStateChange = (state: string) => {
    setSelectedState(state)
    setSelectedLGA('') // Reset LGA when state changes
    const stateLGAs = getLGAsForState(state)
    setLgas(stateLGAs)
  }

  const handleFindCenters = () => {
    if (!selectedState) {
      alert('Please select a state')
      return
    }
    
    // Navigate to centers search page with query params
    navigate({
      to: '/centers',
      search: {
        state: selectedState,
        lga: selectedLGA || undefined,
      },
    })
  }

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
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger id="state" className="w-full">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIA_STATES_LGAS.map((location) => (
                  <SelectItem key={location.state} value={location.state}>
                    {location.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="lga" className="text-sm font-medium">
              Select local government (optional)
            </label>
            <Select
              value={selectedLGA}
              onValueChange={setSelectedLGA}
              disabled={!selectedState}
            >
              <SelectTrigger id="lga" className="w-full">
                <SelectValue placeholder={selectedState ? "Select LGA" : "Select state first"} />
              </SelectTrigger>
              <SelectContent>
                {lgas.map((lga) => (
                  <SelectItem key={lga} value={lga}>
                    {lga}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <button
          onClick={handleFindCenters}
          className="px-8 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
        >
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
