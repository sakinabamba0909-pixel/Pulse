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

export default function WorldSection({ tone, sectionLabel }: { tone: string; sectionLabel: string }) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [newsTone, setNewsTone] = useState<string>('balanced')

  useEffect(() => {
    fetch('/api/news/headlines')
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || [])
        if (data.tone) setNewsTone(data.tone)
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
