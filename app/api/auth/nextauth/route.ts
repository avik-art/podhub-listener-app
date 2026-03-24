import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { createServiceClient } from '@/lib/supabase/server'

export const authOptions: NextAuthOptions = {
  providers: [
    // Magic-link email — no password required
    EmailProvider({
      server: {
        host:   process.env.EMAIL_SERVER_HOST   || 'smtp.resend.com',
        port:   Number(process.env.EMAIL_SERVER_PORT) || 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER   || 'resend',
          pass: process.env.EMAIL_SERVER_PASSWORD || '',
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@podhealth.club',
    }),
    // Google OAuth (optional — requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)
    ...(process.env.GOOGLE_CLIENT_ID ? [
      GoogleProvider({
        clientId:     process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      })
    ] : []),
  ],

  callbacks: {
    async signIn({ user }) {
      // Ensure profile exists in our DB when user signs in
      if (!user.email) return false
      const supabase = createServiceClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_banned')
        .eq('email', user.email.toLowerCase())
        .single()
      // Block banned users
      if (profile?.is_banned) return false
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const supabase = createServiceClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, is_admin, onboarding_complete, is_banned')
          .eq('email', session.user.email.toLowerCase())
          .single()
        if (profile) {
          ;(session.user as Record<string, unknown>).id               = profile.id
          ;(session.user as Record<string, unknown>).isAdmin          = profile.is_admin
          ;(session.user as Record<string, unknown>).onboardingDone   = profile.onboarding_complete
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) token.email = user.email
      return token
    },
  },

  pages: {
    signIn:  '/login',
    error:   '/login',
    verifyRequest: '/login?verify=1',
  },

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: process.env.NEXTAUTH_SECRET!,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
