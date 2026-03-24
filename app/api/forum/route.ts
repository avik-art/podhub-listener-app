import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const PostSchema = z.object({
  tag:   z.enum(['Suggestion', 'Feedback', 'Question']),
  title: z.string().min(3).max(200).trim(),
  body:  z.string().min(10).max(2000).trim(),
})

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const page  = Math.max(1, Number(request.nextUrl.searchParams.get('page')  || 1))
  const limit = Math.min(50, Number(request.nextUrl.searchParams.get('limit') || 20))
  const from  = (page - 1) * limit
  const to    = from + limit - 1

  const { data, error, count } = await supabase
    .from('forum_posts')
    .select(`
      id, tag, title, body, likes, is_pinned, created_at,
      profiles!author_id (id, name, avatar_id, profile_photo_url, designation)
    `, { count: 'exact' })
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    posts:      data || [],
    total:      count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check user is not banned
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, onboarding_complete')
    .eq('id', session.user.id)
    .single()

  if (profile?.is_banned)          return NextResponse.json({ error: 'Account suspended'   }, { status: 403 })
  if (!profile?.onboarding_complete) return NextResponse.json({ error: 'Complete onboarding' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('forum_posts')
    .insert({ author_id: session.user.id, ...parsed.data })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const postId = request.nextUrl.searchParams.get('id')
  if (!postId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Users can delete their own posts; admins can delete any
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()

  const serviceClient = createServiceClient()
  const query = serviceClient.from('forum_posts').delete().eq('id', postId)
  if (!profile?.is_admin) query.eq('author_id', session.user.id)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
