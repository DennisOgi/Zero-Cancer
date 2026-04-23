import { Button } from '@/components/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card'
import { Link } from '@tanstack/react-router'
import { LogIn, UserPlus, ShieldAlert } from 'lucide-react'

interface AuthPromptProps {
  title?: string
  message?: string
  showSignUp?: boolean
  redirectTo?: string
}

export function AuthPrompt({
  title = 'Authentication Required',
  message = 'You need to be logged in to access this page.',
  showSignUp = true,
  redirectTo,
}: AuthPromptProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link
              to="/login"
              search={redirectTo ? { redirect: redirectTo } : undefined}
            >
              <LogIn className="mr-2 h-5 w-5" />
              Log In
            </Link>
          </Button>
          
          {showSignUp && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full" size="lg">
                <Link to="/sign-up">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create Account
                </Link>
              </Button>
            </>
          )}

          <div className="pt-4 text-center">
            <Button asChild variant="link" size="sm">
              <Link to="/">
                ← Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
