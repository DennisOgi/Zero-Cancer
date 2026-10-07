import ScreeningCenterForm from '@/components/AuthPages/SignupPage/ScreeningCenterForm'
import { Button } from '@/components/shared/ui/button'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export function CenterSignupPage() {
  const [submittedEmail, setSubmittedEmail] = useState('')

  const handleFormSubmit = (data: { email?: string }) => {
    if (data?.email) setSubmittedEmail(data.email)
  }

  if (submittedEmail) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your facility is registered</h1>
        <p className="text-muted-foreground">
          We received the application for {submittedEmail}. ZeroCancer will
          review it. After approval, this is how your team works:
        </p>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>
            Sign in as the health facility with this email from the main login.
          </li>
          <li>
            Open <strong>Nurses &amp; staff</strong> and invite each nurse or
            health care provider by email.
          </li>
          <li>
            They set a password from the invite link, then sign in at Staff
            login and work under your facility.
          </li>
        </ol>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/login">Go to facility login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/staff/login">Staff login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/sign-up"
          className="text-gray-600 hover:text-gray-800 px-4 py-1 bg-blue-100 rounded-lg cursor-pointer"
        >
          Back
        </Link>
      </div>
      <ScreeningCenterForm onSubmitSuccess={handleFormSubmit} />
    </div>
  )
}
