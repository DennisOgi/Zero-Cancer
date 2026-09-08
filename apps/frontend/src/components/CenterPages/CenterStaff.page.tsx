import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  useInviteStaff,
} from '@/services/providers/center.provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { inviteStaffSchema } from '@zerocancer/shared/schemas/center.schema'
import { MoreHorizontal, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Import static assets
import megaphoneIcon from '@/assets/images/megaphone.png'
import peopleIcon from '@/assets/images/people.png'
import { CenterStaffFilters } from './CenterStaffFilters'

type InviteStaffForm = z.infer<typeof inviteStaffSchema>

export function CenterStaffPage() {
  const queryClient = useQueryClient()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [filter, setFilter] = useState('All Staff')
  const [searchTerm, setSearchTerm] = useState('')

  // Get current authenticated center info
  const authUserQuery = useQuery(useAuthUser())
  const user = authUserQuery.data?.data?.user
  const centerId = user?.id

  // Get center details including staff
  const { data: centerData, isLoading: centerLoading } = useQuery({
    ...centerById(centerId!),
    enabled: !!centerId,
  })

  // Get pending staff invites
  const { data: staffInvitesData, isLoading: invitesLoading } = useQuery({
    ...staffInvites(),
    enabled: !!centerId,
  })

  const center = centerData?.data
  const activeStaff = center?.staff || []
  const pendingInvites = staffInvitesData?.data?.invites || []

  const allStaff = useMemo(() => {
    const combined = [
      ...activeStaff.map((member) => ({
        id: member.id,
        name: member.fullName || member.email.split('@')[0],
        staffId: member.id.slice(0, 8),
        email: member.email,
        role: (member.role || 'STAFF').toString(),
        lastCheckin: '—',
        status:
          String(member.status || 'ACTIVE').toUpperCase() === 'SUSPENDED'
            ? 'Suspended'
            : 'Active',
      })),
      ...pendingInvites.map((invite) => ({
        id: invite.token,
        name: invite.fullName || invite.email.split('@')[0],
        staffId: 'N/A',
        email: invite.email,
        role: (invite.role || 'NURSE').toString(),
        lastCheckin: 'N/A',
        status:
          invite.expiresAt && new Date(invite.expiresAt) < new Date()
            ? 'Expired'
            : 'Invited',
      })),
    ]
    return combined
  }, [activeStaff, pendingInvites])

  const filteredStaff = useMemo(() => {
    return allStaff
      .filter((staff) => {
        if (filter === 'All Staff') return true
        return staff.status === filter
      })
      .filter((staff) =>
        `${staff.name} ${staff.email} ${staff.role}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
  }, [allStaff, filter, searchTerm])

  const inviteStaffMutation = useInviteStaff()

  const form = useForm<InviteStaffForm>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: {
      centerId: centerId || '',
      emails: [''],
      role: 'NURSE',
      fullName: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'emails' as any,
  })

  useEffect(() => {
    if (centerId) {
      form.setValue('centerId', centerId)
    }
  }, [centerId, form])

  const onInviteStaff = async (data: InviteStaffForm) => {
    const validEmails = data.emails.filter((email) => email.trim())
    if (validEmails.length === 0) {
      toast.error('Please add at least one email address')
      return
    }

    inviteStaffMutation.mutate(
      {
        centerId: data.centerId,
        emails: validEmails,
        role: data.role || 'NURSE',
        fullName: data.fullName || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully sent ${validEmails.length} invitation(s)`)
          form.reset({
            centerId: data.centerId,
            emails: [''],
            role: 'NURSE',
            fullName: '',
          })
          setInviteDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['staffInvites'] })
          queryClient.invalidateQueries({ queryKey: ['centerById'] })
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.error || 'Failed to send invitations',
          )
        },
      },
    )
  }

  const addEmailField = () => append('')
  const removeEmailField = (index: number) => {
    if (fields.length > 1) remove(index)
  }

  const stats = [
    {
      title: 'Total Staff',
      value: allStaff.length,
      description: 'People',
      icon: peopleIcon,
      color: 'bg-red-100',
    },
    {
      title: 'Total Active Staff',
      value: activeStaff.length,
      description: 'People',
      icon: peopleIcon,
      color: 'bg-blue-100',
    },
    {
      title: 'Pending Invites',
      value: pendingInvites.length,
      description: 'People',
      icon: megaphoneIcon,
      color: 'bg-purple-100',
    },
  ]

  const quickActions = [
    { label: 'Invite Staff', icon: UserPlus, primary: true },
  ]

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500'
      case 'Invited':
        return 'bg-gray-400'
      case 'Expired':
      case 'Suspended':
        return 'bg-red-500'
      default:
        return 'bg-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nurses & staff</h1>
          <p className="text-muted-foreground">
            Invite nurses who can register patients at{' '}
            {center?.centerName || 'your center'}. Existing center tools stay
            available for every role.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className={cn('border-0', stat.color)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-white rounded-full">
                <img src={stat.icon} alt={stat.title} className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.primary ? 'default' : 'outline'}
            className={cn('h-24 flex-col gap-2', {
              'bg-primary text-white hover:bg-primary/80': action.primary,
              'bg-gray-100 hover:bg-gray-200': !action.primary,
            })}
            onClick={() =>
              action.label === 'Invite Staff' && setInviteDialogOpen(true)
            }
            disabled={action.label !== 'Invite Staff'}
          >
            <action.icon className="h-6 w-6" />
            <span>{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Replaced inline Tabs + Search with CenterStaffFilters */}
      <CenterStaffFilters
        filter={filter}
        onFilterChange={setFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <p className="text-sm text-muted-foreground">
        Showing {filteredStaff.length} of {allStaff.length} staff members
      </p>

      <Table>
        <TableHeader>
          <TableRow className="bg-blue-50 hover:bg-blue-100">
            <TableHead>Staff Name</TableHead>
            <TableHead>Staff ID</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Staff Email</TableHead>
            <TableHead>Last Check-in</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(centerLoading || invitesLoading) && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                Loading staff...
              </TableCell>
            </TableRow>
          )}
          {!centerLoading && !invitesLoading && filteredStaff.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No staff members found.
              </TableCell>
            </TableRow>
          )}
          {filteredStaff.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {member.staffId}
              </TableCell>
              <TableCell className="capitalize">
                {member.role.toLowerCase()}
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.lastCheckin}</TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    'text-white border-transparent',
                    getStatusBadgeClass(member.status),
                  )}
                >
                  {member.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={member.status === 'Active'}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite nurses & staff</DialogTitle>
            <DialogDescription>
              Invite a nurse to register patients at this hospital. They can
              also verify check-ins, upload results, and use the existing
              center tools.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onInviteStaff)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="centerId"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nurse Adaeze"
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NURSE">Nurse</SelectItem>
                        <SelectItem value="ADMIN">Hospital admin</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Nurses register and screen patients. Hospital admins can
                      also invite teammates.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Email Addresses</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmailField}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Email
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`emails.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="Enter email address"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeEmailField(index)}
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

                <FormDescription>
                  They will be able to register patients, verify check-ins,
                  upload results, and access existing center tools.
                </FormDescription>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteStaffMutation.status === 'pending'}
                >
                  {inviteStaffMutation.status === 'pending'
                    ? 'Sending...'
                    : 'Send Invitations'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
