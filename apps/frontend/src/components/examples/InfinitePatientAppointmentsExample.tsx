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

//   // Flatten all pages into a single array of appointments
//   const allAppointments =
//     data?.pages.flatMap((page) => page.data.appointments) ?? []

//   // Get pagination info from the latest page
//   const latestPage = data?.pages[data.pages.length - 1]
//   const totalAppointments = latestPage?.data.total ?? 0

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <div className="text-center">Loading appointments...</div>
//         </CardContent>
//       </Card>
//     )
//   }

//   if (isError) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <div className="text-center text-red-600">
//             Error loading appointments: {error?.message || 'Unknown error'}
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   return (
//     <div className="space-y-4">
//       <Card>
//         <CardHeader>
//           <CardTitle>
//             Patient Appointments ({allAppointments.length} of{' '}
//             {totalAppointments})
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {allAppointments.length === 0 ? (
//               <div className="text-center text-gray-500">
//                 No appointments found
//               </div>
//             ) : (
//               allAppointments.map((appointment) => (
//                 <div
//                   key={appointment.id}
//                   className="p-4 border rounded-lg flex justify-between items-center"
//                 >
//                   <div>
//                     <div className="font-medium">
//                       {appointment.screeningType.name}
//                     </div>
//                     <div className="text-sm text-gray-600">
//                       {new Date(appointment.scheduledDate).toLocaleDateString()}{' '}
//                       at {appointment.scheduledTime}
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       {appointment.center.name}
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <Badge
//                       variant={
//                         appointment.status === 'CONFIRMED'
//                           ? 'default'
//                           : appointment.status === 'COMPLETED'
//                             ? 'secondary'
//                             : appointment.status === 'CANCELLED'
//                               ? 'destructive'
//                               : 'outline'
//                       }
//                     >
//                       {appointment.status}
//                     </Badge>
//                     <div className="text-xs text-gray-500 mt-1">
//                       ₦{appointment.amount.toLocaleString()}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Load More Button */}
//           {hasNextPage && (
//             <div className="mt-6 text-center">
//               <Button
//                 onClick={() => fetchNextPage()}
//                 disabled={isFetchingNextPage}
//                 variant="outline"
//               >
//                 {isFetchingNextPage
//                   ? 'Loading more...'
//                   : 'Load More Appointments'}
//               </Button>
//             </div>
//           )}

//           {/* End of list indicator */}
//           {!hasNextPage && allAppointments.length > 0 && (
//             <div className="mt-6 text-center text-sm text-gray-500">
//               All appointments loaded
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Debug info (remove in production) */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-sm">Debug Info</CardTitle>
//         </CardHeader>
//         <CardContent className="text-xs space-y-1">
//           <div>Pages loaded: {data?.pages.length || 0}</div>
//           <div>Total appointments loaded: {allAppointments.length}</div>
//           <div>Total appointments available: {totalAppointments}</div>
//           <div>Has next page: {hasNextPage ? 'Yes' : 'No'}</div>
//           <div>Is fetching next page: {isFetchingNextPage ? 'Yes' : 'No'}</div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// /**
//  * Alternative example showing filtered appointments by status
//  */
// export function FilteredInfiniteAppointmentsExample() {
//   const [selectedStatus, setSelectedStatus] =
//     React.useState<string>('CONFIRMED')

//   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
//     useInfiniteQuery(
//       usePatientAppointmentsInfinite({
//         size: 5, // Smaller page size for demo
//         status: selectedStatus,
//       }),
//     )

//   const allAppointments =
//     data?.pages.flatMap((page) => page.data.appointments) ?? []

//   return (
//     <div className="space-y-4">
//       <Card>
//         <CardHeader>
//           <CardTitle>Filtered Appointments</CardTitle>
//           <div className="flex gap-2">
//             {['CONFIRMED', 'COMPLETED', 'CANCELLED', 'PENDING'].map(
//               (status) => (
//                 <Button
//                   key={status}
//                   size="sm"
//                   variant={selectedStatus === status ? 'default' : 'outline'}
//                   onClick={() => setSelectedStatus(status)}
//                 >
//                   {status}
//                 </Button>
//               ),
//             )}
//           </div>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div>Loading {selectedStatus.toLowerCase()} appointments...</div>
//           ) : (
//             <div className="space-y-2">
//               {allAppointments.map((appointment) => (
//                 <div
//                   key={appointment.id}
//                   className="p-2 border rounded text-sm"
//                 >
//                   {appointment.screeningType.name} - {appointment.status}
//                 </div>
//               ))}

//               {hasNextPage && (
//                 <Button
//                   size="sm"
//                   onClick={() => fetchNextPage()}
//                   disabled={isFetchingNextPage}
//                   className="w-full"
//                 >
//                   {isFetchingNextPage ? 'Loading...' : 'Load More'}
//                 </Button>
//               )}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// export default InfinitePatientAppointmentsExample
