// ── Points ────────────────────────────────────────────────────────
export const POINTS = {
  WELCOME:       50,
  EPISODE:       10,   // awarded after MIN_LISTEN_SECS
  SOCIAL:         5,
  REFERRAL:      30,
  REVIEW:       500,
  STREAK_7:      50,
  STREAK_14:    100,
  STREAK_21:    150,
  STREAK_30:    200,
} as const

export const MIN_LISTEN_SECS = 300  // 5 minutes

// ── Rewards ───────────────────────────────────────────────────────
export const REWARDS = {
  first:  { usd: 100, inr: 8300 },
  second: { usd: 50,  inr: 4150 },
  third:  { usd: 30,  inr: 2500 },
} as const

// ── RSS ───────────────────────────────────────────────────────────
export const RSS_CACHE_TTL_MS = 15 * 60 * 1000   // 15 minutes server-side
export const RSS_MAX_EPISODES = 200               // fetch up to 200 per show

// ── Shows ─────────────────────────────────────────────────────────
export interface Show {
  id:       string
  name:     string
  category: string
  rssUrl:   string
  color:    string
  apple?:   string
  spotify?: string
}

export const SHOWS: Show[] = [
  { id:'healthy-mind-healthy-life', name:'Healthy Mind Healthy Life',    category:'Mental Wellness',      rssUrl:'https://www.podhealth.club/feed.xml',                    color:'#4DCFB4' },
  { id:'the-mindful-living',        name:'The Mindful Living',           category:'Mental Wellness',      rssUrl:'https://feeds.captivate.fm/the-mindful-living/',          color:'#5EC9C4', apple:'https://podcasts.apple.com/us/podcast/the-mindful-living/id1762314749',  spotify:'https://open.spotify.com/show/36JojhDCJaqtm6SdOdT5UB' },
  { id:'the-mindful-journey',       name:'The Mindful Journey',          category:'Mental Wellness',      rssUrl:'https://feeds.captivate.fm/the-mindful-journey/',         color:'#7EC5BE', apple:'https://podcasts.apple.com/us/podcast/the-mindful-journey/id1775726562',   spotify:'https://open.spotify.com/show/6aWKf6MxMdr2HKJMAadjpM' },
  { id:'healing-horizons',          name:'Healing Horizons',             category:'Mental Wellness',      rssUrl:'https://feeds.captivate.fm/healing-horizons/',            color:'#E8A860', apple:'https://podcasts.apple.com/us/podcast/healing-horizons/id1810962473',        spotify:'https://open.spotify.com/show/5JG9BfX3DzLBD0rSicobKk' },
  { id:'inner-peace-better-health', name:'Inner Peace Better Health',    category:'Mental Wellness',      rssUrl:'https://feeds.captivate.fm/inner-peace-better/',          color:'#A8D8C0', apple:'https://podcasts.apple.com/us/podcast/inner-peace-better-health/id1781503831', spotify:'https://open.spotify.com/show/6C9VHf8G0RixkoyyFOqcjp' },
  { id:'healing-mindset',           name:'Healing Mindset',              category:'Mental Wellness',      rssUrl:'https://feeds.captivate.fm/healing-mindset/',             color:'#B0C8E8', apple:'https://podcasts.apple.com/us/podcast/healing-mindset/id1818081709',         spotify:'https://open.spotify.com/show/4f5bGPzdhWydHYvhRvp1Kf' },
  { id:'wellness-reimagined',       name:'Wellness Reimagined',          category:'Mental Wellness',      rssUrl:'https://feeds.captivate.fm/wellness-reimagined/',         color:'#E8C8A8', apple:'https://podcasts.apple.com/us/podcast/wellness-reimagined/id1831347920',      spotify:'https://open.spotify.com/show/4jq8Ul0ce99Zh9iHpFsQUM' },
  { id:'mind-over-matter',          name:'Mind Over Matter',             category:'Mental Wellness',      rssUrl:'https://feeds.captivate.fm/mind-over-matter-show/',       color:'#B8D8A8', apple:'https://podcasts.apple.com/us/podcast/mind-over-matter/id1775744614',         spotify:'https://open.spotify.com/show/69Sfsnt7Pk36Wv5rX8YotQ' },
  { id:'bizblend',                  name:'BizBlend',                     category:'Business & Leadership',rssUrl:'https://feeds.captivate.fm/bizblend/',                    color:'#C9A227', apple:'https://podcasts.apple.com/us/podcast/bizblend/id1729431564',               spotify:'https://open.spotify.com/show/3JFHtC4vzryVcjep0vT8Y5' },
  { id:'podhub-celebrity',          name:'PodHub Celebrity Podcast',     category:'Business & Leadership',rssUrl:'https://api.riverside.fm/hosting/esvMPH64.rss',           color:'#E8D080' },
  { id:'mind-meets-machine',        name:'Mind Meets Machine',           category:'AI & Technology',      rssUrl:'https://feeds.captivate.fm/mind-meets-machine/',          color:'#6B9FD4', spotify:'https://open.spotify.com/show/3kHUXNy7iJBDqfqBOp584W' },
  { id:'aibiz',                     name:'AiBiz',                        category:'AI & Technology',      rssUrl:'https://feeds.captivate.fm/aibiz/',                       color:'#90D0E8', apple:'https://podcasts.apple.com/us/podcast/aibiz/id1802223068' },
  { id:'mind-over-masculinity',     name:'Mind Over Masculinity',        category:"Men's Mental Health",  rssUrl:'https://feeds.captivate.fm/mind-over-masculinity/',       color:'#8B7FD4', apple:'https://podcasts.apple.com/us/podcast/mind-over-masculinity/id1786782612', spotify:'https://open.spotify.com/show/1u8JqIzCGpilZ6NiETzRe5' },
  { id:'cosmic-confluence',         name:'Cosmic Confluence',            category:'Spirituality',         rssUrl:'https://feeds.captivate.fm/cosmic-confluence/',           color:'#C8A8E8' },
  { id:'the-divine-decode',         name:'The Divine Decode Podcast',    category:'Spirituality',         rssUrl:'https://feeds.captivate.fm/the-divine-decode/',           color:'#D4B8E0', apple:'https://podcasts.apple.com/us/podcast/the-divine-decode-podcast/id1818066534', spotify:'https://open.spotify.com/show/395fXdaO7xIYJqfIiaif6Q' },
  { id:'the-soul-mirror',           name:'The Soul Mirror Podcast',      category:'Spirituality',         rssUrl:'https://feeds.captivate.fm/the-soul-mirror-podcast/',     color:'#E0D0B8', apple:'https://podcasts.apple.com/us/podcast/the-soul-mirror-podcast/id1817448240', spotify:'https://open.spotify.com/show/6Pb4mPf83z3JszHl7vNetH' },
  { id:'soul-sparks',               name:'Soul Sparks',                  category:'Spirituality',         rssUrl:'https://feeds.captivate.fm/soul-sparks/',                 color:'#E8C0D8', apple:'https://podcasts.apple.com/us/podcast/soul-sparks/id1790388508',              spotify:'https://open.spotify.com/show/7f1v8HEyyd5nFiur5ceAIq' },
  { id:'sacred-harmony',            name:'Sacred Harmony',               category:'Spirituality',         rssUrl:'https://feeds.captivate.fm/sacred-harmony/',              color:'#C8D8F0', apple:'https://podcasts.apple.com/us/podcast/sacred-harmony/id1790938132',          spotify:'https://open.spotify.com/show/14ufd2AZBV8L1dr7S1qcUY' },
  { id:'inner-light',               name:'Inner Light',                  category:'Spirituality',         rssUrl:'https://feeds.captivate.fm/inner-light/',                 color:'#F0E8C0', apple:'https://podcasts.apple.com/us/podcast/inner-light/id1790389436',              spotify:'https://open.spotify.com/show/3LvLDBEXc7Pg5pxM7t4LqR' },
  { id:'i-awaken',                  name:'I Awaken',                     category:'Spirituality',         rssUrl:'https://feeds.captivate.fm/i-awaken/',                    color:'#E8D88A', apple:'https://podcasts.apple.com/us/podcast/i-awaken/id1844351145',                spotify:'https://open.spotify.com/show/3gVIcErjkwVx4EMyc8WhLL' },
  { id:'pleasure-principles',       name:'Pleasure Principles',          category:'Intimacy & Pleasure',  rssUrl:'https://feeds.captivate.fm/plesure-principles/',          color:'#D46FAA', apple:'https://podcasts.apple.com/us/podcast/ple%5Esure-principles/id1771214980', spotify:'https://open.spotify.com/show/1axi6ra2j5eGbACN7fDmeu' },
  { id:'aura-room',                 name:'Aura Room',                    category:'Spirituality',         rssUrl:'https://feeds.captivate.fm/aura-room/',                   color:'#4A9E7A', apple:'https://podcasts.apple.com/us/podcast/aura-room/id1831346757',               spotify:'https://open.spotify.com/show/3DHf3UPF7IMWRNtVsr1Fbl' },
]

