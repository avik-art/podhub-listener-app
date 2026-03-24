'use client'
import useSWR from 'swr'
import { useMember } from '../layout'
import { REWARDS, RANK_NAMES } from '@/lib/constants'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function initials(n: string) {
  return (n || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function LeaderboardPage() {
  const { profile } = useMember()
  const { data, isLoading } = useSWR('/api/leaderboard?limit=20', fetcher, {
    refreshInterval: 60000,
  })

  const members = data?.members || []
  const top3    = members.slice(0, 3)
  const daysLeft = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate() - new Date().getDate()

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <div className="page-title">Monthly Leaderboard</div>
          <div className="page-sub">Resets in {daysLeft} days. Top 3 win real cash.</div>
        </div>
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border2)', borderRadius: 13, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 7, letterSpacing: '.07em', textTransform: 'uppercase' }}>Monthly Prizes</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {([['🥇', `$${REWARDS.first.usd}`], ['🥈', `$${REWARDS.second.usd}`], ['🥉', `$${REWARDS.third.usd}`]] as [string, string][]).map(([m, p]) => (
              <div key={p} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14 }}>{m}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 700, background: 'var(--goldgrad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{p}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <div className="loader-wrap"><div className="spinner" /></div>}

      {/* Empty state */}
      {!isLoading && members.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Leaderboard is empty</div>
          <div style={{ fontSize: 12 }}>Be the first to earn points and claim the top spot.</div>
        </div>
      )}

      {/* Podium */}
      {top3.length > 0 && (
        <div className="podium-wrap">
          <div className="podium-row">
            {top3[1] && (
              <div className="p-slot p2">
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--navy3)', border: '2px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 22 }}>
                  {top3[1].profile_photo_url
                    ? <img src={top3[1].profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : initials(top3[1].name || '')}
                </div>
                <div style={{ fontSize: 16 }}>🥈</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 80, textAlign: 'center', marginTop: 3 }}>{top3[1].name?.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{top3[1].monthly_points} pts</div>
                <div className="p-base" />
              </div>
            )}
            {top3[0] && (
              <div className="p-slot p1">
                <div className="p-crown-ico">👑</div>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--gold)', background: 'var(--navy3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 28, overflow: 'hidden' }}>
                  {top3[0].profile_photo_url
                    ? <img src={top3[0].profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(top3[0].name || '')}
                </div>
                <div style={{ fontSize: 20 }}>🥇</div>
                <div style={{ fontSize: 12, fontWeight: 600, maxWidth: 90, textAlign: 'center', marginTop: 3 }}>{top3[0].name?.split(' ')[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--gold2)', fontWeight: 600 }}>{top3[0].monthly_points} pts</div>
                <div className="p-base" />
              </div>
            )}
            {top3[2] && (
              <div className="p-slot p3">
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--navy3)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 18 }}>
                  {top3[2].profile_photo_url
                    ? <img src={top3[2].profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : initials(top3[2].name || '')}
                </div>
                <div style={{ fontSize: 14 }}>🥉</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 70, textAlign: 'center', marginTop: 3 }}>{top3[2].name?.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{top3[2].monthly_points} pts</div>
                <div className="p-base" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full ranked list */}
      {members.length > 0 && (
        <div className="lb-list">
          <div className="lb-hdr-row">Top Members This Month</div>
          {members.slice(0, 10).map((m: Record<string, unknown>, i: number) => {
            const isMe   = m.id === profile?.id
            const prizes = ['$100', '$50', '$30']
            return (
              <div key={m.id as string} className={`lb-row${isMe ? ' me' : ''}`} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="lb-rank-num">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--serif)', flexShrink: 0, overflow: 'hidden' }}>
                  {(m.profile_photo_url as string)
                    ? <img src={m.profile_photo_url as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(m.name as string || '')}
                </div>
                <div className="lb-info">
                  <div className="lb-member-name">{m.name as string}{isMe ? ' (You)' : ''}</div>
                  <div className="lb-member-meta">
                    {m.country_flag as string || '🌍'} {m.country as string || ''} &nbsp;🔥 {m.streak_days as number || 0} days
                    {RANK_NAMES[i] && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--gold3)' }}>{RANK_NAMES[i]}</span>}
                  </div>
                </div>
                <div>
                  <div className="lb-pts-val">{m.monthly_points as number || 0}</div>
                  {i < 3 && <div className="lb-prize-lbl">{prizes[i]}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
