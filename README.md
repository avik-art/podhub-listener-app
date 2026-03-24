# Podhub Listener App — Production

**Next.js 14 + Supabase + Vercel**

Full-stack production platform for the Healthy Mind by Avik™ podcast network.

---

## DEPLOY IN 30 MINUTES

### Step 1 — Set up Supabase (database)

1. Go to **supabase.com** → Create account → New Project
2. Choose a name (e.g. `podhub`), set a strong password, pick region closest to your audience (Mumbai for India)
3. Wait ~2 minutes for the project to spin up
4. Go to **SQL Editor** → paste the entire contents of `supabase/schema.sql` → click Run
5. After it succeeds, run this one line to make yourself admin:

```sql
UPDATE profiles SET is_admin = true WHERE email = 'avik@podhealth.club';
```

6. Go to **Settings → API** and copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → this is `SUPABASE_SERVICE_ROLE_KEY`

7. Go to **Authentication → Providers → Email** → make sure it's enabled
8. Go to **Authentication → URL Configuration** → set Site URL to `https://yourdomain.com`

### Step 2 — Add your logos

Replace the placeholder files in `/public/` with your real logos:

- `public/podhub-logo.png` — the PodHub gold logo (any size, will be displayed at ~140×40px)
- `public/hma-logo.png` — the Healthy Mind by Avik logo (any size, displayed at ~200×52px)

### Step 3 — Push to GitHub

```bash
# In the project folder
git init
git add .
git commit -m "Initial production deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/podhub-listener-app.git
git push -u origin main
```

### Step 4 — Deploy to Vercel

1. Go to **vercel.com** → Add New → Project
2. Import your GitHub repository
3. Framework is auto-detected as **Next.js**
4. Leave build settings as default (`npm run build`, output `dist`)
5. Click **Environment Variables** and add ALL of these:

```
NEXT_PUBLIC_SUPABASE_URL         = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    = eyJhbGciOiJI... (your anon key)
SUPABASE_SERVICE_ROLE_KEY        = eyJhbGciOiJI... (your service role key — KEEP SECRET)
NEXTAUTH_SECRET                  = (run: openssl rand -base64 32)
NEXTAUTH_URL                     = https://yourdomain.com
NEXT_PUBLIC_APP_URL              = https://yourdomain.com
ADMIN_EMAIL                      = avik@podhealth.club
```

6. Click **Deploy**

### Step 5 — Connect your domain

1. In Vercel → your project → **Domains**
2. Add your domain (e.g. `listeners.podhealth.club`)
3. Vercel gives you DNS records — add them in your domain registrar (GoDaddy, Namecheap, Cloudflare etc)
4. Wait up to 24 hours for DNS propagation (usually 5 minutes with Cloudflare)

### Step 6 — Enable Google OAuth (optional)

1. Go to **console.developers.google.com** → Create Project
2. APIs & Services → Credentials → Create OAuth 2.0 Client
3. Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase → Authentication → Providers → Google
5. Also add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel env vars

### Step 7 — Test before going live

Run through this checklist:

- [ ] Visit `https://yourdomain.com/login` — login page loads
- [ ] Enter your email — magic link arrives in inbox
- [ ] Click magic link — lands on onboarding
- [ ] Complete onboarding — 50 welcome points credited
- [ ] Browse shows — RSS feeds load with episodes
- [ ] Play an episode for 5+ minutes — +10 points awarded
- [ ] Visit `https://yourdomain.com/admin/login` — admin login works
- [ ] Admin portal loads — member list, reviews tab visible
- [ ] Ban a test member — confirm they can't log in

---

## WHAT EACH FILE DOES

```
supabase/schema.sql     Complete database — run this ONCE in Supabase SQL Editor
middleware.ts           Edge-level route protection (runs before every request)
.env.example            Template for all environment variables

app/
  layout.tsx            Root HTML, fonts, metadata
  page.tsx              Redirects / → /login
  (auth)/login          Magic link + Google login
  (auth)/onboarding     6-step profile setup
  (member)/app/         Member portal — shows, episodes, leaderboard, community, forum, profile
  (admin)/admin/        Admin portal — overview, members, reviews, updates, winners
  api/rss               Server-side RSS with 15-min DB cache
  api/points            Validates + credits episode/social points
  api/leaderboard       Paginated real members, no fake data
  api/forum             CRUD forum posts, banned users blocked
  api/referral          Track + credit referral joins
  api/reviews           Submit review reward requests
  api/admin/*           Admin-only: manage members, approve reviews, post updates

lib/
  constants.ts          All 22 shows, points values, socials, badges
  rss.ts                Server RSS parser (works in Node.js, not browser-only)
  points.ts             Atomic points engine — writes to DB
  supabase/client.ts    Browser Supabase client
  supabase/server.ts    Server + service role Supabase clients
  supabase/types.ts     Full TypeScript types for every table

hooks/
  usePlayer.ts          Audio player — reports listen seconds to API every 30s
  useToast.ts           Toast notification state

public/
  podhub-logo.png       REPLACE with your real logo
  hma-logo.png          REPLACE with your real logo
```

---

## HONEST SCALE ASSESSMENT

### What handles 100K users safely

- **Supabase Postgres** — built on PostgreSQL, scales to millions of rows with proper indexing (all indexes are in schema.sql)
- **Vercel Edge** — Next.js API routes run at the edge globally, cold starts under 100ms
- **Leaderboard** — paginated 20 at a time, not loading all users
- **RSS cache** — server-side DB cache prevents hammering external feeds
- **Auth** — Supabase handles millions of auth users on its infrastructure

### What needs upgrading past 100K

| Concern | Current | Upgrade path |
|---|---|---|
| **Monthly points reset** | Manual SQL | Add `pg_cron` in Supabase (`0 0 1 * * SELECT reset_monthly_points()`) |
| **Points atomicity** | Two-step update | Add `increment_points` RPC function in Supabase (prevents race condition at high concurrency) |
| **Badge calculation** | Client-side only | Move to DB trigger or scheduled function |
| **Profile photos** | External URL only | Add Supabase Storage for direct uploads |
| **Email notifications** | Not implemented | Add Resend.com for winner announcements, weekly digests |
| **Real Google/Apple OAuth** | Magic links only | Already wired — just add credentials in Supabase dashboard |

### What will never work at scale (honest)

- **Review verification** — Apple/Spotify have no public API for this. Honor-based self-report + admin approval is the industry standard. No technical upgrade path until the platforms open their APIs.
- **Show image hosting** — RSS artwork URLs come from Captivate/external hosts. If those go down, artwork disappears. Fix: use Supabase Storage to cache artwork on first fetch.

### Vercel Free tier limits

- 100GB bandwidth/month — plenty for 10K active users
- 6,000 serverless function invocations/day — sufficient for small launch
- Upgrade to Vercel Pro ($20/month) before you hit 1,000 daily active users

---

## ADMIN PORTAL

URL: `https://yourdomain.com/admin/login`

This URL is **not linked anywhere** in the member portal. Only you know it.

Credentials: your Supabase user account (avik@podhealth.club) with `is_admin = true`

---

## MONTHLY LEADERBOARD RESET

To reset monthly points on the 1st of each month, run this in Supabase SQL Editor:

```sql
SELECT reset_monthly_points();
```

To automate it, enable `pg_cron` in Supabase and add:

```sql
SELECT cron.schedule('reset-monthly-points', '0 0 1 * *', 'SELECT reset_monthly_points()');
```

---

## SUPPORT

This platform was built for Healthy Mind by Avik™.  
Stack: Next.js 14 · Supabase · Vercel · TypeScript  
Deploy time: ~30 minutes  
