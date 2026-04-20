import { Badge } from '@/components/shared/ui/badge'
import type { TNotificationRecipient } from '@zerocancer/shared/types'

interface PatientNotificationItemProps {
  notification: TNotificationRecipient
  onClick: (n: TNotificationRecipient) => void
}

export function PatientNotificationItem({
  notification: n,
  onClick,
}: PatientNotificationItemProps) {
  return (
    <div
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100/50 cursor-pointer"
      onClick={() => onClick(n)}
    >
      <div
        className={`p-2 rounded-full ${!n.read ? 'bg-blue-100' : 'bg-gray-100'}`}
      >
        {/* Use simple dot badge; parent decides icon if needed */}
        <span className="block w-3 h-3 rounded-full bg-current" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800">{n.notification.title}</p>
        <p className="text-sm text-gray-500">{n.notification.message}</p>
      </div>
      <div className="text-right space-y-1.5 self-start">
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(n.notification.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {!n.read && (
          <div className="flex justify-end">
            <Badge className="bg-red-500 text-white hover:bg-red-600">
              New
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientNotificationItem
