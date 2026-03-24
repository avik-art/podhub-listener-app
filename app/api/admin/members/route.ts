import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
  return data?.is_admin ? session : null
}

const ActionSchema = z.object({
  user_id: z.string().uuid(),
  action:  z.enum(['ban', 'unban', 'delete', 'set_admin']),
})

// GET — list all members (paginated)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const session  = await requireAdmin(supabase)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const page   = Math.max(1, Number(request.nextUrl.searchParams.get('page')  || 1))
  const limit  = Math.min(100, Number(request.nextUrl.searchParams.get('limit') || 50))
  const search = request.nextUrl.searchParams.get('q') || ''
  const filter = request.nextUrl.searchParams.get('filter') || 'all'
  const from   = (page - 1) * limit
  const to     = from + limit - 1

  const serviceClient = createServiceClient()
  let query = serviceClient
    .from('profiles')
    .select('id, email, name, designation, country, country_flag, avatar_id, profile_photo_url, is_admin, is_banned, is_podcaster, onboarding_complete, monthly_points, points, streak_days, referral_code, payout_method, joined_at', { count: 'exact' })
    .order('joined_at', { ascending: false })
    .range(from, to)

  if (search) query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  if (filter === 'banned') query = query.eq('is_banned', true)
  if (filter === 'active') query = query.eq('is_banned', false)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ members: data || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) })
}

// POST — ban / unban / delete
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

  const { user_id, action } = parsed.data
  const serviceClient = createServiceClient()

  switch (action) {
    case 'ban':
      await serviceClient.from('profiles').update({ is_banned: true }).eq('id', user_id)
      return NextResponse.json({ ok: true, action: 'banned' })

    case 'unban':
      await serviceClient.from('profiles').update({ is_banned: false }).eq('id', user_id)
      return NextResponse.json({ ok: true, action: 'unbanned' })

    case 'delete':
      // This cascades to all related rows via ON DELETE CASCADE
      await serviceClient.from('profiles').delete().eq('id', user_id)
      return NextResponse.json({ ok: true, action: 'deleted' })

    case 'set_admin':
      await serviceClient.from('profiles').update({ is_admin: true }).eq('id', user_id)
      return NextResponse.json({ ok: true, action: 'admin_set' })

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
