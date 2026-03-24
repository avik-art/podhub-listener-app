'use client'
import { useState, useEffect, useMemo } from 'react'
import { SHOWS, CAT_COLORS, SOCIALS, COMMUNITY, BADGES, AVATARS, POINTS, REWARDS, RANK_NAMES } from '@/lib/constants'
import { useMember } from '../layout'
import type { ShowFeed, Episode } from '@/lib/rss'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function fmtDate(d: string) { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return '' } }
function fmtDur(s: string) { if (!s) return ''; if (s.includes(':')) return s; const n=parseInt(s); if(isNaN(n))return ''; return `${Math.floor(n/60)}:${n%60<10?'0'+n%60:n%60}` }
function initials(n: string) { return (n||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?' }

export default function EpisodesPage() {
  const { showData, setShowData, player, showToast, profile } = useMember()
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return; setLoaded(true)
    SHOWS.forEach(async s => {
      if (!(showData[s.id] as ShowFeed | undefined)?.episodes?.length) {
        const r = await fetch(`/api/rss?show=${s.id}`)
        if (r.ok) { const d = await r.json(); setShowData(p => ({ ...p, [s.id]: d })) }
      }
    })
  }, []) // eslint-disable-line

  const loadedCount = Object.values(showData).filter((d): d is ShowFeed => !!(d as ShowFeed)?.episodes?.length).length

  const allEps = useMemo(() => {
    const eps: (Episode & { show: typeof SHOWS[0] })[] = []
    SHOWS.forEach(show => {
      const d = showData[show.id] as ShowFeed | undefined
      d?.episodes?.forEach(ep => eps.push({ ...ep, show }))
    })
    return eps.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
  }, [showData])

  const filtered = useMemo(() => {
    let f = cat === 'All' ? allEps : allEps.filter(ep => ep.show.category === cat)
    if (search.trim()) { const q = search.toLowerCase(); f = f.filter(ep => ep.title.toLowerCase().includes(q) || ep.show.name.toLowerCase().includes(q)) }
    return f
  }, [allEps, cat, search])

  function handlePlay(ep: Episode & { show: typeof SHOWS[0] }) {
    if (!ep.enclosure) { showToast('No audio for this episode', '!', '#E8C96A'); return }
    player.play(ep, ep.show, () => showToast(`+${POINTS.EPISODE} pts — 5 min reached!`, '🎧', '#C9A227'))
  }

  return (
    <div className="page">
      <div className="page-title">All Episodes</div>
      <div className="page-sub">{loadedCount < SHOWS.length ? `Loading… (${loadedCount}/${SHOWS.length})` : `${filtered.length} episodes`}</div>
      <input placeholder="Search episodes or shows…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', background: 'var(--navy2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontFamily: 'var(--sans)', marginBottom: 14, outline: 'none' }} />
      <div className="cat-bar" style={{ marginBottom: 14 }}>
        {['All', ...Object.keys(CAT_COLORS)].map(c => (
          <button key={c} className={`cat-btn${cat===c?' active':''}`}
            style={cat===c?{background:CAT_COLORS[c]||'var(--gold)',color:'#06091A',borderColor:'transparent'}:{}}
            onClick={() => setCat(c)}>{c === 'All' ? 'All' : c}</button>
        ))}
      </div>
      {loadedCount === 0
        ? <div className="loader-wrap"><div className="spinner" /><div className="loader-txt">Fetching all feeds…</div></div>
        : <div className="ep-list">
            {filtered.map((ep, i) => {
              const isPlaying = player.cur?.ep.guid === ep.guid && player.playing
              const artwork   = (showData[ep.show.id] as ShowFeed | undefined)?.artwork || null
              return (
                <div key={ep.guid+i} className={`ep-row${isPlaying?' playing':''}`} onClick={() => handlePlay(ep)}>
                  <div className="ep-n">{isPlaying?<div className="wave-anim"><div className="wbar"/><div className="wbar"/><div className="wbar"/><div className="wbar"/></div>:i+1}</div>
                  <div className="ep-thumb">{artwork?<img src={artwork} alt="" loading="lazy" />:<svg width="20" height="20" viewBox="0 0 24 24" fill={ep.show.color}><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>}</div>
                  <div className="ep-info">
                    <div className="ep-show-lbl" style={{color:ep.show.color}}>{ep.show.name}</div>
                    <div className="ep-title-txt">{ep.title}</div>
                    <div className="ep-meta-row">{ep.pubDate&&<span>{fmtDate(ep.pubDate)}</span>}{ep.duration&&<span>{fmtDur(ep.duration)}</span>}</div>
                  </div>
                  <div className="ep-actions">
                    <div className={`play-btn${isPlaying?' active':''}`} onClick={e=>{e.stopPropagation();handlePlay(ep)}}>{isPlaying?'⏸':'▶'}</div>
                    <div className="ep-pts-lbl">5min=+10</div>
                  </div>
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}
