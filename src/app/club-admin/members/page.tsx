'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils/cn'
import { Search, Loader2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { ApprovalStatus } from '@/types/database'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ClubAdminMembersPage() {
  const { clubId } = useRole()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (clubId) loadMembers()
  }, [clubId])

  async function loadMembers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('club_id', clubId)
        .order('full_name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch {
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  async function handleApproval(member: any, status: ApprovalStatus) {
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  const pendingCount = members.filter((m) => m.approval_status === 'pending').length
  const filtered = members.filter((m) =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  const roleColors: Record<string, string> = {
    member: 'bg-gray-100 text-gray-700',
    club_admin: 'bg-blue-100 text-blue-700',
    district_admin: 'bg-cranberry/10 text-cranberry',
    superadmin: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Members</h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{members.length} total members</p>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-700">{pendingCount} pending</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4" colSpan={5}><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No members found</td>
                  </tr>
                ) : (
                  filtered.map((member) => (
                    <tr key={member.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="bg-cranberry/10 text-cranberry text-xs">
                              {member.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-navy">{member.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{member.email}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium capitalize', roleColors[member.role] || '')} variant="outline">
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium capitalize', statusColors[member.approval_status || 'approved'] || '')} variant="outline">
                          {member.approval_status || 'approved'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {member.approval_status === 'pending' ? (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproval(member, 'approved')} disabled={actionLoading === member.id}>
                                {actionLoading === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleApproval(member, 'rejected')} disabled={actionLoading === member.id}>
                                {actionLoading === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
