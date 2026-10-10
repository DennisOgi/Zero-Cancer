import { ACCESS_TOKEN_KEY } from '@/services/keys'
import type { QueryClient } from '@tanstack/react-query'

const STORAGE_KEY = 'zc_access_token'

export function persistAccessToken(
  queryClient: QueryClient,
  token: string | null,
) {
  if (token) {
    queryClient.setQueryData([ACCESS_TOKEN_KEY], token)
    try {
      sessionStorage.setItem(STORAGE_KEY, token)
    } catch {
      // Private mode / blocked storage should not break login.
    }
    return
  }

  queryClient.removeQueries({ queryKey: [ACCESS_TOKEN_KEY] })
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function hydrateAccessToken(queryClient: QueryClient) {
  if (queryClient.getQueryData([ACCESS_TOKEN_KEY])) return
  try {
    const token = sessionStorage.getItem(STORAGE_KEY)
    if (token) {
      queryClient.setQueryData([ACCESS_TOKEN_KEY], token)
    }
  } catch {
    // ignore
  }
}

export function readAccessToken(queryClient: QueryClient): string | undefined {
  const cached = queryClient.getQueryData<string>([ACCESS_TOKEN_KEY])
  if (cached) return cached
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}
