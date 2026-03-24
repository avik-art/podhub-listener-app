'use client'
import { useState, useEffect } from 'react'
import { SHOWS, CAT_COLORS } from '@/lib/constants'
import { useMember } from '../layout'
import type { ShowFeed } from '@/lib/rss'

const CAT_ICONS: Record<string, string> = {
  'Mental Wellness':       'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  'Business & Leadership': 'M20 6h-2.18c.07-.44.18-.86.18-1 0-2.21-1.79-4-4-4s-4 1.79-4 4c0 .14.11.56.18 1H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z',
  'AI & Technology':       'M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2m-2 10a2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2m4 0a2 2 0 0 0-2 2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0-2-2z',
  "Men's Mental Health":   'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  'Spirituality':          'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
  'Intimacy & Pleasure':   'M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z',
}

function fmtDate(d: string) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return '' }
}
function fmtDur(s: string) {
  if (!s) return ''
  if (s.includes(':')) return s
  const n = parseInt(s); if (isNaN(n)) return ''
  return `${Math.floor(n/60)}:${n%60<10?'0'+n%60:n%60}`
}

export default function ShowsPage() {
  const { showData, setShowData, player, showToast, profile } = useMember()
  const [cat,     setCat]     = useState('All')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [modal,   setModal]   = useState<string | null>(null)

  const filtered = cat === 'All' ? SHOWS : SHOWS.filter(s => s.category === cat)

  async function loadShow(showId: string) {
    if ((showData[showId] as ShowFeed | undefined)?.episodes?.length) return
    setLoading(p => ({ ...p, [showId]: true }))
    try {
      const r = await fetch(`/api/rss?show=${showId}`)
      if (r.ok) {
        const data = await r.json()
        setShowData(p => ({ ...p, [showId]: data }))
      }
    } finally {
      setLoading(p => ({ ...p, [showId]: false }))
    }
  }

  useEffect(() => {
    SHOWS.slice(0, 8).forEach(s => loadShow(s.id))
  }, []) // eslint-disable-line

  function handlePlay(ep: { enclosure: string; guid: string; title: string }, show: typeof SHOWS[0]) {
    if (!ep.enclosure) { showToast('No audio for this episode', '!', '#E8C96A'); return }
    player.play(ep, show, () => showToast('+10 pts — 5 min reached!', '🎧', '#C9A227'))
  }

  const modalShow   = modal ? SHOWS.find(s => s.id === modal) : null
  const modalData   = modal ? (showData[modal] as ShowFeed | undefined) : null
  const modalLoad   = modal ? loading[modal] : false

  return (
    <div className="page">
      <div className="page-title">All Shows</div>
      <div className="page-sub">22 shows across 6 categories — every shade of the human experience.</div>

      <div className="cat-bar">
        {['All', ...Object.keys(CAT_COLORS)].map(c => (
          <button key={c}
            className={`cat-btn${cat === c ? ' active' : ''}`}
            style={cat === c ? { background: CAT_COLORS[c] || 'var(--gold)', color: '#06091A', borderColor: 'transparent' } : {}}
            onClick={() => setCat(c)}>
            {c !== 'All' && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
                <path d={CAT_ICONS[c] || CAT_ICONS['Spirituality']} />
              </svg>
            )}
            {c === 'All' ? 'All Shows' : c}
          </button>
        ))}
      </div>

      <div className="show-grid">
        {filtered.map(show => {
          const data    = showData[show.id] as ShowFeed | undefined
          const isLoad  = loading[show.id]
          const artwork = data?.artwork || null
          const epCount = data?.episodes?.length ?? null
          return (
            <div key={show.id} className="show-card" style={{ borderTop: `2.5px solid ${show.color}` }}
              onClick={() => { setModal(show.id); loadShow(show.id) }}>
              <div className="show-img">
                {artwork
                  ? <img src={artwork} alt={show.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${show.color}22, ${show.color}08)` }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill={show.color} opacity={0.6}>
                        <path d={CAT_ICONS[show.category] || CAT_ICONS['Spirituality']} />
                      </svg>
                    </div>
                  )}
                <div className="ep-badge">{isLoad ? '...' : epCount !== null ? `${epCount} eps` : 'tap'}</div>
              </div>
              <div className="show-body">
                <div className="show-cat" style={{ color: show.color }}>{show.category}</div>
                <div className="show-name">{show.name}</div>
                <div className="show-eps-txt">{isLoad ? 'Loading...' : epCount !== null ? `${epCount} episodes` : 'Tap to explore'}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && modalShow && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ flex: 1, paddingRight: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: modalShow.color, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 3 }}>{modalShow.category}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700 }}>{modalShow.name}</div>
              </div>
              <button className="modal-x" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {modalLoad && <div className="loader-wrap"><div className="spinner" /><div className="loader-txt">Loading episodes...</div></div>}
              {!modalLoad && modalData && (
                <>
                  <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                    {modalData.artwork && <img src={modalData.artwork} loading="lazy" style={{ width: 88, height: 88, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} alt="" />}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7, marginBottom: 8 }}>{(modalData.description || '').slice(0, 220)}</p>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold2)', marginBottom: 8 }}>{modalData.episodes.length} episodes</div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {modalShow.apple && <a href={modalShow.apple} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '4px 10px', borderRadius: '100px', background: 'rgba(252,94,94,0.1)', border: '1px solid rgba(252,94,94,0.3)', color: '#FC5E5E', textDecoration: 'none' }}>Apple Podcasts</a>}
                        {modalShow.spotify && <a href={modalShow.spotify} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '4px 10px', borderRadius: '100px', background: 'rgba(30,215,96,0.1)', border: '1px solid rgba(30,215,96,0.3)', color: '#1ED760', textDecoration: 'none' }}>Spotify</a>}
                      </div>
                    </div>
                  </div>
                  {modalData.episodes.length === 0 && <div style={{ textAlign: 'center', padding: 28, color: 'var(--text3)', fontSize: 13 }}>RSS feed temporarily unavailable. Check back shortly.</div>}
                  <div className="ep-list">
                    {modalData.episodes.map((ep, i) => {
                      const isPlaying = player.cur?.ep.guid === ep.guid && player.playing
                      return (
                        <div key={ep.guid || i} className={`ep-row${isPlaying ? ' playing' : ''}`} onClick={() => handlePlay(ep, modalShow)}>
                          <div className="ep-n">{isPlaying ? <div className="wave-anim"><div className="wbar" /><div className="wbar" /><div className="wbar" /><div className="wbar" /></div> : modalData.episodes.length - i}</div>
                          <div className="ep-info">
                            <div className="ep-title-txt" style={{ fontSize: 13 }}>{ep.title}</div>
                            <div className="ep-meta-row">{ep.pubDate && <span>{fmtDate(ep.pubDate)}</span>}{ep.duration && <span>{fmtDur(ep.duration)}</span>}</div>
                          </div>
                          <div className="ep-actions">
                            <div className={`play-btn${isPlaying ? ' active' : ''}`} style={{ width: 30, height: 30, fontSize: 11 }} onClick={e => { e.stopPropagation(); handlePlay(ep, modalShow) }}>{isPlaying ? '⏸' : '▶'}</div>
                            <div className="ep-pts-lbl" style={{ fontSize: 10 }}>5min=+10</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