export const CAT_COLORS: Record<string, string> = {
  'Mental Wellness':       '#4DCFB4',
  'Business & Leadership': '#C9A227',
  'AI & Technology':       '#6B9FD4',
  "Men's Mental Health":   '#8B7FD4',
  'Spirituality':          '#C8A8E8',
  'Intimacy & Pleasure':   '#D46FAA',
}

export const SOCIALS = [
  { key: 'youtube',   label: 'YouTube',   cta: 'Subscribe',   url: 'https://www.youtube.com/@healthymindbyavik?sub_confirmation=1' },
  { key: 'instagram', label: 'Instagram', cta: 'Follow',      url: 'https://www.instagram.com/healthyminds.pod/' },
  { key: 'facebook',  label: 'Facebook',  cta: 'Follow',      url: 'https://www.facebook.com/podcast.healthymind' },
  { key: 'linkedin',  label: 'LinkedIn',  cta: 'Follow',      url: 'https://www.linkedin.com/company/healthymindbyavik' },
  { key: 'x',         label: 'X',         cta: 'Follow',      url: 'https://twitter.com/podhealthclub' },
  { key: 'pinterest', label: 'Pinterest', cta: 'Save',        url: 'https://www.pinterest.com/Avikpodhealth/' },
  { key: 'bluesky',   label: 'Bluesky',   cta: 'Follow',      url: 'https://bsky.app/profile/healthymindbyavik.bsky.social' },
  { key: 'reddit',    label: 'Reddit',    cta: 'Follow',      url: 'https://www.reddit.com/user/Podcastbyavik/' },
  { key: 'threads',   label: 'Threads',   cta: 'Follow',      url: 'https://www.threads.com/@healthyminds.pod' },
]
export const COMMUNITY = [
  { key: 'whatsapp', label: 'WhatsApp Community', cta: 'Join Group',    url: 'https://chat.whatsapp.com/GXy6WqQNKos2d15MlmdPZr', color: '#25D366' },
  { key: 'telegram', label: 'Telegram Channel',   cta: 'Join Channel',  url: 'https://t.me/podhubnetwork',                        color: '#2AABEE' },
]

