'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { AnalyticsEntry } from '@/types/database'

const emptyForm = {
  label: '',
  value: '',
  suffix: '',
  category: '',
  note: '',
}

export default function SuperAdminAnalyticsPage() {
  const [entries, setEntries] = useState<AnalyticsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AnalyticsEntry | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const loadEntries = useCallback(() => {
    supabase
      .from('analytics_entries')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error('Failed to load analytics')
          setLoading(false)
          return
        }
        setEntries((data || []) as AnalyticsEntry[])
        setLoading(false)
      })
  }, [supabase])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(entry: AnalyticsEntry) {
    setEditing(entry)
    setForm({
      label: entry.label,
      value: String(entry.value),
      suffix: entry.suffix || '',
      category: entry.category || '',
      note: entry.note || '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.label.trim()) {
      toast.error('Label is required')
      return
    }
    const numericValue = Number(form.value)
    if (form.value.trim() === '' || isNaN(numericValue)) {
      toast.error('Enter a valid number')
      return
    }
    setSaving(true)
    try {
      const payload = {
        label: form.label.trim(),
        value: numericValue,
        suffix: form.suffix.trim() || null,
        category: form.category.trim() || null,
        note: form.note.trim() || null,
      }
      if (editing) {
        const { error } = await supabase.from('analytics_entries').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Metric updated')
      } else {
        const maxSort = entries.length > 0 ? Math.max(...entries.map((e) => e.sort_order || 0)) : -1
        const { error } = await supabase.from('analytics_entries').insert({ ...payload, sort_order: maxSort + 1 })
        if (error) throw error
        toast.success('Metric created')
      }
      setDialogOpen(false)
      loadEntries()
    } catch {
      toast.error('Failed to save metric')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('analytics_entries').delete().eq('id', id)
      if (error) throw error
      toast.success('Metric deleted')
      setDeleteDialogOpen(false)
      loadEntries()
    } catch {
      toast.error('Failed to delete metric')
    }
  }

  async function moveEntry(id: string, direction: 'up' | 'down') {
    const sorted = [...entries].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const idx = sorted.findIndex((e) => e.id === id)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= sorted.length) return

    const current = sorted[idx]
    const other = sorted[target]

    const { error: e1 } = await supabase
      .from('analytics_entries')
      .update({ sort_order: other.sort_order || 0 })
      .eq('id', current.id)
    const { error: e2 } = await supabase
      .from('analytics_entries')
      .update({ sort_order: current.sort_order || 0 })
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
        <h1 className="text-3xl font-bold text-amber-900">Analytics</h1>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-900">Analytics</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Metric</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">District Metrics (shown to district admins)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="w-16 px-4 pb-3" />
                  <th className="pb-3 pr-4">Metric</th>
                  <th className="pb-3 pr-4">Value</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No metrics yet. Add a metric to show district admins.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, i) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => moveEntry(entry.id, 'up')}>↑</Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === entries.length - 1} onClick={() => moveEntry(entry.id, 'down')}>↓</Button>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium text-navy">
                        {entry.label}
                        {entry.note && <span className="ml-2 text-xs font-normal text-gray-400">{entry.note}</span>}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-cranberry">
                        {Number(entry.value).toLocaleString()}
                        {entry.suffix && <span className="ml-0.5 text-xs font-normal text-gray-500">{entry.suffix}</span>}
                      </td>
                      <td className="py-3 pr-4">
                        {entry.category ? (
                          <Badge variant="outline">{entry.category}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => { setDeletingId(entry.id); setDeleteDialogOpen(true) }}
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
            <DialogTitle>{editing ? 'Edit Metric' : 'New Metric'}</DialogTitle>
            <DialogDescription>Add a number that district admins will see</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Label</label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Active Members" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Value</label>
                <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="e.g. 850" inputMode="decimal" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Suffix (optional)</label>
                <Input value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} placeholder="e.g. clubs, EGP, %" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Category (optional)</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Growth" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Note (optional)</label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                placeholder="Short remark shown to admins"
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
            <DialogTitle>Delete Metric</DialogTitle>
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