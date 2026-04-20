import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import {
  Bell,
  Briefcase,
  Clock,
  FileText,
  HeartHandshake,
  Home,
  LineChart,
  LogOut,
  Stethoscope,
  Store as StoreIcon,
  Ticket,
  Users,
} from 'lucide-react'
import logo from '@/assets/images/logo-blue.svg'
import { useLogout } from '@/services/providers/auth.provider'

export function AdminLayout() {
  const { mutate: logout } = useLogout()
  const navigate = useNavigate()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block md:sticky md:top-0 md:h-screen">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[70px] lg:px-6 flex-shrink-0">
            <Link to="/admin" className="flex items-center gap-2 font-semibold">
              <img src={logo} alt="ZeroCancer" className="h-12" />
              <span className="text-sm text-muted-foreground ml-2">Admin Portal</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-2">
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
                activeOptions={{ exact: true }}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/admin/notifications"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
                preload="render"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Users className="h-4 w-4" />
                Users
              </Link>
              <Link
                to="/admin/centers"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Stethoscope className="h-4 w-4" />
                Centers
              </Link>
              <Link
                to="/admin/campaigns"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <HeartHandshake className="h-4 w-4" />
                Campaigns
              </Link>
              <Link
                to="/admin/waitlist"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Clock className="h-4 w-4" />
                Waitlist
              </Link>
              <Link
                to="/admin/appointments"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Briefcase className="h-4 w-4" />
                Appointments
              </Link>
              <Link
                to="/admin/results"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <FileText className="h-4 w-4" />
                Results
              </Link>
              <Link
                to="/admin/transactions"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <Ticket className="h-4 w-4" />
                Transactions
              </Link>
              <Link
                to="/admin/store"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
              >
                <StoreIcon className="h-4 w-4" />
                Store
              </Link>
              <Link
                to="/admin/analytics"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                activeProps={{ className: 'bg-muted text-primary' }}
                preload="render"
              >
                <LineChart className="h-4 w-4" />
                Analytics
              </Link>
            </nav>
          </div>
          <div className="border-t p-2 lg:p-4">
            <button
              onClick={() => {
                logout()
                navigate({ to: '/admin/login', replace: true, reloadDocument: true })
              }}
              className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col min-h-screen">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
