import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SHOWS } from '@/lib/constants'

const SubmitSchema = z.object({
  show_id:  z.string().min(1).max(100),
  platform: z.enum(['apple', 'spotify']),
})

// POST — member submits a review (self-reported, pending admin approval)
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SubmitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { show_id, platform } = parsed.data

  const show = SHOWS.find(s => s.id === show_id)
  if (!show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })

  // Validate the platform URL exists for this show
  if (platform === 'apple' && !show.apple)    return NextResponse.json({ error: 'No Apple link for this show' }, { status: 400 })
  if (platform === 'spotify' && !show.spotify) return NextResponse.json({ error: 'No Spotify link for this show' }, { status: 400 })

  const serviceClient = createServiceClient()

  // Check for existing submission
  const { data: existing } = await serviceClient
    .from('review_submissions')
    .select('id, status')
    .eq('user_id', session.user.id)
    .eq('show_id', show_id)
    .eq('platform', platform)
    .single()

  if (existing) {
    return NextResponse.json({
      already_submitted: true,
      status: existing.status,
    })
  }

  // Insert pending review
  const { data, error } = await serviceClient
    .from('review_submissions')
    .insert({
      user_id:   session.user.id,
      show_id,
      show_name: show.name,
      platform,
      status:    'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, review: data }, { status: 201 })
}

// GET — fetch current user's review submissions
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('review_submissions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
