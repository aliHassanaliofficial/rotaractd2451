'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, Pencil, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { formatDateTime } from '@/lib/utils/date'
import type { BlacklistEntry } from '@/types/database'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  reason: '',
}

export default function AdminBlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BlacklistEntry | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blacklist')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setEntries((data || []) as BlacklistEntry[])
    } catch {
      toast.error('Failed to load blacklist')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(entry: BlacklistEntry) {
    setEditing(entry)
    setForm({
      name: entry.name,
      phone: entry.phone || '',
      email: entry.email || '',
      reason: entry.reason || '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!form.phone.trim() && !form.email.trim()) {
      toast.error('Add at least a phone number or an email')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        reason: form.reason.trim() || null,
      }
      if (editing) {
        const { error } = await supabase.from('blacklist').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Entry updated')
      } else {
        const { error } = await supabase.from('blacklist').insert(payload)
        if (error) throw error
        toast.success('Entry added to blacklist')
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
    try {
      const { error } = await supabase.from('blacklist').delete().eq('id', id)
      if (error) throw error
      toast.success('Entry removed from blacklist')
      setDeleteDialogOpen(false)
      loadEntries()
    } catch {
      toast.error('Failed to delete entry')
    }
  }

  if (loading && entries.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Blacklist</h1>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy">Blacklist</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Person</Button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-cranberry/20 bg-cranberry/5 p-4">
        <Ban className="h-5 w-5 shrink-0 text-cranberry" />
        <p className="text-sm text-cranberry">
          Anyone whose phone number or email matches an entry here is automatically blocked from registering for
          events — both in the registration workflow and at the database level.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Blocked Contacts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pr-4 pl-4">Name</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Reason</th>
                  <th className="pb-3 pr-4">Added</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Blacklist is empty
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 pl-4 font-medium text-navy">{entry.name}</td>
                      <td className="py-3 pr-4 text-gray-600">{entry.phone || '—'}</td>
                      <td className="py-3 pr-4 text-gray-600">{entry.email || '—'}</td>
                      <td className="py-3 pr-4 text-gray-600">{entry.reason || '—'}</td>
                      <td className="py-3 pr-4 text-gray-500">{formatDateTime(entry.created_at)}</td>
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
            <DialogTitle>{editing ? 'Edit Entry' : 'Add to Blacklist'}</DialogTitle>
            <DialogDescription>Block a person from registering by their contact details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +20 10 1234 5678" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-navy">Email</label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. name@example.com" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-navy">Reason</label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                placeholder="Why is this person blacklisted?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Blacklist</DialogTitle>
            <DialogDescription>This person will be allowed to register again. Are you sure?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}