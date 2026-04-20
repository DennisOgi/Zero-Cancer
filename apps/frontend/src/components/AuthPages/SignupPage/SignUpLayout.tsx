import { Link } from "@tanstack/react-router";
import signupImage from '@/assets/images/signup.png'
import { Outlet } from "@tanstack/react-router";

export default function SignUpLayout() {
    return (
      <div className="flex h-screen p-2">
        {/* Desktop Image - Hidden on mobile */}
        <div className="hidden md:block md:w-1/2 lg:w-2/5">
          <img
            src={signupImage}
            alt="signup"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
  
        {/* Form Section - Full width on mobile, half width on desktop */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-4 lg:p-8">
            <div className="flex">
              <span className="inline-block ml-auto">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold">
                  Login
                </Link>
              </span>
            </div>
          </div>
  
          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    )
  }