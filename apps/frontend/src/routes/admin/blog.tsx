import { AdminBlogPage } from '@/components/AdminPage/Blog/AdminBlog.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/blog')({
  component: AdminBlogPage,
})
