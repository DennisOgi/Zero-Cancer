import logo from '@/assets/images/logo.svg'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: authData } = useQuery(useAuthUser())

  const isAuthenticated = !!authData?.data?.user
  const userProfile = authData?.data?.user?.profile?.toLowerCase()

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

  return (
    <div className="bg-primary py-4 wrapper flex justify-between items-center">
      <div className="flex items-center gap-12 text-white">
        <Link to="/">
          <img src={logo} alt="ZeroCancer Logo" className="w-24 cursor-pointer hover:opacity-90 transition-opacity" />
        </Link>
        <div className="hidden md:flex items-center gap-12 text-white">
          <a href="#">How it Works</a>
          <Link to="/blog">Blog</Link>
          <Link to="/about">About</Link>
          <a href="#">Contact Us</a>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {isAuthenticated && dashboardLink ? (
          <Link to={dashboardLink} preload="render">
            <button className="bg-white text-primary px-8 py-2 rounded-lg font-semibold cursor-pointer">
              Dashboard
            </button>
          </Link>
        ) : (
          <>
            <Link to="/login" preload="render">
              <button className="border-2 border-white font-semibold px-8 py-2 rounded-lg text-white cursor-pointer">
                Login
              </button>
            </Link>
            <Link to="/sign-up">
              <button className="bg-white text-primary px-8 py-2 rounded-lg font-semibold cursor-pointer">
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
          <div className="flex flex-col items-center gap-8 text-white text-2xl">
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
            {isAuthenticated && dashboardLink ? (
              <Link to={dashboardLink} onClick={() => setIsOpen(false)}>
                <button className="bg-white text-primary px-8 py-2 rounded-lg font-semibold">
                  Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" preload="render">
                  <button className="border-2 border-white font-semibold px-8 py-2 rounded-lg text-white">
                    Login
                  </button>
                </Link>
                <Link to="/sign-up" preload="render">
                  <button className="bg-white text-primary px-8 py-2 rounded-lg font-semibold">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
