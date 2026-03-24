import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { awardPoints } from '@/lib/points'
import { POINTS } from '@/lib/constants'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
  return data?.is_admin ? session : null
}

const ActionSchema = z.object({
  review_id: z.string().uuid(),
  action:    z.enum(['approve', 'reject']),
})

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const session  = await requireAdmin(supabase)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = request.nextUrl.searchParams.get('status') || 'pending'
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from('review_submissions')
    .select(`
      *,
      profiles!user_id (name, email, avatar_id)
    `)
    .eq('status', status)
    .order('submitted_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const session  = await requireAdmin(supabase)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ActionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { review_id, action } = parsed.data
  const serviceClient = createServiceClient()

  const { data: review } = await serviceClient
    .from('review_submissions')
    .select('*')
    .eq('id', review_id)
    .single()

  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  if (review.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 409 })

  await serviceClient
    .from('review_submissions')
    .update({ status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: session.user.id })
    .eq('id', review_id)

  if (action === 'approve') {
    await awardPoints(review.user_id, POINTS.REVIEW, 'review', {
      show_id: review.show_id, platform: review.platform,
    })
  }

  return NextResponse.json({ ok: true, action })
}
