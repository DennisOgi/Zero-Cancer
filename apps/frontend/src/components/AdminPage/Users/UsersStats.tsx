import { Card, CardContent } from '@/components/shared/ui/card'
import { Heart, Stethoscope, UserCheck, Users } from 'lucide-react'

export interface UsersStatsProps {
  total: number
  patientCount: number
  donorCount: number
  verifiedCount: number
}

export default function UsersStats({
  total,
  patientCount,
  donorCount,
  verifiedCount,
}: UsersStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Patients</p>
              <p className="text-xl font-bold">{patientCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Donors</p>
              <p className="text-xl font-bold">{donorCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Verified</p>
              <p className="text-xl font-bold">{verifiedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
