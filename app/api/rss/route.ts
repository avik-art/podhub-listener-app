import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchShowFeed } from '@/lib/rss'
import { SHOWS, RSS_CACHE_TTL_MS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const showId = request.nextUrl.searchParams.get('show')
  if (!showId) {
    return NextResponse.json({ error: 'Missing show parameter' }, { status: 400 })
  }

  const show = SHOWS.find(s => s.id === showId)
  if (!show) {
    return NextResponse.json({ error: 'Show not found' }, { status: 404 })
  }

  // Verify user is authenticated
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check DB cache first
  const serviceClient = createServiceClient()
  const { data: cached } = await serviceClient
    .from('rss_cache')
    .select('data, fetched_at')
    .eq('show_id', showId)
    .single()

  const now = Date.now()
  if (cached) {
    const age = now - new Date(cached.fetched_at).getTime()
    if (age < RSS_CACHE_TTL_MS) {
      // Cache hit — return immediately with cache headers
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=900', // 15 min browser cache
          'X-Cache': 'HIT',
        },
      })
    }
  }

  // Cache miss — fetch from RSS
  const feed = await fetchShowFeed(show.rssUrl, show.id)

  if (!feed || feed.episodes.length === 0) {
    // Return stale cache if fetch failed
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'STALE' },
      })
    }
    return NextResponse.json({ error: 'Could not fetch feed' }, { status: 502 })
  }

  // Write to DB cache (upsert)
  await serviceClient
    .from('rss_cache')
    .upsert({ show_id: showId, data: feed as unknown as Record<string, unknown>, fetched_at: new Date().toISOString() })

  return NextResponse.json(feed, {
    headers: {
      'Cache-Control': 'public, max-age=900',
      'X-Cache': 'MISS',
    },
  })
}
