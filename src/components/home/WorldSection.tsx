'use client'

import { useState, useEffect } from 'react'

interface Article {
  title: string
  link: string
  source: string
  sourceId: string
  pubDate: string | null
  description: string | null
}

const C = {
  text: '#2D2A26',
  muted: '#9E958B',
  faint: '#C9C1B8',
  accent: '#9B7EC8',
  accentDim: 'rgba(155,126,200,0.10)',
  accentBorder: 'rgba(155,126,200,0.25)',
  card: 'rgba(255,255,255,0.52)',
  cardBorder: 'rgba(0,0,0,0.05)',
  divider: 'rgba(0,0,0,0.04)',
}

const RSS_FEEDS: Record<string, string[]> = {
  cnn: [
    'https://rss.cnn.com/rss/cnn_topstories.rss',
    'https://rss.cnn.com/rss/edition.rss',
  ],
  bbc: ['https://feeds.bbci.co.uk/news/rss.xml'],
  npr: ['https://feeds.npr.org/1001/rss.xml'],
  guardian: ['https://www.theguardian.com/world/rss'],
  nyt: ['https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'],
  ap: ['https://rsshub.app/apnews/topics/apf-topnews'],
  reuters: ['https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best'],
  wsj: ['https://feeds.content.dowjones.io/public/rss/mw_topstories'],
}

const SOURCE_NAMES: Record<string, string> = {
  ap: 'AP News', reuters: 'Reuters', bbc: 'BBC', nyt: 'NY Times',
  cnn: 'CNN', wsj: 'WSJ', npr: 'NPR', guardian: 'The Guardian',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

async function fetchFeedViaProxy(feedUrl: string, sourceId: string, sourceName: string): Promise<Article[]> {
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
  try {
    const res = await fetch(proxyUrl)
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

export default function WorldSection({ tone, sectionLabel }: { tone: string; sectionLabel: string }) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [newsTone, setNewsTone] = useState<string>('balanced')

  useEffect(() => {
    // Step 1: get user preferences from our API
    fetch('/api/news/headlines')
      .then(r => r.json())
      .then(async (data) => {
        if (data.tone) setNewsTone(data.tone)

        // If server already returned articles, use them
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles)
          setLoading(false)
          return
        }

        // Step 2: if server returned no articles, fetch client-side via rss2json
        const outlets: string[] = data.outlets?.map((o: any) => typeof o === 'string' ? o : o.id) || []
        if (outlets.length === 0) {
          setLoading(false)
          return
        }

        const allArticles: Article[] = []
        const fetches = outlets.map(async (outletId) => {
          const feeds = RSS_FEEDS[outletId]
          if (!feeds) return
          const sourceName = SOURCE_NAMES[outletId] || outletId
          for (const feedUrl of feeds) {
            const result = await fetchFeedViaProxy(feedUrl, outletId, sourceName)
            if (result.length > 0) {
              allArticles.push(...result)
              return
            }
          }
        })

        await Promise.allSettled(fetches)

        // Sort by pubDate newest first, take top 12
        allArticles.sort((a, b) => {
          if (!a.pubDate && !b.pubDate) return 0
          if (!a.pubDate) return 1
          if (!b.pubDate) return -1
          return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        })

        setArticles(allArticles.slice(0, 12))
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div style={{
        background: C.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${C.cardBorder}`, borderRadius: 22, padding: '22px 24px',
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 18 }}>
          {sectionLabel}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.faint, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, background: C.divider, borderRadius: 4, marginBottom: 6, width: `${70 + i * 10}%` }} />
                <div style={{ height: 10, background: C.divider, borderRadius: 4, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || articles.length === 0) {
    return (
      <div style={{
        background: C.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${C.cardBorder}`, borderRadius: 22, padding: '22px 24px',
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
          {sectionLabel}
        </p>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
          {error ? 'Unable to load news right now. Check back later.' : 'No headlines available at the moment.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: C.card, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${C.cardBorder}`, borderRadius: 22, padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          {sectionLabel}
        </p>
        <span style={{
          fontSize: 10, fontWeight: 500, color: C.muted,
          padding: '4px 10px', borderRadius: 20,
          background: 'rgba(0,0,0,0.02)', border: `1px solid ${C.cardBorder}`,
        }}>
          {newsTone === 'positive' ? '☀ Positive' : newsTone === 'full' ? '🌐 Full reality' : '⚖ Balanced'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {articles.map((article, i) => (
          <a
            key={i}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 8px', borderRadius: 12,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(155,126,200,0.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: C.accent, marginTop: 6, flexShrink: 0,
              opacity: 0.6,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 500, color: C.text,
                lineHeight: 1.45, marginBottom: 4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}>
                {article.title}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: C.accent,
                  padding: '1px 7px', borderRadius: 6,
                  background: C.accentDim,
                }}>
                  {article.source}
                </span>
                {article.pubDate && (
                  <span style={{ fontSize: 10, color: C.faint }}>
                    {timeAgo(article.pubDate)}
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
