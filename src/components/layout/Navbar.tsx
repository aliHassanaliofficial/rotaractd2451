'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/hooks/useUser'
import { useRole } from '@/hooks/useRole'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { createClient } from '@/lib/supabase/client'
import { NAV_LINKS, RESOURCE_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Library,
  Megaphone,
  Landmark,
  Mail,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const RESOURCE_ICONS: Record<string, LucideIcon> = {
  library: Library,
  announcements: Megaphone,
  history: Landmark,
  newsletter: Mail,
}

type NotificationItem = {
  id: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const resourcesRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const { user, profile } = useUser()
  const { isAdmin } = useRole()
  const { settings } = useSiteSettings()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('notifications')
      .select('id, title, message, link, is_read, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) {
          setRecentNotifs(data)
          setUnreadCount(data.filter((n) => !n.is_read).length)
        }
      })
  }, [user, supabase])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`,
        },
        () => {
          supabase
            .from('notifications')
            .select('id, title, message, link, is_read, created_at')
            .eq('profile_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5)
            .then(({ data }) => {
              if (data) {
                setRecentNotifs(data)
                setUnreadCount(data.length)
              }
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isResourceActive = RESOURCE_LINKS.some((l) => pathname === l.href || pathname.startsWith(l.href + '/'))

  return (
    <header
      className={cn(
        'sticky z-50 w-full transform-gpu transition-[top] duration-300 ease-out',
        scrolled ? 'top-3' : 'top-0'
      )}
    >
      <div
        className={cn(
          'relative transform-gpu transition-[border-radius,margin,background-color,box-shadow,border-color] duration-300 ease-out',
          scrolled
            ? 'mx-3 rounded-full border border-white/50 bg-white/80 shadow-xl shadow-navy/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 lg:mx-auto lg:max-w-6xl'
            : 'rounded-none border-b border-white/10 bg-white/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/30'
        )}
      >
        {!scrolled && <div className="h-0.5 bg-gradient-to-r from-gold via-cranberry to-navy" />}
        <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="container mx-auto flex h-16 items-center justify-between px-4"
      >
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <Image
            src={settings.logo_url || '/logo.png'}
            alt={settings.district_name || 'Rotaract'}
            width={140}
            height={48}
            className="h-12 object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium transition-colors duration-200',
                  'after:absolute after:-bottom-0.5 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:origin-center after:scale-x-0 after:rounded-full after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100',
                  active ? 'text-cranberry' : 'text-gray-600 hover:text-cranberry'
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-cranberry"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}

          <div
            ref={resourcesRef}
            className="relative"
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setResourcesOpen((o) => !o)}
              aria-expanded={resourcesOpen}
              className={cn(
                'relative flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200',
                'after:absolute after:-bottom-0.5 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:origin-center after:scale-x-0 after:rounded-full after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100',
                resourcesOpen || isResourceActive ? 'text-cranberry' : 'text-gray-600 hover:text-cranberry'
              )}
            >
              Resources
              <motion.span animate={{ rotate: resourcesOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex">
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>

            <AnimatePresence>
              {resourcesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3"
                >
                  <div className="absolute left-1/2 top-[9px] h-3 w-3 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-white/40 bg-white/90 backdrop-blur-xl" />
                  <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-2xl shadow-navy/10 backdrop-blur-xl">
                    <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                      <Sparkles className="h-4 w-4 text-gold" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Explore</p>
                    </div>
                    <div className="p-2">
                      {RESOURCE_LINKS.map((link, i) => {
                        const Icon = RESOURCE_ICONS[link.href.split('/')[1]]
                        const active = pathname === link.href
                        return (
                          <motion.div
                            key={link.href}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.03 + i * 0.04 }}
                          >
                            <Link
                              href={link.href}
                              onClick={() => setResourcesOpen(false)}
                              className={cn(
                                'group flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200',
                                active ? 'bg-cranberry/5' : 'hover:bg-gold/10'
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200',
                                  active
                                    ? 'bg-cranberry text-white'
                                    : 'bg-gradient-to-br from-gold/15 to-cranberry/15 text-cranberry group-hover:from-cranberry group-hover:to-deep-cranberry group-hover:text-white'
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-navy transition-colors group-hover:text-cranberry">
                                  {link.label}
                                </span>
                                <span className="block text-xs text-gray-500">{link.description}</span>
                              </span>
                            </Link>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative transition-transform duration-200 hover:scale-110"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-cranberry px-1 text-xs text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-2xl shadow-navy/10 backdrop-blur-xl"
                    >
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="text-sm font-semibold text-navy">Notifications</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {recentNotifs.length === 0 ? (
                          <p className="p-4 text-center text-sm text-gray-500">No notifications</p>
                        ) : (
                          recentNotifs.map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || '#'}
                              className={cn(
                                'flex items-start gap-3 border-b px-4 py-3 text-sm transition-colors hover:bg-gray-50',
                                !n.is_read && 'bg-cranberry/5'
                              )}
                              onClick={() => setNotifOpen(false)}
                            >
                              <div
                                className={cn(
                                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                                  n.is_read ? 'bg-gray-300' : 'bg-cranberry'
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className={cn('font-medium', !n.is_read ? 'text-navy' : 'text-gray-600')}>
                                  {n.title}
                                </p>
                                {n.message && (
                                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                                )}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="border-t border-gray-100 p-2">
                        <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                          <Link href={isAdmin ? '/club-admin/notifications' : '/notifications'} onClick={() => setNotifOpen(false)}>
                            View All
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-full transition-transform duration-200 hover:scale-105">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cranberry to-deep-cranberry text-xs font-bold text-white shadow-sm">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden text-sm font-medium sm:inline-block">
                      {profile?.full_name || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/40 bg-white/90 backdrop-blur-xl">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-tickets" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      My Tickets
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-cranberry">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button className="bg-gradient-to-r from-cranberry to-deep-cranberry text-white shadow-md shadow-cranberry/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cranberry/30" asChild>
                <Link href="/register">Join Us</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'close' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
      </motion.div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className={cn(
              'transform-gpu overflow-hidden backdrop-blur-xl transition-[border-radius,margin,border-color] duration-300 ease-out lg:hidden',
              scrolled
                ? 'mx-3 rounded-b-2xl border border-t-0 border-white/50 bg-white/90 shadow-xl shadow-navy/10 lg:mx-auto lg:max-w-6xl'
                : 'border-t border-gold/10 bg-white/90 supports-[backdrop-filter]:bg-white/80'
            )}
          >
            <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link, i) => {
                const active = pathname === link.href
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                        active ? 'bg-cranberry/10 text-cranberry' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {link.label}
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-cranberry" />}
                    </Link>
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.04 }}
                className="overflow-hidden rounded-2xl"
              >
                <button
                  type="button"
                  onClick={() => setMobileResourcesOpen((o) => !o)}
                  aria-expanded={mobileResourcesOpen}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isResourceActive ? 'text-cranberry' : 'text-gray-600'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" />
                    Resources
                  </span>
                  <motion.span animate={{ rotate: mobileResourcesOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex">
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {mobileResourcesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 pb-1 pl-3">
                        {RESOURCE_LINKS.map((link) => {
                          const Icon = RESOURCE_ICONS[link.href.split('/')[1]]
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-cranberry/5 hover:text-cranberry"
                            >
                              <Icon className="h-4 w-4 shrink-0 text-cranberry" />
                              <span>
                                {link.label}
                                <span className="block text-xs text-gray-400">{link.description}</span>
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (NAV_LINKS.length + 1) * 0.04 }}
                  className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3"
                >
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-cranberry to-deep-cranberry text-white shadow-md shadow-cranberry/20" asChild>
                    <Link href="/register">Join Us</Link>
                  </Button>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
