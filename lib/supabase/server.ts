import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string)            { return cookieStore.get(name)?.value },
        set(name, value, options)    { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name, options)        { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )
}

/** Service role client — bypasses RLS, use ONLY in secure API routes */
export function createServiceClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string)            { return cookieStore.get(name)?.value },
        set(name, value, options)    { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name, options)        { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
      auth: { persistSession: false },
    }
  )
}
