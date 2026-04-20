import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import type { BlogPost } from '@/services/providers/blog.provider'

interface BlogArticleProps {
  post: BlogPost
}

export default function BlogArticle({ post }: BlogArticleProps) {
  return (
    <article>
      {/* Hero Section */}
      <div
        className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: post.coverImage
            ? `url(${post.coverImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 wrapper py-20 text-white text-center">
          <div className="max-w-4xl mx-auto">
            {/* Category badges */}
            <div className="flex flex-wrap gap-3 mb-6 justify-center">
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Intro paragraph */}
            <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="bg-white">
        <div className="wrapper py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Author and date */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b">
              <div>
                <p className="font-semibold">{post.author.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {post.publishedAt &&
                    format(new Date(post.publishedAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            {/* Markdown content */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl md:text-4xl font-bold mt-8 mb-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl md:text-2xl font-bold mt-6 mb-3">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-base leading-relaxed mb-4 text-gray-700">
                      {children}
                    </p>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-primary hover:underline font-medium"
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-base text-gray-700">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-gray-600">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Back to blog link */}
            <div className="mt-12 pt-8 border-t">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
