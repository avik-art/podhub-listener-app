import { RSS_CACHE_TTL_MS, RSS_MAX_EPISODES } from './constants'

export interface Episode {
  guid:        string
  title:       string
  description: string
  pubDate:     string
  duration:    string
  enclosure:   string  // audio URL
}

export interface ShowFeed {
  title:       string
  description: string
  artwork:     string | null
  episodes:    Episode[]
}

/** Parse a raw RSS XML string into structured data */
export function parseRSSXML(xmlText: string, showId: string): ShowFeed | null {
  try {
    // Server-side: use a simple regex-based parser (no DOMParser in Node)
    // This runs in Next.js API routes / Server Components

    function extractTag(text: string, tag: string): string {
      const match = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''
    }

    function extractAttr(text: string, tag: string, attr: string): string {
      const match = text.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, 'i'))
      return match ? match[1] : ''
    }

    // Get channel-level artwork
    let artwork: string | null =
      extractAttr(xmlText.slice(0, 3000), 'itunes:image', 'href') ||
      extractTag(xmlText.slice(0, 3000), 'image url') ||
      null

    if (!artwork) {
      const imgMatch = xmlText.slice(0, 3000).match(/<image>([\s\S]*?)<\/image>/i)
      if (imgMatch) {
        const urlMatch = imgMatch[1].match(/<url>([\s\S]*?)<\/url>/i)
        if (urlMatch) artwork = urlMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      }
    }

    // Split into items
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || []

    const episodes: Episode[] = itemMatches.slice(0, RSS_MAX_EPISODES).map((item, i) => {
      const guid      = extractTag(item, 'guid')     || `${showId}-${i}`
      const title     = extractTag(item, 'title')    || `Episode ${itemMatches.length - i}`
      const desc      = extractTag(item, 'description') || extractTag(item, 'itunes:summary') || ''
      const pubDate   = extractTag(item, 'pubDate')  || ''
      const duration  = extractTag(item, 'itunes:duration') || ''
      const enclosure = extractAttr(item, 'enclosure', 'url') || ''

      return {
        guid,
        title: title.slice(0, 300),
        description: desc.replace(/<[^>]+>/g, '').trim().slice(0, 400),
        pubDate,
        duration,
        enclosure,
      }
    })

    const channelTitle = extractTag(xmlText.slice(0, 1000), 'title') || ''
    const channelDesc  = extractTag(xmlText.slice(0, 2000), 'description') || ''

    return {
      title:       channelTitle.slice(0, 200),
      description: channelDesc.replace(/<[^>]+>/g, '').trim().slice(0, 400),
      artwork,
      episodes,
    }
  } catch {
    return null
  }
}

/** Fetch RSS from multiple proxies — returns raw XML text */
export async function fetchRSSText(rssUrl: string): Promise<string | null> {
  const proxies = [
    // rss2json returns JSON — handled separately
    `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`,
  ]

  // Try rss2json first (most reliable, returns up to 100 items)
  try {
    const r = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=${RSS_MAX_EPISODES}`,
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(12000) }
    )
    if (r.ok) {
      const j = await r.json()
      if (j.status === 'ok' && j.items?.length > 0) {
        // Convert rss2json response to our format directly
        const artwork = j.feed?.image || null
        const episodes: Episode[] = j.items.map((item: Record<string, unknown>, i: number) => ({
          guid:        (item.guid as string) || `rss2json-${i}`,
          title:       (item.title as string) || `Episode ${j.items.length - i}`,
          description: String(item.description || item.content || '').replace(/<[^>]+>/g, '').slice(0, 400),
          pubDate:     (item.pubDate as string) || '',
          duration:    (item.itunes_duration as string) || '',
          enclosure:   (item.enclosure as { link?: string; url?: string })?.link || (item.enclosure as { link?: string; url?: string })?.url || '',
        }))
        // Return as a synthetic JSON string our parser can use
        return JSON.stringify({ __rss2json: true, title: j.feed?.title, description: j.feed?.description, artwork, episodes })
      }
    }
  } catch {}

  // Fallback to XML proxies
  for (const proxyUrl of proxies) {
    try {
      const r = await fetch(proxyUrl, { next: { revalidate: 0 }, signal: AbortSignal.timeout(10000) })
      if (!r.ok) continue
      let text: string
      if (proxyUrl.includes('allorigins')) {
        const j = await r.json()
        text = j.contents || ''
      } else {
        text = await r.text()
      }
      if (text && text.length > 500) return text
    } catch {}
  }

  return null
}

/** Main function: fetch + parse RSS, handling both rss2json and raw XML */
export async function fetchShowFeed(rssUrl: string, showId: string): Promise<ShowFeed | null> {
  const raw = await fetchRSSText(rssUrl)
  if (!raw) return null

  // rss2json synthetic JSON
  if (raw.startsWith('{"__rss2json":true')) {
    try {
      const parsed = JSON.parse(raw)
      return {
        title:       parsed.title || showId,
        description: parsed.description || '',
        artwork:     parsed.artwork,
        episodes:    parsed.episodes,
      }
    } catch { return null }
  }

  // Raw XML
  return parseRSSXML(raw, showId)
}
