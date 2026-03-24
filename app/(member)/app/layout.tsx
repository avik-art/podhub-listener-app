'use client'
import React from 'react'
import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import Image from 'next/image'
import PlayerBar from '@/components/member/PlayerBar'
import Toast from '@/components/ui/Toast'
import { usePlayer } from '@/hooks/usePlayer'
import { useToast } from '@/hooks/useToast'

export interface MemberCtx {
  profile:     Profile | null
  showData:    Record<string, unknown>
  setShowData: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void
  player:      ReturnType<typeof usePlayer>
  showToast:   ReturnType<typeof useToast>['showToast']
}
const MemberContext = createContext<MemberCtx | null>(null)
export function useMember() {
  const c = useContext(MemberContext)
  if (!c) throw new Error('useMember must be used inside MemberLayout')
  return c
}

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showData, _setShowData] = useState<Record<string, unknown>>({})
  const { toast, showToast } = useToast()
  const player = usePlayer()

  const setShowData = (fn: (p: Record<string, unknown>) => Record<string, unknown>) =>
    _setShowData(prev => fn(prev))

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => { if (!d.error) setProfile(d) })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') router.replace('/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const tabs = [
    { path: '/app/shows',       label: 'Shows'     },
    { path: '/app/episodes',    label: 'Episodes'  },
    { path: '/app/leaderboard', label: 'Rank'      },
    { path: '/app/community',   label: 'Community' },
    { path: '/app/forum',       label: 'Forum'     },
    { path: '/app/profile',     label: 'Profile'   },
  ]

  const active = (p: string) => pathname === p || pathname.startsWith(p + '/')

  return (
    <MemberContext.Provider value={{ profile, showData, setShowData, player, showToast }}>
      <div style={{ minHeight: '100vh', background: 'var(--navy)' }}>
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />

        <nav className="nav">
          <a href="/app/shows" style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/podhub-logo.png" alt="Podhub" width={140} height={40}
              className="nav-logo-img" style={{ mixBlendMode: 'screen', filter: 'brightness(1.4)' }} />
          </a>
          <div className="nav-tabs">
            {tabs.map(t => (
              <a key={t.path} href={t.path} className={`nav-tab${active(t.path) ? ' active' : ''}`}>
                {t.label}
              </a>
            ))}
          </div>
          <div className="nav-r">
            <div className="pts-pill">★ {profile?.monthly_points ?? 0}</div>
            <button
              onClick={logout}
              style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Sign Out
            </button>
          </div>
        </nav>

        <div className="mob-nav">
          {tabs.slice(0, 5).map(t => (
            <a key={t.path} href={t.path} className={`mob-t${active(t.path) ? ' active' : ''}`}>
              {t.label}
            </a>
          ))}
        </div>

        <div style={{ paddingBottom: player.cur ? 88 : 0 }}>
          {children}
        </div>

        {player.cur && <PlayerBar player={player} showData={showData} />}
        {toast && <Toast toast={toast} />}
      </div>
    </MemberContext.Provider>
  )
}
