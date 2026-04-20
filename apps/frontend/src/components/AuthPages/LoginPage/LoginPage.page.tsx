import signupImage from '@/assets/images/signup.png'
import { Link } from '@tanstack/react-router'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    // <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
    <>
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center">
        <div className="w-full">
          <LoginForm />
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          For Center staff:{' '}
          <Link
            to="/staff/login"
            className="text-primary font-semibold hover:underline"
          >
            Use Staff Login
          </Link>
        </p>
      </div>
    </>
    // </div>
  )
}
