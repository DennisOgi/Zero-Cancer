import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { Textarea } from '@/components/shared/ui/textarea'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { useQuery } from '@tanstack/react-query'
import {
  getBlogPost,
  getBlogCategories,
  useCreateBlogPost,
  useUpdateBlogPost,
} from '@/services/providers/blog.provider'
import { ArrowLeft, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'

export function AdminBlogEditorPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const postId = (params as any)?.id

  const isEditMode = !!postId

  // Fetch post data if editing
  const { data: postData } = useQuery({
    ...getBlogPost(postId),
    enabled: isEditMode,
  })

  // Fetch categories
  const { data: categoriesData } = useQuery(getBlogCategories())

  const createMutation = useCreateBlogPost()
  const updateMutation = useUpdateBlogPost()

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    categoryIds: [] as string[],
    published: false,
  })

  // Populate form when editing
  useEffect(() => {
    if (postData?.post) {
      setFormData({
        title: postData.post.title,
        excerpt: postData.post.excerpt,
        content: postData.post.content,
        coverImage: postData.post.coverImage || '',
        categoryIds: postData.post.categories.map((c) => c.id),
        published: postData.post.published,
      })
    }
  }, [postData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: postId,
          data: formData,
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      navigate({ to: '/admin/blog' })
    } catch (error) {
      console.error('Failed to save post:', error)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }))
  }

  const categories = categoriesData?.categories || []
  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update your blog post' : 'Write a new blog post'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Post Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter post title"
                required
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                placeholder="Brief summary of the post"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="content">Content (Markdown) *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Write your post content in Markdown format..."
                rows={15}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports Markdown formatting
              </p>
            </div>

            <div>
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={formData.categoryIds.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label
                    htmlFor={category.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Publish Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Publish Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked as boolean })
                }
              />
              <Label htmlFor="published" className="cursor-pointer">
                Publish immediately
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formData.published
                ? 'This post will be visible to the public'
                : 'This post will be saved as a draft'}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : isEditMode ? 'Update Post' : 'Create Post'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/blog">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
