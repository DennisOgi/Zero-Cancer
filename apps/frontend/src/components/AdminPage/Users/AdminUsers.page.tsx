import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { useAdminUsers } from '@/services/providers/admin.provider'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Heart,
  Mail,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import UsersStats from './UsersStats'

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [profileType, setProfileType] = useState<'PATIENT' | 'DONOR' | 'ALL'>(
    'ALL',
  )
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data: usersData, isLoading } = useAdminUsers({
    page,
    pageSize,
    search: search.trim() || undefined,
    profileType: profileType === 'ALL' ? undefined : profileType,
  })

  const users = usersData?.data?.users || []
  const totalPages = usersData?.data?.totalPages || 1
  const total = usersData?.data?.total || 0

  const clearFilters = () => {
    setSearch('')
    setProfileType('ALL')
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleProfileTypeChange = (value: string) => {
    setProfileType(value as 'PATIENT' | 'DONOR' | 'ALL')
    setPage(1)
  }

  const patientCount = users.filter((user: any) => user.patientProfile).length
  const donorCount = users.filter((user: any) => user.donorProfile).length
  const verifiedCount = users.filter(
    (user: any) =>
      user.patientProfile?.emailVerified || user.donorProfile?.emailVerified,
  ).length

  const getProfileBadge = (user: any) => {
    if (user.patientProfile) {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          Patient
        </Badge>
      )
    }
    if (user.donorProfile) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Donor
        </Badge>
      )
    }
    return <Badge variant="outline">Unknown</Badge>
  }

  const getVerificationStatus = (user: any) => {
    const isVerified =
      user.patientProfile?.emailVerified || user.donorProfile?.emailVerified
    return isVerified ? (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm">Verified</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-amber-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm">Pending</span>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getLocationInfo = (user: any) => {
    if (user.patientProfile?.state) {
      const parts = [] as string[]
      if (user.patientProfile.city) parts.push(user.patientProfile.city)
      if (user.patientProfile.state) parts.push(user.patientProfile.state)
      return parts.join(', ')
    }
    if (user.donorProfile?.country) {
      return user.donorProfile.country
    }
    return 'Not specified'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all platform users
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <UsersStats
        total={total}
        patientCount={patientCount}
        donorCount={donorCount}
        verifiedCount={verifiedCount}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-[200px]">
              <Select
                value={profileType}
                onValueChange={handleProfileTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Users</SelectItem>
                  <SelectItem value="PATIENT">Patients Only</SelectItem>
                  <SelectItem value="DONOR">Donors Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || profileType !== 'ALL') && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {search || profileType !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'No users have registered yet'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getProfileBadge(user)}
                        {user.donorProfile?.organizationName && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {user.donorProfile.organizationName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.phone && (
                            <div className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          )}
                          {getVerificationStatus(user)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getLocationInfo(user)}
                        </div>
                      </TableCell>
                      <TableCell>{getVerificationStatus(user)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            {user.appointments.length} appointments
                          </div>
                          {user.donationCampaigns.length > 0 && (
                            <div className="text-sm flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {user.donationCampaigns.length} campaigns
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total users)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
