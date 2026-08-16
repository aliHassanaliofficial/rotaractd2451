'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/date'
import { Search, Mail, Loader2, User, Check, X, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { Profile, ApprovalStatus, Club } from '@/types/database'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<(Profile & { club?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState<(Profile & { club?: any }) | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    club_id: '',
  })
  const supabase = createClient()

  useEffect(() => { loadMembers() }, [roleFilter])

  useEffect(() => {
    if (!createOpen) return
    supabase
      .from('clubs')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }) => {
        if (!error) setClubs((data as Club[]) || [])
      })
  }, [createOpen, supabase])

  async function loadMembers() {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*, club:club_id(*)')
        .order('created_at', { ascending: false })

      if (roleFilter !== 'all') query = query.eq('role', roleFilter)

      const { data, error } = await query
      if (error) throw error
      setMembers(data || [])
    } catch {
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  async function handleApproval(member: Profile, status: ApprovalStatus) {
    setActionLoading(member.id)
    try {
      const res = await fetch(`/api/admin/members/${member.id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update')
      toast.success(status === 'approved' ? `${member.full_name} approved` : `${member.full_name} rejected`)
      loadMembers()
      setSelectedMember(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreateClubAdmin(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create club admin')
      toast.success(`Club admin account created for ${form.full_name}`)
      setCreateOpen(false)
      setForm({ full_name: '', email: '', password: '', club_id: '' })
      loadMembers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create club admin')
    } finally {
      setCreating(false)
    }
  }

  const filtered = members.filter((m) =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = members.filter((m) => m.approval_status === 'pending').length

  const roleColors: Record<string, string> = {
    member: 'bg-gray-100 text-gray-700',
    club_admin: 'bg-blue-100 text-blue-700',
    district_admin: 'bg-cranberry/10 text-cranberry',
    superadmin: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Members</h1>
          <p className="text-sm text-gray-500">
            {members.length} total members
            {pendingCount > 0 && ` · ${pendingCount} pending approval`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Create Club Admin
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="club_admin">Club Admin</SelectItem>
            <SelectItem value="district_admin">District Admin</SelectItem>
            <SelectItem value="superadmin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Club</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4" colSpan={6}><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No members found</td>
                  </tr>
                ) : (
                  filtered.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b transition-colors hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="bg-cranberry/10 text-cranberry">
                              {member.full_name?.charAt(0) || <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-navy">{member.full_name}</p>
                            <p className="text-xs text-gray-400">{member.rotaract_id || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{member.email}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium capitalize', roleColors[member.role] || '')} variant="outline">
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{member.club?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium capitalize', statusColors[member.approval_status || 'approved'] || '')} variant="outline">
                          {member.approval_status || 'approved'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(member.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-navy">Member Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedMember.avatar_url} />
                    <AvatarFallback className="bg-cranberry/10 text-xl text-cranberry">
                      {selectedMember.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-navy">{selectedMember.full_name}</h3>
                    <p className="text-sm text-gray-500">{selectedMember.email}</p>
                    {selectedMember.rotaract_id && (
                      <p className="text-xs text-gray-400">ID: {selectedMember.rotaract_id}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Role</p>
                    <p className="font-medium text-navy capitalize">{selectedMember.role.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Approval Status</p>
                    <Badge className={cn('font-medium capitalize', statusColors[selectedMember.approval_status || 'approved'] || '')} variant="outline">
                      {selectedMember.approval_status || 'approved'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Club</p>
                    <p className="font-medium text-navy">{selectedMember.club?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-navy">{selectedMember.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Occupation</p>
                    <p className="font-medium text-navy">{selectedMember.occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Graduation Year</p>
                    <p className="font-medium text-navy">{selectedMember.graduation_year || 'N/A'}</p>
                  </div>
                </div>

                {selectedMember.bio && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Bio</p>
                      <p className="text-sm text-navy">{selectedMember.bio}</p>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400">Joined {formatDate(selectedMember.created_at)}</p>
                  <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${selectedMember.email}`)}>
                    <Mail className="mr-2 h-4 w-4" /> Send Email
                  </Button>
                </div>

                {selectedMember.role === 'member' && selectedMember.approval_status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproval(selectedMember, 'approved')}
                      disabled={actionLoading === selectedMember.id}
                    >
                      {actionLoading === selectedMember.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                      Approve Member
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleApproval(selectedMember, 'rejected')}
                      disabled={actionLoading === selectedMember.id}
                    >
                      {actionLoading === selectedMember.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
                      Reject Member
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Create Club Admin</DialogTitle>
            <DialogDescription>
              Create a club admin account. The new admin can sign in immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClubAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Admin name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Club</Label>
              <Select value={form.club_id} onValueChange={(v) => setForm({ ...form, club_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose the club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                      {club.university ? ` - ${club.university}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
