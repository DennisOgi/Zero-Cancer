import type { BlogPost } from '@/services/providers/blog.provider'
import BlogCard from './BlogCard'

interface BlogGridProps {
  posts: BlogPost[]
  title?: string
}

export default function BlogGrid({ posts, title = 'Popular topics' }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="wrapper py-16">
        <h2 className="text-3xl font-bold mb-8">{title}</h2>
        <p className="text-muted-foreground text-center py-12">
          No blog posts found.
        </p>
      </div>
    )
  }

  return (
    <div className="wrapper py-16">
      <h2 className="text-3xl font-bold mb-12">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
