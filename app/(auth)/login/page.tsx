'use client'
import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const refCode      = searchParams.get('ref')
  const errorParam   = searchParams.get('error')

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState(errorParam === 'banned' ? 'Your account has been suspended.' : '')

  const supabase = createClient()

  async function handleEmail(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) { setError('Enter a valid email address.'); return }

    setLoading(true); setError('')
    const redirectUrl = `${window.location.origin}/app${refCode ? `?ref=${refCode}` : ''}`

    const { error: sbError } = await supabase.auth.signInWithOtp({
      email:   trimmed,
      options: { emailRedirectTo: redirectUrl },
    })

    if (sbError) { setError(sbError.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/app${refCode ? `?ref=${refCode}` : ''}` },
    })
  }

  if (sent) return (
    <div className="login-wrap">
      <div className="orb orb1" /><div className="orb orb2" />
      <div className="animated-border-wrap" style={{ maxWidth: 460, width: '100%' }}>
        <div className="animated-border-inner" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
          <div className="ob-title" style={{ marginBottom: 8 }}>Check your email</div>
          <div style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.75 }}>
            We sent a magic link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.<br />
            Click it to sign in — no password needed.
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => setSent(false)}>
            Use a different email
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="login-wrap">
      <div className="orb orb1" /><div className="orb orb2" />

      <div className="login-top-left">
        <Image src="/podhub-logo.png" alt="Podhub" width={140} height={40}
          style={{ mixBlendMode: 'screen', filter: 'brightness(1.4)' }} />
      </div>

      <div className="animated-border-wrap" style={{ maxWidth: 460, width: '100%' }}>
        <div className="animated-border-inner">
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <Image src="/hma-logo.png" alt="Healthy Mind by Avik" width={200} height={52}
              style={{ objectFit: 'contain', marginBottom: 12, mixBlendMode: 'screen', filter: 'brightness(1.4)' }} />
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, background: 'var(--goldgrad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Podhub Listener Portal
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              This isn&apos;t self-help. It&apos;s self-honesty.
            </div>
          </div>

          <form onSubmit={handleEmail}>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: 'var(--sans)', marginBottom: error ? 8 : 14, outline: 'none' }}
              autoComplete="email"
              autoFocus
            />
            {error && (
              <div style={{ color: '#E87070', fontSize: 11, marginBottom: 12, padding: '8px 12px', background: 'rgba(232,112,112,0.06)', borderRadius: 8, borderLeft: '2px solid #E87070' }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-gold" style={{ width: '100%', padding: 12, marginBottom: 14 }} disabled={loading}>
              {loading ? 'Sending link...' : 'Continue with Email →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>or</div>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
          </div>

          <button onClick={handleGoogle}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--navy3)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)', marginBottom: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(201,162,39,0.04)', borderRadius: 8, borderLeft: '2px solid rgba(201,162,39,0.3)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.7 }}>
            New here? Enter your email to create an account. Already a member? Your profile loads automatically.
          </div>
        </div>
      </div>
    </div>
  )
}
