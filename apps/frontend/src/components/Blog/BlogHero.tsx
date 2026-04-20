import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import type { BlogPost } from '@/services/providers/blog.provider'

interface BlogHeroProps {
  post: BlogPost
}

export default function BlogHero({ post }: BlogHeroProps) {
  return (
    <div
      className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: post.coverImage
          ? `url(${post.coverImage})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 wrapper py-20 md:py-32 text-white">
        <div className="max-w-4xl">
          {/* Category badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                to="/blog"
                search={{ category: category.slug }}
                className="px-4 py-2 text-sm font-semibold uppercase tracking-wide bg-white/20 backdrop-blur-md border border-white/30 rounded-md hover:bg-white/30 transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Date */}
          <p className="text-lg md:text-xl mb-4 text-white/90">
            {post.publishedAt && format(new Date(post.publishedAt), 'dd.MM.yyyy')}
          </p>

          {/* Excerpt */}
          <p className="text-base md:text-lg mb-8 text-white/90 max-w-3xl leading-relaxed">
            {post.excerpt}
          </p>

          {/* Read button */}
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="inline-block px-8 py-3 text-base font-semibold border-2 border-white text-white rounded-md hover:bg-white hover:text-black transition-all duration-300"
          >
            Read
          </Link>
        </div>
      </div>
    </div>
  )
}
