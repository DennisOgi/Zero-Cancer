/* eslint-disable @typescript-eslint/no-explicit-any */
import * as endpoints from '@/services/endpoints'
import { ACCESS_TOKEN_KEY } from '@/services/keys'
import type { QueryClient } from '@tanstack/react-query'
import type * as t from '@zerocancer/shared/types'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import axios from 'axios'

// Remove the local QueryClient - we'll pass it as parameter
axios.defaults.withCredentials = true

async function _get<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
  const response = await axios.get(url, { ...options })
  return response.data
}

async function _getResponse<T>(
  url: string,
  options?: AxiosRequestConfig,
): Promise<T> {
  return await axios.get(url, { ...options })
}

async function _post(url: string, data?: any) {
  const response = await axios.post(url, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
  return response.data
}

async function _postMultiPart(
  url: string,
  formData: FormData,
  options?: AxiosRequestConfig,
) {
  const response = await axios.post(url, formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

async function _postTTS(
  url: string,
  formData: FormData,
  options?: AxiosRequestConfig,
) {
  const response = await axios.post(url, formData, {
    ...options,
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'arraybuffer',
  })
  return response.data
}

async function _put(url: string, data?: any) {
  const response = await axios.put(url, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
  return response.data
}

async function _delete<T>(url: string): Promise<T> {
  const response = await axios.delete(url)
  return response.data
}

async function _deleteWithOptions<T>(
  url: string,
  options?: AxiosRequestConfig,
): Promise<T> {
  const response = await axios.delete(url, { ...options })
  return response.data
}

async function _patch(url: string, data?: any) {
  const response = await axios.patch(url, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
  return response.data
}

let isRefreshing = false
let failedQueue: {
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}[] = []

const refreshToken = (
  retry?: boolean,
): Promise<t.TRefreshTokenResponse | undefined> =>
  _post(endpoints.refreshToken(retry))

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Function to setup axios interceptors with the correct QueryClient
export function setupAxiosInterceptors(queryClient: QueryClient) {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (!error.response) {
        return Promise.reject(error)
      }

      if (originalRequest.url?.includes('/api/auth/2fa') === true) {
        return Promise.reject(error)
      }
      if (originalRequest.url?.includes('/api/auth/logout') === true) {
        return Promise.reject(error)
      }

      if (error.response.status === 401 && !originalRequest._retry) {
        console.warn(
          '401 error, refreshing token & retry is false',
          error.response.data,
        )
        originalRequest._retry = true

        if (isRefreshing) {
          console.warn('isRefreshing', isRefreshing)
          try {
            const token = await new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject })
            })
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return await axios(originalRequest)
          } catch (err) {
            return Promise.reject(err)
          }
        }
        isRefreshing = true

        try {
          const response = await refreshToken(
            // Handle edge case where we get a blank screen if the initial 401 error is from a refresh token request
            originalRequest.url?.includes('/auth/refresh') === true
              ? true
              : false,
          )

          const token = response?.data?.token ?? ''

          if (!!token) {
            // Update React Query cache with new access token
            queryClient.setQueryData([ACCESS_TOKEN_KEY], token)
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            processQueue(null, token)
            return await axios(originalRequest)
          } else {
            window.location.href = '/login'
          }
        } catch (err) {
          processQueue(err as AxiosError, null)
          return Promise.reject(err)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    },
  );

  // Axios request interceptor to attach access token from React Query cache
  axios.interceptors.request.use(
    (config) => {
      // Handle API URL rewriting for both dev and production
      if (
        config.url?.startsWith('/api/') &&
        !config.url.startsWith('/api/v1/') &&
        !config.url.startsWith('http')
      ) {
        if (import.meta.env.VITE_ENV_MODE !== 'production') {
          // Development: Frontend (3000) -> Backend (8000)
          config.url = config.url.replace(
            '/api/',
            `${import.meta.env.VITE_DEV_API_BASE_URL || 'http://localhost:8787'}/api/v1/`,
          )
        } else {
          // Production: Same server, just rewrite path
          config.url = config.url.replace('/api/', '/api/v1/')
        }
      }

      // Get access token from React Query cache
      const token = queryClient.getQueryData<string>([ACCESS_TOKEN_KEY])
      if (token) {
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  );
}

export default {
  get: _get,
  getResponse: _getResponse,
  post: _post,
  postMultiPart: _postMultiPart,
  postTTS: _postTTS,
  put: _put,
  delete: _delete,
  deleteWithOptions: _deleteWithOptions,
  patch: _patch,
  refreshToken,
  setupAxiosInterceptors,
}
