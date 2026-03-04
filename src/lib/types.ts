export interface ConflictEvent {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  country: string;
  region: string;
  type: 'airstrike' | 'missile' | 'ground_combat' | 'naval' | 'drone' | 'shelling' | 'cyber' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
  sourceUrl: string;
  estimatedCasualties?: string;
  estimatedDamage?: string;
  parties: string[];
  ongoing: boolean;
}

export interface VideoFeed {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  source: string;
  duration?: string;
  timestamp: string;
  region: string;
}

export interface GlobalStats {
  activeConflicts: number;
  eventsToday: number;
  countriesAffected: number;
  criticalAlerts: number;
  lastUpdated: string;
}

export interface IntelLink {
  id: string;
  title: string;
  url: string;
  description: string;
  region: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
}

export interface NewsSource {
  name: string;
  reliability: 'high' | 'medium';
  type: 'government' | 'international_org' | 'news_agency' | 'osint';
  url: string;
}

export const TRUSTED_SOURCES: NewsSource[] = [
  { name: 'ACLED', reliability: 'high', type: 'international_org', url: 'https://acleddata.com' },
  { name: 'Reuters', reliability: 'high', type: 'news_agency', url: 'https://www.reuters.com' },
  { name: 'AP News', reliability: 'high', type: 'news_agency', url: 'https://apnews.com' },
  { name: 'BBC World', reliability: 'high', type: 'news_agency', url: 'https://www.bbc.com/news/world' },
  { name: 'UN OCHA', reliability: 'high', type: 'international_org', url: 'https://www.unocha.org' },
  { name: 'Al Jazeera', reliability: 'medium', type: 'news_agency', url: 'https://www.aljazeera.com' },
  { name: 'Liveuamap', reliability: 'medium', type: 'osint', url: 'https://liveuamap.com' },
  { name: 'ISW', reliability: 'high', type: 'osint', url: 'https://www.understandingwar.org' },
];
