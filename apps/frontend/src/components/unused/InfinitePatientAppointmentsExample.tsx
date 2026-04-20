// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { usePatientAppointmentsInfinite } from '@/services/providers/patient.provider'
// import { useInfiniteQuery } from '@tanstack/react-query'
// import React from 'react'

// /**
//  * Example component demonstrating how to use the infinite query for patient appointments.
//  *
//  * This shows:
//  * 1. How to use usePatientAppointmentsInfinite with query parameters
//  * 2. How to handle loading states for initial and subsequent pages
//  * 3. How to implement "Load More" functionality
//  * 4. How to access flattened data from all pages
//  * 5. How to handle errors and edge cases
//  */
// export function InfinitePatientAppointmentsExample() {
//   // Example: Get all appointments, 10 per page
//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//     isLoading,
//     isError,
//     error,
//   } = useInfiniteQuery(
//     usePatientAppointmentsInfinite({
//       size: 10,
//       // status: 'CONFIRMED' // Optional: filter by status
//     }),
//   )
//
//   // Flatten all pages into a single array of appointments
//   const allAppointments =
//     data?.pages.flatMap((page) => page.data.appointments) ?? []
//
//   // Get pagination info from the latest page
//   const latestPage = data?.pages[data.pages.length - 1]
//   // ...rest of the code remains unchanged...
// }
// This file has been moved to unused/InfinitePatientAppointmentsExample.tsx
