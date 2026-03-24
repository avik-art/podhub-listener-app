'use client'
import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminUpdatesPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/updates', fetcher)
  const [title,   setTitle]   = useState('')
  const [body,    setBody]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const updates = Array.isArray(data) ? data : []

  async function publish() {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    const r = await fetch('/api/admin/updates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), body: body.trim() }),
    })
    if (r.ok) { await mutate(); setTitle(''); setBody(''); setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Platform Updates</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Updates are saved here and also pinned to the Community Forum for all members.</div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 14 }}>New Update</div>
        <input placeholder="Update title…" value={title} onChange={e => setTitle(e.target.value)}
          style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 9, padding: '10px 13px', fontSize: 13, fontFamily: 'var(--sans)', marginBottom: 9, outline: 'none' }} />
        <textarea placeholder="Write your update for the community…" value={body} onChange={e => setBody(e.target.value)} rows={5}
          style={{ resize: 'vertical', width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 9, padding: '10px 13px', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none', marginBottom: 12 }} />
        <button className="btn btn-gold btn-sm" onClick={publish} disabled={saving || !title.trim() || !body.trim()}
          style={{ ...(saved ? { background: 'var(--green)' } : {}) }}>
          {saved ? '✓ Published' : saving ? 'Publishing…' : 'Publish Update'}
        </button>
      </div>

      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>Published ({updates.length})</div>
      {isLoading && <div className="loader-wrap"><div className="spinner" /></div>}
      {!isLoading && updates.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📢</div>
          <div style={{ fontSize: 13 }}>No updates published yet.</div>
        </div>
      )}
      {updates.map((u: Record<string, unknown>) => (
        <div key={u.id as string} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{u.title as string}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(u.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{u.body as string}</div>
        </div>
      ))}
    </div>
  )
}
