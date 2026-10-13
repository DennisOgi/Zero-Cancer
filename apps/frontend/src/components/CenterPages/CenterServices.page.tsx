import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import {
  groupByServiceCategory,
  getServiceTypeLabel,
  serviceTypeBadgeStyles,
  serviceTypeOrder,
} from '@/lib/service-types'
import {
  addCenterMyServices,
  getCenterMyServices,
  removeCenterMyService,
  updateCenterMyServicePrice,
} from '@/services/center.service'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export function CenterServicesPage() {
  const queryClient = useQueryClient()
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([])
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [draftPrice, setDraftPrice] = useState('')

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

  const currentByCategory = useMemo(
    () => groupByServiceCategory(services),
    [services],
  )

  const availableByCategory = useMemo(
    () => groupByServiceCategory(availableToAdd),
    [availableToAdd],
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

  const priceMutation = useMutation({
    mutationFn: ({
      screeningTypeId,
      amount,
    }: {
      screeningTypeId: string
      amount: number
    }) => updateCenterMyServicePrice(screeningTypeId, amount),
    onSuccess: (result) => {
      toast.success(result.message)
      setEditingTypeId(null)
      setDraftPrice('')
      queryClient.invalidateQueries({ queryKey: ['centerMyServices'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update price')
    },
  })

  const toggleSelection = (typeId: string) => {
    setSelectedToAdd((current) =>
      current.includes(typeId)
        ? current.filter((id) => id !== typeId)
        : [...current, typeId],
    )
  }

  const startEdit = (screeningTypeId: string, price: number) => {
    setEditingTypeId(screeningTypeId)
    setDraftPrice(String(price))
  }

  const savePrice = (screeningTypeId: string, agreedPrice: number) => {
    const amount = Number(draftPrice)
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error('Enter a valid price')
      return
    }
    if (amount < agreedPrice) {
      toast.error(
        `Price cannot be below the platform base of ₦${agreedPrice.toLocaleString()}`,
      )
      return
    }
    priceMutation.mutate({ screeningTypeId, amount })
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
          Manage vaccination, screening, and treatment services patients can
          find and book at your center. Set the patient-facing price for each
          service — this is what referrals and bookings will charge.
        </p>
      </div>

      {serviceTypeOrder.map((category) => {
        const current = currentByCategory[category]
        const available = availableByCategory[category]
        if (current.length === 0 && available.length === 0) return null

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle>{getServiceTypeLabel(category)}</CardTitle>
                <Badge
                  variant="outline"
                  className={serviceTypeBadgeStyles[category]}
                >
                  {current.length} offered
                </Badge>
              </div>
              <CardDescription>
                {category === 'vaccination' &&
                  'Immunizations such as HPV and Hepatitis B vaccines.'}
                {category === 'screening' &&
                  'Cancer and diagnostic screenings offered at your center.'}
                {category === 'treatment' &&
                  'Oncology consultations and treatment services.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {current.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No {getServiceTypeLabel(category).toLowerCase()} services
                  added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {current.map((service) => {
                    const isEditing = editingTypeId === service.screeningTypeId
                    return (
                      <div
                        key={service.id}
                        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Platform base: ₦
                            {Number(service.agreedPrice || 0).toLocaleString()}
                          </p>
                          {isEditing ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                ₦
                              </span>
                              <Input
                                type="number"
                                min={service.agreedPrice || 0}
                                step="100"
                                value={draftPrice}
                                onChange={(e) => setDraftPrice(e.target.value)}
                                className="h-9 w-36"
                                aria-label={`Price for ${service.name}`}
                              />
                              <Button
                                size="sm"
                                disabled={priceMutation.isPending}
                                onClick={() =>
                                  savePrice(
                                    service.screeningTypeId,
                                    service.agreedPrice || 0,
                                  )
                                }
                              >
                                {priceMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                <span className="ml-1">Save</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingTypeId(null)
                                  setDraftPrice('')
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <p className="mt-1 text-base font-semibold text-emerald-800">
                              Patient price: ₦
                              {Number(service.price || 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {!isEditing ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                startEdit(
                                  service.screeningTypeId,
                                  service.price || 0,
                                )
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit price
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={removeMutation.isPending}
                            onClick={() =>
                              removeMutation.mutate(service.screeningTypeId)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {available.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium">
                    Add {getServiceTypeLabel(category).toLowerCase()} services
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {available.map((type) => (
                      <Button
                        key={type.id}
                        type="button"
                        variant={
                          selectedToAdd.includes(type.id)
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() => toggleSelection(type.id)}
                      >
                        {type.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <Button
        disabled={selectedToAdd.length === 0 || addMutation.isPending}
        onClick={() => addMutation.mutate(selectedToAdd)}
      >
        {addMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Add selected services
      </Button>
    </div>
  )
}

export default CenterServicesPage
