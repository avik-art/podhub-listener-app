'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { MIN_LISTEN_SECS } from '@/lib/constants'
import type { Show } from '@/lib/constants'
import type { Episode } from '@/lib/rss'

export interface PlayerEp {
  ep:   Episode
  show: Show
}

export interface PlayerState {
  cur:       PlayerEp | null
  playing:   boolean
  prog:      number
  dur:       number
  vol:       number
  play:      (ep: Episode, show: Show, onPoints?: () => void) => void
  toggle:    () => void
  seek:      (pct: number) => void
  skip:      (secs: number) => void
  setVolume: (v: number) => void
  close:     () => void
}

export function usePlayer(): PlayerState {
  const [cur,     setCur]     = useState<PlayerEp | null>(null)
  const [playing, setPlaying] = useState(false)
  const [prog,    setProg]    = useState(0)
  const [dur,     setDur]     = useState(0)
  const [vol,     setVol]     = useState(0.85)

  const audioRef      = useRef<HTMLAudioElement | null>(null)
  const listenStart   = useRef<number | null>(null)
  const listenAccum   = useRef(0)
  const pointsFired   = useRef(false)
  const onPointsCb    = useRef<(() => void) | null>(null)
  const curEpGuid     = useRef<string | null>(null)
  const curShowId     = useRef<string | null>(null)
  const reportedSecs  = useRef(0)  // last seconds value we reported to the API

  useEffect(() => {
    const a = new Audio()
    a.preload = 'metadata'
    audioRef.current = a

    const onTime = () => {
      setProg(a.currentTime)
      if (listenStart.current !== null) {
        const now = Date.now()
        listenAccum.current += (now - listenStart.current) / 1000
        listenStart.current = now

        // Report to API every 30 seconds of new listening
        const newSecs = Math.floor(listenAccum.current)
        if (newSecs - reportedSecs.current >= 30 && curEpGuid.current) {
          const delta = newSecs - reportedSecs.current
          reportedSecs.current = newSecs
          // Fire-and-forget points sync to DB
          fetch('/api/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action:         'episode_listen',
              episode_guid:   curEpGuid.current,
              show_id:        curShowId.current,
              listen_seconds: delta,
            }),
          }).then(async r => {
            if (r.ok) {
              const data = await r.json()
              if (data.awarded && !pointsFired.current) {
                pointsFired.current = true
                onPointsCb.current?.()
              }
            }
          }).catch(() => {})
        }
      }
    }

    const onPlay  = () => { setPlaying(true);  listenStart.current = Date.now() }
    const onPause = () => {
      setPlaying(false)
      if (listenStart.current !== null) {
        listenAccum.current += (Date.now() - listenStart.current) / 1000
        listenStart.current = null
      }
    }
    const onDur = () => setDur(a.duration || 0)
    const onEnd = () => { setPlaying(false); setProg(0); if (listenStart.current !== null) { listenAccum.current += (Date.now() - listenStart.current) / 1000; listenStart.current = null } }

    a.addEventListener('timeupdate',     onTime)
    a.addEventListener('play',           onPlay)
    a.addEventListener('pause',          onPause)
    a.addEventListener('loadedmetadata', onDur)
    a.addEventListener('ended',          onEnd)

    return () => {
      a.removeEventListener('timeupdate',     onTime)
      a.removeEventListener('play',           onPlay)
      a.removeEventListener('pause',          onPause)
      a.removeEventListener('loadedmetadata', onDur)
      a.removeEventListener('ended',          onEnd)
      a.pause()
    }
  }, [])

  const play = useCallback((ep: Episode, show: Show, onPointsEarned?: () => void) => {
    const a = audioRef.current
    if (!a) return

    // Toggle same episode
    if (curEpGuid.current === ep.guid) {
      if (playing) a.pause()
      else a.play().catch(() => {})
      return
    }

    // New episode — flush remaining listen time for previous episode
    if (curEpGuid.current && listenAccum.current > reportedSecs.current) {
      const delta = Math.floor(listenAccum.current) - reportedSecs.current
      if (delta > 0) {
        fetch('/api/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'episode_listen', episode_guid: curEpGuid.current, show_id: curShowId.current, listen_seconds: delta }),
        }).catch(() => {})
      }
    }

    // Reset state for new episode
    a.src = ep.enclosure
    a.volume = vol
    listenAccum.current  = 0
    listenStart.current  = null
    pointsFired.current  = false
    reportedSecs.current = 0
    onPointsCb.current   = onPointsEarned || null
    curEpGuid.current    = ep.guid
    curShowId.current    = show.id

    setCur({ ep, show })
    setProg(0)
    setDur(0)
    a.play().catch(() => {})
  }, [playing, vol])

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a || !cur) return
    if (playing) a.pause()
    else a.play().catch(() => {})
  }, [cur, playing])

  const seek = useCallback((pct: number) => {
    const a = audioRef.current
    if (!a || !dur) return
    a.currentTime = pct * dur
  }, [dur])

  const skip = useCallback((secs: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, a.currentTime + secs)
  }, [])

  const setVolume = useCallback((v: number) => {
    setVol(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const close = useCallback(() => {
    const a = audioRef.current
    if (a) { a.pause(); a.src = '' }
    setCur(null); setPlaying(false); setProg(0); setDur(0)
    listenAccum.current  = 0
    listenStart.current  = null
    pointsFired.current  = false
    reportedSecs.current = 0
    curEpGuid.current    = null
    curShowId.current    = null
  }, [])

  return { cur, playing, prog, dur, vol, play, toggle, seek, skip, setVolume, close }
}
