import { useAuthUser, useLogout } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

function initialsFromName(name?: string | null) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'ZC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function profileHref(profile?: string | null) {
  switch (String(profile || '').toLowerCase()) {
    case 'patient':
      return '/patient/profile'
    case 'center':
    case 'center_staff':
      return '/center/profile'
    case 'donor':
      return '/donor'
    case 'admin':
      return '/admin'
    default:
      return '/'
  }
}

export function DashboardAccountActions({
  tone = 'onPrimary',
  onLogout,
}: {
  tone?: 'onPrimary' | 'onLight'
  onLogout?: () => void
}) {
  const { data: authData } = useQuery(useAuthUser())
  const { mutate: logout, isPending } = useLogout()
  const user = authData?.data?.user
  const href = profileHref(user?.profile)
  const name = user?.fullName || user?.centerName || user?.email || 'Account'

  const avatarBorder =
    tone === 'onPrimary' ? 'border-white/50' : 'border-primary/20'
  const logoutClass =
    tone === 'onPrimary'
      ? 'border-white/40 text-white hover:border-white hover:bg-white/10'
      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        to={href}
        preload="render"
        title={name}
        className="shrink-0"
        aria-label="Open profile"
      >
        <span
          className={`inline-flex h-10 w-10 overflow-hidden rounded-full border-2 bg-white/15 text-xs font-bold text-white ring-offset-2 ${avatarBorder}`}
        >
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className={`flex h-full w-full items-center justify-center ${
                tone === 'onLight' ? 'bg-primary text-white' : ''
              }`}
            >
              {initialsFromName(name)}
            </span>
          )}
        </span>
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          onLogout?.()
          logout()
        }}
        className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-60 ${logoutClass}`}
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </div>
  )
}
