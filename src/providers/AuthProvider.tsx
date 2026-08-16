'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true })
  const supabase = useRef(createClient())

  useEffect(() => {
    let cancelled = false

    const fetchProfile = async (userId: string) => {
      const query = async () => {
        const { data, error } = await supabase.current
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (data && !error) {
          if (data.club_id) {
            const { data: club } = await supabase.current
              .from('clubs')
              .select('*')
              .eq('id', data.club_id)
              .single()
            return { ...data, club: club || undefined }
          }
          return data
        }
        return null
      }

      let profile = await query()
      if (cancelled) return null

      // Logged-in user with no profiles row (e.g. OAuth sign-in that never ran
      // the callback, a deleted profile, or a backfill gap). Heal it server-side
      // so the user shows up in admin/member listings instead of the app
      // treating them as signed out.
      if (!profile) {
        try {
          await fetch('/api/auth/ensure-profile', { method: 'POST' })
        } catch {
          // Ignore network errors; the callback path still heals on next OAuth.
        }
        if (cancelled) return null
        profile = await query()
      }

      return profile
    }

    let profileFetchInFlight: string | null = null

    const loadUserState = (user: User | null) => {
      if (cancelled) return
      if (user) {
        if (profileFetchInFlight === user.id) return
        profileFetchInFlight = user.id
        fetchProfile(user.id).then((profile) => {
          if (!cancelled) {
            setState({ user, profile: profile as Profile | null, loading: false })
          }
        })
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    }

    const init = async () => {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (cancelled) return
      loadUserState(user)
    }

    init()

    const { data: { subscription } } = supabase.current.auth.onAuthStateChange((_event, session) => {
      // Never await a supabase query inside this callback. On initial load with
      // an existing session, auth-js fires SIGNED_IN during session recovery
      // while still holding the client's internal lock (initialization in
      // progress). A query issued here waits on that same in-progress
      // initialization, and initialization waits on this callback - a deadlock
      // that leaves the page stuck on a loading skeleton until a refresh.
      // Deferring the profile fetch lets initialization finish first.
      loadUserState(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
