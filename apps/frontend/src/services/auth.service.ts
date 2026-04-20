import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import { loginSchema } from '@zerocancer/shared/schemas/auth.schema'
import type {
  TActors,
  TAuthMeResponse,
  TForgotPasswordResponse,
  TLoginResponse,
  TLogoutResponse,
  TResendVerificationResponse,
  TResetPasswordResponse,
  TVerifyEmailResponse,
} from '@zerocancer/shared/types'
import type { z } from 'zod'

// Login service
export const loginUser = async (
  params: z.infer<typeof loginSchema>,
  actor: TActors,
): Promise<TLoginResponse> => {
  return await request.post(endpoints.loginUser(actor), params)
}

// Authenticated user service
export const authUser = async (): Promise<TAuthMeResponse | null> => {
  try {
    const response = await request.get<TAuthMeResponse>(endpoints.authUser())
    console.log('Auth User Email & Profile:', response.data.user)
    return response
  } catch (error) {
    console.error('Error fetching authenticated user:', error)
    return null
  }
}

// logout
export const logout = async (): Promise<TLogoutResponse> => {
  return await request.post(endpoints.logoutUser())
}

// Check profiles (re-export from register service for convenience)
export { checkProfiles } from './register.service'

// Forgot password
export const forgotPassword = async (
  email: string,
): Promise<TForgotPasswordResponse> => {
  return await request.post(endpoints.forgotPassword(), { email })
}

// Reset password
export const resetPassword = async (
  token: string,
  password: string,
): Promise<TResetPasswordResponse> => {
  return await request.post(endpoints.resetPassword(), { token, password })
}

// Verify email
export const verifyEmail = async (
  token: string,
): Promise<TVerifyEmailResponse> => {
  return await request.post(endpoints.verifyEmail(), { token })
}

// Resend verification email
export const resendVerification = async (
  email: string,
  profileType: string,
): Promise<TResendVerificationResponse> => {
  return await request.post(endpoints.resendVerification(), {
    email,
    profileType,
  })
}

// // request password reest
// export const requestPasswordReset = (params: t.TRequestPasswordResetParams) => {
//   return request.post(endpoints.requestPasswordReset(), params)
// }

// // reset password
// export const resetPassword = ({
//   uidb64,
//   token,
//   ...params
// }: t.TResetPasswordParams) => {
//   return request.post(endpoints.resetPassword(uidb64, token), {
//     uidb64,
//     token,
//     ...params,
//   })
// }

// // confirm email
// export const confirmEmail = (params: t.TConfirmEmailParams) => {
//   return request.post(endpoints.verifyEmail(), params)
// }

// // resend confirmation email
// export const resendConfirmEmail = (params: t.TResendConfirmEmailParams) => {
//   return request.post(endpoints.resendVerifyEmail(), params)
// }

// // 2fa setup

// // password reset

// // confirm email

// // 2fa setup
// // 2fa verify
