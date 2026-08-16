'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/date'
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { toast } from 'sonner'
import type { HistoryEntry } from '@/types/database'

export default function SuperAdminHistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    title: '',
    description: '',
    image_url: '',
    milestone_type: 'none',
  })

  const supabase = createClient()

  useEffect(() => { loadEntries() }, [])

  async function loadEntries() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('history_entries')
        .select('*')
        .order('year', { ascending: false })
        .order('sort_order', { ascending: true })
      if (error) throw error
      setEntries(data || [])
    } catch {
      toast.error('Failed to load history entries')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditingEntry(null)
    setForm({ year: new Date().getFullYear(), title: '', description: '', image_url: '', milestone_type: 'none' })
    setDialogOpen(true)
  }

  function openEdit(entry: HistoryEntry) {
    setEditingEntry(entry)
    setForm({
      year: entry.year,
      title: entry.title,
      description: entry.description || '',
      image_url: entry.image_url || '',
      milestone_type: entry.milestone_type || 'none',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('history_entries')
          .update({
            year: form.year,
            title: form.title,
            description: form.description || null,
            image_url: form.image_url || null,
            milestone_type: form.milestone_type === 'none' ? null : form.milestone_type,
          })
          .eq('id', editingEntry.id)
        if (error) throw error
        toast.success('Entry updated')
      } else {
        const maxSort = entries.length > 0 ? Math.max(...entries.map((e) => e.sort_order || 0)) : -1
        const { error } = await supabase
          .from('history_entries')
          .insert({
            year: form.year,
            title: form.title,
            description: form.description || null,
            image_url: form.image_url || null,
            milestone_type: form.milestone_type === 'none' ? null : form.milestone_type,
            sort_order: maxSort + 1,
          })
        if (error) throw error
        toast.success('Entry created')
      }
      setDialogOpen(false)
      loadEntries()
    } catch {
      toast.error('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const { error } = await supabase.from('history_entries').delete().eq('id', id)
      if (error) throw error
      toast.success('Entry deleted')
      setDeleteDialogOpen(false)
      loadEntries()
    } catch {
      toast.error('Failed to delete entry')
    } finally {
      setDeletingId(null)
    }
  }

  async function moveEntry(id: string, direction: 'up' | 'down') {
    const sorted = [...entries].sort((a, b) => a.year !== b.year ? b.year - a.year : a.sort_order - b.sort_order)
    const idx = sorted.findIndex((e) => e.id === id)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= sorted.length) return

    const current = sorted[idx]
    const other = sorted[target]

    const { error: e1 } = await supabase
      .from('history_entries')
      .update({ sort_order: other.sort_order })
      .eq('id', current.id)
    const { error: e2 } = await supabase
      .from('history_entries')
      .update({ sort_order: current.sort_order })
      .eq('id', other.id)

    if (e1 || e2) {
      toast.error('Failed to reorder')
      return
    }
    loadEntries()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-amber-900">District History</h1>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-900">District History</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Entry</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">History Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="w-12 px-4 pb-3" />
                  <th className="pb-3 pr-4">Year</th>
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Milestone Type</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No history entries yet
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, i) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => moveEntry(entry.id, 'up')}>
                            ↑
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === entries.length - 1} onClick={() => moveEntry(entry.id, 'down')}>
                            ↓
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium text-navy">{entry.year}</td>
                      <td className="py-3 pr-4 text-gray-700">{entry.title}</td>
                      <td className="py-3 pr-4">
                        {entry.milestone_type ? (
                          <Badge variant="outline">{entry.milestone_type}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>Edit</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => { setDeletingId(entry.id); setDeleteDialogOpen(true) }}
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
            <DialogTitle>{editingEntry ? 'Edit Entry' : 'New History Entry'}</DialogTitle>
            <DialogDescription>Add a milestone or significant event in district history</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Year</label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Milestone Type</label>
                <Select
                  value={form.milestone_type}
                  onValueChange={(v) => setForm({ ...form, milestone_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="founding">Founding</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="award">Award</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Charter Night" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the milestone..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Image URL</label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingEntry ? 'Update' : 'Create'}
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
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)} disabled={deletingId === deletingId && deletingId !== null}>
              {deletingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
