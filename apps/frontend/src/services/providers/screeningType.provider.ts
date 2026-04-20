import { QueryKeys } from '@/services/keys'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import {
  fetchAllScreeningTypes,
  fetchScreeningTypeById,
  fetchScreeningTypeByName,
  fetchScreeningTypeCategories,
  fetchScreeningTypes,
  fetchScreeningTypesByCategory,
} from '../screeningType.service'

export const useScreeningTypes = (params: {
  page?: number
  pageSize?: number
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypes, params],
    queryFn: () => fetchScreeningTypes(params),
  })

// Get screening types with infinite loading (paginated, searchable)
export const useScreeningTypesInfinite = (params: {
  pageSize?: number
  search?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.screeningTypes, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return fetchScreeningTypes({
        ...params,
        page: pageParam,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Handle optional pagination fields from TGetScreeningTypesResponse
      const { page, totalPages } = lastPage
      return page && totalPages && page < totalPages ? page + 1 : undefined
    },
  })

export const useAllScreeningTypes = (search?: string) =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypesAll, search],
    queryFn: () => fetchAllScreeningTypes({ search }),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: Infinity, // Keep this data fresh indefinitely
  })

export const useScreeningTypeCategories = () =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypeCategories],
    queryFn: fetchScreeningTypeCategories,
  })

export const useScreeningTypesByCategory = (
  categoryId: string,
  params: { page?: number; pageSize?: number; search?: string },
) =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypesCategory, categoryId, params],
    queryFn: () => fetchScreeningTypesByCategory(categoryId, params),
    enabled: !!categoryId,
  })

// Get screening types by category with infinite loading (paginated, searchable)
export const useScreeningTypesByCategoryInfinite = (
  categoryId: string,
  params: { pageSize?: number; search?: string },
) =>
  infiniteQueryOptions({
    queryKey: [
      QueryKeys.screeningTypesCategory,
      'infinite',
      categoryId,
      params,
    ],
    queryFn: ({ pageParam }) => {
      return fetchScreeningTypesByCategory(categoryId, {
        ...params,
        page: pageParam,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Handle optional pagination fields from TGetScreeningTypesResponse
      const { page, totalPages } = lastPage
      return page && totalPages && page < totalPages ? page + 1 : undefined
    },
    enabled: !!categoryId,
  })

export const useScreeningTypeById = (id: string) =>
  queryOptions({
    queryKey: [QueryKeys.screeningType, id],
    queryFn: () => fetchScreeningTypeById(id),
    enabled: !!id,
  })

export const useScreeningTypeByName = (name: string) =>
  queryOptions({
    queryKey: [QueryKeys.screeningTypeByName, name],
    queryFn: () => fetchScreeningTypeByName(name),
    enabled: !!name,
  })
