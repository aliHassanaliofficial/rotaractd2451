'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { getCurrentRotaryYear, formatRotaryYear } from '@/lib/utils/date'
import type { Award } from '@/types/database'

const emptyForm = {
  title: '',
  recipient: '',
  category: '',
  year: getCurrentRotaryYear(),
  description: '',
}

export default function AdminAwardsPage() {
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Award | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadAwards()
  }, [])

  async function loadAwards() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .order('year', { ascending: false })
        .order('sort_order', { ascending: true })
      if (error) throw error
      setAwards((data || []) as Award[])
    } catch {
      toast.error('Failed to load awards')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(award: Award) {
    setEditing(award)
    setForm({
      title: award.title,
      recipient: award.recipient || '',
      category: award.category || '',
      year: award.year || getCurrentRotaryYear(),
      description: award.description || '',
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
      const payload = {
        title: form.title.trim(),
        recipient: form.recipient.trim() || null,
        category: form.category.trim() || null,
        year: form.year.trim() || null,
        description: form.description.trim() || null,
      }
      if (editing) {
        const { error } = await supabase.from('awards').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Award updated')
      } else {
        const maxSort = awards.length > 0 ? Math.max(...awards.map((a) => a.sort_order || 0)) : -1
        const { error } = await supabase.from('awards').insert({ ...payload, sort_order: maxSort + 1 })
        if (error) throw error
        toast.success('Award created')
      }
      setDialogOpen(false)
      loadAwards()
    } catch {
      toast.error('Failed to save award')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('awards').delete().eq('id', id)
      if (error) throw error
      toast.success('Award deleted')
      setDeleteDialogOpen(false)
      loadAwards()
    } catch {
      toast.error('Failed to delete award')
    }
  }

  if (loading && awards.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Awards</h1>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Awards</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Award</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">District Awards</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4 pl-4">Title</th>
                  <th className="pb-3 pr-4">Recipient</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Year</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {awards.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No awards yet
                    </td>
                  </tr>
                ) : (
                  awards.map((award) => (
                    <tr key={award.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 pl-4 font-medium text-navy">{award.title}</td>
                      <td className="py-3 pr-4 text-gray-600">{award.recipient || '—'}</td>
                      <td className="py-3 pr-4">
                        {award.category ? (
                          <Badge className="bg-cranberry/10 text-cranberry" variant="outline">{award.category}</Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{award.year ? formatRotaryYear(award.year) : '—'}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(award)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => { setDeletingId(award.id); setDeleteDialogOpen(true) }}
                            title="Delete"
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
            <DialogTitle>{editing ? 'Edit Award' : 'New Award'}</DialogTitle>
            <DialogDescription>Add or update a district award</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Best Club of the Year" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Recipient</label>
                <Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="e.g. RC Cairo North" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Category</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Community Service" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Year (Rotary Year)</label>
              <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 26/27" />
              {form.year && <p className="text-xs text-gray-400">Displays as {formatRotaryYear(form.year)}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Why was this award given?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Award</DialogTitle>
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