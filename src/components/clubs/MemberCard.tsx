'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { Profile } from '@/types/database'

interface MemberCardProps {
  member: Profile
  className?: string
}

export function MemberCard({ member, className }: MemberCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <Avatar className="h-12 w-12 border-2 border-gold/20">
        <AvatarImage src={member.avatar_url} alt={member.full_name} />
        <AvatarFallback className="bg-gradient-to-br from-navy to-cranberry text-white font-bold">
          {member.full_name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-navy truncate">{member.full_name}</h4>
        {member.rotaract_id && (
          <p className="text-xs text-gray-400">{member.rotaract_id}</p>
        )}
        {member.occupation && (
          <p className="text-sm text-gray-500 truncate">{member.occupation}</p>
        )}
      </div>

      {member.role && (
        <Badge
          variant={
            member.role === 'district_admin' || member.role === 'superadmin'
              ? 'cranberry'
              : member.role === 'club_admin'
              ? 'default'
              : 'outline'
          }
          className="capitalize shrink-0"
        >
          {member.role.replace('_', ' ')}
        </Badge>
      )}
    </div>
  )
}
