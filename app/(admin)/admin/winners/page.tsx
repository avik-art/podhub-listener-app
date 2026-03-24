'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { REWARDS } from '@/lib/constants'

const fetcher = (url: string) => fetch(url).then(r => r.json())
function initials(n: string) { return (n||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?' }

const MEDALS  = ['🥇', '🥈', '🥉']
const PRIZES  = [REWARDS.first, REWARDS.second, REWARDS.third]

export default function AdminWinnersPage() {
  const { data, isLoading } = useSWR('/api/leaderboard?limit=10', fetcher)
  const [paid, setPaid] = useState<Record<string, boolean>>({})
  const members = data?.members || []
  const top3    = members.slice(0, 3)
  const month   = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function togglePaid(id: string) { setPaid(p => ({ ...p, [id]: !p[id] })) }

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Monthly Winners</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{month} — Top 3 earn cash prizes.</div>

      {isLoading && <div className="loader-wrap"><div className="spinner" /></div>}

      {!isLoading && members.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>No members yet</div>
        </div>
      )}

      {top3.map((m: Record<string, unknown>, i: number) => (
        <div key={m.id as string} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--navy2)', border: `1px solid ${i===0?'rgba(201,162,39,0.3)':'var(--border)'}`, borderRadius: 14, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 22, width: 28, flexShrink: 0 }}>{MEDALS[i]}</div>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${i===0?'var(--gold)':'var(--border)'}`, background: 'var(--navy3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 18, overflow: 'hidden', flexShrink: 0 }}>
            {(m.profile_photo_url as string) ? <img src={m.profile_photo_url as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(m.name as string||'')}
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name as string || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{m.country_flag as string} {m.country as string || ''} &nbsp;·&nbsp; {m.monthly_points as number} pts this month</div>
            {m.payout_method && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Payout: {m.payout_method as string}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, background: 'var(--goldgrad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${PRIZES[i].usd}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>~₹{PRIZES[i].inr.toLocaleString()}</div>
            <button onClick={() => togglePaid(m.id as string)}
              style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${paid[m.id as string]?'var(--green)':'var(--border)'}`, background: paid[m.id as string]?'rgba(77,207,180,0.08)':'transparent', color: paid[m.id as string]?'var(--green)':'var(--text3)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>
              {paid[m.id as string] ? '✓ Paid' : 'Mark Paid'}
            </button>
          </div>
        </div>
      ))}

      {members.length > 3 && (
        <>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12, marginTop: 24 }}>Full Top 10</div>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {members.slice(0, 10).map((m: Record<string, unknown>, i: number) => (
              <div key={m.id as string} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < 9 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 28, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text3)', flexShrink: 0 }}>{i<3?MEDALS[i]:`#${i+1}`}</div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 13 }}>{initials(m.name as string||'')}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{m.name as string}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.country_flag as string} {m.country as string}</div></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold2)' }}>{m.monthly_points as number}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text3)', lineHeight: 1.75 }}>
        To send winner announcements by email, integrate <strong>Resend</strong> (resend.com) — free tier covers monthly announcements easily.
      </div>
    </div>
  )
}
