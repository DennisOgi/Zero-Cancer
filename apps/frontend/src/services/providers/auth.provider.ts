import { persistAccessToken } from '@/lib/access-token'
import * as authService from '@/services/auth.service'
import { MutationKeys } from '@/services/keys'
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
        persistAccessToken(queryClient, data.data.token)
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
    throwOnError: false,
    retry: false,
    staleTime: 60 * 60 * 1000,
  })

export const useUpdatePatientProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.updatePatientProfile],
    mutationFn: authService.updatePatientProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
    },
  })
}

export const isAuthMiddleware = async (
  queryClient: QueryClient,
  actor?: TActors,
) => {
  let auth: Awaited<ReturnType<typeof authService.authUser>> | undefined
  try {
    auth = await queryClient.ensureQueryData(useAuthUser())
  } catch {
    auth = queryClient.getQueryData(useAuthUser().queryKey)
  }

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
      persistAccessToken(queryClient, null)
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

export const useChangePassword = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MutationKeys.changePassword],
    mutationFn: authService.changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
    },
  })
}

// --- Email Verification Mutations ---

export const useVerifyEmail = () => {
  return useMutation({
    mutationKey: [MutationKeys.verifyEmail],
    mutationFn: (token: string) => authService.verifyEmail(token),
  })
}
