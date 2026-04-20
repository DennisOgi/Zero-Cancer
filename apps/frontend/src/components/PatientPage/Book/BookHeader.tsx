interface BookHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function BookHeader({ title, description, action }: BookHeaderProps) {
  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  )
}

export default BookHeader
