'use client'
import { useState } from 'react'
import { useMember } from '../layout'
import { SOCIALS, COMMUNITY, POINTS } from '@/lib/constants'

export default function CommunityPage() {
  const { showToast } = useMember()
  const [verified, setVerified] = useState<Record<string, boolean>>({})

  async function handle(item: { key: string; label: string; url: string }) {
    window.open(item.url, '_blank')
    if (verified[item.key]) return

    setTimeout(async () => {
      const confirmed = window.confirm(
        `Did you follow ${item.label}?\n\nClick OK only after following to earn +${POINTS.SOCIAL} points.`
      )
      if (!confirmed) {
        showToast('Points are only credited after confirming your follow.', '!', '#E8C96A')
        return
      }
      const r = await fetch('/api/points', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'social_follow', platform: item.key }),
      })
      if (r.ok) {
        const d = await r.json()
        if (d.awarded) {
          setVerified(p => ({ ...p, [item.key]: true }))
          showToast(`+${POINTS.SOCIAL} pts for following ${item.label}!`, '🌐', '#C9A227')
        } else if (d.already_credited) {
          setVerified(p => ({ ...p, [item.key]: true }))
          showToast('Already credited for this platform.', '✓', '#4DCFB4')
        }
      }
    }, 1600)
  }

  const done  = Object.values(verified).filter(Boolean).length
  const total = SOCIALS.length + COMMUNITY.length

  return (
    <div className="page">
      <div className="page-title">Join Our World</div>
      <div className="page-sub">
        Follow us everywhere — each confirmed follow earns +{POINTS.SOCIAL} points.
      </div>

      {/* Social platforms */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          Social Platforms
        </div>
        <div className="soc-wrap">
          {SOCIALS.map(s => (
            <button key={s.key}
              className={`soc-btn${verified[s.key] ? ' done' : ''}`}
              onClick={() => handle(s)}>
              {s.cta} on {s.label}
              {verified[s.key] && <div className="soc-tick">✓</div>}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12, padding: '9px 12px', background: 'var(--navy3)', borderRadius: 8, borderLeft: '2px solid var(--gold)', lineHeight: 1.65 }}>
          Click a button, follow on the platform, then confirm in the popup. Points are credited only on confirmation.
        </div>
      </div>

      {/* Community groups */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Community Groups
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {COMMUNITY.map(s => (
            <button key={s.key}
              style={{ flex: 1, minWidth: 180, padding: 14, borderRadius: 13, border: `1.5px solid ${verified[s.key] ? 'var(--green)' : s.color + '60'}`, background: s.color + '0A', color: verified[s.key] ? 'var(--green)' : s.color, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 9, transition: 'all .2s' }}
              onClick={() => handle(s)}>
              <span style={{ fontSize: 18 }}>{s.key === 'whatsapp' ? '💬' : '✈'}</span>
              <div style={{ textAlign: 'left' }}>
                <div>{s.cta}</div>
                <div style={{ fontSize: 11, fontWeight: 400, opacity: .75, marginTop: 2 }}>
                  {s.label}{verified[s.key] ? ' — Joined ✓' : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Progress</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold2)' }}>{done}/{total} confirmed</div>
        </div>
        <div style={{ height: 5, background: 'var(--navy4)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: 'var(--goldgrad)', borderRadius: 3, transition: 'width .5s' }} />
        </div>
      </div>
    </div>
  )
}
