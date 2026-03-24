'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate as globalMutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useMember } from '../layout'
import { BADGES, SHOWS, POINTS, AVATARS, COUNTRIES } from '@/lib/constants'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function initials(n: string) {
  return (n || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function ProfilePage() {
  const router = useRouter()
  const { profile, showToast } = useMember()
  const { data: referralData }  = useSWR('/api/referral', fetcher)
  const { data: reviewsData }   = useSWR('/api/reviews', fetcher)

  const [editing,     setEditing]     = useState(false)
  const [name,        setName]        = useState('')
  const [designation, setDesignation] = useState('')
  const [showAv,      setShowAv]      = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (profile) { setName(profile.name || ''); setDesignation(profile.designation || '') }
  }, [profile])

  async function saveProfile() {
    setSaving(true)
    const r = await fetch('/api/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, designation }),
    })
    if (r.ok) {
      await globalMutate('/api/profile')
      setEditing(false)
      showToast('Profile saved', '✓', '#C9A227')
    }
    setSaving(false)
  }

  async function setAvatar(avatarId: string) {
    await fetch('/api/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ avatar_id: avatarId, profile_photo_url: null }),
    })
    await globalMutate('/api/profile')
    setShowAv(false)
    showToast('Avatar updated', '✓', '#C9A227')
  }

  async function submitReview(showId: string, platform: 'apple' | 'spotify') {
    const show = SHOWS.find(s => s.id === showId)
    if (!show) return
    const url = platform === 'apple' ? show.apple : show.spotify
    if (!url) return
    window.open(url, '_blank')
    setTimeout(async () => {
      const ok = window.confirm(
        `Did you leave a review on ${platform === 'apple' ? 'Apple Podcasts' : 'Spotify'} for ${show.name}?\n\nClick OK only if you actually submitted a review.`
      )
      if (ok) {
        const r = await fetch('/api/reviews', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ show_id: showId, platform }),
        })
        if (r.ok) {
          await globalMutate('/api/reviews')
          showToast('Review submitted! Pending admin approval for +500 pts', '⭐', '#C9A227')
        }
      }
    }, 2000)
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const earned     = calcBadges(profile)
  const reviews    = Array.isArray(reviewsData) ? reviewsData : []
  const reviewMap  = new Map(reviews.map((r: Record<string, unknown>) => [`${r.show_id}|${r.platform}`, r.status]))

  return (
    <div className="page">
      {/* Profile header */}
      <div className="prof-hdr">
        <div style={{ position: 'relative' }}>
          <div
            style={{ width: 86, height: 86, borderRadius: '50%', border: '2px solid var(--gold)', background: 'var(--navy3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 28, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
            onClick={() => setShowAv(v => !v)}>
            {profile?.profile_photo_url
              ? <img src={profile.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (() => { const av = AVATARS.find(a => a.id === profile?.avatar_id); return av ? <span style={{ fontSize: 36 }}>{av.emoji}</span> : initials(profile?.name || '') })()
            }
          </div>
          <button
            style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--goldgrad)', border: 'none', color: '#06091A', width: 22, height: 22, borderRadius: '50%', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowAv(v => !v)}>
            ✎
          </button>
        </div>

        {editing ? (
          <div style={{ flex: 1 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 9, padding: '9px 12px', fontSize: 13, fontFamily: 'var(--sans)', marginBottom: 8, outline: 'none' }} />
            <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="What you do"
              style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 9, padding: '9px 12px', fontSize: 13, fontFamily: 'var(--sans)', marginBottom: 8, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-gold btn-sm" onClick={saveProfile} disabled={saving}>{saving ? '…' : '✓ Save'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{profile?.name || 'Your Name'}</div>
            <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 4 }}>{profile?.designation || 'Listener'}</div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              {profile?.country_flag} {profile?.country}
              {profile?.gender ? ` · ${profile.gender}` : ''}
              {profile?.age_range ? ` · ${profile.age_range}` : ''}
            </div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>🔥 {profile?.streak_days || 0} day streak</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit Profile</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--pink)' }} onClick={logout}>Sign Out</button>
            </div>
          </div>
        )}
      </div>

      {/* Avatar picker */}
      {showAv && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 9, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Choose Avatar</div>
          <div className="av-grid">
            {AVATARS.map(av => (
              <div key={av.id}
                className={`av-opt${profile?.avatar_id === av.id && !profile?.profile_photo_url ? ' picked' : ''}`}
                style={{ background: av.bg }}
                onClick={() => setAvatar(av.id)}>
                {av.emoji}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid">
        {([
          [profile?.monthly_points || 0, 'Monthly Pts', 'var(--gold2)'],
          [profile?.points || 0,         'Total Pts',   'var(--purple)'],
          [profile?.streak_days || 0,    'Streak Days', 'var(--pink)'],
          [earned.length,                'Badges',      'var(--green)'],
        ] as [number, string, string][]).map(([v, l, c]) => (
          <div key={l} className="stat-box">
            <div className="stat-val" style={{ color: c }}>{v}</div>
            <div className="stat-lbl">{l}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
          Badges <span style={{ fontSize: 11, color: 'var(--text3)' }}>{earned.length}/{BADGES.length} earned</span>
        </div>
        <div className="badge-grid">
          {BADGES.map(b => {
            const has = earned.includes(b.id)
            return (
              <div key={b.id} className="badge-item">
                <div className={`badge-ico${has ? '' : ' locked'}`}
                  style={{ borderColor: b.color, background: has ? b.color + '16' : 'transparent' }}>
                  {b.icon}
                </div>
                <div className="badge-lbl">{b.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Referral */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Referral Program</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
          Earn +{POINTS.REFERRAL} pts every time someone joins with your link.
        </div>
        {referralData && (
          <>
            <div className="ref-stats">
              {([
                [referralData.total_invited || 0, 'Invited',    'var(--text)'],
                [referralData.total_joined  || 0, 'Joined',     'var(--green)'],
                [referralData.total_points  || 0, 'Pts Earned', 'var(--gold2)'],
              ] as [number, string, string][]).map(([v, l, c]) => (
                <div key={l} className="ref-stat">
                  <div className="ref-stat-v" style={{ color: c }}>{v}</div>
                  <div className="ref-stat-l">{l}</div>
                </div>
              ))}
            </div>
            <div className="ref-link-box" style={{ marginTop: 12 }}>
              <div style={{ flex: 1, fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {referralData.ref_link}
              </div>
              <button className="btn btn-gold btn-sm"
                onClick={() => { navigator.clipboard?.writeText(referralData.ref_link).catch(() => {}); showToast('Referral link copied!', '✓', '#C9A227') }}>
                ⌘ Copy
              </button>
            </div>
          </>
        )}
      </div>

      {/* Review Rewards */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowReviews(v => !v)}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>Review Rewards</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              +{POINTS.REVIEW} pts per verified review on Apple or Spotify
            </div>
          </div>
          <span style={{ color: 'var(--text3)', fontSize: 14 }}>{showReviews ? '▲' : '▼'}</span>
        </div>

        {showReviews && (
          <div style={{ marginTop: 14 }}>
            <div style={{ padding: '10px 12px', background: 'rgba(201,162,39,0.04)', borderRadius: 8, borderLeft: '2px solid rgba(201,162,39,0.3)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.75, marginBottom: 14 }}>
              Apple and Spotify do not provide an API to auto-verify reviews. After submitting, confirm here. Points are credited within 24 hours after admin verification.
            </div>
            {SHOWS.filter(s => s.apple || s.spotify).slice(0, 10).map(show => {
              const appleKey   = `${show.id}|apple`
              const spotifyKey = `${show.id}|spotify`
              const aStatus    = reviewMap.get(appleKey)
              const sStatus    = reviewMap.get(spotifyKey)
              return (
                <div key={show.id} style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 11, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>{show.name}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {show.apple && (
                      <button onClick={() => !aStatus && submitReview(show.id, 'apple')}
                        style={{ padding: '6px 13px', borderRadius: '100px', border: '1px solid rgba(252,94,94,0.3)', background: 'rgba(252,94,94,0.06)', color: aStatus ? 'var(--green)' : '#FC5E5E', cursor: aStatus ? 'default' : 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>
                        {aStatus === 'approved' ? '✓ Approved' : aStatus === 'pending' ? '⏳ Pending' : 'Review on Apple'}
                      </button>
                    )}
                    {show.spotify && (
                      <button onClick={() => !sStatus && submitReview(show.id, 'spotify')}
                        style={{ padding: '6px 13px', borderRadius: '100px', border: '1px solid rgba(30,215,96,0.3)', background: 'rgba(30,215,96,0.06)', color: sStatus ? 'var(--green)' : '#1ED760', cursor: sStatus ? 'default' : 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>
                        {sStatus === 'approved' ? '✓ Approved' : sStatus === 'pending' ? '⏳ Pending' : 'Review on Spotify'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Points guide */}
      <div className="guide-card">
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>How Points Work</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.75, padding: '10px 12px', background: 'rgba(77,207,180,0.06)', borderRadius: 8, borderLeft: '2px solid var(--green)' }}>
          You must listen for at least 5 minutes to earn episode points.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {([
            ['🎧', 'Listen 5+ min to any episode', `+${POINTS.EPISODE} pts`],
            ['📅', '7-day streak bonus',           '+50 pts'],
            ['🌙', '14-day streak bonus',          '+100 pts'],
            ['🌟', '21-day streak bonus',          '+150 pts'],
            ['💎', '30-day streak bonus',          '+200 pts'],
            ['🌐', 'Follow & confirm on social',   `+${POINTS.SOCIAL} pts each`],
            ['🤝', 'Successful referral',          `+${POINTS.REFERRAL} pts`],
            ['⭐', 'Apple/Spotify review',         `+${POINTS.REVIEW} pts`],
            ['🎁', 'Welcome bonus',                '+50 pts'],
          ] as [string, string, string][]).map(([ico, label, pts]) => (
            <div key={label} className="guide-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{ico}</span>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
              </div>
              <div className="guide-pts-lbl">{pts}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function calcBadges(profile: Record<string, unknown> | null): string[] {
  if (!profile) return []
  return BADGES.filter(b => {
    if (b.type === 'eps')    return false // episode count from DB — placeholder
    if (b.type === 'streak') return (profile.streak_days as number || 0) >= b.need
    if (b.type === 'social') return false
    if (b.type === 'review') return false
    return false
  }).map(b => b.id)
}
