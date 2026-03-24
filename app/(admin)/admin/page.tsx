'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminOverview() {
  const { data: membersData } = useSWR('/api/admin/members?limit=1', fetcher)
  const { data: reviewsData } = useSWR('/api/admin/reviews?status=pending', fetcher)
  const total   = membersData?.total   || 0
  const pending = reviewsData?.length  || 0

  const stats = [
    { lbl: 'Total Members',   val: total,   c: 'var(--gold2)'  },
    { lbl: 'Total Shows',     val: 22,      c: 'var(--blue)'   },
    { lbl: 'Pending Reviews', val: pending, c: 'var(--pink)'   },
    { lbl: 'Platform',        val: 'Live',  c: 'var(--green)'  },
  ]

  return (
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Overview</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>Platform health at a glance.</div>
      <div className="analytics-grid" style={{ marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.lbl} className="analytics-card">
            <div className="analytics-val" style={{ color: s.c }}>{s.val}</div>
            <div className="analytics-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 12 }}>Quick Links</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[['Members', '/admin/members'], ['Pending Reviews', '/admin/reviews'], ['Post Update', '/admin/updates'], ['Winners', '/admin/winners']].map(([l, p]) => (
            <a key={l} href={p} style={{ padding: '7px 14px', borderRadius: '100px', background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--gold2)', fontSize: 12, textDecoration: 'none', transition: 'all .2s' }}>{l}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
