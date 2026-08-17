'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import type { DistrictLeadership, Profile } from '@/types/database'

export default function AdminLeadershipPage() {
  const [leaders, setLeaders] = useState<(DistrictLeadership & { profile?: Profile })[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLeader, setEditingLeader] = useState<(DistrictLeadership & { profile?: Profile }) | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    profile_id: '',
    position: '',
    year: new Date().getFullYear().toString(),
    bio: '',
    photo_url: '',
    is_current: true,
  })

  const supabase = createClient()

  useEffect(() => {
    Promise.all([loadProfiles(), loadYears()])
  }, [])

  useEffect(() => {
    if (selectedYear) loadLeaders()
  }, [selectedYear])

  async function loadYears() {
    const { data } = await supabase.from('district_leadership').select('year')
    const years = [...new Set((data || []).map((r: { year: string }) => r.year))].sort().reverse()
    if (years.length > 0) setSelectedYear(years[0])
    else setSelectedYear(new Date().getFullYear().toString())
  }

  async function loadLeaders() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('district_leadership')
        .select('*, profile:profile_id(*)')
        .eq('year', selectedYear)
        .order('sort_order', { ascending: true })
      if (error) throw error
      setLeaders(data || [])
    } catch {
      toast.error('Failed to load leadership')
    } finally {
      setLoading(false)
    }
  }

  async function loadProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name')
    if (!error) setProfiles(data || [])
  }

  function openNew() {
    setEditingLeader(null)
    setForm({
      profile_id: '',
      position: '',
      year: selectedYear,
      bio: '',
      photo_url: '',
      is_current: true,
    })
    setDialogOpen(true)
  }

  function openEdit(leader: DistrictLeadership & { profile?: Profile }) {
    setEditingLeader(leader)
    setForm({
      profile_id: leader.profile_id || '',
      position: leader.position,
      year: leader.year,
      bio: leader.bio || '',
      photo_url: leader.photo_url || '',
      is_current: leader.is_current,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.position.trim()) {
      toast.error('Position is required')
      return
    }
    setSaving(true)
    try {
      if (editingLeader) {
        const { error } = await supabase
          .from('district_leadership')
          .update({
            profile_id: form.profile_id || null,
            position: form.position,
            year: form.year,
            bio: form.bio || null,
            photo_url: form.photo_url || null,
            is_current: form.is_current,
          })
          .eq('id', editingLeader.id)
        if (error) throw error
        toast.success('Leadership entry updated')
      } else {
        const maxSort = leaders.length > 0 ? Math.max(...leaders.map((l) => l.sort_order || 0)) : -1
        const { error } = await supabase
          .from('district_leadership')
          .insert({
            profile_id: form.profile_id || null,
            position: form.position,
            year: form.year,
            bio: form.bio || null,
            photo_url: form.photo_url || null,
            is_current: form.is_current,
            sort_order: maxSort + 1,
          })
        if (error) throw error
        toast.success('Leadership entry created')
      }
      setDialogOpen(false)
      loadLeaders()
    } catch {
      toast.error('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('district_leadership').delete().eq('id', id)
      if (error) throw error
      toast.success('Entry deleted')
      setDeleteDialogOpen(false)
      loadLeaders()
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function toggleCurrent(leader: DistrictLeadership & { profile?: Profile }) {
    try {
      const { error } = await supabase
        .from('district_leadership')
        .update({ is_current: !leader.is_current })
        .eq('id', leader.id)
      if (error) throw error
      toast.success(`Marked as ${leader.is_current ? 'past' : 'current'}`)
      loadLeaders()
    } catch {
      toast.error('Failed to toggle')
    }
  }

  if (loading && leaders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">District Leadership</h1>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">District Leadership</h1>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString()).map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Leadership for {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4 pl-4">Position</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Year</th>
                  <th className="pb-3 pr-4">Current</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No leadership entries for {selectedYear}
                    </td>
                  </tr>
                ) : (
                  leaders.map((leader) => (
                    <tr key={leader.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 pl-4 font-medium text-navy">{leader.position}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={leader.profile?.avatar_url || leader.photo_url} />
                            <AvatarFallback className="text-xs">
                              {leader.profile?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{leader.profile?.full_name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{leader.year}</td>
                      <td className="py-3 pr-4">
                        {leader.is_current ? (
                          <Badge className="bg-green-100 text-green-700" variant="outline">Current</Badge>
                        ) : (
                          <Badge variant="outline">Past</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(leader)}>Edit</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCurrent(leader)} title="Toggle current">
                            {leader.is_current ? (
                              <XCircle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => { setDeletingId(leader.id); setDeleteDialogOpen(true) }}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLeader ? 'Edit Entry' : 'New Leadership Entry'}</DialogTitle>
            <DialogDescription>Add a district leadership position</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">User</label>
              <Select value={form.profile_id} onValueChange={(v) => setForm({ ...form, profile_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name} ({p.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Position</label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="District Governor" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Year</label>
                <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2025-2026" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                placeholder="Short biography..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Photo URL</label>
              <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-navy">Current</label>
              <input
                type="checkbox"
                checked={form.is_current}
                onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-cranberry focus:ring-cranberry"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingLeader ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
