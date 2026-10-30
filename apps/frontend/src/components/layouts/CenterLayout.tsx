import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import calendar from '@/assets/images/calendar.png'
import cross from '@/assets/images/cross.png'
import eventsIcon from '@/assets/images/events.png'
import health from '@/assets/images/health.png'
import kitsIcon from '@/assets/images/kits.png'
import whiteLogo from '@/assets/images/logo.svg'
import logoutIcon from '@/assets/images/logout.png'
import notificationIcon from '@/assets/images/notification.png'
import nursesIcon from '@/assets/images/nurses.png'
import payoutsIcon from '@/assets/images/payouts.png'
import people from '@/assets/images/people.png'
import profileIcon from '@/assets/images/profile.png'
import reportsIcon from '@/assets/images/reports.png'
import screening from '@/assets/images/screening.png'
import treatment from '@/assets/images/treatment.png'
import waitlistIcon from '@/assets/images/waitlist.png'
import walletIcon from '@/assets/images/wallet.png'
import { DashboardAccountActions } from '@/components/layouts/DashboardAccountActions'
import { Button } from '@/components/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { Input } from '@/components/shared/ui/input'
import { isClinicalStaffRole, staffRoleLabel } from '@zerocancer/shared'
import { useAuthUser, useLogout } from '@/services/providers/auth.provider'
import { useUpdateStaffProfile } from '@/services/providers/center.provider'
import { useNotifications } from '@/services/providers/notification.provider'
import { toast } from 'sonner'

const FACILITY_ADMIN_ONLY_PATHS = [
  '/center/profile',
  '/center/availability',
  '/center/team-schedules',
  '/center/wallet',
  '/center/staff',
  '/center/events',
  '/center/receipt-history',
]

const MOBILE_PRIMARY_COUNT = 4

