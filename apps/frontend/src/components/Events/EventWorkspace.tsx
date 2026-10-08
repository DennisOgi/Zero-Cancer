import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { Textarea } from '@/components/shared/ui/textarea'
import {
  myEvents,
  useCreateEvent,
  useDeleteEvent,
  useUploadEventPhoto,
} from '@/services/providers/event.provider'
import type { TCommunityEvent } from '@zerocancer/shared/types'
import { useQuery } from '@tanstack/react-query'
import { ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

const statusStyle: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-emerald-100 text-emerald-900',
  REJECTED: 'bg-red-100 text-red-900',
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read the selected file'))
    reader.readAsDataURL(file)
  })
}

function mimeOf(file: File): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (file.type === 'image/png') return 'image/png'
  if (file.type === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

type EventWorkspaceProps = {
  actorLabel: string
}

export function EventWorkspace({ actorLabel }: EventWorkspaceProps) {
  const { data, isLoading } = useQuery(myEvents())
  const createEvent = useCreateEvent()
  const deleteEvent = useDeleteEvent()
  const uploadPhoto = useUploadEventPhoto()
  const coverRef = useRef<HTMLInputElement>(null)
  const extraRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const events = data?.data?.events || []

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a JPG, PNG, or WEBP photo.')
      return null
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be 5MB or smaller.')
      return null
    }
    const response = await uploadPhoto.mutateAsync({
      fileBase64: await readFileAsDataUrl(file),
      fileName: file.name,
      mimeType: mimeOf(file),
    })
    if (!response.ok || !response.data?.url) {
      throw new Error((response as { error?: string }).error || 'Upload failed')
    }
    return response.data.url
  }

  const onCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file)
      if (url) setCoverImageUrl(url)
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Upload failed')
    } finally {
      if (coverRef.current) coverRef.current.value = ''
    }
  }

  const onExtra = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (imageUrls.length >= 4) {
      toast.error('You can add up to 4 extra photos.')
      return
    }
    try {
      const url = await uploadFile(file)
      if (url) setImageUrls((current) => [...current, url])
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || 'Upload failed')
    } finally {
      if (extraRef.current) extraRef.current.value = ''
    }
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await createEvent.mutateAsync({
        title,
        body,
        coverImageUrl,
        imageUrls,
      })
      toast.success('Event submitted for ZeroCancer approval.')
      setTitle('')
      setBody('')
      setCoverImageUrl('')
      setImageUrls([])
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          'Could not submit this event. Check the title, write-up, and photo.',
      )
    }
  }

  const onDelete = async (item: TCommunityEvent) => {
    try {
      await deleteEvent.mutateAsync(item.id)
      toast.success('Event removed')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not remove this event')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events & programmes</h1>
        <p className="text-muted-foreground">
          Share outreach, charity work, and screening programmes from your{' '}
          {actorLabel}. Photos go live only after ZeroCancer approves them.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post an event</CardTitle>
          <CardDescription>
            Add one cover photo and a short write-up. You can attach up to four
            extra photos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Free cervical screening outreach in Enugu"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-body">Write-up</Label>
              <Textarea
                id="event-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Tell people what happened, who you served, and why it matters."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Cover photo</Label>
              <input
                ref={coverRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onCover}
              />
              {coverImageUrl ? (
                <div className="relative overflow-hidden rounded-xl border">
                  <img
                    src={coverImageUrl}
                    alt="Event cover"
                    className="h-48 w-full object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute right-3 top-3"
                    onClick={() => setCoverImageUrl('')}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverRef.current?.click()}
                  disabled={uploadPhoto.isPending}
                >
                  {uploadPhoto.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload cover photo
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Extra photos (optional)</Label>
              <div className="flex flex-wrap gap-3">
                {imageUrls.map((url) => (
                  <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      onClick={() =>
                        setImageUrls((current) => current.filter((item) => item !== url))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {imageUrls.length < 4 && (
                  <>
                    <input
                      ref={extraRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={onExtra}
                    />
                    <button
                      type="button"
                      className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed text-muted-foreground"
                      onClick={() => extraRef.current?.click()}
                    >
                      <ImagePlus className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <Button type="submit" disabled={createEvent.isPending || uploadPhoto.isPending}>
              {createEvent.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit for approval
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground">You have not posted an event yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row"
                >
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="h-28 w-full rounded-lg object-cover sm:w-40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge className={statusStyle[item.status] || ''}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.body}
                    </p>
                    {item.status !== 'APPROVED' && (
                      <Button
                        className="mt-3"
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(item)}
                        disabled={deleteEvent.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
