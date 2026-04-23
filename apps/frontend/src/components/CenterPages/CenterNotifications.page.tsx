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
import { Bell, CheckCircle2, DollarSign, Users, Calendar } from 'lucide-react'
import { toast } from 'sonner'

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

// Get icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'DONATION_RECEIVED':
    case 'PAYOUT_PROCESSED':
      return <DollarSign className="h-5 w-5 text-green-600" />
    case 'NEW_APPOINTMENT':
    case 'APPOINTMENT_CANCELLED':
      return <Calendar className="h-5 w-5 text-blue-600" />
    case 'NEW_PATIENT':
      return <Users className="h-5 w-5 text-purple-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}

interface NotificationItemProps {
  notification: TNotificationRecipient
  onClick: (notification: TNotificationRecipient) => void
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { notification: notif, read } = notification

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        !read ? 'bg-blue-50 border-blue-200' : 'bg-white'
      }`}
      onClick={() => onClick(notification)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notif.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm">{notif.title}</h4>
              {!read && (
                <div className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full mt-1" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {notif.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(notif.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

export function CenterNotificationsPage() {
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
      donationId?: string
      payoutId?: string
    }

    // Navigate based on notification type
    if (notification.type === 'NEW_APPOINTMENT' && data?.appointmentId) {
      navigate({ to: '/center/appointments', search: { appointmentId: data.appointmentId } })
      return
    }

    if (notification.type === 'DONATION_RECEIVED' || notification.type === 'PAYOUT_PROCESSED') {
      navigate({ to: '/center/receipt-history' })
      return
    }

    if (notification.type === 'NEW_PATIENT') {
      navigate({ to: '/center/appointments' })
      return
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with donations, appointments, and center activities
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
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with donations, appointments, and center activities
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

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with donations, appointments, and center activities
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
            <Bell className="h-4 w-4" />
            <span className="font-semibold">{unreadCount} unread</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl">
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && (
              <span className="ml-2 text-xs">({notifications.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="donations">
            Donations
            {notificationsByType('DONATION_RECEIVED').length > 0 && (
              <span className="ml-2 text-xs">
                ({notificationsByType('DONATION_RECEIVED').length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="appointments">
            Appointments
            {notificationsByType('NEW_APPOINTMENT').length > 0 && (
              <span className="ml-2 text-xs">
                ({notificationsByType('NEW_APPOINTMENT').length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {notifications.length > 0 ? (
            <div className="space-y-8">
              {notificationGroups.map(([groupTitle, groupNotifications]) => (
                <div key={groupTitle}>
                  <h3 className="text-sm font-semibold mb-4 text-gray-600 uppercase tracking-wide">
                    {groupTitle}
                  </h3>
                  <div className="space-y-3">
                    {groupNotifications.map((n) => (
                      <NotificationItem
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
            <EmptyState
              title="No Notifications"
              message="Your notifications will appear here when you receive donations, appointments, or other updates"
            />
          )}
        </TabsContent>

        <TabsContent value="donations" className="mt-6">
          {notificationsByType('DONATION_RECEIVED').length > 0 ? (
            <div className="space-y-3">
              {notificationsByType('DONATION_RECEIVED').map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Donation Notifications"
              message="You'll be notified here when your center receives donations"
            />
          )}
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          {notificationsByType('NEW_APPOINTMENT').length > 0 ? (
            <div className="space-y-3">
              {notificationsByType('NEW_APPOINTMENT').map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Appointment Notifications"
              message="You'll be notified here when patients book appointments at your center"
            />
          )}
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          {notificationsByType('PAYOUT_PROCESSED').length > 0 ? (
            <div className="space-y-3">
              {notificationsByType('PAYOUT_PROCESSED').map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Payout Notifications"
              message="You'll be notified here when payouts are processed for your center"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
