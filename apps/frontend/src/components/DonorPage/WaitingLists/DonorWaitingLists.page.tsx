import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shared/ui/tabs'
import { Textarea } from '@/components/shared/ui/textarea'
import {
  buildWaitingListWhatsAppMessage,
  openWhatsAppTextShare,
} from '@/lib/whatsapp-link'
import {
  myWaitingLists,
  publicWaitingLists,
  useCreateWaitingList,
} from '@/services/providers/waiting-list.provider'
import { useScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { TWaitingList } from '@zerocancer/shared/types'
import {
  Copy,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

function naira(amount: number) {
  return `₦${Math.round(amount).toLocaleString()}`
}

function ListCard({
  list,
  showShare,
  onSponsor,
}: {
  list: TWaitingList
  showShare?: boolean
  onSponsor: (list: TWaitingList, count: number) => void
}) {
  const [count, setCount] = useState(
    Math.max(1, list.pendingCount || list.memberCount || 1),
  )
  const amount = count * (list.screeningPrice || 10000)

  const copyLink = async () => {
    if (!list.joinUrl) return
    await navigator.clipboard.writeText(list.joinUrl)
    toast.success('Join link copied')
  }

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{list.name}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {list.visibility === 'PRIVATE' ? 'Private list' : 'Public list'}
            {list.targetGender === 'FEMALE' ? ' · Women' : ''}
            {list.targetGender === 'MALE' ? ' · Men' : ''}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
          <Users className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
        {list.description || 'People on this list can be sponsored for screening.'}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Waiting</p>
          <p className="font-semibold">{list.pendingCount}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Joined</p>
          <p className="font-semibold">{list.memberCount}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-700">
        {list.screeningTypeName} · {naira(list.screeningPrice)} each
      </p>
      {list.ownerLabel ? (
        <p className="mt-1 text-xs text-muted-foreground">Created by {list.ownerLabel}</p>
      ) : null}

      <div className="mt-4 space-y-2">
        <Label htmlFor={`count-${list.id}`}>How many people to sponsor</Label>
        <Input
          id={`count-${list.id}`}
          type="number"
          min={1}
          value={count}
          onChange={(event) =>
            setCount(Math.max(1, Number(event.target.value) || 1))
          }
        />
        <p className="text-sm text-muted-foreground">Total: {naira(amount)}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="bg-secondary text-white hover:bg-secondary/90"
          onClick={() => onSponsor(list, count)}
        >
          Sponsor {count} {count === 1 ? 'person' : 'people'}
        </Button>
        {list.pendingCount > 0 ? (
          <Button
            variant="outline"
            onClick={() => onSponsor(list, Math.max(1, list.pendingCount))}
          >
            Sponsor everyone waiting ({list.pendingCount})
          </Button>
        ) : null}
      </div>

      {showShare && list.joinUrl ? (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={copyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy link
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              openWhatsAppTextShare(
                buildWaitingListWhatsAppMessage({
                  listName: list.name,
                  joinUrl: list.joinUrl!,
                  visibility: list.visibility,
                }),
              )
            }
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function DonorWaitingListsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [targetGender, setTargetGender] = useState<'FEMALE' | 'MALE' | 'ANY'>(
    'FEMALE',
  )
  const [screeningTypeId, setScreeningTypeId] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timeout)
  }, [search])

  const { data: publicData, isLoading: publicLoading } = useQuery(
    publicWaitingLists({
      page: 1,
      pageSize: 50,
      search: debouncedSearch || undefined,
    }),
  )
  const { data: mineData, isLoading: mineLoading } = useQuery(myWaitingLists())
  const { data: screeningTypesData } = useQuery(
    useScreeningTypes({ page: 1, pageSize: 50 }),
  )
  const createList = useCreateWaitingList()

  const screeningTypes = screeningTypesData?.data || []
  const defaultScreeningId = useMemo(() => {
    const cervical = screeningTypes.find((type) =>
      type.name.toLowerCase().includes('cervical'),
    )
    return cervical?.id || screeningTypes[0]?.id || ''
  }, [screeningTypes])

  useEffect(() => {
    if (!screeningTypeId && defaultScreeningId) {
      setScreeningTypeId(defaultScreeningId)
    }
  }, [defaultScreeningId, screeningTypeId])

  const publicLists = publicData?.data?.lists || []
  const myLists = mineData?.data?.lists || []

  const handleSponsor = (list: TWaitingList, count: number) => {
    const amount = Math.max(1000, count * (list.screeningPrice || 10000))
    navigate({
      to: '/donor/campaigns/create',
      search: {
        targetGroupId: list.id,
        groupName: list.name,
        screeningTypeId: list.screeningTypeId || undefined,
        fundingAmount: amount,
        sponsorCount: count,
        targetGender: list.targetGender || 'ALL',
      },
    })
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) {
      toast.error('Give the waiting list a name')
      return
    }
    try {
      const created = await createList.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        targetGender: targetGender === 'ANY' ? undefined : targetGender,
        screeningTypeId: screeningTypeId || undefined,
      })
      toast.success(
        visibility === 'PRIVATE'
          ? 'Private waiting list created. Share the WhatsApp link with the people you want to sponsor.'
          : 'Public waiting list created. Other donors can sponsor people on it.',
      )
      setName('')
      setDescription('')
      if (created.data.joinUrl) {
        await navigator.clipboard.writeText(created.data.joinUrl).catch(() => {})
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || 'Could not create the waiting list',
      )
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Waiting lists</h1>
        <p className="mt-1 text-gray-500">
          Churches, fellowships, and celebrants can create a list, share a WhatsApp
          join link, and sponsor everyone on it — or a specific number of people.
          You can fund a public list, a CWO/church group, or tag a private list
          to your event.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-pink-600" />
            Create a waiting list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="list-name">List name</Label>
              <Input
                id="list-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. St Mary's Women's Screening Sunday"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="list-description">Description</Label>
              <Textarea
                id="list-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Who should join, and what you want to sponsor."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as 'PUBLIC' | 'PRIVATE')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    Public — any donor can sponsor
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    Private — only you can sponsor
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Who can join</Label>
              <Select
                value={targetGender}
                onValueChange={(value) =>
                  setTargetGender(value as 'FEMALE' | 'MALE' | 'ANY')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEMALE">Women</SelectItem>
                  <SelectItem value="MALE">Men</SelectItem>
                  <SelectItem value="ANY">Anyone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Screening to sponsor</Label>
              <Select
                value={screeningTypeId}
                onValueChange={setScreeningTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a screening" />
                </SelectTrigger>
                <SelectContent>
                  {screeningTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createList.isPending}>
                {createList.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create list and get share link
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                A church or fellowship should create a public list for women,
                then share the WhatsApp link. People register through that link
                and wait here to be sponsored.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="public">
        <TabsList>
          <TabsTrigger value="public">Public lists to sponsor</TabsTrigger>
          <TabsTrigger value="mine">My lists</TabsTrigger>
        </TabsList>
        <TabsContent value="public" className="mt-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search public waiting lists..."
              className="pl-9"
            />
          </div>
          {publicLoading ? (
            <div className="flex items-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading public lists...
            </div>
          ) : publicLists.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
              No public waiting lists yet. Create one above for a church,
              outreach, or community group.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {publicLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  showShare={Boolean(list.joinUrl)}
                  onSponsor={handleSponsor}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="mine" className="mt-6">
          {mineLoading ? (
            <div className="flex items-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading your lists...
            </div>
          ) : myLists.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
              You have not created a waiting list yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {myLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  showShare
                  onSponsor={handleSponsor}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
