import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import request from '@/lib/request'

// ============================================
// TYPES
// ============================================

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  authorId: string
  published: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    fullName: string
    email: string
  }
  categories: BlogCategory[]
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
}

export interface BlogListResponse {
  posts: BlogPost[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CreatePostData {
  title: string
  excerpt: string
  content: string
  coverImage?: string
  categoryIds: string[]
  published: boolean
}

export interface UpdatePostData {
  title?: string
  excerpt?: string
  content?: string
  coverImage?: string | null
  categoryIds?: string[]
  published?: boolean
}

// ============================================
// QUERY OPTIONS
// ============================================

/**
 * Get list of published blog posts
 */
export const getBlogPosts = (params?: {
  page?: number
  pageSize?: number
  category?: string
  search?: string
}) =>
  queryOptions({
    queryKey: ['blog', 'posts', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
      if (params?.category) searchParams.set('category', params.category)
      if (params?.search) searchParams.set('search', params.search)

      const response = await request.get<{ data: BlogListResponse }>(
        `/api/blog?${searchParams.toString()}`
      )
      return response.data
    },
  })

/**
 * Get single blog post by slug
 */
export const getBlogPost = (slug: string) =>
  queryOptions({
    queryKey: ['blog', 'post', slug],
    queryFn: async () => {
      const response = await request.get<{ data: { post: BlogPost } }>(`/api/blog/${slug}`)
      return response.data
    },
    enabled: !!slug,
  })

/**
 * Get all blog categories
 */
export const getBlogCategories = () =>
  queryOptions({
    queryKey: ['blog', 'categories'],
    queryFn: async () => {
      const response = await request.get<{ data: { categories: BlogCategory[] } }>(
        '/api/blog/categories'
      )
      return response.data
    },
  })

/**
 * Get all blog posts for admin (including drafts)
 */
export const getAdminBlogPosts = (params?: {
  page?: number
  pageSize?: number
  category?: string
  search?: string
  published?: boolean
}) =>
  queryOptions({
    queryKey: ['blog', 'admin', 'posts', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
      if (params?.category) searchParams.set('category', params.category)
      if (params?.search) searchParams.set('search', params.search)
      if (params?.published !== undefined)
        searchParams.set('published', params.published.toString())

      const response = await request.get<{ data: BlogListResponse }>(
        `/api/blog/admin/posts?${searchParams.toString()}`
      )
      return response.data
    },
  })

// ============================================
// MUTATIONS
// ============================================

/**
 * Create new blog post (admin only)
 */
export const useCreateBlogPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      const response = await request.post<{ data: { post: BlogPost } }>(
        '/api/blog/admin/posts',
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}

/**
 * Update blog post (admin only)
 */
export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePostData }) => {
      const response = await request.put<{ data: { post: BlogPost } }>(
        `/api/blog/admin/posts/${id}`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}

/**
 * Delete blog post (admin only)
 */
export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await request.delete(`/api/blog/admin/posts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}

/**
 * Toggle publish status (admin only)
 */
export const useTogglePublishPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await request.post<{ data: { post: BlogPost } }>(
        `/api/blog/admin/posts/${id}/publish`,
        {}
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}
