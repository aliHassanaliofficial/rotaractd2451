'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Search, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import { REG_STATUS_LABELS, REG_STATUS_COLORS } from '@/lib/constants'
import type { Registration, RegStatus } from '@/types/database'

interface RegistrationTableProps {
  registrations: Registration[]
  onStatusChange?: (id: string, status: RegStatus) => Promise<void>
  onCheckIn?: (id: string) => Promise<void>
  loading?: boolean
}

export function RegistrationTable({
  registrations,
  onStatusChange,
  onCheckIn,
  loading = false,
}: RegistrationTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = registrations.filter((reg) => {
    const name = reg.guest_name || reg.profile?.full_name || ''
    const email = reg.guest_email || reg.profile?.email || ''
    const ticket = reg.ticket_number || ''
    const q = search.toLowerCase()
    const matchesSearch = name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || ticket.includes(q)
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-9 w-full animate-pulse rounded bg-gray-200" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email, or ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(REG_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                  No registrations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((reg) => {
                const name = reg.guest_name || reg.profile?.full_name || 'Unknown'
                const email = reg.guest_email || reg.profile?.email || ''
                const club = reg.guest_club || reg.profile?.club?.name || '-'
                return (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-navy">{name}</p>
                        {email && <p className="text-xs text-gray-400">{email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{reg.ticket_number || '-'}</TableCell>
                    <TableCell className="text-sm">{club}</TableCell>
                    <TableCell>
                      <Badge className={REG_STATUS_COLORS[reg.status]}>
                        {REG_STATUS_LABELS[reg.status] || reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(reg.registered_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {reg.status !== 'attended' && onCheckIn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            onClick={() => onCheckIn(reg.id)}
                            title="Check in"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {onStatusChange && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() =>
                              onStatusChange(
                                reg.id,
                                reg.status === 'cancelled' ? 'confirmed' : 'cancelled'
                              )
                            }
                            title="Toggle status"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {registrations.length} registration
        {registrations.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
