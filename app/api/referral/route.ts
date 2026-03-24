import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { awardPoints } from '@/lib/points'
import { POINTS } from '@/lib/constants'

// Called when a user lands with ?ref=CODE — logged in or not
export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ref_code, new_user_email } = body as Record<string, string>
  if (!ref_code || !new_user_email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Find the referrer by referral_code
  const { data: referrer } = await serviceClient
    .from('profiles')
    .select('id, email')
    .eq('referral_code', ref_code)
    .single()

  if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })

  // Don't allow self-referral
  if (referrer.email === new_user_email.toLowerCase()) {
    return NextResponse.json({ error: 'Self-referral not allowed' }, { status: 400 })
  }

  // Check if already credited for this email
  const { data: existing } = await serviceClient
    .from('referrals')
    .select('id, status')
    .eq('referrer_id', referrer.id)
    .eq('referred_email', new_user_email.toLowerCase())
    .single()

  if (existing?.status === 'credited') {
    return NextResponse.json({ already_credited: true })
  }

  // Find the new user's profile (they must have signed up)
  const { data: newUser } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('email', new_user_email.toLowerCase())
    .single()

  // Upsert the referral record
  await serviceClient
    .from('referrals')
    .upsert({
      referrer_id:    referrer.id,
      referred_email: new_user_email.toLowerCase(),
      referred_id:    newUser?.id || null,
      status:         newUser ? 'joined' : 'pending',
      points_awarded: false,
    })

  // Credit points if the new user has joined
  if (newUser && (!existing || existing.status === 'pending')) {
    await awardPoints(referrer.id, POINTS.REFERRAL, 'referral', {
      referred_email: new_user_email.toLowerCase(),
    })

    await serviceClient
      .from('referrals')
      .update({ status: 'credited', points_awarded: true, referred_id: newUser.id })
      .eq('referrer_id', referrer.id)
      .eq('referred_email', new_user_email.toLowerCase())

    // Tag the new user's profile with who referred them
    await serviceClient
      .from('profiles')
      .update({ referred_by: ref_code })
      .eq('id', newUser.id)
      .is('referred_by', null)  // only set once
  }

  return NextResponse.json({ ok: true, credited: !!newUser })
}

// GET — fetch referral stats for the current user
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  const [profileRes, referralsRes] = await Promise.all([
    serviceClient.from('profiles').select('referral_code').eq('id', session.user.id).single(),
    serviceClient.from('referrals').select('status, points_awarded, created_at').eq('referrer_id', session.user.id),
  ])

  const referrals  = referralsRes.data || []
  const totalSent  = referrals.length
  const totalJoined= referrals.filter(r => r.status !== 'pending').length
  const totalPts   = referrals.filter(r => r.points_awarded).length * POINTS.REFERRAL
  const refCode    = profileRes.data?.referral_code || ''
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://podhub.app'

  return NextResponse.json({
    ref_code:      refCode,
    ref_link:      `${appUrl}/login?ref=${refCode}`,
    total_invited: totalSent,
    total_joined:  totalJoined,
    total_points:  totalPts,
  })
}
