import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const RSS_FEEDS: Record<string, string> = {
  cnn: 'https://rss.cnn.com/rss/edition.rss',
  bbc: 'https://feeds.bbci.co.uk/news/rss.xml',
  npr: 'https://feeds.npr.org/1001/rss.xml',
  guardian: 'https://www.theguardian.com/world/rss',
  nyt: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  ap: 'https://rsshub.app/apnews/topics/apf-topnews',
  reuters: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best',
  wsj: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
}

interface Article {
  title: string
  link: string
  source: string
  sourceId: string
  pubDate: string | null
  description: string | null
}

function parseRssXml(xml: string, sourceId: string, sourceName: string): Article[] {
  const articles: Article[] = []
  // Simple XML parsing for RSS <item> elements
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim()
    const link = item.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1]?.trim()
    const pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || null
    const desc = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() || null

    if (title && link) {
      // Strip HTML tags from description
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

const SOURCE_NAMES: Record<string, string> = {
  ap: 'AP News', reuters: 'Reuters', bbc: 'BBC', nyt: 'NY Times',
  cnn: 'CNN', wsj: 'WSJ', npr: 'NPR', guardian: 'The Guardian',
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

  // Fetch RSS feeds in parallel
  const results = await Promise.allSettled(
    outlets.map(async (outletId) => {
      const feedUrl = RSS_FEEDS[outletId]
      if (!feedUrl) return []
      try {
        const res = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Pulse/1.0' },
          next: { revalidate: 600 }, // Cache for 10 minutes
        })
        if (!res.ok) return []
        const xml = await res.text()
        return parseRssXml(xml, outletId, SOURCE_NAMES[outletId] || outletId)
      } catch {
        return []
      }
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
