import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Link } from '@tanstack/react-router'
import {
  Clock,
  DollarSign,
  HeartHandshake,
  Stethoscope,
  Store,
  Users,
} from 'lucide-react'

export function AdminQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/admin/centers">
            <Stethoscope className="h-4 w-4 mr-2" />
            Manage Centers
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/admin/users">
            <Users className="h-4 w-4 mr-2" />
            View Users
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/admin/campaigns">
            <HeartHandshake className="h-4 w-4 mr-2" />
            Campaign Status
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/admin/waitlist">
            <Clock className="h-4 w-4 mr-2" />
            Waitlist Management
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/admin/store">
            <Store className="h-4 w-4 mr-2" />
            Store Management
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/admin/transactions">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial Overview
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default AdminQuickActions
