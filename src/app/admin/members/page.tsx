'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/date'
import { Search, Mail, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

export default function AdminMembersPage() {
  const [members, setMembers] = useState<(Profile & { club?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState<(Profile & { club?: any }) | null>(null)
  const supabase = createClient()

  useEffect(() => { loadMembers() }, [roleFilter])

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
        <p className="text-sm text-gray-500">{members.length} total members</p>
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
                        <Badge className={cn(member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')} variant="outline">
                          {member.is_active ? 'Active' : 'Inactive'}
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
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium text-navy">{selectedMember.is_active ? 'Active' : 'Inactive'}</p>
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
