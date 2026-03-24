'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { POINTS } from '@/lib/constants'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const { data, mutate, isLoading } = useSWR(`/api/admin/reviews?status=${tab}`, fetcher)
  const reviews = Array.isArray(data) ? data : []

  async function act(reviewId: string, action: 'approve' | 'reject') {
    await fetch('/api/admin/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, action }),
    })
    mutate()
  }

  const plLabel = (p: string) => p === 'apple' ? 'Apple Podcasts' : 'Spotify'
  const plColor = (p: string) => p === 'apple' ? '#FC5E5E' : '#1ED760'

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Review Approvals</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Approve after verifying the review exists on the platform.</div>

      <div style={{ padding: '12px 14px', background: 'rgba(201,162,39,0.04)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--text3)', lineHeight: 1.75, marginBottom: 20 }}>
        <strong style={{ color: 'var(--gold2)' }}>Platform limitation:</strong> Apple Podcasts and Spotify provide no API to auto-verify reviews. Members self-report. Verify manually on the platform before approving.
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['pending', 'approved', 'rejected'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '7px 16px', borderRadius: '100px', border: `1px solid ${tab===t?'var(--gold)':'var(--border)'}`, background: tab===t?'rgba(201,162,39,0.1)':'transparent', color: tab===t?'var(--gold)':'var(--text3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {isLoading && <div className="loader-wrap"><div className="spinner" /></div>}

      {!isLoading && reviews.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⭐</div>
          <div style={{ fontSize: 13 }}>No {tab} review requests.</div>
        </div>
      )}

      {reviews.map((r: Record<string, unknown>) => {
        const author = r.profiles as Record<string, unknown> | null
        return (
          <div key={r.id as string} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>{r.show_name as string}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                {author?.email as string} &nbsp;|&nbsp;
                <span style={{ color: plColor(r.platform as string) }}>{plLabel(r.platform as string)}</span> &nbsp;|&nbsp;
                {new Date(r.submitted_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            {tab === 'pending' && (
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                <button onClick={() => act(r.id as string, 'approve')}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--green)', background: 'rgba(77,207,180,0.06)', color: 'var(--green)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)' }}>
                  +{POINTS.REVIEW} Approve
                </button>
                <button onClick={() => act(r.id as string, 'reject')}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--pink)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)' }}>
                  Reject
                </button>
              </div>
            )}
            {tab === 'approved' && <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>+{POINTS.REVIEW} credited</div>}
            {tab === 'rejected' && <div style={{ fontSize: 11, color: 'var(--pink)' }}>Rejected</div>}
          </div>
        )
      })}
    </div>
  )
}
