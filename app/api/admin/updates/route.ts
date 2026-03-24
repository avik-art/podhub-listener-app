import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
  return data?.is_admin ? session : null
}

const UpdateSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  body:  z.string().min(10).max(5000).trim(),
})

export async function GET() {
  const supabase = createClient()
  const session  = await requireAdmin(supabase)
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('admin_updates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

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

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const serviceClient = createServiceClient()

  // Save to admin_updates
  const { data: update, error: updateError } = await serviceClient
    .from('admin_updates')
    .insert({ author_id: session.user.id, ...parsed.data })
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Also pin it as a forum post so members see it
  await serviceClient.from('forum_posts').insert({
    author_id: session.user.id,
    tag:       'Update',
    title:     parsed.data.title,
    body:      parsed.data.body,
    is_pinned: true,
  })

  return NextResponse.json(update, { status: 201 })
}
