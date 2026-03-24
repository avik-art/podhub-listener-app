import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const UpdateSchema = z.object({
  name:              z.string().min(1).max(100).optional(),
  designation:       z.string().max(100).optional(),
  country:           z.string().max(60).optional(),
  country_flag:      z.string().max(10).optional(),
  gender:            z.string().max(30).optional(),
  age_range:         z.string().max(20).optional(),
  avatar_id:         z.string().max(30).optional(),
  profile_photo_url: z.string().url().max(500).optional().nullable(),
  payout_method:     z.string().max(30).optional().nullable(),
  payout_details:    z.string().max(200).optional().nullable(),
  onboarding_complete: z.boolean().optional(),
  disclaimer_agreed:   z.boolean().optional(),
  is_podcaster:        z.boolean().optional(),
  is_guest:            z.boolean().optional(),
})

export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Use service client for update (user can update their own profile)
  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('profiles')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', session.user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Award welcome points on first onboarding completion
  if (parsed.data.onboarding_complete === true) {
    const { awardPoints } = await import('@/lib/points')
    await awardPoints(session.user.id, 50, 'welcome')
  }

  return NextResponse.json(data)
}
