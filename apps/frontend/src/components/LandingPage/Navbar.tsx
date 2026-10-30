import logo from '@/assets/images/logo.svg'
import { useAuthUser, useLogout } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe, LogOut } from 'lucide-react'

const navBtnBase =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-all'

function initialsFromName(name?: string | null) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'ZC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [activeCta, setActiveCta] = useState<'donate' | 'screening'>('donate')
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const { data: authData } = useQuery(useAuthUser())
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  const user = authData?.data?.user
  const isAuthenticated = !!user
  const userProfile = user?.profile?.toLowerCase()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveCta((current) =>
        current === 'donate' ? 'screening' : 'donate',
      )
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  const getDashboardLink = () => {
    if (!isAuthenticated) return null

    switch (userProfile) {
      case 'patient':
        return '/patient'
      case 'donor':
        return '/donor'
      case 'center':
        return '/center'
      case 'center_staff':
        return '/center'
      case 'admin':
        return '/admin'
      default:
        return null
    }
  }

  const getProfileLink = () => {
    switch (userProfile) {
      case 'patient':
        return '/patient/profile'
      case 'center':
      case 'center_staff':
        return '/center/profile'
      default:
        return getDashboardLink()
    }
  }

  const dashboardLink = getDashboardLink()
  const profileLink = getProfileLink()

  const scrollToSection = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setIsOpen(false)
    const element = document.getElementById(sectionId)
    if (element) {
      window.history.replaceState(null, '', `#${sectionId}`)
      element.scrollIntoView({ behavior: 'smooth' })
      return
    }

    window.location.href = `/#${sectionId}`
  }

  const activeCtaConfig =
    activeCta === 'donate'
      ? {
          label: 'Donate Now',
          sectionId: 'donate-section',
          href: '#donate-section',
          className:
            'bg-secondary text-white hover:bg-secondary/90 shadow-secondary/10 hover:shadow-secondary/20',
        }
      : {
          label: 'Screen Now',
          sectionId: 'find-center-section',
          href: '#find-center-section',
          className:
            'bg-green-700 text-white hover:bg-green-800 shadow-green-700/20 hover:shadow-green-700/30',
        }

  const countries = [
    { name: 'Nigeria 🇳🇬', active: true },
    { name: 'Ghana 🇬🇭', active: false },
    { name: 'Kenya 🇰🇪', active: false },
    { name: 'South Africa 🇿🇦', active: false },
    { name: 'Rwanda 🇷🇼', active: false },
  ]

  const avatar = (
    <span className="inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/40 bg-white/15 text-xs font-bold text-white ring-offset-2 transition hover:border-white">
      {user?.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.fullName || 'Profile'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {initialsFromName(user?.fullName)}
        </span>
      )}
    </span>
  )

  const countryPicker = (
    <div className="relative" ref={countryDropdownRef}>
      <button
        type="button"
        onClick={() => setIsCountryOpen(!isCountryOpen)}
        className={`${navBtnBase} border border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10`}
      >
        <Globe size={14} className="text-secondary" />
        <span>Nigeria 🇳🇬</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isCountryOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isCountryOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-neutral-100 bg-white py-2 text-neutral-800 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mb-1 border-b border-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-400">
            Target Countries
          </div>
          {countries.map((c) => (
            <div
              key={c.name}
              className={`flex items-center justify-between px-4 py-2 text-sm ${
                c.active
                  ? 'cursor-pointer bg-neutral-50 font-semibold text-primary hover:bg-neutral-100'
                  : 'cursor-not-allowed text-neutral-400 opacity-80'
              }`}
            >
              <span>{c.name}</span>
              {!c.active && (
                <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                  Soon
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="wrapper relative z-50 flex items-center justify-between gap-4 bg-primary py-4">
      <div className="flex min-w-0 items-center gap-8 text-white lg:gap-12">
        <Link to="/" className="shrink-0">
          <img
            src={logo}
            alt="ZeroCancer Logo"
            className="w-24 cursor-pointer transition-opacity hover:opacity-90"
          />
        </Link>
        <div className="hidden items-center gap-6 whitespace-nowrap text-sm md:flex lg:gap-8">
          <Link to="/learn" className="transition-colors hover:text-secondary">
            How it Works
          </Link>
          <Link to="/blog" className="transition-colors hover:text-secondary">
            Blog
          </Link>
          <Link to="/events" className="transition-colors hover:text-secondary">
            Events
          </Link>
          <Link to="/about" className="transition-colors hover:text-secondary">
            About
          </Link>
          <a href="#" className="transition-colors hover:text-secondary">
            Contact Us
          </a>
        </div>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        {countryPicker}
        <a
          key={activeCta}
          href={activeCtaConfig.href}
          onClick={(e) => scrollToSection(activeCtaConfig.sectionId, e)}
          className={`${navBtnBase} shadow-md hover:-translate-y-0.5 ${activeCtaConfig.className}`}
        >
          {activeCtaConfig.label}
        </a>
        {isAuthenticated ? (
          <>
            {profileLink ? (
              <Link
                to={profileLink}
                preload="render"
                title={user?.fullName || 'Profile'}
                className="shrink-0"
              >
                {avatar}
              </Link>
            ) : (
              avatar
            )}
            {dashboardLink ? (
              <Link to={dashboardLink} preload="render">
                <button
                  type="button"
                  className={`${navBtnBase} border border-neutral-200 bg-white text-primary hover:bg-neutral-50`}
                >
                  Dashboard
                </button>
              </Link>
            ) : null}
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => logout()}
              className={`${navBtnBase} border border-white/40 text-white hover:border-white hover:bg-white/10 disabled:opacity-60`}
            >
              <LogOut size={14} />
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" preload="render">
              <button
                type="button"
                className={`${navBtnBase} border border-white/40 text-white hover:border-white hover:bg-white/10`}
              >
                Login
              </button>
            </Link>
            <Link to="/sign-up">
              <button
                type="button"
                className={`${navBtnBase} border border-neutral-200 bg-white text-primary hover:bg-neutral-50`}
              >
                Sign Up
              </button>
            </Link>
          </>
        )}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex translate-x-0 flex-col items-center justify-center bg-primary bg-opacity-95 transition-transform duration-300 ease-in-out">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="flex flex-col items-center gap-6 text-xl text-white">
            {isAuthenticated ? (
              <div className="flex flex-col items-center gap-3">
                {profileLink ? (
                  <Link to={profileLink} onClick={() => setIsOpen(false)}>
                    {avatar}
                  </Link>
                ) : (
                  avatar
                )}
                <p className="text-base font-medium">
                  {user?.fullName || user?.email}
                </p>
              </div>
            ) : null}
            <Link to="/learn" onClick={() => setIsOpen(false)}>
              How it Works
            </Link>
            <Link to="/blog" onClick={() => setIsOpen(false)}>
              Blog
            </Link>
            <Link to="/events" onClick={() => setIsOpen(false)}>
              Events
            </Link>
            <Link to="/about" onClick={() => setIsOpen(false)}>
              About
            </Link>
            <a href="#" onClick={() => setIsOpen(false)}>
              Contact Us
            </a>
            <div className="w-64 rounded-xl border border-white/10 bg-white/10 p-3 text-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <Globe size={16} className="text-secondary" />
                <span>Target Countries</span>
              </div>
              <div className="space-y-2">
                {countries.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span>{c.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.active
                          ? 'bg-secondary text-white'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {c.active ? 'Active' : 'Soon'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <a
              key={activeCta}
              href={activeCtaConfig.href}
              onClick={(e) => scrollToSection(activeCtaConfig.sectionId, e)}
              className={`${navBtnBase} w-48 shadow-md ${activeCtaConfig.className}`}
            >
              {activeCtaConfig.label}
            </a>
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                {dashboardLink ? (
                  <Link to={dashboardLink} onClick={() => setIsOpen(false)}>
                    <button
                      type="button"
                      className={`${navBtnBase} w-48 bg-white text-primary`}
                    >
                      Dashboard
                    </button>
                  </Link>
                ) : null}
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => {
                    setIsOpen(false)
                    logout()
                  }}
                  className={`${navBtnBase} w-48 border-2 border-white text-white disabled:opacity-60`}
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  preload="render"
                  onClick={() => setIsOpen(false)}
                >
                  <button
                    type="button"
                    className={`${navBtnBase} w-48 border-2 border-white text-white`}
                  >
                    Login
                  </button>
                </Link>
                <Link
                  to="/sign-up"
                  preload="render"
                  onClick={() => setIsOpen(false)}
                >
                  <button
                    type="button"
                    className={`${navBtnBase} w-48 bg-white text-primary`}
                  >
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
