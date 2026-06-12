import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  addCenterMyServices,
  getCenterMyServices,
  removeCenterMyService,
} from '@/services/center.service'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export function CenterServicesPage() {
  const queryClient = useQueryClient()
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([])

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['centerMyServices'],
    queryFn: getCenterMyServices,
  })

  const { data: screeningTypesData, isLoading: typesLoading } = useQuery(
    useAllScreeningTypes(),
  )

  const services = servicesData?.data?.services || []
  const offeredTypeIds = new Set(services.map((service) => service.screeningTypeId))

  const availableToAdd = useMemo(
    () =>
      (screeningTypesData?.data || []).filter(
        (type) => !offeredTypeIds.has(type.id),
      ),
    [offeredTypeIds, screeningTypesData?.data],
  )

  const addMutation = useMutation({
    mutationFn: (screeningTypeIds: string[]) =>
      addCenterMyServices(screeningTypeIds),
    onSuccess: (result) => {
      toast.success(result.message)
      setSelectedToAdd([])
      queryClient.invalidateQueries({ queryKey: ['centerMyServices'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to add services')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (screeningTypeId: string) =>
      removeCenterMyService(screeningTypeId),
    onSuccess: (result) => {
      toast.success(result.message)
      queryClient.invalidateQueries({ queryKey: ['centerMyServices'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to remove service')
    },
  })

  const toggleSelection = (typeId: string) => {
    setSelectedToAdd((current) =>
      current.includes(typeId)
        ? current.filter((id) => id !== typeId)
        : [...current, typeId],
    )
  }

  if (isLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services Offered</h1>
        <p className="text-muted-foreground">
          Manage the screening and vaccination services patients can book at your
          center.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current services</CardTitle>
          <CardDescription>
            These services appear in search results and on your center profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.length === 0 ? (
            <p className="text-muted-foreground">
              No services added yet. Select services below to get started.
            </p>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Listed price: ₦{service.price.toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(service.screeningTypeId)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add services</CardTitle>
          <CardDescription>
            Choose from the platform catalog. New services use the agreed base
            price by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableToAdd.length === 0 ? (
            <p className="text-muted-foreground">
              You already offer all available services.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableToAdd.map((type) => (
                <Button
                  key={type.id}
                  type="button"
                  variant={
                    selectedToAdd.includes(type.id) ? 'default' : 'outline'
                  }
                  onClick={() => toggleSelection(type.id)}
                >
                  {type.name}
                </Button>
              ))}
            </div>
          )}

          <Button
            disabled={selectedToAdd.length === 0 || addMutation.isPending}
            onClick={() => addMutation.mutate(selectedToAdd)}
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add selected services
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default CenterServicesPage
