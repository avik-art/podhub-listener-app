'use client'
import React from 'react'
import type { PlayerState } from '@/hooks/usePlayer'
import type { ShowFeed } from '@/lib/rss'

function fmtTime(s: number) {
  if (!s && s !== 0) return '0:00'
  s = Math.floor(s)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec < 10 ? '0' + sec : sec}`
}

export default function PlayerBar({
  player,
  showData,
}: {
  player:   PlayerState
  showData: Record<string, unknown>
}) {
  const { cur, playing, prog, dur, vol, toggle, seek, skip, setVolume, close } = player
  if (!cur) return null

  const pct     = dur > 0 ? (prog / dur) * 100 : 0
  const artwork = (showData?.[cur.show.id] as ShowFeed | undefined)?.artwork || null

  function handleTrack(ev: React.MouseEvent<HTMLDivElement>) {
    const r = ev.currentTarget.getBoundingClientRect()
    seek((ev.clientX - r.left) / r.width)
  }

  function handleVol(ev: React.MouseEvent<HTMLDivElement>) {
    const r = ev.currentTarget.getBoundingClientRect()
    setVolume(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)))
  }

  return (
    <div className="player-bar">
      <div className="player-in">
        {/* Artwork */}
        <div className="player-artwork">
          {artwork
            ? <img src={artwork} alt="" />
            : <span>🎙</span>
          }
        </div>

        {/* Track info */}
        <div style={{ flex: '0 0 auto', minWidth: 0, maxWidth: 170 }}>
          <div className="player-ep-name">{cur.ep.title}</div>
          <div className="player-show-name">{cur.show.name}</div>
        </div>

        {/* Controls */}
        <div className="player-ctrls">
          <button className="skip-btn" onClick={() => skip(-15)}>⏮ 15s</button>
          <button className="player-main-btn" onClick={toggle}>
            {playing ? '⏸' : '▶'}
          </button>
          <button className="skip-btn" onClick={() => skip(30)}>+30s</button>
        </div>

        {/* Progress bar */}
        <div className="prog-wrap">
          <div className="p-time-lbl">{fmtTime(prog)}</div>
          <div className="p-track" onClick={handleTrack}>
            <div className="p-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="p-time-lbl" style={{ textAlign: 'right' }}>{fmtTime(dur)}</div>
        </div>

        {/* Volume */}
        <div className="vol-wrap">
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            {vol > 0.5 ? '🔊' : '🔈'}
          </span>
          <div className="vol-track" onClick={handleVol}>
            <div className="vol-fill" style={{ width: `${vol * 100}%` }} />
          </div>
        </div>

        <button className="p-close-btn" onClick={close}>✕</button>
      </div>
    </div>
  )
}
