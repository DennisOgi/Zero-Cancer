import { Button } from '@/components/shared/ui/button'
import { Card, CardContent } from '@/components/shared/ui/card'
import { Link, useNavigate } from '@tanstack/react-router'
import type { TNotificationRecipient } from '@zerocancer/shared/types'
import { Bell, Loader2 } from 'lucide-react'

// Import icons for different notification types
import donorIcon from '@/assets/images/donor.png'
import notificationIcon from '@/assets/images/notification.png'
import screeningIcon from '@/assets/images/screening.png'

interface NotificationsPanelProps {
  notifications: TNotificationRecipient[]
  isLoading: boolean
}

const notificationTypes: {
  [key: string]: { icon: string; defaultTitle: string }
} = {
  RESULTS_AVAILABLE: {
    icon: screeningIcon,
    defaultTitle: 'Screening Result Ready',
  },
  DONATION_ALLOCATED: {
    icon: donorIcon,
    defaultTitle: 'Donation Applied',
  },
  APPOINTMENT_REMINDER: {
    icon: notificationIcon,
    defaultTitle: 'Appointment Reminder',
  },
  // Add other types as needed
  DEFAULT: {
    icon: notificationIcon, // A default icon
    defaultTitle: 'Notification',
  },
}

const NotificationItem = ({
  notification,
}: {
  notification: TNotificationRecipient
}) => {
  const navigate = useNavigate()
  const typeInfo =
    notificationTypes[notification.notification.type as any] ||
    notificationTypes.DEFAULT

  const handleAction = () => {
    // Navigate based on the data in the notification
    // This is a placeholder and needs to be adapted to your routing structure
    if (notification.notification.data?.appointmentId) {
      navigate({ to: '/patient/appointments' })
    } else if (notification.notification.data?.waitlistId) {
      navigate({ to: '/patient/book' })
    }
  }

  const getButtonText = () => {
    switch (notification.notification.type) {
      case 'RESULTS_AVAILABLE':
        return 'View Result'
      case 'DONATION_ALLOCATED':
        return 'Book Now'
      case 'APPOINTMENT_REMINDER':
        return 'View Appointment'
      default:
        return 'View Details'
    }
  }

  return (
    <div className="bg-blue-50/50 p-4 rounded-xl space-y-2">
      <div className="flex items-start gap-4">
        <img src={typeInfo.icon} alt="notification icon" className="w-8 h-8" />
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">
            {notification.notification.title || typeInfo.defaultTitle}
          </h4>
          <p className="text-sm text-gray-600">
            {notification.notification.message}
          </p>
          <p className="text-xs text-gray-500 pt-1">
            {new Date(notification.notification.createdAt).toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit',
              },
            )}
          </p>
        </div>
      </div>
      <Button
        onClick={handleAction}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
      >
        {getButtonText()}
      </Button>
    </div>
  )
}

export default function NotificationsPanel({
  notifications,
  isLoading,
}: NotificationsPanelProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={notificationIcon}
              alt="notification icon"
              className="w-8 h-8"
            />
            <h3 className="text-lg font-semibold text-gray-800">
              Notifications
            </h3>
          </div>
          <Link to="/patient/notifications">
            <Button variant="link" className="text-sm">
              See All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications
              .slice(0, 2) // Show first 2 notifications
              .map((item) => (
                <NotificationItem key={item.id} notification={item} />
              ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground bg-gray-50/80 rounded-xl">
            <p>You have no new notifications.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