export const AVATARS = [
  { id: 'zen',     emoji: '🧘', bg: '#0D1A0D' },
  { id: 'star',    emoji: '⭐', bg: '#1A1A0D' },
  { id: 'phoenix', emoji: '🔥', bg: '#1A0D0D' },
  { id: 'moon',    emoji: '🌙', bg: '#0D0D1A' },
  { id: 'wave',    emoji: '🌊', bg: '#0D161A' },
  { id: 'leaf',    emoji: '🌿', bg: '#0D140D' },
  { id: 'sun',     emoji: '☀',  bg: '#1A140D' },
  { id: 'crystal', emoji: '💎', bg: '#11101A' },
  { id: 'lotus',   emoji: '🪷', bg: '#1A0D14' },
  { id: 'cosmos',  emoji: '🌌', bg: '#09091A' },
]

export const COUNTRIES = [
  { code: 'IN',  name: 'India',          flag: '🇮🇳' },
  { code: 'US',  name: 'United States',  flag: '🇺🇸' },
  { code: 'GB',  name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA',  name: 'Canada',         flag: '🇨🇦' },
  { code: 'AU',  name: 'Australia',      flag: '🇦🇺' },
  { code: 'DE',  name: 'Germany',        flag: '🇩🇪' },
  { code: 'SG',  name: 'Singapore',      flag: '🇸🇬' },
  { code: 'AE',  name: 'UAE',            flag: '🇦🇪' },
  { code: 'NG',  name: 'Nigeria',        flag: '🇳🇬' },
  { code: 'OTH', name: 'Other',          flag: '🌍' },
]

export const BADGES = [
  { id: 'spark',      icon: '⚡', label: 'First Spark',  color: '#C9A227', need: 1,  type: 'eps'    },
  { id: 'explorer',   icon: '🗺', label: 'Explorer',     color: '#4DCFB4', need: 5,  type: 'eps'    },
  { id: 'storyteller',icon: '📻', label: 'Storyteller',  color: '#6B9FD4', need: 15, type: 'eps'    },
  { id: 'devotee',    icon: '🔥', label: 'Devotee',      color: '#D46FAA', need: 30, type: 'eps'    },
  { id: 'legend',     icon: '👑', label: 'Legend',       color: '#C9A227', need: 60, type: 'eps'    },
  { id: 'streak7',    icon: '⚡', label: '7-Day',        color: '#FFD700', need: 7,  type: 'streak' },
  { id: 'streak14',   icon: '🌙', label: '14-Day',       color: '#8B7FD4', need: 14, type: 'streak' },
  { id: 'streak21',   icon: '🌟', label: '21-Day',       color: '#C8A8E8', need: 21, type: 'streak' },
  { id: 'streak30',   icon: '💎', label: 'Month',        color: '#6B9FD4', need: 30, type: 'streak' },
  { id: 'connector',  icon: '🌐', label: 'Connector',    color: '#A8D8C0', need: 5,  type: 'social' },
  { id: 'reviewer',   icon: '⭐', label: 'Reviewer',     color: '#FFD700', need: 1,  type: 'review' },
]

export const RANK_NAMES = [
  'The Trailblazer', 'The Soulful', 'The Awakened', 'The Warrior', 'The Seeker',
  'The Grounded',    'The Rising',  'The Curious',  'The Present', 'The Brave',
]

export const ADMIN_EMAIL = 'avik@podhealth.club'
