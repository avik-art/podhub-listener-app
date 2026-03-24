'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)

    const supabase = createClient()
    const { error: sbError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    })

    if (sbError) { setError('Invalid credentials.'); setLoading(false); return }

    // Verify admin role server-side
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (!profile?.is_admin) {
      await supabase.auth.signOut()
      setError('You do not have admin access.')
      setLoading(false)
      return
    }

    router.replace('/admin')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)', fontFamily: 'var(--sans)', padding: 24 }}>
      <div className="orb orb1" />

      <div style={{ background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: 20, padding: '36px 32px', maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)', borderRadius: 12, marginBottom: 14 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--gold)">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Admin Portal</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Healthy Mind by Avik™ — Restricted Access</div>
        </div>

        <form onSubmit={handleLogin}>
          <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="avik@podhealth.club"
            autoComplete="email"
            style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 9, padding: '10px 13px', fontSize: 13, fontFamily: 'var(--sans)', marginBottom: 12, outline: 'none' }}
          />
          <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Password</label>
          <input
            type="password"
            value={pass}
            onChange={e => { setPass(e.target.value); setError('') }}
            placeholder="Enter admin password"
            autoComplete="current-password"
            style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 9, padding: '10px 13px', fontSize: 13, fontFamily: 'var(--sans)', marginBottom: error ? 10 : 18, outline: 'none' }}
          />
          {error && (
            <div style={{ color: '#E87070', fontSize: 11, marginBottom: 14, padding: '8px 12px', background: 'rgba(232,112,112,0.06)', borderRadius: 8, borderLeft: '2px solid #E87070' }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-gold" style={{ width: '100%', padding: 12 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Login as Admin'}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
          This portal is not publicly linked.<br />Unauthorised access is prohibited.
        </div>
      </div>
    </div>
  )
}
