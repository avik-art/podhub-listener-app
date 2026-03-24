'use client'
import React from 'react'
import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function initials(n: string) { return (n||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?' }

export default function AdminMembersPage() {
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [q,      setQ]      = useState('')

  const { data, mutate, isLoading } = useSWR(
    `/api/admin/members?page=${page}&limit=25&q=${q}&filter=${filter}`,
    fetcher
  )

  const members    = data?.members    || []
  const totalPages = data?.totalPages || 1
  const total      = data?.total      || 0

  function handleSearch(e: React.FormEvent) {
    e.preventDefault(); setQ(search); setPage(1)
  }

  async function action(userId: string, act: 'ban' | 'unban' | 'delete') {
    if (act === 'delete' && !window.confirm('Permanently delete this member?')) return
    await fetch('/api/admin/members', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action: act }),
    })
    mutate()
  }

  function exportCSV() {
    if (!members.length) return
    const headers = ['Name','Email','Country','Monthly Pts','Total Pts','Streak','Joined','Status']
    const rows = members.map((m: Record<string,unknown>) => [
      m.name, m.email, m.country, m.monthly_points, m.points, m.streak_days,
      new Date(m.joined_at as string).toLocaleDateString(), m.is_banned ? 'banned' : 'active',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `podhub-members-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Members</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{total} registered members.</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, gap: 8, minWidth: 200 }}>
          <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'var(--navy2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 9, padding: '8px 13px', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none' }} />
          <button type="submit" className="btn btn-gold btn-sm">Search</button>
        </form>
        {['all','active','banned'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            style={{ padding: '7px 14px', borderRadius: '100px', border: `1px solid ${filter===f?'var(--gold)':'var(--border)'}`, background: filter===f?'rgba(201,162,39,0.1)':'transparent', color: filter===f?'var(--gold)':'var(--text3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>↓ CSV</button>
      </div>

      {isLoading && <div className="loader-wrap"><div className="spinner" /></div>}

      {!isLoading && members.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{total === 0 ? 'No members registered yet' : 'No members match this filter'}</div>
        </div>
      )}

      {members.map((m: Record<string,unknown>) => (
        <div key={m.id as string} style={{ background: 'var(--navy2)', border: `1px solid ${m.is_banned?'rgba(212,111,170,0.3)':'var(--border)'}`, borderRadius: 13, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--navy3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
            {(m.profile_photo_url as string) ? <img src={m.profile_photo_url as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(m.name as string||'')}
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {m.name as string || '—'}
              {m.is_banned && <span style={{ fontSize: 10, color: 'var(--pink)', background: 'rgba(212,111,170,0.1)', padding: '2px 8px', borderRadius: '100px' }}>banned</span>}
              {m.is_podcaster && <span style={{ fontSize: 10, color: 'var(--gold2)', background: 'rgba(201,162,39,0.1)', padding: '2px 8px', borderRadius: '100px' }}>🎙 podcaster</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{m.email as string}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {m.country_flag as string} {m.country as string || '—'} &nbsp;|&nbsp;
              {m.monthly_points as number} pts &nbsp;|&nbsp;
              🔥 {m.streak_days as number} days &nbsp;|&nbsp;
              Joined {new Date(m.joined_at as string).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {m.is_banned
              ? <button onClick={() => action(m.id as string, 'unban')} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--green)', background: 'transparent', color: 'var(--green)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>Restore</button>
              : <button onClick={() => action(m.id as string, 'ban')}   style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--pink)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>Ban</button>
            }
            <button onClick={() => action(m.id as string, 'delete')} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>Delete</button>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--text3)', padding: '7px 14px' }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}
    </div>
  )
}
