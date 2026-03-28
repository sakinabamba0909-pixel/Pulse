import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// RSS feed URLs — multiple fallbacks per source
const RSS_FEEDS: Record<string, string[]> = {
  cnn: [
    'https://rss.cnn.com/rss/cnn_topstories.rss',
    'https://rss.cnn.com/rss/edition.rss',
    'https://rss.cnn.com/rss/cnn_latest.rss',
  ],
  bbc: [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
  ],
  npr: [
    'https://feeds.npr.org/1001/rss.xml',
  ],
  guardian: [
    'https://www.theguardian.com/world/rss',
    'https://www.theguardian.com/international/rss',
  ],
  nyt: [
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  ],
  ap: [
    'https://rsshub.app/apnews/topics/apf-topnews',
  ],
  reuters: [
    'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best',
  ],
  wsj: [
    'https://feeds.content.dowjones.io/public/rss/mw_topstories',
  ],
}

const SOURCE_NAMES: Record<string, string> = {
  ap: 'AP News', reuters: 'Reuters', bbc: 'BBC', nyt: 'NY Times',
  cnn: 'CNN', wsj: 'WSJ', npr: 'NPR', guardian: 'The Guardian',
}

interface Article {
  title: string
  link: string
  source: string
  sourceId: string
  pubDate: string | null
  description: string | null
}

// Use rss2json.com proxy to avoid CORS and User-Agent blocks
async function fetchViaProxy(feedUrl: string, sourceId: string, sourceName: string): Promise<Article[]> {
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
  try {
    const res = await fetch(proxyUrl, { next: { revalidate: 600 } })
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 'ok' || !Array.isArray(data.items)) return []
    return data.items.map((item: any) => ({
      title: (item.title || '').replace(/<[^>]+>/g, '').trim(),
      link: item.link || item.guid || '',
      source: sourceName,
      sourceId,
      pubDate: item.pubDate || null,
      description: item.description
        ? item.description.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim().slice(0, 200)
        : null,
    })).filter((a: Article) => a.title && a.link)
  } catch {
    return []
  }
}

// Direct fetch with XML parsing as fallback
async function fetchDirect(feedUrl: string, sourceId: string, sourceName: string): Promise<Article[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Pulse/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRssXml(xml, sourceId, sourceName)
  } catch {
    return []
  }
}

function parseRssXml(xml: string, sourceId: string, sourceName: string): Article[] {
  const articles: Article[] = []
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim()
    const link = item.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1]?.trim()
    const pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || null
    const desc = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() || null

    if (title && link) {
      const cleanDesc = desc ? desc.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim().slice(0, 200) : null
      articles.push({
        title: title.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        link,
        source: sourceName,
        sourceId,
        pubDate,
        description: cleanDesc,
      })
    }
  }
  return articles
}

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: prefs } = await supabase
    .from('news_preferences')
    .select('enabled, tone, outlets')
    .eq('user_id', user.id)
    .single()

  if (!prefs?.enabled || !prefs.outlets?.length) {
    return NextResponse.json({ articles: [], outlets: [] })
  }

  const outlets: string[] = prefs.outlets
  const allArticles: Article[] = []

  // Fetch feeds in parallel — try proxy first, fall back to direct
  const results = await Promise.allSettled(
    outlets.map(async (outletId) => {
      const feeds = RSS_FEEDS[outletId]
      if (!feeds || feeds.length === 0) return []
      const sourceName = SOURCE_NAMES[outletId] || outletId

      // Try each feed URL with proxy first, then direct
      for (const feedUrl of feeds) {
        const proxyResult = await fetchViaProxy(feedUrl, outletId, sourceName)
        if (proxyResult.length > 0) return proxyResult

        const directResult = await fetchDirect(feedUrl, outletId, sourceName)
        if (directResult.length > 0) return directResult
      }
      return []
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value)
    }
  }

  // Sort by pubDate (newest first), take top 12
  allArticles.sort((a, b) => {
    if (!a.pubDate && !b.pubDate) return 0
    if (!a.pubDate) return 1
    if (!b.pubDate) return -1
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  })

  return NextResponse.json({
    articles: allArticles.slice(0, 12),
    outlets: outlets.map(o => ({ id: o, name: SOURCE_NAMES[o] || o })),
    tone: prefs.tone,
  })
}
