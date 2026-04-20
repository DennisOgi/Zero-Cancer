import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import type { BlogPost } from '@/services/providers/blog.provider'

interface BlogCardProps {
  post: BlogPost
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
    >
      {/* Image */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gray-200">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Date */}
        <p className="text-sm text-muted-foreground mb-3">
          {post.publishedAt && format(new Date(post.publishedAt), 'dd.MM.yyyy')}
        </p>

        {/* Title */}
        <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {post.excerpt}
        </p>
      </div>
    </Link>
  )
}
