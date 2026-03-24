-- ============================================================
-- PODHUB LISTENER APP — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor once.
-- ============================================================

-- Enable UUID extension (already on by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────────
-- Extends Supabase auth.users (one row per user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT UNIQUE NOT NULL,
  name                TEXT,
  designation         TEXT,
  country             TEXT,
  country_flag        TEXT,
  gender              TEXT,
  age_range           TEXT,
  avatar_id           TEXT,
  profile_photo_url   TEXT,
  is_admin            BOOLEAN NOT NULL DEFAULT false,
  is_podcaster        BOOLEAN NOT NULL DEFAULT false,
  is_guest            BOOLEAN NOT NULL DEFAULT false,
  is_banned           BOOLEAN NOT NULL DEFAULT false,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  disclaimer_agreed   BOOLEAN NOT NULL DEFAULT false,
  payout_method       TEXT,
  payout_details      TEXT,
  referral_code       TEXT UNIQUE,
  referred_by         TEXT,              -- referral_code of the person who referred them
  points              INTEGER NOT NULL DEFAULT 0,
  monthly_points      INTEGER NOT NULL DEFAULT 0,
  streak_days         INTEGER NOT NULL DEFAULT 0,
  last_listen_date    DATE,
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── POINT TRANSACTIONS (audit log) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,           -- positive = earn, negative = deduct
  reason      TEXT NOT NULL,              -- 'episode_listen' | 'social_follow' | 'referral' | 'review' | 'streak_bonus' | 'welcome'
  metadata    JSONB,                      -- e.g. { episode_guid, show_id, platform }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EPISODE LISTENS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.episode_listens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  episode_guid    TEXT NOT NULL,
  show_id         TEXT NOT NULL,
  listen_seconds  INTEGER NOT NULL DEFAULT 0,   -- tracked seconds
  points_awarded  BOOLEAN NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, episode_guid)
);

-- ── SOCIAL FOLLOWS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_follows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,              -- 'youtube' | 'instagram' | etc
  verified    BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- ── REFERRALS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_email  TEXT NOT NULL,
  referred_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'joined' | 'credited'
  points_awarded  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── REVIEW SUBMISSIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_submissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id     TEXT NOT NULL,
  show_name   TEXT NOT NULL,
  platform    TEXT NOT NULL,              -- 'apple' | 'spotify'
  status      TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ,
  reviewed_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id, show_id, platform)
);

-- ── FORUM POSTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL DEFAULT 'Suggestion',  -- 'Suggestion' | 'Feedback' | 'Question' | 'Update'
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  likes       INTEGER NOT NULL DEFAULT 0,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ADMIN UPDATES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_updates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RSS CACHE ─────────────────────────────────────────────────────
-- Server-side cache for RSS feeds (avoids hitting proxy on every request)
CREATE TABLE IF NOT EXISTS public.rss_cache (
  show_id     TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES (critical for 100K+ users)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email          ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code  ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_monthly_points ON public.profiles(monthly_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned      ON public.profiles(is_banned);

CREATE INDEX IF NOT EXISTS idx_point_tx_user_id        ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_created_at     ON public.point_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_episode_listens_user    ON public.episode_listens(user_id);
CREATE INDEX IF NOT EXISTS idx_episode_listens_show    ON public.episode_listens(show_id);

CREATE INDEX IF NOT EXISTS idx_social_follows_user     ON public.social_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer      ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_review_sub_user         ON public.review_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_sub_status       ON public.review_submissions(status);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created     ON public.forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rss_cache_fetched       ON public.rss_cache(fetched_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — all tables protected
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_listens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_follows      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_updates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_cache           ENABLE ROW LEVEL SECURITY;

-- ── PROFILES policies ────────────────────────────────────────────
-- Members can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Members can update their own profile (except admin flags)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = false);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Leaderboard: anyone authenticated can see non-banned members (name, points, streak)
CREATE POLICY "profiles_leaderboard" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_banned = false);

-- ── POINT TRANSACTIONS policies ──────────────────────────────────
CREATE POLICY "point_tx_select_own" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "point_tx_insert_own" ON public.point_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "point_tx_admin" ON public.point_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── EPISODE LISTENS policies ─────────────────────────────────────
CREATE POLICY "ep_listens_own" ON public.episode_listens
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── SOCIAL FOLLOWS policies ──────────────────────────────────────
CREATE POLICY "social_follows_own" ON public.social_follows
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── REFERRALS policies ───────────────────────────────────────────
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "referrals_insert" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "referrals_admin" ON public.referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── REVIEW SUBMISSIONS policies ──────────────────────────────────
CREATE POLICY "reviews_own" ON public.review_submissions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_admin" ON public.review_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── FORUM POSTS policies ─────────────────────────────────────────
CREATE POLICY "forum_select_all" ON public.forum_posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "forum_insert_own" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "forum_delete_own_or_admin" ON public.forum_posts
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── ADMIN UPDATES policies ───────────────────────────────────────
CREATE POLICY "updates_select_all" ON public.admin_updates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "updates_admin_only" ON public.admin_updates
  FOR INSERT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── RSS CACHE policies ───────────────────────────────────────────
-- Anyone authenticated can read the cache
CREATE POLICY "rss_cache_select" ON public.rss_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only service role can write (our API routes use service_role key)
-- No INSERT/UPDATE policy needed for anon/user — only service role bypasses RLS

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile when user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
BEGIN
  -- Generate unique referral code
  ref_code := 'PHB' || UPPER(SUBSTRING(MD5(NEW.id::TEXT), 1, 6));

  INSERT INTO public.profiles (id, email, referral_code)
  VALUES (NEW.id, NEW.email, ref_code)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Monthly points reset (run via Supabase cron or pg_cron)
-- Schedule: 0 0 1 * * (1st of every month)
CREATE OR REPLACE FUNCTION public.reset_monthly_points()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET monthly_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INITIAL ADMIN SETUP
-- NOTE: After creating your Supabase account and logging in,
-- run this to make avik@podhealth.club an admin:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'avik@podhealth.club';
-- ============================================================
