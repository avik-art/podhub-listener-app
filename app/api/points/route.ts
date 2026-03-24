import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { awardPoints, checkStreak } from '@/lib/points'
import { POINTS, MIN_LISTEN_SECS } from '@/lib/constants'

const EpisodeSchema = z.object({
  action:        z.literal('episode_listen'),
  episode_guid:  z.string().min(1).max(500),
  show_id:       z.string().min(1).max(100),
  listen_seconds:z.number().int().min(0).max(7200),
})

const SocialSchema = z.object({
  action:   z.literal('social_follow'),
  platform: z.string().min(1).max(50),
})

const BodySchema = z.discriminatedUnion('action', [EpisodeSchema, SocialSchema])

export async function POST(request: NextRequest) {
  // Verify auth
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Parse + validate body
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const serviceClient = createServiceClient()

  // ── Episode listen ───────────────────────────────────────────
  if (parsed.data.action === 'episode_listen') {
    const { episode_guid, show_id, listen_seconds } = parsed.data

    // Upsert the listen record
    const { data: existing } = await serviceClient
      .from('episode_listens')
      .select('listen_seconds, points_awarded')
      .eq('user_id', userId)
      .eq('episode_guid', episode_guid)
      .single()

    const newTotal = (existing?.listen_seconds || 0) + listen_seconds
    const alreadyAwarded = existing?.points_awarded || false

    await serviceClient
      .from('episode_listens')
      .upsert({
        user_id:        userId,
        episode_guid,
        show_id,
        listen_seconds: newTotal,
        points_awarded: alreadyAwarded,
      })

    // Award points once >= MIN_LISTEN_SECS
    if (newTotal >= MIN_LISTEN_SECS && !alreadyAwarded) {
      await awardPoints(userId, POINTS.EPISODE, 'episode_listen', { episode_guid, show_id })
      await checkStreak(userId)

      // Mark as awarded
      await serviceClient
        .from('episode_listens')
        .update({ points_awarded: true, completed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('episode_guid', episode_guid)

      return NextResponse.json({ awarded: true, points: POINTS.EPISODE })
    }

    return NextResponse.json({ awarded: false, listened: newTotal, needed: MIN_LISTEN_SECS })
  }

  // ── Social follow ────────────────────────────────────────────
  if (parsed.data.action === 'social_follow') {
    const { platform } = parsed.data

    // Check if already verified
    const { data: existing } = await serviceClient
      .from('social_follows')
      .select('verified')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single()

    if (existing?.verified) {
      return NextResponse.json({ already_credited: true })
    }

    await serviceClient
      .from('social_follows')
      .upsert({ user_id: userId, platform, verified: true, verified_at: new Date().toISOString() })

    await awardPoints(userId, POINTS.SOCIAL, 'social_follow', { platform })

    return NextResponse.json({ awarded: true, points: POINTS.SOCIAL })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
