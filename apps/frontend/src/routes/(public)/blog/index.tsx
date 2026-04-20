import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getBlogPosts } from '@/services/providers/blog.provider'
import BlogHero from '@/components/Blog/BlogHero'
import BlogGrid from '@/components/Blog/BlogGrid'

export const Route = createFileRoute('/(public)/blog/')({
  component: BlogPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search?.page ?? 1),
      category: (search?.category as string) || undefined,
      search: (search?.search as string) || undefined,
    }
  },
})

function BlogPage() {
  const { page, category, search } = Route.useSearch()

  const { data, isLoading } = useQuery(
    getBlogPosts({
      page,
      pageSize: 9,
      category,
      search,
    })
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading blog posts...</p>
        </div>
      </div>
    )
  }

  if (!data || data.posts.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="wrapper py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground">No blog posts found.</p>
        </div>
      </div>
    )
  }

  const [featuredPost, ...otherPosts] = data.posts

  return (
    <div className="min-h-screen">
      {/* Featured post hero */}
      {featuredPost && <BlogHero post={featuredPost} />}

      {/* Other posts grid */}
      {otherPosts.length > 0 && (
        <BlogGrid posts={otherPosts} title="Popular topics" />
      )}

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="wrapper pb-16">
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <a
                  key={pageNum}
                  href={`/blog?page=${pageNum}`}
                  className={`px-4 py-2 rounded-md ${
                    pageNum === page
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </a>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
