import { Button } from '@/components/shared/ui/button'
import { Card, CardContent } from '@/components/shared/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shared/ui/tabs'
import {
  useMarkNotificationRead,
  useNotifications,
} from '@/services/providers/notification.provider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { TNotificationRecipient } from '@zerocancer/shared/types'
import { toast } from 'sonner'
import PatientNotificationEmptyState from './PatientNotificationEmptyState'
import PatientNotificationItem from './PatientNotificationItem'

// Helper to group notifications by date
const groupNotificationsByDate = (notifications: TNotificationRecipient[]) => {
  const groups: { [key: string]: TNotificationRecipient[] } = {}

  notifications.forEach((n) => {
    const date = new Date(n.notification.createdAt)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    let key: string

    if (date.toDateString() === today.toDateString()) {
      key = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday'
    } else {
      key = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(n)
  })

  // Sort groups: Today, Yesterday, then by date descending
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    if (a === 'Today') return -1
    if (b === 'Today') return 1
    if (a === 'Yesterday') return -1
    if (b === 'Yesterday') return 1
    return new Date(b).getTime() - new Date(a).getTime()
  })

  const sortedGroups: { [key: string]: TNotificationRecipient[] } = {}
  for (const key of sortedGroupKeys) {
    sortedGroups[key] = groups[key]
  }

  return sortedGroups
}

export function PatientNotificationsPage() {
  const {
    data: notificationsData,
    isLoading,
    error,
  } = useQuery(useNotifications())
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const markAsReadMutation = useMarkNotificationRead()

  const handleMarkAsRead = (notificationRecipientId: string) => {
    markAsReadMutation.mutate(notificationRecipientId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: useNotifications().queryKey })
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || 'Failed to mark as read')
      },
    })
  }

  const handleNotificationClick = (
    notificationRecipient: TNotificationRecipient,
  ) => {
    const { notification, read, id } = notificationRecipient
    if (!read) {
      handleMarkAsRead(id)
    }

    const data = notification.data as {
      appointmentId?: string
      waitlistId?: string
    }

    // Specific navigation logic
    if (notification.type === 'RESULTS_AVAILABLE') {
      // Assuming results are linked to appointments for now
      if (data?.appointmentId) {
        navigate({ to: '/patient/appointments' })
      }
      return
    }

    if (notification.type === 'DONATION_ALLOCATED') {
      navigate({ to: '/patient/book' })
      return
    }

    if (data?.appointmentId) {
      navigate({ to: '/patient/appointments' })
      return
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your screening bookings easily.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your screening bookings easily.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">
              Failed to load notifications. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const notifications = notificationsData?.data || []
  const groupedNotifications = groupNotificationsByDate(notifications)
  const notificationGroups = Object.entries(groupedNotifications)

  const notificationsByType = (type: string) =>
    notifications.filter((n) => n.notification.type === type)

  return (
    <div className="space-y-4 md:space-y-6 min-h-[calc(100vh-100px)]">
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Manage your screening bookings easily.
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-lg">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {notifications.length > 0 ? (
            <div className="space-y-8">
              {notificationGroups.map(([groupTitle, groupNotifications]) => (
                <div key={groupTitle}>
                  <h3 className="text-base font-semibold mb-4 text-gray-600">
                    {groupTitle}
                  </h3>
                  <div className="space-y-2">
                    {groupNotifications.map((n) => (
                      <PatientNotificationItem
                        key={n.id}
                        notification={n}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PatientNotificationEmptyState
              title="No Notification"
              message="Your new notifications will appear here"
            />
          )}
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          {notificationsByType('RESULTS_AVAILABLE').length > 0 ? (
            <p>Results notifications will be here</p>
          ) : (
            <PatientNotificationEmptyState
              title="No Results"
              message="Your results notifications will appear here"
            />
          )}
        </TabsContent>
        <TabsContent value="appointments" className="mt-4">
          {notificationsByType('APPOINTMENT_REMINDER').length > 0 ? (
            <p>Appointments notifications will be here</p>
          ) : (
            <PatientNotificationEmptyState
              title="No Appointment Updates"
              message="Your appointment notifications will appear here"
            />
          )}
        </TabsContent>
        <TabsContent value="referrals" className="mt-4">
          <PatientNotificationEmptyState
            title="No Referrals"
            message="Your referral notifications will appear here"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
