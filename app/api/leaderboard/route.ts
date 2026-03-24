import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const page  = Math.max(1, Number(request.nextUrl.searchParams.get('page')  || 1))
  const limit = Math.min(50, Number(request.nextUrl.searchParams.get('limit') || 20))
  const from  = (page - 1) * limit
  const to    = from + limit - 1

  // Only real, non-banned, onboarded members — sorted by monthly_points
  const { data, error, count } = await supabase
    .from('profiles')
    .select('id, name, designation, country, country_flag, avatar_id, profile_photo_url, monthly_points, points, streak_days, is_podcaster, joined_at', { count: 'exact' })
    .eq('is_banned', false)
    .eq('onboarding_complete', true)
    .eq('is_admin', false)
    .order('monthly_points', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    members:    data || [],
    total:      count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  })
}
