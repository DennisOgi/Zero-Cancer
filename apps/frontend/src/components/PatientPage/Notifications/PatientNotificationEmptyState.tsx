import bellIcon from '@/assets/images/notification.png'

interface PatientNotificationEmptyStateProps {
  title: string
  message: string
}

export function PatientNotificationEmptyState({
  title,
  message,
}: PatientNotificationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <img src={bellIcon} alt="No notifications" className="w-24 h-24 mb-6" />
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <p className="text-muted-foreground mt-1">{message}</p>
    </div>
  )
}

export default PatientNotificationEmptyState