export function CenterLayout() {
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()
  const updateProfile = useUpdateStaffProfile()
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)

  const authUserQuery = useQuery(useAuthUser())
  const user = authUserQuery.data?.data?.user
  const isStaff = user?.profile === 'CENTER_STAFF'
  const isAdmin = user?.profile === 'CENTER' || user?.staffRole === 'ADMIN'
  const isClinicalStaff = isStaff && isClinicalStaffRole(user?.staffRole)
  const staffId = user?.staffId
  const canSeePrivateEarnings =
    Boolean(staffId) &&
    user?.profile !== 'CENTER' &&
    isClinicalStaffRole(user?.staffRole)

  const staffPersonalName = (user?.staffFullName || '').trim()
  // Any CenterStaff row (clinical or ADMIN staff account) without a personal name
  const needsDisplayName = Boolean(staffId) && !staffPersonalName
  const displayName =
    staffPersonalName ||
    (needsDisplayName
      ? 'Add your name'
      : user?.fullName || user?.centerName || 'Account')
  const roleLabel = isAdmin
    ? 'Facility admin'
    : staffRoleLabel(user?.staffRole)
  const facilityName = user?.centerName || ''

  const { data: notificationsData } = useQuery(useNotifications())
  const unreadCount =
    notificationsData?.data?.filter((n: any) => !n.read).length || 0

  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Harden: redirect staff away from facility-admin pages (must re-check on every nav)
  useEffect(() => {
    if (!isStaff || isAdmin) return
    if (
      FACILITY_ADMIN_ONLY_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/'),
      )
    ) {
      navigate({ to: '/center' })
    }
  }, [isStaff, isAdmin, navigate, pathname])

  const openNameDialog = () => {
    setDraftName(staffPersonalName)
    setNameDialogOpen(true)
  }

  const saveDisplayName = async () => {
    const fullName = draftName.trim()
    if (fullName.length < 2) {
      toast.error('Enter your full name')
      return
    }
    try {
      await updateProfile.mutateAsync({ fullName })
      toast.success('Name saved')
      setNameDialogOpen(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not save name')
    }
  }

  const clinicalNavLinks = [
    { to: '/center', label: 'Dashboard', icon: cross },
    { to: '/center/services', label: 'Services', icon: health },
    { to: '/center/patients', label: 'Patients', icon: people },
    {
      to: '/center/register-patient',
      label: 'Register patient',
      icon: waitlistIcon,
    },
    { to: '/center/appointments', label: 'Appointments', icon: calendar },
    {
      to: '/center/my-schedule',
      label: 'My schedule',
      icon: calendar,
    },
    { to: '/center/verify-code', label: 'Verify Code', icon: screening },
    { to: '/center/upload-results', label: 'Upload Results', icon: treatment },
    { to: '/center/reports', label: 'Reports', icon: reportsIcon },
    { to: '/center/kits', label: 'Kits and Devices', icon: kitsIcon },
    {
      to: '/center/notifications',
      label: 'Notifications',
      icon: notificationIcon,
    },
  ]

  const adminNavLinks = [
    { to: '/center', label: 'Dashboard', icon: cross },
    { to: '/center/services', label: 'Services', icon: health },
    { to: '/center/patients', label: 'Patients', icon: people },
    {
      to: '/center/register-patient',
      label: 'Register patient',
      icon: waitlistIcon,
    },
    { to: '/center/appointments', label: 'Appointments', icon: calendar },
    { to: '/center/availability', label: 'Availability', icon: calendar },
    {
      to: '/center/team-schedules',
      label: 'Team schedules',
      icon: calendar,
    },
    { to: '/center/verify-code', label: 'Verify Code', icon: screening },
    { to: '/center/upload-results', label: 'Upload Results', icon: treatment },
    { to: '/center/reports', label: 'Reports', icon: reportsIcon },
    { to: '/center/kits', label: 'Kits and Devices', icon: kitsIcon },
    {
      to: '/center/notifications',
      label: 'Notifications',
      icon: notificationIcon,
    },
    { to: '/center/profile', label: 'Profile', icon: profileIcon },
    { to: '/center/receipt-history', label: 'Payouts', icon: payoutsIcon },
    { to: '/center/wallet', label: 'Wallet', icon: walletIcon },
    { to: '/center/staff', label: 'Doctors & staff', icon: nursesIcon },
    { to: '/center/events', label: 'Events', icon: eventsIcon },
  ]

  const earningsNav = canSeePrivateEarnings
    ? [{ to: '/center/earnings', label: 'Earnings', icon: payoutsIcon }]
    : []

  const navLinks = isAdmin
    ? [...adminNavLinks, ...earningsNav]
    : isClinicalStaff
      ? [...clinicalNavLinks, ...earningsNav]
      : [...clinicalNavLinks.filter((l) => l.to !== '/center/my-schedule'), ...earningsNav]

  const mobilePrimaryLinks = navLinks.slice(0, MOBILE_PRIMARY_COUNT)
  const mobileMoreLinks = navLinks.slice(MOBILE_PRIMARY_COUNT)

  const IdentityChip = () => (
    <button
      type="button"
      onClick={needsDisplayName ? openNameDialog : undefined}
      className={`mx-2 lg:mx-4 mb-3 w-[calc(100%-1rem)] rounded-lg bg-white/10 px-3 py-2 text-left text-white ${
        needsDisplayName
          ? 'cursor-pointer ring-1 ring-amber-300/60 hover:bg-white/15'
          : 'cursor-default'
      }`}
    >
      <p className="text-sm font-semibold truncate" title={displayName}>
        {displayName}
      </p>
      <p className="text-xs text-white/80 truncate">
        {roleLabel}
        {facilityName ? ` · ${facilityName}` : ''}
      </p>
    </button>
  )

  return (
    <div className="min-h-screen w-full">
      <div className="fixed inset-y-0 left-0 z-50 w-60 xl:w-72 hidden md:block bg-primary">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center px-4 lg:h-[80px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <img
                src={whiteLogo}
                alt="ZeroCancer"
                className="h-12 cursor-pointer hover:opacity-90 transition-opacity"
              />
              {isStaff && !isAdmin && (
                <span className="text-sm text-gray-300 ml-2">Staff Portal</span>
              )}
            </Link>
          </div>
          <IdentityChip />
          <div className="flex-1 overflow-y-auto flex flex-col justify-between">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-2 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  preload="intent"
                  className="flex items-center gap-4 rounded-lg px-3 py-3 text-white transition-all hover:bg-white/20 relative"
                  activeOptions={{ exact: true }}
                  activeProps={{ className: 'bg-white/30 font-semibold' }}
                >
                  <img src={link.icon} alt={link.label} className="h-6 w-6" />
                  {link.label}
                  {link.to === '/center/notifications' && unreadCount > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-2 lg:p-4 mt-auto">
              <button
                onClick={() => logout()}
                className="cursor-pointer flex w-full items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium text-white transition-all hover:bg-white/20"
              >
                <img src={logoutIcon} alt="Logout" className="h-6 w-6" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:ml-60 xl:ml-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-primary px-4 shadow-md md:h-20 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="flex items-center gap-2 font-semibold md:hidden">
              <img
                src={whiteLogo}
                alt="ZeroCancer"
                className="h-12 cursor-pointer hover:opacity-90 transition-opacity"
              />
            </Link>
            <div className="hidden min-w-0 sm:block md:hidden">
              <p className="truncate text-xs font-medium text-white">{displayName}</p>
              <p className="truncate text-[11px] text-white/70">{roleLabel}</p>
            </div>
          </div>
          <DashboardAccountActions />
        </header>

        <main className="flex-grow bg-neutral-50 p-4 pb-24 md:p-6 md:pb-6">
          {needsDisplayName ? (
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  Complete your profile
                </p>
                <p className="text-sm text-amber-900/80">
                  {isClinicalStaff
                    ? 'Add your name so patients and referrals show you as a nurse or doctor, not the facility name.'
                    : 'Add your name so teammates and patients see who you are, not only your email.'}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={openNameDialog}
              >
                Add name
              </Button>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>

      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your display name</DialogTitle>
            <DialogDescription>
              This name appears on your referral link and in facility lists.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="e.g. Ada Okonkwo"
            autoComplete="name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void saveDisplayName()
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveDisplayName()}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving…' : 'Save name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
        <DialogContent className="bottom-0 top-auto translate-y-0 rounded-t-2xl max-h-[75vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
            <DialogDescription>
              All {roleLabel.toLowerCase()} tools for this facility.
            </DialogDescription>
          </DialogHeader>
          <nav className="grid gap-1 pb-2">
            {mobileMoreLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                preload="intent"
                onClick={() => setMobileMoreOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-neutral-100"
              >
                <img src={link.icon} alt="" className="h-5 w-5" />
                {link.label}
                {link.to === '/center/notifications' && unreadCount > 0 ? (
                  <span className="ml-auto rounded-full bg-red-500 px-2 text-xs text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-2 inset-x-2 md:hidden bg-white z-50 shadow-lg rounded-xl">
        <nav className="flex justify-around items-center h-16 px-1">
          {mobilePrimaryLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex-1 relative"
              activeOptions={{ exact: link.to === '/center' }}
              preload="intent"
            >
              <div className="flex h-16 w-full flex-col items-center justify-center rounded-lg p-1 transition-colors duration-200">
                <img src={link.icon} alt={link.label} className="h-6 w-6" />
                <span className="mt-2 text-xs text-muted-foreground">
                  {link.label.split(' ')[0]}
                </span>
                {link.to === '/center/notifications' && unreadCount > 0 && (
                  <span className="absolute top-2 right-1/2 translate-x-3 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
          {mobileMoreLinks.length > 0 ? (
            <button
              type="button"
              className="flex-1"
              onClick={() => setMobileMoreOpen(true)}
              aria-label="More menu"
            >
              <div className="flex h-16 w-full flex-col items-center justify-center rounded-lg p-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-700">
                  ···
                </span>
                <span className="mt-2 text-xs text-muted-foreground">More</span>
              </div>
            </button>
          ) : null}
        </nav>
      </div>
    </div>
  )
}

export default CenterLayout
