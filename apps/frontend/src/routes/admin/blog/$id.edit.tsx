import { AdminBlogEditorPage } from '@/components/AdminPage/Blog/AdminBlogEditor.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/blog/$id/edit')({
  component: AdminBlogEditorPage,
})
