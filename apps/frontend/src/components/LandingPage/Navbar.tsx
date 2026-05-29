import logo from '@/assets/images/logo.svg'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [activeCta, setActiveCta] = useState<'donate' | 'screening'>('donate')
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const { data: authData } = useQuery(useAuthUser())

  const isAuthenticated = !!authData?.data?.user
  const userProfile = authData?.data?.user?.profile?.toLowerCase()

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

  const dashboardLink = getDashboardLink()

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
          label: 'Screen now',
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

  return (
    <div className="bg-primary py-4 wrapper flex justify-between items-center relative z-50">
      <div className="flex items-center gap-12 text-white">
        <Link to="/">
          <img src={logo} alt="ZeroCancer Logo" className="w-24 cursor-pointer hover:opacity-90 transition-opacity" />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-white">
          <a href="#" className="hover:text-secondary transition-colors">How it Works</a>
          <Link to="/blog" className="hover:text-secondary transition-colors">Blog</Link>
          <Link to="/about" className="hover:text-secondary transition-colors">About</Link>
          <a href="#" className="hover:text-secondary transition-colors">Contact Us</a>
          
          {/* Country Selection Dropdown */}
          <div className="relative" ref={countryDropdownRef}>
            <button
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all text-sm font-medium cursor-pointer"
            >
              <Globe size={14} className="text-secondary" />
              <span>Nigeria 🇳🇬</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isCountryOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCountryOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-white border border-neutral-100 shadow-xl py-2 text-neutral-800 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-3 py-1.5 text-xs font-semibold text-neutral-400 border-b border-neutral-50 mb-1">
                  Target Countries
                </div>
                {countries.map((c) => (
                  <div
                    key={c.name}
                    className={`px-4 py-2 text-sm flex items-center justify-between ${
                      c.active
                        ? 'bg-neutral-50 font-semibold text-primary cursor-pointer hover:bg-neutral-100'
                        : 'text-neutral-400 cursor-not-allowed opacity-80'
                    }`}
                  >
                    <span>{c.name}</span>
                    {!c.active && (
                      <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full border border-neutral-200">
                        Soon
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-6">
        <a
          key={activeCta}
          href={activeCtaConfig.href}
          onClick={(e) => scrollToSection(activeCtaConfig.sectionId, e)}
          className={`px-6 py-2.5 rounded-lg font-semibold cursor-pointer shadow-md hover:-translate-y-0.5 transition-all text-sm ${activeCtaConfig.className}`}
        >
          {activeCtaConfig.label}
        </a>
        {isAuthenticated && dashboardLink ? (
          <Link to={dashboardLink} preload="render">
            <button className="bg-white text-primary hover:bg-neutral-50 px-6 py-2.5 rounded-lg font-semibold cursor-pointer border border-neutral-200 transition-all text-sm">
              Dashboard
            </button>
          </Link>
        ) : (
          <>
            <Link to="/login" preload="render">
              <button className="border border-white/40 font-semibold px-6 py-2.5 rounded-lg text-white hover:bg-white/10 hover:border-white transition-all cursor-pointer text-sm">
                Login
              </button>
            </Link>
            <Link to="/sign-up">
              <button className="bg-white text-primary hover:bg-neutral-50 px-6 py-2.5 rounded-lg font-semibold cursor-pointer border border-neutral-200 transition-all text-sm">
                Sign Up
              </button>
            </Link>
          </>
        )}
      </div>
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
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
        <div
          className={`fixed inset-0 bg-primary bg-opacity-95 z-50 flex flex-col items-center justify-center transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white"
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
          <div className="flex flex-col items-center gap-6 text-white text-xl">
            <a href="#" onClick={() => setIsOpen(false)}>
              How it Works
            </a>
            <Link to="/blog" onClick={() => setIsOpen(false)}>
              Blog
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
              className={`text-center w-48 py-2.5 rounded-lg font-semibold shadow-md text-base transition-all ${activeCtaConfig.className}`}
            >
              {activeCtaConfig.label}
            </a>
            {isAuthenticated && dashboardLink ? (
              <Link to={dashboardLink} onClick={() => setIsOpen(false)}>
                <button className="bg-white text-primary px-8 py-2 rounded-lg font-semibold w-48 text-base">
                  Dashboard
                </button>
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/login" preload="render" onClick={() => setIsOpen(false)}>
                  <button className="border-2 border-white font-semibold px-8 py-2 rounded-lg text-white w-48 text-base">
                    Login
                  </button>
                </Link>
                <Link to="/sign-up" preload="render" onClick={() => setIsOpen(false)}>
                  <button className="bg-white text-primary px-8 py-2 rounded-lg font-semibold w-48 text-base">
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
