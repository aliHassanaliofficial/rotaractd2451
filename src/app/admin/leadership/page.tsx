'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Trash2, Loader2, CheckCircle2, XCircle, Upload } from 'lucide-react'
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
import type { DistrictLeadership } from '@/types/database'

export default function AdminLeadershipPage() {
  const [leaders, setLeaders] = useState<DistrictLeadership[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLeader, setEditingLeader] = useState<DistrictLeadership | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    position: '',
    year: new Date().getFullYear().toString(),
    bio: '',
    photo_url: '',
    is_current: true,
  })

  const supabase = createClient()

  useEffect(() => {
    loadYears()
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
        .select('*')
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

  function openNew() {
    setEditingLeader(null)
    setForm({
      name: '',
      position: '',
      year: selectedYear,
      bio: '',
      photo_url: '',
      is_current: true,
    })
    setDialogOpen(true)
  }

  function openEdit(leader: DistrictLeadership) {
    setEditingLeader(leader)
    setForm({
      name: leader.name || '',
      position: leader.position,
      year: leader.year,
      bio: leader.bio || '',
      photo_url: leader.photo_url || '',
      is_current: leader.is_current,
    })
    setDialogOpen(true)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be under 2MB')
      return
    }
    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `leadership/${uuidv4()}.${ext}`
      const { error } = await supabase.storage.from('gallery').upload(filePath, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath)
      setForm((f) => ({ ...f, photo_url: urlData.publicUrl }))
      toast.success('Photo uploaded')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
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
            name: form.name || null,
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
            name: form.name || null,
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

  async function toggleCurrent(leader: DistrictLeadership) {
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
                            <AvatarImage src={leader.photo_url} />
                            <AvatarFallback className="text-xs">
                              {leader.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{leader.name || '—'}</span>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Position</label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="District Governor" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Year</label>
              <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2025-2026" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Photo</label>
              <div className="flex items-center gap-3">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Preview" className="h-16 w-16 rounded-full border object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-gray-100 text-xs text-gray-400">
                    No photo
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {form.photo_url ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {form.photo_url && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setForm((f) => ({ ...f, photo_url: '' }))}>
                      Remove
                    </Button>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
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
