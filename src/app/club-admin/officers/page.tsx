'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/hooks/useRole'
import { CLUB_OFFICER_GROUPS } from '@/lib/constants'
import { getClubOfficers, addClubOfficer, removeClubOfficer, getClubMembers } from '@/lib/supabase/queries/clubs'
import { getCurrentRotaryYear } from '@/lib/utils/date'
import type { ClubOfficer, Profile } from '@/types/database'
import { Plus, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type OfficerRow = ClubOfficer & { profile: Profile }

export default function ClubAdminOfficersPage() {
  const { clubId, assignedClubIds } = useRole()
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [selectedClubId, setSelectedClubId] = useState('')
  const [officers, setOfficers] = useState<OfficerRow[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [position, setPosition] = useState('')
  const [customPosition, setCustomPosition] = useState('')
  const [memberId, setMemberId] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadClubs()
  }, [clubId, assignedClubIds])

  useEffect(() => {
    if (selectedClubId) loadOfficers()
  }, [selectedClubId])

  useEffect(() => {
    if (selectedClubId) loadMembers()
  }, [selectedClubId])

  async function loadClubs() {
    const ids = assignedClubIds.length > 0 ? assignedClubIds : clubId ? [clubId] : []
    if (ids.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('clubs')
      .select('id, name')
      .in('id', ids)
      .order('name')
    const list = (data || []) as { id: string; name: string }[]
    setClubs(list)
    if (list.length === 0) setLoading(false)
    setSelectedClubId(list[0]?.id || '')
  }

  async function loadOfficers() {
    setLoading(true)
    try {
      const data = await getClubOfficers(selectedClubId)
      setOfficers(data)
    } catch (err) {
      console.error('Failed to load officers', err)
      toast.error('Failed to load officers')
    } finally {
      setLoading(false)
    }
  }

  async function loadMembers() {
    try {
      const data = await getClubMembers(selectedClubId)
      setMembers(data)
    } catch (err) {
      console.error('Failed to load members', err)
      toast.error('Failed to load members')
    }
  }

  async function handleAdd() {
    const finalPosition = position === 'other' ? customPosition.trim() : position
    if (!finalPosition || !memberId || !selectedClubId) return
    setAdding(true)
    try {
      await addClubOfficer({
        club_id: selectedClubId,
        profile_id: memberId,
        position: finalPosition,
        year: getCurrentRotaryYear(),
      })
      toast.success('Officer added')
      setDialogOpen(false)
      setPosition('')
      setCustomPosition('')
      setMemberId('')
      loadOfficers()
    } catch (err) {
      console.error('Failed to add officer', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add officer')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(officerId: string) {
    setRemoving(officerId)
    try {
      await removeClubOfficer(officerId)
      setOfficers((prev) => prev.filter((o) => o.id !== officerId))
      toast.success('Officer removed')
    } catch {
      toast.error('Failed to remove officer')
    } finally {
      setRemoving(null)
    }
  }

  const selectedClub = clubs.find((c) => c.id === selectedClubId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-navy">Officers</h1>
          {selectedClub && <p className="text-sm text-gray-500">{selectedClub.name}</p>}
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Officer
        </Button>
      </div>

      {clubs.length > 1 && (
        <div className="w-72">
          <Select value={selectedClubId} onValueChange={setSelectedClubId}>
            <SelectTrigger>
              <SelectValue placeholder="Select club" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-navy">Current Officers</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedClubId ? (
            loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : officers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No officers assigned</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {officers.map((officer) => (
                  <div
                    key={officer.id}
                    className="flex items-center justify-between rounded-2xl border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={officer.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-cranberry/10 text-cranberry">
                          {officer.profile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-navy">{officer.profile?.full_name || 'Unknown'}</p>
                        <Badge variant="outline" className="mt-0.5 text-xs">{officer.position}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      disabled={removing === officer.id}
                      onClick={() => handleRemove(officer.id)}
                    >
                      {removing === officer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">You are not assigned to any clubs</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Officer</DialogTitle>
            <DialogDescription>
              Assign an officer position to a member of this club.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {CLUB_OFFICER_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.positions.map((pos) => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectGroup>
                    <SelectLabel>Other</SelectLabel>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {position === 'other' && (
              <div className="space-y-2">
                <Label>Position Title</Label>
                <Input
                  placeholder="Enter a custom position title"
                  value={customPosition}
                  onChange={(e) => setCustomPosition(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}{m.email ? ` (${m.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={
                adding ||
                !memberId ||
                (position === 'other' ? !customPosition.trim() : !position)
              }
            >
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
