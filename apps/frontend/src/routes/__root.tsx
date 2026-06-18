import GlobalError from '@/components/GlobalError'
import GlobalNotFound from '@/components/GlobalNotFound'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        name: 'description',
        content: 'Reaching out to save lives one donation at a time',
      },
      {
        title: 'Zero Cancer',
      },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/zerocancer-logo.svg',
      },
    ],
    // scripts: [
    //   {
    //     src: 'https://www.google-analytics.com/analytics.js',
    //   },
    // ],
  }),
  notFoundComponent: GlobalNotFound,
  // errorComponent: GlobalError,
  component: () => (
    <>
      <HeadContent />
      <Outlet />
      {/* <TanStackRouterDevtools position="top-left" /> */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </>
  ),
})
