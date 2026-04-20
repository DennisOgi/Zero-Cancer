import { Link, Outlet } from '@tanstack/react-router'
import calendar from '@/assets/images/calendar.png'
import cross from '@/assets/images/cross.png'
import logo from '@/assets/images/logo.svg'
import logoutIcon from '@/assets/images/logout.png'
import notification from '@/assets/images/notification.png'
import stethoscope from '@/assets/images/stethoscope.png'
import { cn } from '@/lib/utils'
import { useLogout } from '@/services/providers/auth.provider'
import { useNotifications } from '@/services/providers/notification.provider'
import { useQuery } from '@tanstack/react-query'

export function PatientLayout() {
  const { mutate: logout } = useLogout()

  const navLinks = [
    { to: '/patient', label: 'Dashboard', icon: cross },
    { to: '/patient/book', label: 'Book Screening', icon: stethoscope },
    { to: '/patient/appointments', label: 'Appointments', icon: calendar },
    { to: '/patient/notifications', label: 'Notifications', icon: notification },
  ]

  const { data } = useQuery(useNotifications())
  const numberOfUnreadNotifications = data?.data?.filter((n) => !n.read).length || 0

  return (
    <div className="min-h-screen w-full">
      {/* Fixed Sidebar for Desktop */}
      <div className="fixed inset-y-0 left-0 z-50 w-60 xl:w-72 hidden md:block bg-primary">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center px-4 lg:h-[80px] lg:px-6">
            <Link to="/patient" className="flex items-center gap-2 font-semibold">
              <img src={logo} alt="ZeroCancer" className="h-12" />
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
                  activeOptions={link.to === '/patient' ? { exact: true } : { exact: false }}
                  activeProps={{ className: 'bg-white/30 font-semibold' }}
                >
                  <div className="relative">
                    <img src={link.icon} alt={link.label} className="h-6 w-6" />
                    {link.to === '/patient/notifications' && numberOfUnreadNotifications !== 0 && (
                      <span className="absolute -bottom-1 right-0 block size-3.5 text-xs rounded-full bg-red-500 ring-1 ring-white">
                        {numberOfUnreadNotifications}
                      </span>
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

      {/* Mobile Topbar */}
      <div className="flex flex-col md:ml-60 xl:ml-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-primary px-4 py-6 shadow-md md:hidden">
          <Link to="/patient" className="flex items-center gap-2 font-semibold">
            <img src={logo} alt="ZeroCancer" className="h-12" />
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

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-2 inset-x-2 md:hidden bg-white z-50 shadow-lg rounded-xl">
        <nav className="flex justify-around items-center h-16 px-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="flex-1" activeOptions={{ exact: link.to === '/patient' }} preload="render">
              {({ isActive, isTransitioning }) => (
                <div
                  className={cn(
                    'flex h-16 w-full flex-col items-center justify-center rounded-lg p-1 transition-colors duration-200',
                    isActive ? 'bg-primary' : 'bg-transparent',
                    isTransitioning && 'animate-pulse',
                  )}
                >
                  <img src={link.icon} alt={link.label} className="h-6 w-6" />
                  <span className={cn('mt-2 text-xs', isActive ? 'font-semibold text-white' : 'text-muted-foreground')}>
                    {link.label.split(' ')[0]}
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
