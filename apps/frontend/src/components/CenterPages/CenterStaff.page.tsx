import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import { Card, CardContent } from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/shared/ui/form'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  centerById,
  staffInvites,
  staffMemberActivity,
  staffMembers,
  useCancelStaffInvite,
  useInviteStaff,
  useRemoveStaffMember,
  useResendStaffInvite,
  useUpdateStaffMember,
} from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { inviteStaffSchema } from '@zerocancer/shared/schemas/center.schema'
import {
  DEFAULT_STAFF_INVITE_ROLE,
  STAFF_INVITE_ROLE_ORDER,
  STAFF_ROLE_LABEL,
  isClinicalStaffRole,
  normalizeStaffRoleValue,
  type TStaffRole,
} from '@zerocancer/shared'
import {
  Ban,
  CheckCircle2,
  Copy,
  ListOrdered,
  Mail,
  MoreHorizontal,
  Plus,
  Trash2,
  UserCog,
  UserPlus,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import megaphoneIcon from '@/assets/images/megaphone.png'
import peopleIcon from '@/assets/images/people.png'
import { CenterStaffFilters } from './CenterStaffFilters'

type InviteStaffForm = z.input<typeof inviteStaffSchema>
type StaffRole = TStaffRole

const roleLabel = STAFF_ROLE_LABEL

type Row =
  | {
      kind: 'member'
      id: string
      name: string
      email: string
      role: StaffRole
      status: 'Active' | 'Suspended'
      patientsRegistered: number
      referralsCredited: number
      screeningsCompleted: number
      personalEois: number
      joined: string
      isOwner?: boolean
    }
  | {
      kind: 'invite'
      id: string
      name: string
      email: string
      role: StaffRole
      status: 'Invited' | 'Expired'
      patientsRegistered: null
      referralsCredited: null
      screeningsCompleted: null
      personalEois: null
      joined: string
    }

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error || fallback

const SOURCE_LABEL: Record<string, string> = {
  ONBOARDED: 'Registered / walk-in',
  REFERRAL: 'Staff referral',
  SCREENED: 'Screened',
}

export function CenterStaffPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [filter, setFilter] = useState('All Staff')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingRemoval, setPendingRemoval] = useState<Row | null>(null)
  const [activityStaff, setActivityStaff] = useState<{
    id: string
    name: string
  } | null>(null)
  const [renameStaff, setRenameStaff] = useState<{
    id: string
    name: string
  } | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [sentInvites, setSentInvites] = useState<
    Array<{ email: string; token: string }>
  >([])

  const authUserQuery = useQuery(useAuthUser())
  const user = authUserQuery.data?.data?.user
  const centerId = user?.id
  const myStaffId = user?.staffId

  const { data: centerData } = useQuery({
    ...centerById(centerId!),
    enabled: !!centerId,
  })
  const { data: membersData, isLoading: membersLoading } = useQuery({
    ...staffMembers(),
    enabled: !!centerId,
  })
  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    ...staffInvites(),
    enabled: !!centerId,
  })
  const { data: activityData, isLoading: activityLoading } = useQuery({
    ...staffMemberActivity(activityStaff?.id || ''),
    enabled: !!activityStaff?.id,
  })

  const inviteStaffMutation = useInviteStaff()
  const updateMember = useUpdateStaffMember()
  const removeMember = useRemoveStaffMember()
  const cancelInvite = useCancelStaffInvite()
  const resendInvite = useResendStaffInvite()

  const centerName = centerData?.data?.centerName
  const members = membersData?.data?.members || []
  const invites = invitesData?.data?.invites || []

  const topPerformers = membersData?.data?.topPerformers || []

  const rows = useMemo<Row[]>(
    () => [
      ...members.map((m) => ({
        kind: 'member' as const,
        id: m.id,
        name: m.fullName || m.email.split('@')[0],
        email: m.email,
        role: normalizeStaffRoleValue(m.role),
        status: m.status === 'SUSPENDED' ? ('Suspended' as const) : ('Active' as const),
        patientsRegistered: m.patientsRegistered,
        referralsCredited: m.referralsCredited || 0,
        screeningsCompleted: m.screeningsCompleted || 0,
        personalEois: m.personalEois || 0,
        joined: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—',
        isOwner: m.isOwner,
      })),
      ...invites.map((invite) => ({
        kind: 'invite' as const,
        id: invite.token,
        name: invite.fullName || invite.email.split('@')[0],
        email: invite.email,
        role: normalizeStaffRoleValue(
          invite.role || DEFAULT_STAFF_INVITE_ROLE,
        ),
        status:
          invite.expiresAt && new Date(invite.expiresAt) < new Date()
            ? ('Expired' as const)
            : ('Invited' as const),
        patientsRegistered: null,
        referralsCredited: null,
        screeningsCompleted: null,
        personalEois: null,
        joined: invite.expiresAt
          ? `Link expires ${new Date(invite.expiresAt).toLocaleDateString()}`
          : '—',
      })),
    ],
    [members, invites],
  )

  const filteredRows = useMemo(
    () =>
      rows
        .filter((row) => {
          if (filter === 'All Staff') return true
          if (filter === 'Invited')
            return row.status === 'Invited' || row.status === 'Expired'
          return row.status === filter
        })
        .filter((row) =>
          `${row.name} ${row.email} ${roleLabel[row.role]}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
        ),
    [rows, filter, searchTerm],
  )

  const form = useForm<InviteStaffForm>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: {
      emails: [''],
      role: DEFAULT_STAFF_INVITE_ROLE,
      fullName: '',
    },
  })
  const emailFields = form.watch('emails')
  const appendEmail = () =>
    form.setValue('emails', [...(form.getValues('emails') || []), ''])
  const removeEmail = (index: number) => {
    const next = (form.getValues('emails') || []).filter((_, i) => i !== index)
    form.setValue('emails', next.length ? next : [''])
  }

  const onInviteStaff = (data: InviteStaffForm) => {
    const validEmails = data.emails.filter((email) => email.trim())
    if (validEmails.length === 0) {
      toast.error('Please add at least one email address')
      return
    }
    inviteStaffMutation.mutate(
      {
        emails: validEmails,
        role: data.role || DEFAULT_STAFF_INVITE_ROLE,
        fullName: data.fullName || undefined,
      },
      {
        onSuccess: (res) => {
          const sent = res.data?.invites?.length || 0
          const skipped = res.data?.skipped || []
          toast.success(`Sent ${sent} invitation${sent === 1 ? '' : 's'}`)
          if (skipped.length) {
            toast.info(
              `Skipped ${skipped.map((s) => s.email).join(', ')}: already on your team`,
            )
          }
          setSentInvites(
            (res.data?.invites || []).map((invite) => ({
              email: invite.email,
              token: invite.token,
            })),
          )
          form.reset({
            emails: [''],
            role: DEFAULT_STAFF_INVITE_ROLE,
            fullName: '',
          })
          setInviteDialogOpen(false)
        },
        onError: (error) =>
          toast.error(errorMessage(error, 'Failed to send invitations')),
      },
    )
  }

  const changeRole = (row: Row, role: StaffRole) =>
    updateMember.mutate(
      { staffId: row.id, role },
      {
        onSuccess: () =>
          toast.success(`${row.name} is now ${roleLabel[role].toLowerCase()}`),
        onError: (error) => toast.error(errorMessage(error, 'Could not change role')),
      },
    )

  const setStatus = (row: Row, status: 'ACTIVE' | 'SUSPENDED') =>
    updateMember.mutate(
      { staffId: row.id, status },
      {
        onSuccess: () =>
          toast.success(
            status === 'SUSPENDED'
              ? `${row.name} can no longer sign in`
              : `${row.name} can sign in again`,
          ),
        onError: (error) =>
          toast.error(errorMessage(error, 'Could not update status')),
      },
    )

  const confirmRemoval = () => {
    if (!pendingRemoval) return
    const row = pendingRemoval
    const onDone = {
      onSuccess: () => {
        toast.success(
          row.kind === 'invite'
            ? `Invite to ${row.email} cancelled`
            : `${row.name} removed from your facility`,
        )
        setPendingRemoval(null)
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, 'Could not remove')),
    }
    if (row.kind === 'invite') cancelInvite.mutate(row.id, onDone)
    else removeMember.mutate(row.id, onDone)
  }

  const resend = (row: Row) =>
    resendInvite.mutate(row.id, {
      onSuccess: () => toast.success(`New invite link sent to ${row.email}`),
      onError: (error) => toast.error(errorMessage(error, 'Could not resend')),
    })

  const copyInviteLink = async (token: string) => {
    const url = `${window.location.origin}/staff/create-new-password?token=${token}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Invite link copied. Share it with your teammate.')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const activeCount = members.filter((m) => m.status === 'ACTIVE').length
  const clinicalCount = members.filter(
    (m) => isClinicalStaffRole(m.role) && m.status === 'ACTIVE',
  ).length
  const stats = [
    { title: 'Active team', value: activeCount, icon: peopleIcon, color: 'bg-blue-100' },
    { title: 'Doctors & nurses', value: clinicalCount, icon: peopleIcon, color: 'bg-red-100' },
    { title: 'Pending invites', value: invites.length, icon: megaphoneIcon, color: 'bg-purple-100' },
  ]

  const statusClass: Record<Row['status'], string> = {
    Active: 'bg-green-500',
    Invited: 'bg-gray-400',
    Expired: 'bg-red-500',
    Suspended: 'bg-amber-500',
  }

  const loading = membersLoading || invitesLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Doctors, nurses & staff</h1>
          <p className="text-muted-foreground">
            Manage the health care providers who work at{' '}
            {centerName || 'your health facility'}.
          </p>
        </div>
        <Button
          className="bg-primary text-white hover:bg-primary/80"
          onClick={() => setInviteDialogOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite staff
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className={cn('border-0', stat.color)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-white rounded-full">
                <img src={stat.icon} alt="" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {topPerformers.length > 0 ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="font-semibold">Top performing staff</p>
              <p className="text-sm text-muted-foreground">
                Based on referrals, screenings, registrations, and personal kit
                requests (activity counts only).
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {topPerformers.map((p, index) => (
                <div
                  key={p.id}
                  className="rounded-lg border bg-slate-50 px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    #{index + 1} {p.fullName || p.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.referralsCredited} referrals · {p.screeningsCompleted}{' '}
                    screenings · {p.patientsRegistered} patients ·{' '}
                    {p.personalEois} personal EOIs
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <CenterStaffFilters
        filter={filter}
        onFilterChange={setFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50 hover:bg-blue-100">
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Patients</TableHead>
              <TableHead className="text-right">Referrals</TableHead>
              <TableHead className="text-right">Screenings</TableHead>
              <TableHead className="text-right">Personal EOIs</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Loading staff...
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10">
                  <p className="font-medium">No staff here yet</p>
                  <p className="text-sm text-muted-foreground">
                    Invite doctors and nurses so they can register and screen patients.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {filteredRows.map((row) => {
              const isMe = row.kind === 'member' && row.id === myStaffId
              const isOwner = row.kind === 'member' && row.isOwner
              const locked = isMe || isOwner
              return (
                <TableRow key={`${row.kind}-${row.id}`}>
                  <TableCell className="font-medium">
                    {row.name}
                    {isMe && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                    {isOwner && !isMe && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (facility owner)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{roleLabel[row.role]}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell className="text-right">
                    {row.patientsRegistered ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.referralsCredited ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.screeningsCompleted ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.personalEois ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.joined}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn('text-white border-transparent', statusClass[row.status])}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.kind === 'member' ? (
                      <div className="inline-flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            setActivityStaff({ id: row.id, name: row.name })
                          }
                        >
                          Activity
                        </Button>
                        {!locked ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                aria-label="Actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onClick={() =>
                                  setActivityStaff({
                                    id: row.id,
                                    name: row.name,
                                  })
                                }
                              >
                                <ListOrdered className="mr-2 h-4 w-4" />
                                View patients / activity
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setRenameStaff({
                                    id: row.id,
                                    name: row.name,
                                  })
                                  setRenameDraft(
                                    row.name.includes('@') ? '' : row.name,
                                  )
                                }}
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                Edit display name
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change role</DropdownMenuLabel>
                              {STAFF_INVITE_ROLE_ORDER.filter(
                                (r) => r !== row.role,
                              ).map((r) => (
                                <DropdownMenuItem
                                  key={r}
                                  onClick={() => changeRole(row, r)}
                                >
                                  <UserCog className="mr-2 h-4 w-4" />
                                  Make {roleLabel[r].toLowerCase()}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              {row.status === 'Active' ? (
                                <DropdownMenuItem
                                  onClick={() => setStatus(row, 'SUSPENDED')}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend access
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setStatus(row, 'ACTIVE')}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setPendingRemoval(row)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove from facility
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => resend(row)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend invite
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={row.status === 'Expired'}
                            onClick={() => copyInviteLink(row.id)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy invite link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setPendingRemoval(row)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel invite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!activityStaff}
        onOpenChange={(open) => !open && setActivityStaff(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {activityStaff?.name || 'Staff'} — patients
            </DialogTitle>
            <DialogDescription>
              Patients this staff member registered, referred, or screened.
            </DialogDescription>
          </DialogHeader>
          {activityLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading activity…
            </p>
          ) : (activityData?.data?.patients || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No patient activity yet for this staff member.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {(activityData?.data?.patients || []).map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {patient.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {patient.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {SOURCE_LABEL[patient.source] || patient.source}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityStaff(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!renameStaff}
        onOpenChange={(open) => !open && setRenameStaff(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit display name</DialogTitle>
            <DialogDescription>
              Shown on referral invites and the staff list for{' '}
              {renameStaff?.name}.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            placeholder="e.g. Ada Okonkwo"
            autoComplete="name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameStaff(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateMember.isPending || renameDraft.trim().length < 2}
              onClick={() => {
                if (!renameStaff) return
                const fullName = renameDraft.trim()
                updateMember.mutate(
                  { staffId: renameStaff.id, fullName },
                  {
                    onSuccess: () => {
                      toast.success('Name updated')
                      setRenameStaff(null)
                    },
                    onError: (error) =>
                      toast.error(
                        errorMessage(error, 'Could not update name'),
                      ),
                  },
                )
              }}
            >
              {updateMember.isPending ? 'Saving…' : 'Save name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!pendingRemoval}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {pendingRemoval?.kind === 'invite'
                ? 'Cancel this invite?'
                : `Remove ${pendingRemoval?.name}?`}
            </DialogTitle>
            <DialogDescription>
              {pendingRemoval?.kind === 'invite'
                ? `The link sent to ${pendingRemoval?.email} will stop working.`
                : 'They will no longer be able to sign in to this facility. Patients they registered stay with your facility. You can invite them again later.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemoval(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoval}
              disabled={removeMember.isPending || cancelInvite.isPending}
            >
              {pendingRemoval?.kind === 'invite' ? 'Cancel invite' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite doctors & staff</DialogTitle>
            <DialogDescription>
              Each person gets an email link to set a password and join{' '}
              {centerName || 'your facility'}.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onInviteStaff)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dr Adaeze"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAFF_INVITE_ROLE_ORDER.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabel[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Doctors and nurses share a simple clinical path: register
                      and screen patients, or request a screen for a patient.
                      Each gets a private referral wallet the facility admin
                      cannot see. Facility admins manage the team, the
                      facility wallet, and Kits and Devices orders — not
                      individual clinician balances.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Email addresses</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={appendEmail}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add email
                  </Button>
                </div>
                <div className="space-y-3">
                  {emailFields.map((_, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`emails.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="Enter email address" type="email" {...field} />
                            </FormControl>
                            {emailFields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeEmail(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteStaffMutation.isPending}>
                  {inviteStaffMutation.isPending ? 'Sending...' : 'Send invitations'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sentInvites.length > 0}
        onOpenChange={(open) => !open && setSentInvites([])}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Invites are ready</DialogTitle>
            <DialogDescription>
              We emailed each person a link to set a password and join{' '}
              {centerName || 'your facility'}. If email is delayed, copy a link
              and send it yourself.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {sentInvites.map((invite) => (
              <div
                key={invite.token}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <p className="truncate text-sm">{invite.email}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyInviteLink(invite.token)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setSentInvites([])}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
