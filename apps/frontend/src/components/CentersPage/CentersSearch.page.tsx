import { centers } from '@/services/providers/center.provider'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Building2, MapPin, Phone, CheckCircle2, AlertCircle, Package } from 'lucide-react'

export default function CentersSearchPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(public)/centers' })
  const { state, lga } = search

  console.log('CentersSearchPage - search params:', { state, lga })

  const { data } = useSuspenseQuery(
    centers({
      state: state || undefined,
      lga: lga || undefined,
      pageSize: 50,
    })
  )

  console.log('CentersSearchPage - API response:', data)

  const centersData = data?.data?.centers || []

  console.log('CentersSearchPage - centers count:', centersData.length)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="wrapper py-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold">Screening Centers</h1>
          <p className="text-muted-foreground mt-2">
            {state && (
              <>
                Showing centers in <span className="font-semibold">{state}</span>
                {lga && (
                  <>
                    {' '}
                    - <span className="font-semibold">{lga}</span>
                  </>
                )}
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Found {centersData.length} center{centersData.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="wrapper py-8">
        {centersData.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Centers Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find any screening centers in {state}
              {lga && ` - ${lga}`}.
            </p>
            <button
              onClick={() => navigate({ to: '/' })}
              className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
            >
              Try Another Location
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centersData.map((center: any) => (
              <div
                key={center.id}
                className="bg-white rounded-lg border hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Funding Status Banner */}
                {center.isFunded ? (
                  <div className="bg-green-50 border-b border-green-100 px-4 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Funded by {center.fundingSource}
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      Seeking Funding
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Center Name */}
                  <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                    {center.centerName}
                  </h3>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{center.address}</p>
                      <p className="font-medium text-foreground">
                        {center.lga}, {center.state}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  {center.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Phone className="w-4 h-4" />
                      <span>{center.phone}</span>
                    </div>
                  )}

                  {/* Kit Availability */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">Kit Availability</span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          center.availableKits > 20
                            ? 'text-green-600'
                            : center.availableKits > 5
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {center.availableKits} available
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          center.availableKits > 20
                            ? 'bg-green-500'
                            : center.availableKits > 5
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (center.availableKits / center.totalKits) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {center.usedKits} of {center.totalKits} kits used
                    </p>
                  </div>

                  {/* Funding Details */}
                  {center.isFunded && center.fundingAmount && (
                    <div className="text-sm space-y-1 mb-4 pb-4 border-b">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Funding Amount:</span>
                        <span className="font-semibold">
                          {formatCurrency(center.fundingAmount)}
                        </span>
                      </div>
                      {center.fundingExpiry && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valid Until:</span>
                          <span className="font-medium">
                            {formatDate(center.fundingExpiry)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services Count */}
                  {center.services && center.services.length > 0 && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Offers {center.services.length} screening service
                      {center.services.length !== 1 ? 's' : ''}
                    </p>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      // Navigate to patient registration/login
                      navigate({ to: '/register', search: { actor: 'patient' } })
                    }}
                    className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium"
                    disabled={center.availableKits === 0}
                  >
                    {center.availableKits === 0 ? 'No Kits Available' : 'Book Screening'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
