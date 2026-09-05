'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X, Image as ImageIcon, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { STORAGE_BUCKETS } from '@/lib/constants'
import type { TransactionMethod } from '@/types/database'
import { cn } from '@/lib/utils/cn'

export interface SelectedPayment {
  methodId: string
  proofUrl: string
}

interface PaymentSectionProps {
  price: number
  currency: string
  onChange: (payment: SelectedPayment | null) => void
  compact?: boolean
}

export default function PaymentSection({ price, currency, onChange, compact }: PaymentSectionProps) {
  const [methods, setMethods] = useState<TransactionMethod[]>([])
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [methodId, setMethodId] = useState<string>('')
  const [proofUrl, setProofUrl] = useState('')
  const [proofName, setProofName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/transaction-methods', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setMethods(data || [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingMethods(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    onChange(methodId && proofUrl ? { methodId, proofUrl } : null)
  }, [methodId, proofUrl, onChange])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image of the payment proof')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', STORAGE_BUCKETS.REGISTRATION_PROOFS)
      formData.append('folder', 'proofs')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Upload failed')

      setProofUrl(result.url)
      setProofName(file.name)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload proof. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (loadingMethods) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment methods...
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-navy">
          <CreditCard className="h-4 w-4 text-gold" />
          Payment Method {price > 0 && <span className="font-normal text-gray-500">({price} {currency})</span>}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {methods.length === 0 && (
            <p className="text-sm text-gray-500">No payment methods are available yet. Please contact the organizers.</p>
          )}
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethodId(m.id)}
              className={cn(
                'rounded-xl border p-3 text-left transition-all',
                methodId === m.id
                  ? 'border-cranberry bg-cranberry/5 ring-1 ring-cranberry'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <p className="text-sm font-medium text-navy">{m.name}</p>
              {m.description && <p className="mt-0.5 text-xs text-gray-500">{m.description}</p>}
              {m.instructions && <p className="mt-1 text-xs text-green-700">{m.instructions}</p>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-navy">Payment Proof *</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        {proofUrl ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <ImageIcon className="h-8 w-8 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-navy">{proofName}</p>
              <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cranberry hover:underline">
                View upload
              </a>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500" onClick={() => { setProofUrl(''); setProofName('') }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-6 text-sm text-gray-500 transition-colors hover:border-cranberry hover:text-cranberry disabled:opacity-60"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload a screenshot of the transfer / payment</>
            )}
          </button>
        )}
        <p className="mt-1.5 text-xs text-gray-400">Your registration stays pending until our team verifies your payment.</p>
      </div>
    </div>
  )
}