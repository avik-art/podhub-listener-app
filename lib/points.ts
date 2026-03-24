import { createServiceClient } from './supabase/server'
import { POINTS } from './constants'

/** Award points to a user — writes to both profiles and point_transactions */
export async function awardPoints(
  userId:   string,
  amount:   number,
  reason:   string,
  metadata?: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient()

  // Use a transaction-like approach: update profile + insert tx in sequence
  // (Supabase doesn't support client-side transactions; use a DB function for strict atomicity)
  const { error: txError } = await supabase
    .from('point_transactions')
    .insert({ user_id: userId, amount, reason, metadata: metadata ?? null })

  if (txError) return { ok: false, error: txError.message }

  const { error: profileError } = await supabase.rpc('increment_points', {
    p_user_id: userId,
    p_amount:  amount,
  })

  // Fallback if RPC not set up: manual update
  if (profileError) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points, monthly_points')
      .eq('id', userId)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          points:        (profile.points || 0) + amount,
          monthly_points:(profile.monthly_points || 0) + amount,
        })
        .eq('id', userId)
    }
  }

  return { ok: true }
}

/** Check + award streak bonus when a user listens */
export async function checkStreak(userId: string): Promise<void> {
  const supabase = createServiceClient()
  const today    = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_days, last_listen_date')
    .eq('id', userId)
    .single()

  if (!profile) return

  const last      = profile.last_listen_date
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let newStreak = profile.streak_days || 0

  if (last === today) return                    // already counted today
  if (last === yesterday) newStreak += 1        // consecutive day
  else newStreak = 1                            // streak broken

  await supabase
    .from('profiles')
    .update({ streak_days: newStreak, last_listen_date: today })
    .eq('id', userId)

  // Award streak milestone bonuses
  const bonuses: Record<number, number> = {
    7:  POINTS.STREAK_7,
    14: POINTS.STREAK_14,
    21: POINTS.STREAK_21,
    30: POINTS.STREAK_30,
  }
  if (bonuses[newStreak]) {
    await awardPoints(userId, bonuses[newStreak], `streak_bonus`, { streak_days: newStreak })
  }
}
