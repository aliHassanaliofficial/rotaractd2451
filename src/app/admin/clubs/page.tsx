'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { deleteClub } from '@/lib/supabase/queries/clubs'
import type { Club } from '@/types/database'

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [permanent, setPermanent] = useState(false)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        let query = supabase.from('clubs').select('*').order('name')

        if (statusFilter === 'active') query = query.eq('is_active', true)
        else if (statusFilter === 'inactive') query = query.eq('is_active', false)

        const { data, error } = await query
        if (error) throw error
        if (!cancelled) setClubs(data || [])
      } catch {
        if (!cancelled) toast.error('Failed to load clubs')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [statusFilter, supabase])

  function closeDelete() {
    setDeleteId(null)
    setPermanent(false)
    setPassword('')
  }

  async function handleDelete(id: string, action: 'inactivate' | 'permanent') {
    setDeleting(true)
    try {
      await deleteClub(id, action, action === 'permanent' ? password : undefined)

      if (action === 'inactivate') {
        setClubs((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: false } : c)))
        toast.success('Club inactivated')
      } else {
        setClubs((prev) => prev.filter((c) => c.id !== id))
        toast.success('Club permanently deleted')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete club')
    } finally {
      setDeleting(false)
      closeDelete()
    }
  }

  const filtered = clubs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.university?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  const deleteClubRow = clubs.find((c) => c.id === deleteId) || null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Clubs</h1>
        <Link href="/admin/clubs/new">
          <Button type="button">
            <Plus className="mr-2 h-4 w-4" /> Create Club
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search clubs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">University</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Members</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4" colSpan={6}><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No clubs found</td>
                  </tr>
                ) : (
                  filtered.map((club) => (
                    <tr key={club.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-navy">{club.name}</td>
                      <td className="px-6 py-4 text-gray-600">{club.university || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{club.city || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{club.member_count || 0}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn(club.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')} variant="outline">
                          {club.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/clubs/${club.id}/edit`}>
                            <Button type="button" variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => {
                              setDeleteId(club.id)
                              setPermanent(false)
                              setPassword('')
                            }}
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
        </CardContent>
      </Card>

      <Dialog open={!!deleteClubRow} onOpenChange={(open) => !open && closeDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {permanent ? 'Permanently Delete Club' : 'Delete Club'}
            </DialogTitle>
            <DialogDescription>
              {permanent
                ? `This will permanently delete "${deleteClubRow?.name}", including all of its events, posts, gallery albums, and registrations. All members will be unassigned. This cannot be undone.`
                : `Choose how to handle "${deleteClubRow?.name}".`}
            </DialogDescription>
          </DialogHeader>
          {permanent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-password">Confirm password</Label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setPermanent(false)} disabled={deleting}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeDelete} disabled={deleting}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => deleteClubRow && handleDelete(deleteClubRow.id, 'permanent')}
                    disabled={deleting || !password}
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete Forever
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="outline" onClick={closeDelete}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => deleteClubRow && handleDelete(deleteClubRow.id, 'inactivate')}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Inactivate
                </Button>
                <Button type="button" variant="destructive" onClick={() => setPermanent(true)} disabled={deleting}>
                  Permanently Delete
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
