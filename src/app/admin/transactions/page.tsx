'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { REG_STATUS_LABELS, REG_STATUS_COLORS } from '@/lib/constants'
import { Check, X, Loader2, Wallet, ReceiptText, Clock, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Registration, TransactionMethod } from '@/types/database'

type TxRegistration = Registration & { event: any; transaction_method: any }

export default function TransactionsPage() {
  const [registrations, setRegistrations] = useState<TxRegistration[]>([])
  const [methods, setMethods] = useState<TransactionMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [methodDialog, setMethodDialog] = useState(false)
  const [editingMethod, setEditingMethod] = useState<TransactionMethod | null>(null)
  const [methodName, setMethodName] = useState('')
  const [methodDescription, setMethodDescription] = useState('')
  const [methodInstructions, setMethodInstructions] = useState('')
  const [methodSort, setMethodSort] = useState(0)
  const [methodActive, setMethodActive] = useState(true)
  const [savingMethod, setSavingMethod] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const [{ data, error }, { data: methodsData, error: methodsError }] = await Promise.all([
          supabase
            .from('registrations')
            .select('*, event:event_id(*), profile:profile_id(*), transaction_method:transaction_method_id(*)')
            .not('transaction_method_id', 'is', null)
            .order('registered_at', { ascending: false }),
          supabase.from('transaction_methods').select('*').order('sort_order', { ascending: true }),
        ])

        if (error) throw error
        if (methodsError) throw methodsError
        setRegistrations((data as TxRegistration[]) || [])
        setMethods((methodsData as TransactionMethod[]) || [])
      } catch {
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  async function handleStatusChange(regId: string, status: Registration['status']) {
    setUpdating(regId)
    try {
      const res = await fetch(`/api/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update')
      setRegistrations((prev) => prev.map((r) => (r.id === regId ? { ...r, status } : r)))
      toast.success(`Registration ${REG_STATUS_LABELS[status] || status}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  async function handleSaveMethod() {
    if (!methodName.trim()) {
      toast.error('Method name is required')
      return
    }
    setSavingMethod(true)
    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('transaction_methods')
          .update({
            name: methodName.trim(),
            description: methodDescription || null,
            instructions: methodInstructions || null,
            sort_order: methodSort,
            is_active: methodActive,
          })
          .eq('id', editingMethod.id)
        if (error) throw error
        toast.success('Payment method updated')
      } else {
        const { error } = await supabase.from('transaction_methods').insert({
          name: methodName.trim(),
          description: methodDescription || null,
          instructions: methodInstructions || null,
          sort_order: methodSort,
          is_active: methodActive,
        })
        if (error) throw error
        toast.success('Payment method added')
      }
      setMethodDialog(false)
      setEditingMethod(null)
      setMethodName('')
      setMethodDescription('')
      setMethodInstructions('')
      setMethodSort(0)
      setMethodActive(true)
      const { data, error } = await supabase.from('transaction_methods').select('*').order('sort_order', { ascending: true })
      if (!error) setMethods((data as TransactionMethod[]) || [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save payment method')
    } finally {
      setSavingMethod(false)
    }
  }

  async function handleToggleMethod(methodId: string, current: boolean) {
    const { error } = await supabase.from('transaction_methods').update({ is_active: !current }).eq('id', methodId)
    if (error) {
      toast.error(error.message)
      return
    }
    setMethods((prev) => prev.map((m) => (m.id === methodId ? { ...m, is_active: !current } : m)))
  }

  async function handleDeleteMethod(methodId: string) {
    if (!confirm('Delete this payment method? Registrations already using it are not affected.')) return
    const { error } = await supabase.from('transaction_methods').delete().eq('id', methodId)
    if (error) {
      toast.error(error.message)
      return
    }
    setMethods((prev) => prev.filter((m) => m.id !== methodId))
    toast.success('Payment method deleted')
  }

  function openNewMethod() {
    setEditingMethod(null)
    setMethodName('')
    setMethodDescription('')
    setMethodInstructions('')
    setMethodSort(methods.length)
    setMethodActive(true)
    setMethodDialog(true)
  }

  function openEditMethod(method: TransactionMethod) {
    setEditingMethod(method)
    setMethodName(method.name)
    setMethodDescription(method.description || '')
    setMethodInstructions(method.instructions || '')
    setMethodSort(method.sort_order)
    setMethodActive(method.is_active)
    setMethodDialog(true)
  }

  const pending = registrations.filter((r) => r.status === 'pending')
  const pendingTotal = pending.reduce((sum, r) => sum + (r.event?.price || 0), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Transactions</h1>
          <p className="text-sm text-gray-500">Payment registrations awaiting review</p>
        </div>
        <Dialog open={methodDialog} onOpenChange={setMethodDialog}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-cranberry text-white hover:bg-cranberry/90" onClick={openNewMethod}>
              <Plus className="mr-1 h-4 w-4" />
              Manage Payment Methods
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Methods</DialogTitle>
              <DialogDescription>Methods are shown to attendees when registering for paid events.</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {methods.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">No payment methods yet. Add your first one below.</p>
              )}
              {methods.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">
                      {m.name}
                      {!m.is_active && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">inactive</span>
                      )}
                    </p>
                    {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500"
                      onClick={() => handleToggleMethod(m.id, m.is_active)}
                      title={m.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => openEditMethod(m)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteMethod(m.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium text-navy">{editingMethod ? 'Edit' : 'Add'} payment method</p>
              <div className="space-y-2">
                <Label htmlFor="method-name">Name *</Label>
                <Input
                  id="method-name"
                  value={methodName}
                  onChange={(e) => setMethodName(e.target.value)}
                  placeholder="e.g. InstaPay, Vodafone Cash, Bank Transfer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method-desc">Description</Label>
                <Input
                  id="method-desc"
                  value={methodDescription}
                  onChange={(e) => setMethodDescription(e.target.value)}
                  placeholder="Short label shown next to the method"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method-instructions">Instructions</Label>
                <Textarea
                  id="method-instructions"
                  value={methodInstructions}
                  onChange={(e) => setMethodInstructions(e.target.value)}
                  placeholder="Account number / phone number / link you want attendees to pay to"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="method-sort">Sort Order</Label>
                  <Input
                    id="method-sort"
                    type="number"
                    value={methodSort}
                    onChange={(e) => setMethodSort(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-navy">
                    <input
                      type="checkbox"
                      checked={methodActive}
                      onChange={(e) => setMethodActive(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>
              </div>
              <Button
                onClick={handleSaveMethod}
                disabled={savingMethod}
                className="w-full bg-cranberry text-white hover:bg-cranberry/90"
              >
                {savingMethod ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {editingMethod ? 'Save Changes' : 'Add Method'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{pending.length}</p>
              <p className="text-sm text-gray-500">Pending review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100">
              <ReceiptText className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{pendingTotal.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Pending amount (EGP)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
              <Wallet className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{registrations.length}</p>
              <p className="text-sm text-gray-500">Total transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-4">Attendee</th>
                  <th className="px-4 py-4">Event</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Method</th>
                  <th className="px-4 py-4">Proof</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Registered At</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">No payment transactions yet</td>
                  </tr>
                ) : (
                  registrations.map((reg) => (
                    <tr key={reg.id} className="border-b transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-navy">
                        {reg.profile?.full_name || reg.guest_name || 'Guest'}
                        {reg.event && (
                          <Link href={`/admin/events/${reg.event.id}/registrations`} className="mt-0.5 block text-xs font-normal text-cranberry hover:underline">
                            View registrations
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{reg.event?.title || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {reg.event ? `${reg.event.price} ${reg.event.currency}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {reg.transaction_method ? (
                          <span className="font-medium text-navy">{reg.transaction_method.name}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {reg.transaction_proof_url ? (
                          <a href={reg.transaction_proof_url} target="_blank" rel="noopener noreferrer" className="text-cranberry hover:underline">
                            View proof
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('font-medium', REG_STATUS_COLORS[reg.status])} variant="outline">
                          {REG_STATUS_LABELS[reg.status] || reg.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(reg.registered_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {reg.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleStatusChange(reg.id, 'confirmed')} disabled={updating === reg.id} title="Approve">
                                {updating === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleStatusChange(reg.id, 'declined')} disabled={updating === reg.id} title="Decline">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
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