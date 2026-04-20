import { Calendar as CalendarPrimitive } from "react-aria-components"

export function Calendar(props: React.ComponentProps<typeof CalendarPrimitive>) {
  return <CalendarPrimitive {...props} />
} 