export const ACCESS_TOKEN_TTL_SEC = 60 * 60 * 24
export const REFRESH_TOKEN_TTL_SEC = 60 * 60 * 24 * 7

/** Claim that marks a JWT as a refresh token so it cannot be used as an access token. */
export const REFRESH_TOKEN_TYPE = { typ: 'refresh' } as const

export function isRefreshTokenPayload(payload: unknown): boolean {
  return (payload as { typ?: unknown } | undefined)?.typ === REFRESH_TOKEN_TYPE.typ
}
