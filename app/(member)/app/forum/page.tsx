'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { useMember } from '../layout'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TAG_COLORS: Record<string, string> = {
  Suggestion: 'var(--blue)',
  Feedback:   'var(--green)',
  Question:   'var(--purple)',
  Update:     'var(--gold)',
}

function initials(n: string) {
  return (n || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function ForumPage() {
  const { profile, showToast } = useMember()
  const { data, mutate, isLoading } = useSWR('/api/forum', fetcher)
  const [showForm, setShowForm] = useState(false)
  const [title,   setTitle]    = useState('')
  const [body,    setBody]     = useState('')
  const [tag,     setTag]      = useState<'Suggestion' | 'Feedback' | 'Question'>('Suggestion')
  const [posting, setPosting]  = useState(false)

  const posts = data?.posts || []

  async function submit() {
    if (!title.trim() || !body.trim()) return
    setPosting(true)
    try {
      const r = await fetch('/api/forum', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tag, title: title.trim(), body: body.trim() }),
      })
      if (r.ok) {
        await mutate()
        setTitle(''); setBody(''); setShowForm(false)
        showToast('Posted to forum!', '💬', '#C9A227')
      } else {
        const d = await r.json()
        showToast(d.error || 'Something went wrong', '!', '#E87070')
      }
    } finally {
      setPosting(false)
    }
  }

  async function deletePost(id: string) {
    if (!window.confirm('Delete this post?')) return
    await fetch(`/api/forum?id=${id}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Community Forum</div>
          <div className="page-sub">Share ideas, feedback, and conversations.</div>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {(['Suggestion', 'Feedback', 'Question'] as const).map(t => (
              <button key={t}
                style={{ padding: '6px 14px', borderRadius: '100px', border: `1px solid ${tag === t ? 'var(--gold)' : 'var(--border)'}`, background: tag === t ? 'rgba(201,162,39,0.1)' : 'transparent', color: tag === t ? 'var(--gold)' : 'var(--text3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)', transition: 'all .15s' }}
                onClick={() => setTag(t)}>
                {t}
              </button>
            ))}
          </div>
          <input
            placeholder="Post title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 9, padding: '10px 13px', fontSize: 13, fontFamily: 'var(--sans)', marginBottom: 9, outline: 'none' }}
          />
          <textarea
            placeholder="Share your thoughts…"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            maxLength={2000}
            style={{ resize: 'vertical', width: '100%', background: 'var(--navy3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 9, padding: '10px 13px', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{body.length}/2000</div>
            <button className="btn btn-gold btn-sm" onClick={submit} disabled={posting || !title.trim() || !body.trim()}>
              {posting ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      )}

      {isLoading && <div className="loader-wrap"><div className="spinner" /></div>}

      {!isLoading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No posts yet</div>
          <div style={{ fontSize: 12 }}>Be the first to start a conversation.</div>
        </div>
      )}

      {posts.map((post: Record<string, unknown>) => {
        const author   = post.profiles as Record<string, unknown> | null
        const isOwn    = author && (author.id === profile?.id)
        const tagColor = TAG_COLORS[post.tag as string] || 'var(--gold)'

        return (
          <div key={post.id as string} className="forum-post">
            {/* Pin badge */}
            {post.is_pinned && (
              <div style={{ fontSize: 10, color: 'var(--gold2)', fontWeight: 600, marginBottom: 6, letterSpacing: '.06em' }}>
                📌 PINNED
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--navy3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontFamily: 'var(--serif)', overflow: 'hidden', flexShrink: 0 }}>
                  {(author?.profile_photo_url as string)
                    ? <img src={author.profile_photo_url as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(author?.name as string || '')}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{author?.name as string || 'Member'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {new Date(post.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="forum-tag"
                  style={{ background: tagColor + '18', color: tagColor, border: `1px solid ${tagColor}40` }}>
                  {post.tag as string}
                </span>
                {isOwn && (
                  <button onClick={() => deletePost(post.id as string)}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, padding: '2px 6px' }}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{post.title as string}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 10 }}>
              {post.body as string}
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text3)' }}>
              <span>♥ {post.likes as number || 0}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
