'use client'
import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const tabs = [
    { path: '/admin',         label: 'Overview' },
    { path: '/admin/members', label: 'Members'  },
    { path: '/admin/reviews', label: 'Reviews'  },
    { path: '/admin/updates', label: 'Updates'  },
    { path: '/admin/winners', label: 'Winners'  },
  ]

  const active = (p: string) =>
    p === '/admin' ? pathname === '/admin' : pathname.startsWith(p)

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', fontFamily: 'var(--sans)', color: 'var(--text)' }}>
      <div className="orb orb1" />

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(6,9,26,0.98)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(201,162,39,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '.1em', textTransform: 'uppercase', background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)', padding: '3px 10px', borderRadius: 6 }}>
            Admin Portal
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Healthy Mind by Avik™</div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <a key={t.path} href={t.path}
              style={{ padding: '6px 12px', borderRadius: '100px', border: `1px solid ${active(t.path) ? 'var(--gold)' : 'var(--border)'}`, background: active(t.path) ? 'rgba(201,162,39,0.12)' : 'transparent', color: active(t.path) ? 'var(--gold)' : 'var(--text3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)', transition: 'all .2s', textDecoration: 'none' }}>
              {t.label}
            </a>
          ))}
        </div>

        <button onClick={logout}
          style={{ padding: '5px 11px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>
          Sign Out
        </button>
      </nav>

      <div style={{ paddingTop: 80, maxWidth: 1200, margin: '0 auto', padding: '80px 24px 40px' }}>
        {children}
      </div>
    </div>
  )
}
