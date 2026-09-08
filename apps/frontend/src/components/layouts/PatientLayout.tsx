import { Link, Outlet } from '@tanstack/react-router'
import calendar from '@/assets/images/calendar.png'
import cross from '@/assets/images/cross.png'
import logo from '@/assets/images/logo.svg'
import logoutIcon from '@/assets/images/logout.png'
import notification from '@/assets/images/notification.png'
import people from '@/assets/images/people.png'
import stethoscope from '@/assets/images/stethoscope.png'
import reportIcon from '@/assets/images/stethoscope.png'
import { cn } from '@/lib/utils'
import { useLogout } from '@/services/providers/auth.provider'
import { useNotifications } from '@/services/providers/notification.provider'
import { useQuery } from '@tanstack/react-query'
import { PiggyBank, Share2, type LucideIcon } from 'lucide-react'

type NavLink =
  | {
      to: string
      label: string
      shortLabel: string
      icon: string
      iconType: 'image'
      mobile: boolean
    }
  | {
      to: string
      label: string
      shortLabel: string
      icon: LucideIcon
      iconType: 'lucide'
      mobile: boolean
    }

function NavIcon({
  link,
  className,
}: {
  link: NavLink
  className?: string
}) {
  if (link.iconType === 'image') {
    return <img src={link.icon} alt="" className={cn('h-6 w-6', className)} />
  }
  const Icon = link.icon
  return <Icon className={cn('h-5 w-5', className)} strokeWidth={2} />
}

export function PatientLayout() {
  const { mutate: logout } = useLogout()

  const navLinks: NavLink[] = [
    {
      to: '/patient',
      label: 'Dashboard',
      shortLabel: 'Home',
      icon: cross,
      iconType: 'image',
      mobile: true,
    },
    {
      to: '/patient/book',
      label: 'Book Screening',
      shortLabel: 'Book',
      icon: stethoscope,
      iconType: 'image',
      mobile: true,
    },
    {
      to: '/patient/appointments',
      label: 'Appointments',
      shortLabel: 'Appts',
      icon: calendar,
      iconType: 'image',
      mobile: true,
    },
    {
      to: '/patient/reports',
      label: 'Reports',
      shortLabel: 'Reports',
      icon: reportIcon,
      iconType: 'image',
      mobile: false,
    },
    {
      to: '/patient/savings',
      label: 'Save to screen',
      shortLabel: 'Save',
      icon: PiggyBank,
      iconType: 'lucide',
      mobile: false,
    },
    {
      to: '/patient/agent',
      label: 'Earn / Refer',
      shortLabel: 'Earn',
      icon: Share2,
      iconType: 'lucide',
      mobile: true,
    },
    {
      to: '/patient/notifications',
      label: 'Notifications',
      shortLabel: 'Alerts',
      icon: notification,
      iconType: 'image',
      mobile: true,
    },
    {
      to: '/patient/profile',
      label: 'Profile',
      shortLabel: 'Profile',
      icon: people,
      iconType: 'image',
      mobile: false,
    },
  ]

  const mobileLinks = navLinks.filter((link) => link.mobile)

  const { data } = useQuery(useNotifications())
  const numberOfUnreadNotifications =
    data?.data?.filter((n) => !n.read).length || 0

  return (
    <div className="min-h-screen w-full">
      <div className="fixed inset-y-0 left-0 z-50 w-60 xl:w-72 hidden md:block bg-primary">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center px-4 lg:h-[80px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <img
                src={logo}
                alt="ZeroCancer"
                className="h-12 cursor-pointer hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col justify-between">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  preload="render"
                  className="flex items-center gap-4 rounded-lg px-3 py-3 text-white transition-all hover:bg-white/20"
                  activeOptions={
                    link.to === '/patient' ? { exact: true } : { exact: false }
                  }
                  activeProps={{ className: 'bg-white/30 font-semibold' }}
                >
                  <div className="relative">
                    <NavIcon link={link} className="text-white" />
                    {link.to === '/patient/notifications' &&
                      numberOfUnreadNotifications !== 0 && (
                        <span className="absolute -bottom-1 right-0 block size-3.5 text-xs rounded-full bg-red-500 ring-1 ring-white" />
                      )}
                  </div>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="p-2 lg:p-4 mt-auto">
              <button
                onClick={() => {
                  logout()
                }}
                className="cursor-pointer flex w-full items-center gap-4 rounded-lg px-3 py-3 text-sm font-medium text-white transition-all hover:bg-white/20"
              >
                <img src={logoutIcon} alt="logout" className="h-6 w-6" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:ml-60 xl:ml-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-primary px-4 py-6 shadow-md md:hidden">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img
              src={logo}
              alt="ZeroCancer"
              className="h-12 cursor-pointer hover:opacity-90 transition-opacity"
            />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              className="cursor-pointer rounded-full p-2 text-white transition-all hover:bg-white/20"
              aria-label="Logout"
            >
              <img src={logoutIcon} alt="logout" className="h-6 w-6" />
            </button>
          </div>
        </header>

        <main className="flex-grow bg-neutral-50 p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      <div className="fixed bottom-2 inset-x-2 md:hidden bg-white z-50 shadow-lg rounded-xl">
        <nav className="flex justify-around items-center h-16 px-1">
          {mobileLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex-1"
              activeOptions={{ exact: link.to === '/patient' }}
              preload="render"
            >
              {({ isActive, isTransitioning }) => (
                <div
                  className={cn(
                    'flex h-16 w-full flex-col items-center justify-center rounded-lg p-1 transition-colors duration-200',
                    isActive ? 'bg-primary text-white' : 'bg-transparent text-muted-foreground',
                    isTransitioning && 'animate-pulse',
                  )}
                >
                  <div className="relative">
                    <NavIcon
                      link={link}
                      className={isActive ? 'text-white' : 'text-muted-foreground'}
                    />
                    {link.to === '/patient/notifications' &&
                      numberOfUnreadNotifications !== 0 && (
                        <span className="absolute -top-1 -right-1 block size-2.5 rounded-full bg-red-500 ring-1 ring-white" />
                      )}
                  </div>
                  <span
                    className={cn(
                      'mt-1 text-[10px] leading-tight',
                      isActive
                        ? 'font-semibold text-white'
                        : 'text-muted-foreground',
                    )}
                  >
                    {link.shortLabel}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default PatientLayout
