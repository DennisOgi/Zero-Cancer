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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  buildBoardingInviteWhatsAppMessage,
  openWhatsAppShare,
  openWhatsAppTextShare,
} from '@/lib/whatsapp-link'
import {
  anniversaryContacts,
  boardingInvitees,
  myBoardingInvites,
  useCreateAnniversaryContact,
  useCreateBoardingInvite,
} from '@/services/providers/boarding.provider'
import { deleteAnniversaryContact } from '@/services/boarding.service'
import { useAuthUser } from '@/services/providers/auth.provider'
import { centers } from '@/services/providers/center.provider'
import { myWaitingLists } from '@/services/providers/waiting-list.provider'
import { QueryKeys } from '@/services/keys'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { TBoardingInvite } from '@zerocancer/shared/types'
import {
  CalendarHeart,
  Copy,
  Gift,
  Loader2,
  MessageCircle,
  Stethoscope,
  Users,
} from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function InviteHubPage() {
  const queryClient = useQueryClient()
  const { data: auth } = useQuery(useAuthUser())
  const inviterName = auth?.data?.user?.fullName || 'A friend'
  const profile = auth?.data?.user?.profile
  const assignedCenter = auth?.data?.user?.assignedCenter
  const isDonor = profile === 'DONOR'
  const { data: invitesData, isLoading: invitesLoading } = useQuery(myBoardingInvites())
  const { data: inviteesData } = useQuery(boardingInvitees())
  const { data: datesData } = useQuery(anniversaryContacts())
  const { data: centersData } = useQuery({
    ...centers({ page: 1, pageSize: 80 }),
    enabled: isDonor,
  })
  const { data: listsData } = useQuery({
    ...myWaitingLists(),
    enabled: isDonor,
  })
  const createInvite = useCreateBoardingInvite()
  const saveDate = useCreateAnniversaryContact()
  const [creating, setCreating] = useState<'SCREEN' | 'CELEBRANT' | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [occasion, setOccasion] = useState<'BIRTHDAY' | 'WEDDING'>('BIRTHDAY')
  const [month, setMonth] = useState('6')
  const [day, setDay] = useState('12')
  const [boundCenterId, setBoundCenterId] = useState('')
  const [waitingListId, setWaitingListId] = useState('')

  const invites = invitesData?.data?.invites || []
  const screenInvite = invites.find((row) => row.type === 'SCREEN' && !row.waitingListId)
  const celebrantInvite = invites.find((row) =>
    row.type === 'CELEBRANT' &&
    (waitingListId ? row.waitingListId === waitingListId : !row.waitingListId),
  )
  const facilityChoices = centersData?.data?.centers || []
  const myLists = listsData?.data?.lists || []
  const invitees = inviteesData?.data?.invitees || []
  const dates = datesData?.data?.contacts || []
  const dueSoon = useMemo(() => dates.filter((row) => row.dueSoon), [dates])

  const ensureInvite = async (type: 'SCREEN' | 'CELEBRANT') => {
    const existing = type === 'SCREEN' ? screenInvite : celebrantInvite
    if (type === 'SCREEN' && existing && !boundCenterId) return existing
    if (type === 'CELEBRANT' && existing && !waitingListId) return existing
    setCreating(type)
    try {
      const res = await createInvite.mutateAsync({
        type,
        boundCenterId:
          type === 'SCREEN' && boundCenterId ? boundCenterId : undefined,
        waitingListId:
          type === 'CELEBRANT' && waitingListId ? waitingListId : undefined,
      })
      return res.data
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not create this invite')
      return null
    } finally {
      setCreating(null)
    }
  }

  const copyInvite = async (invite: TBoardingInvite) => {
    await navigator.clipboard.writeText(invite.joinUrl)
    toast.success('Invite link copied')
  }

  const shareInvite = async (type: 'SCREEN' | 'CELEBRANT') => {
    const invite = await ensureInvite(type)
    if (!invite) return
    openWhatsAppTextShare(
      buildBoardingInviteWhatsAppMessage({
        inviterName,
        type,
        joinUrl: invite.joinUrl,
      }),
    )
  }

  const onSaveDate = async (event: FormEvent) => {
    event.preventDefault()
    const monthNumber = Number(month)
    const dayNumber = Number(day)
    const probe = new Date(2024, monthNumber - 1, dayNumber)
    if (
      probe.getMonth() !== monthNumber - 1 ||
      probe.getDate() !== dayNumber
    ) {
      toast.error('That date does not exist. Check the day for that month.')
      return
    }
    try {
      await saveDate.mutateAsync({
        name,
        phone,
        occasion,
        month: Number(month),
        day: Number(day),
      })
      setName('')
      setPhone('')
      toast.success('Saved. We will remind you in the app — you send the WhatsApp.')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not save this date')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invite people in</h1>
        <p className="mt-1 text-muted-foreground">
          Choose the kind of invite before you share. They land on a short
          onboarding, then create an account. You will see who joined — never
          their screening or result.
        </p>
        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Earnings: screen invites pay only if you have Earn / Refer turned on,
          and only when that person completes a screening. Celebrant invites pay
          a percentage when they fund a campaign — not per woman screened.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InviteCard
          title="Invite someone to screen"
          description={
            screenInvite?.boundCenter
              ? `Invitees in ${screenInvite.boundCenter.lga} can join ${screenInvite.boundCenter.centerName}. Others pick a nearby facility.`
              : assignedCenter
                ? `Your hospital is ${assignedCenter.centerName}. Invitees in the same city can join it.`
                : 'This link has no hospital yet. Invitees will choose a facility after signup.'
          }
          icon={Stethoscope}
          invite={screenInvite}
          loading={creating === 'SCREEN' || invitesLoading}
          onGenerate={() => ensureInvite('SCREEN')}
          onCopy={() => screenInvite && copyInvite(screenInvite)}
          onWhatsApp={() => shareInvite('SCREEN')}
        >
          {isDonor ? (
            <div className="space-y-1.5">
              <Label>Hospital on this link (optional)</Label>
              <Select
                value={boundCenterId || '__none'}
                onValueChange={(value) =>
                  setBoundCenterId(value === '__none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Invitees choose their own facility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">
                    No hospital — they choose after signup
                  </SelectItem>
                  {facilityChoices.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.centerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </InviteCard>
        <InviteCard
          title="Invite a celebrant or donor"
          description="For birthdays, weddings, CWO, and philanthropists. They can fund a waiting list or create one tagged to their event."
          icon={Gift}
          invite={celebrantInvite}
          loading={creating === 'CELEBRANT' || invitesLoading}
          onGenerate={() => ensureInvite('CELEBRANT')}
          onCopy={() => celebrantInvite && copyInvite(celebrantInvite)}
          onWhatsApp={() => shareInvite('CELEBRANT')}
        >
          {isDonor && myLists.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Tag a waiting list (optional)</Label>
              <Select
                value={waitingListId || '__none'}
                onValueChange={(value) =>
                  setWaitingListId(value === '__none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Generic waiting lists page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No tagged list</SelectItem>
                  {myLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : isDonor ? (
            <p className="text-xs text-muted-foreground">
              Create a waiting list first if you want this celebrant link to
              open that list.
            </p>
          ) : null}
        </InviteCard>
      </div>

      {dueSoon.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-950">
              <CalendarHeart className="h-5 w-5" />
              Reminders this month
            </CardTitle>
            <CardDescription className="text-amber-900">
              We remind you in the app. You send the WhatsApp so they know it came from you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueSoon.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.occasion === 'WEDDING' ? 'Wedding anniversary' : 'Birthday'}{' '}
                    in {row.daysUntil === 0 ? 'today' : `${row.daysUntil} days`}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => openWhatsAppShare(row.phone, row.whatsappMessage)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp {row.name.split(' ')[0]}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Invitees
            </CardTitle>
            <CardDescription>
              People who created an account with your link. Screening dates and
              results stay private.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No one has joined yet. Share a link above.
              </p>
            ) : (
              <ul className="space-y-3">
                {invitees.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{row.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(row.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                      {row.role === 'DONOR' ? 'Celebrant' : 'To screen'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarHeart className="h-5 w-5" />
              Birthdays & anniversaries
            </CardTitle>
            <CardDescription>
              Save a friend’s date and WhatsApp. We remind you in the app before
              the day. We do not message them for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSaveDate} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="friend-name">Name</Label>
                <Input
                  id="friend-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Chioma"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="friend-phone">WhatsApp number</Label>
                <Input
                  id="friend-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0803..."
                  required
                />
              </div>
              <div>
                <Label>Occasion</Label>
                <Select value={occasion} onValueChange={(value) => setOccasion(value as 'BIRTHDAY' | 'WEDDING')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIRTHDAY">Birthday</SelectItem>
                    <SelectItem value="WEDDING">Wedding anniversary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Month</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((label, index) => (
                        <SelectItem key={label} value={String(index + 1)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="friend-day">Day</Label>
                  <Input
                    id="friend-day"
                    type="number"
                    min={1}
                    max={31}
                    value={day}
                    onChange={(event) => setDay(event.target.value)}
                  />
                </div>
              </div>
              <Button className="sm:col-span-2" disabled={saveDate.isPending}>
                {saveDate.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save date
              </Button>
            </form>
            <ul className="mt-4 space-y-2">
              {dates.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>
                    {row.name} · {MONTHS[row.month - 1]} {row.day}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-rose-600"
                    onClick={async () => {
                      await deleteAnniversaryContact(row.id)
                      queryClient.invalidateQueries({
                        queryKey: [QueryKeys.anniversaryContacts],
                      })
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InviteCard({
  title,
  description,
  icon: Icon,
  invite,
  loading,
  onGenerate,
  onCopy,
  onWhatsApp,
  children,
}: {
  title: string
  description: string
  icon: typeof Gift
  invite?: TBoardingInvite
  loading: boolean
  onGenerate: () => void
  onCopy: () => void
  onWhatsApp: () => void
  children?: ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-pink-700">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        {invite ? (
          <p className="truncate rounded-lg bg-slate-50 px-3 py-2 text-xs">{invite.joinUrl}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onGenerate} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {invite ? 'Ready to share' : 'Generate link'}
          </Button>
          {invite ? (
            <>
              <Button variant="outline" onClick={onCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={onWhatsApp}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onWhatsApp} disabled={loading}>
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
