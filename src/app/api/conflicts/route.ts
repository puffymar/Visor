import { NextResponse } from 'next/server';
import { getConflictEvents, getVideoFeeds, getGlobalStats } from '@/lib/conflict-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Visor-Dashboard/1.0' },
    });
    if (!res.ok) return [];
    const text = await res.text();

    const items: RSSItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const itemXml = match[1];
      const getTag = (tag: string) => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return m ? (m[1] || m[2] || '').trim() : '';
      };
      items.push({
        title: getTag('title'),
        link: getTag('link'),
        pubDate: getTag('pubDate'),
        description: getTag('description').replace(/<[^>]*>/g, '').slice(0, 300),
      });
    }
    return items.slice(0, 10);
  } catch {
    return [];
  }
}

const RSS_FEEDS = [
  'https://feeds.reuters.com/reuters/worldNews',
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
];

const CONFLICT_KEYWORDS = [
  'strike', 'attack', 'missile', 'bomb', 'combat', 'war', 'military',
  'killed', 'troops', 'offensive', 'shelling', 'drone', 'airstrike',
  'casualties', 'conflict', 'fighting', 'siege', 'invasion',
  'weapon', 'artillery', 'explosion', 'ceasefire', 'battle',
];

function isConflictRelated(item: RSSItem): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return CONFLICT_KEYWORDS.some(kw => text.includes(kw));
}

export async function GET() {
  try {
    // Fetch RSS feeds in parallel for live headlines
    const feedResults = await Promise.allSettled(
      RSS_FEEDS.map(url => fetchRSSFeed(url))
    );

    const liveHeadlines = feedResults
      .filter((r): r is PromiseFulfilledResult<RSSItem[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(isConflictRelated)
      .slice(0, 15);

    const events = getConflictEvents();
    const videos = getVideoFeeds();
    const stats = getGlobalStats(events);

    return NextResponse.json({
      events,
      videos,
      stats,
      liveHeadlines: liveHeadlines.map(h => ({
        title: h.title,
        link: h.link,
        source: h.link.includes('reuters') ? 'Reuters'
          : h.link.includes('bbc') ? 'BBC'
          : h.link.includes('nytimes') ? 'NYT'
          : 'News',
        timestamp: h.pubDate || new Date().toISOString(),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch {
    const events = getConflictEvents();
    return NextResponse.json({
      events,
      videos: getVideoFeeds(),
      stats: getGlobalStats(events),
      liveHeadlines: [],
      timestamp: new Date().toISOString(),
    });
  }
}
