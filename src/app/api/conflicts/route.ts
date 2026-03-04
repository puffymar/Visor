import { NextResponse } from 'next/server';
import { getConflictEvents, getVideoFeeds, getGlobalStats, getIntelLinks, getIncrementalEvents } from '@/lib/conflict-data';

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

const RSS_FEEDS: { url: string; source: string; lang: string }[] = [
  { url: 'https://feeds.reuters.com/reuters/worldNews', source: 'Reuters', lang: 'en' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC', lang: 'en' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NYT', lang: 'en' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera EN', lang: 'en' },
  { url: 'https://english.alarabiya.net/tools/rss', source: 'Al Arabiya EN', lang: 'en' },
  { url: 'https://www.middleeasteye.net/rss', source: 'Middle East Eye', lang: 'en' },
];

const CONFLICT_KEYWORDS = [
  'strike', 'attack', 'missile', 'bomb', 'combat', 'war', 'military',
  'killed', 'troops', 'offensive', 'shelling', 'drone', 'airstrike',
  'casualties', 'conflict', 'fighting', 'siege', 'invasion',
  'weapon', 'artillery', 'explosion', 'ceasefire', 'battle',
  'houthi', 'hamas', 'hezbollah', 'wagner', 'rsf', 'idf',
];

const PROPAGANDA_SIGNALS = [
  'glorious victory', 'heroic resistance', 'enemies of god',
  'zionist entity', 'crusader', 'axis of evil',
  'divine punishment', 'great satan', 'final solution',
  'ethnic cleansing justified', 'holy war',
];

function isConflictRelated(item: RSSItem): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return CONFLICT_KEYWORDS.some(kw => text.includes(kw));
}

function isPropaganda(item: RSSItem): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return PROPAGANDA_SIGNALS.some(kw => text.includes(kw));
}

function identifySource(link: string, feedSource: string): string {
  if (feedSource) return feedSource;
  if (link.includes('reuters')) return 'Reuters';
  if (link.includes('bbc')) return 'BBC';
  if (link.includes('nytimes')) return 'NYT';
  if (link.includes('aljazeera')) return 'Al Jazeera';
  if (link.includes('alarabiya')) return 'Al Arabiya';
  if (link.includes('middleeasteye')) return 'MEE';
  return 'News';
}

export async function GET() {
  try {
    const feedResults = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const items = await fetchRSSFeed(feed.url);
        return items.map(item => ({ ...item, feedSource: feed.source }));
      })
    );

    const allItems = feedResults
      .filter((r): r is PromiseFulfilledResult<(RSSItem & { feedSource: string })[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    const liveHeadlines = allItems
      .filter(isConflictRelated)
      .filter(item => !isPropaganda(item))
      .slice(0, 20);

    const baseEvents = getConflictEvents();
    const incremental = getIncrementalEvents();
    const events = [...baseEvents, ...incremental].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const videos = getVideoFeeds();
    const stats = getGlobalStats(events);
    const intelLinks = getIntelLinks();

    return NextResponse.json({
      events,
      videos,
      stats,
      intelLinks,
      liveHeadlines: liveHeadlines.map(h => ({
        title: h.title,
        link: h.link,
        source: identifySource(h.link, h.feedSource),
        timestamp: h.pubDate || new Date().toISOString(),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch {
    const baseEvents = getConflictEvents();
    const incremental = getIncrementalEvents();
    const events = [...baseEvents, ...incremental].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return NextResponse.json({
      events,
      videos: getVideoFeeds(),
      stats: getGlobalStats(events),
      intelLinks: getIntelLinks(),
      liveHeadlines: [],
      timestamp: new Date().toISOString(),
    });
  }
}
