import * as authService from '@/services/auth.service'
import { ACCESS_TOKEN_KEY, MutationKeys } from '@/services/keys'
// import * as registerService from '@/services/register.service'
import {
  QueryClient,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { loginSchema } from '@zerocancer/shared/schemas/auth.schema'
import type { TActors } from '@zerocancer/shared/types'
import type { z } from 'zod'

export const useLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.loginUser],
    mutationFn: ({
      params,
      actor,
    }: {
      params: z.infer<typeof loginSchema>
      actor: TActors
    }) => authService.loginUser(params, actor),
    onSettled: (data) => {
      if (data?.data?.token) {
        // Store access token in React Query cache
        queryClient.setQueryData([ACCESS_TOKEN_KEY], data.data.token)
        queryClient.invalidateQueries({
          queryKey: ['authUser'],
        })
      }
    },
  })
}

// export const getAccessToken = () => {
//   const queryClient = useQueryClient()
//   return queryClient.getQueryData<string>([ACCESS_TOKEN_KEY])
// }

export const useAuthUser = () =>
  queryOptions({
    queryKey: ['authUser'],
    queryFn: authService.authUser,
    // throwOnError
    throwOnError: false,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

export const isAuthMiddleware = async (
  queryClient: QueryClient,
  actor?: TActors,
) => {
  const auth = await queryClient.ensureQueryData(useAuthUser())

  const isAuthenticated = !!auth && !!auth.data
  const profile = auth?.data?.user?.profile

  if (!actor) {
    return { isAuth: isAuthenticated, profile }
  }

  // Check if user's profile matches the required actor role
  const profileMatches = auth?.data?.user?.profile === actor.toUpperCase()

  return {
    isAuth: isAuthenticated,
    isAuthorized: isAuthenticated && profileMatches,
    profile,
  }
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationKey: [MutationKeys.logoutUser],
    mutationFn: authService.logout,
    onSuccess: () => {
      // Remove access token and user data from React Query cache
      queryClient.clear()
      navigate({ to: '/', reloadDocument: true })
    },
  })
}

export const useResendVerification = () => {
  return useMutation({
    mutationKey: [MutationKeys.resendVerification],
    mutationFn: ({
      email,
      profileType,
    }: {
      email: string
      profileType: string
    }) => authService.resendVerification(email, profileType),
  })
}

// --- Password Reset Mutations ---

export const useForgotPassword = () => {
  return useMutation({
    mutationKey: [MutationKeys.forgotPassword],
    mutationFn: (email: string) => authService.forgotPassword(email),
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationKey: [MutationKeys.resetPassword],
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
  })
}

// --- Email Verification Mutations ---

export const useVerifyEmail = () => {
  return useMutation({
    mutationKey: [MutationKeys.verifyEmail],
    mutationFn: (token: string) => authService.verifyEmail(token),
  })
}
