'use client'

import { MapPin, Users, Calendar, Globe, Mail, Phone, ExternalLink } from 'lucide-react'

const FacebookIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)

const LinkedinIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { Club } from '@/types/database'

interface ClubProfileHeaderProps {
  club: Club
  isAdmin?: boolean
  onEdit?: () => void
}

export function ClubProfileHeader({ club, isAdmin = false, onEdit }: ClubProfileHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-md">
      <div
        className="h-48 bg-cover bg-center sm:h-56"
        style={{ backgroundImage: `url(${club.cover_url || '/images/club-cover-default.jpg'})` }}
      >
        <div className="h-full w-full bg-gradient-to-t from-navy/70 to-transparent" />
      </div>

      <div className="relative px-6 pb-6">
        <div className="flex flex-col items-start gap-4 -mt-14 sm:flex-row sm:items-end">
          <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
            <AvatarImage src={club.logo_url} alt={club.name} />
            <AvatarFallback className="bg-gold text-navy text-3xl font-bold">
              {club.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pt-2 sm:pb-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-2xl font-bold text-navy">{club.name}</h1>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Edit Profile
                </Button>
              )}
            </div>
            {club.university && (
              <p className="text-sm text-gray-500">{club.university}</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {club.city && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-cranberry" />
              {club.city}, {club.country}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-navy" />
            {club.member_count} Members
          </div>
          {club.founded_year && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gold" />
              Founded {club.founded_year}
            </div>
          )}
          {club.charter_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gold" />
              Chartered {new Date(club.charter_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {club.description && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600">{club.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {club.website && (
            <Button variant="ghost" size="sm" asChild>
              <a href={club.website} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-1 h-3.5 w-3.5" /> Website
              </a>
            </Button>
          )}
          {club.email && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`mailto:${club.email}`}>
                <Mail className="mr-1 h-3.5 w-3.5" /> Email
              </a>
            </Button>
          )}
          {club.phone && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`tel:${club.phone}`}>
                <Phone className="mr-1 h-3.5 w-3.5" /> Call
              </a>
            </Button>
          )}
          {club.facebook && (
            <Button variant="ghost" size="sm" asChild>
              <a href={club.facebook} target="_blank" rel="noopener noreferrer">
                <FacebookIcon /> Facebook
              </a>
            </Button>
          )}
          {club.instagram && (
            <Button variant="ghost" size="sm" asChild>
              <a href={club.instagram} target="_blank" rel="noopener noreferrer">
                <InstagramIcon /> Instagram
              </a>
            </Button>
          )}
          {club.linkedin && (
            <Button variant="ghost" size="sm" asChild>
              <a href={club.linkedin} target="_blank" rel="noopener noreferrer">
                <LinkedinIcon /> LinkedIn
              </a>
            </Button>
          )}
        </div>

        {club.meeting_day && (
          <div className="mt-4 rounded-2xl bg-gray-50 p-3 text-sm">
            <span className="font-medium text-navy">Meetings: </span>
            {club.meeting_day}
            {club.meeting_time && ` at ${club.meeting_time}`}
            {club.meeting_location && ` - ${club.meeting_location}`}
          </div>
        )}
      </div>
    </div>
  )
}
