'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/date'
import {
  Search,
  Loader2,
  Upload,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import type { Profile, UserRole, ApprovalStatus } from '@/types/database'

const roleColors: Record<string, string> = {
  member: 'bg-gray-100 text-gray-700',
  club_admin: 'bg-blue-100 text-blue-700',
  district_admin: 'bg-cranberry/10 text-cranberry',
  superadmin: 'bg-amber-100 text-amber-700',
}

const approvalColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<(Profile & { club?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<(Profile & { club?: any }) | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<UserRole>('member')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadUsers() }, [roleFilter])

  async function loadUsers() {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*, club:club_id(*)')
        .order('created_at', { ascending: false })

      if (roleFilter !== 'all') query = query.eq('role', roleFilter)

      const { data, error } = await query
      if (error) throw error
      setUsers(data || [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleRoleChange() {
    if (!selectedUser) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id)
      if (error) throw error
      toast.success(`${selectedUser.full_name} is now ${newRole}`)
      setRoleDialogOpen(false)
      loadUsers()
    } catch {
      toast.error('Failed to update role')
    }
  }

  async function handleToggleActive(user: Profile & { club?: any }) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)
      if (error) throw error
      toast.success(`${user.is_active ? 'Deactivated' : 'Activated'} ${user.full_name}`)
      loadUsers()
    } catch {
      toast.error('Failed to toggle account status')
    }
  }

  async function handleApproval(user: Profile & { club?: any }, status: ApprovalStatus) {
    setApprovalLoading(user.id)
    try {
      const res = await fetch(`/api/admin/members/${user.id}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update')
      toast.success(status === 'approved' ? `${user.full_name} approved` : `${user.full_name} rejected`)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setApprovalLoading(null)
    }
  }

  async function handleDelete() {
    if (!selectedUser) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id)
      if (error) throw error
      toast.success(`Deleted ${selectedUser.full_name}`)
      setDeleteDialogOpen(false)
      loadUsers()
    } catch {
      toast.error('Failed to delete user. Cascade may have been blocked.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      const nameIdx = headers.indexOf('full_name')
      const emailIdx = headers.indexOf('email')
      const roleIdx = headers.indexOf('role')
      const clubIdx = headers.indexOf('club_id')

      if (nameIdx === -1 || emailIdx === -1) {
        throw new Error('CSV must include full_name and email columns')
      }

      let created = 0
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim())
        const profile = {
          full_name: cols[nameIdx],
          email: cols[emailIdx],
          role: (roleIdx >= 0 ? cols[roleIdx] : 'member') as UserRole,
          club_id: clubIdx >= 0 ? cols[clubIdx] || null : null,
          is_active: true,
          is_verified: false,
        }
        const { error } = await supabase.from('profiles').insert(profile)
        if (!error) created++
      }

      toast.success(`Imported ${created} members`)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to import CSV')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setImportDialogOpen(false)
    }
  }

  const openRoleDialog = (user: Profile & { club?: any }) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setRoleDialogOpen(true)
  }

  const openDeleteDialog = (user: Profile & { club?: any }) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-900">User Management</h1>
        <Button onClick={() => setImportDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" /> Import CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-navy">All Users</CardTitle>
            <CardDescription>{users.length} total</CardDescription>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
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
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Club</th>
                    <th className="pb-3 pr-4">Active</th>
                    <th className="pb-3 pr-4">Verified</th>
                    <th className="pb-3 pr-4">Approval</th>
                    <th className="pb-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {user.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-navy">{user.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{user.email}</td>
                        <td className="py-3 pr-4">
                          <Badge className={roleColors[user.role]} variant="outline">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{user.club?.name || '-'}</td>
                        <td className="py-3 pr-4">
                          {user.is_active ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={user.is_verified ? 'default' : 'outline'}>
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <Badge className={approvalColors[user.approval_status || 'approved']} variant="outline">
                              {user.approval_status || 'approved'}
                            </Badge>
                            {user.role === 'member' && user.approval_status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:bg-green-50"
                                  title="Approve membership"
                                  onClick={() => handleApproval(user, 'approved')}
                                  disabled={approvalLoading === user.id}
                                >
                                  {approvalLoading === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:bg-red-50"
                                  title="Reject membership"
                                  onClick={() => handleApproval(user, 'rejected')}
                                  disabled={approvalLoading === user.id}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Change Role" onClick={() => openRoleDialog(user)}>
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleActive(user)}
                            >
                              {user.is_active ? (
                                <XCircle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              title="Delete User"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="club_admin">Club Admin</SelectItem>
                <SelectItem value="district_admin">District Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This will permanently delete {selectedUser?.full_name} and all their data. This action cascades to their registrations, posts, and other associated records and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Members from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: full_name, email, role (optional), club_id (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="w-full text-sm file:mr-4 file:rounded-2xl file:border-0 file:bg-cranberry file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-cranberry/90"
              disabled={importing}
            />
            {importing && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Importing...
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importing}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
