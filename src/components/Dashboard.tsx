'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ConflictEvent, VideoFeed, GlobalStats, IntelLink, MarketImpactAssessment } from '@/lib/types';
import StatsBar from './StatsBar';
import NewsTicker from './NewsTicker';
import EventCard from './EventCard';
import EventDetail from './EventDetail';
import VideoPanel from './VideoPanel';
import IntelPanel from './IntelPanel';
import FocusPanel from './FocusPanel';
import FeedSidebar from './FeedSidebar';
import MarketPanel from './MarketPanel';
import RegionFilter from './RegionFilter';
import { Shield, RefreshCw, Search, ChevronUp, ChevronDown, FileWarning, BarChart3, List, Globe2, Video } from 'lucide-react';

const Globe = dynamic(() => import('./Globe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-cyan-500 font-mono text-xs animate-pulse">INITIALIZING 3D ENGINE...</div>
    </div>
  ),
});

interface DashboardData {
  events: ConflictEvent[];
  videos: VideoFeed[];
  stats: GlobalStats;
  intelLinks: IntelLink[];
  marketImpacts?: MarketImpactAssessment[];
  liveHeadlines: { title: string; link: string; source: string; timestamp: string }[];
  timestamp: string;
}

const REFRESH_INTERVAL = 60000; // 60s refresh; API adds 5 new events every 4 min

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ConflictEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<ConflictEvent | null>(null);
  const [videoPanelOpen, setVideoPanelOpen] = useState(true);
  const [regionFilter, setRegionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'severity'>('newest');
  const [intelOpen, setIntelOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [mobileTab, setMobileTab] = useState<'events' | 'globe' | 'live'>('events');
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const selectedEventRef = useRef<ConflictEvent | null>(null);
  selectedEventRef.current = selectedEvent;

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch('/api/conflicts', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json: DashboardData = await res.json();

      setData(json);

      const sel = selectedEventRef.current;
      if (sel) {
        const updated = json.events.find(e => e.id === sel.id);
        if (updated) setSelectedEvent(updated);
      }

      setIsConnected(true);
      lastFetchRef.current = Date.now();
    } catch {
      setIsConnected(false);
    } finally {
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    refreshTimerRef.current = setInterval(() => fetchData(false), REFRESH_INTERVAL);
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [fetchData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailEvent(null);
        setSelectedEvent(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectEvent = useCallback((event: ConflictEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleEventClick = useCallback((event: ConflictEvent) => {
    setSelectedEvent(event);
    setDetailEvent(event);
  }, []);

  const handleToggleVideoPanel = useCallback(() => {
    setVideoPanelOpen(v => !v);
  }, []);

  const handleCriticalClick = useCallback(() => {
    if (!data) return;
    const criticals = data.events.filter(e => e.severity === 'critical');
    if (criticals.length > 0) {
      setDetailEvent(criticals[0]);
      setSelectedEvent(criticals[0]);
      setSortOrder('severity');
    }
  }, [data]);

  const handleToggleIntel = useCallback(() => {
    setIntelOpen(v => !v);
    setMarketOpen(false);
  }, []);

  const handleToggleMarket = useCallback(() => {
    setMarketOpen(v => !v);
    setIntelOpen(false);
  }, []);

  const handleCheckEvent = useCallback((event: ConflictEvent) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(event.id)) next.delete(event.id);
      else next.add(event.id);
      return next;
    });
  }, []);

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    return data.events.filter(e => {
      const matchRegion = regionFilter === 'All' || e.region === regionFilter;
      const matchSearch = searchQuery === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRegion && matchSearch;
    }).sort((a, b) => {
      if (sortOrder === 'severity') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.severity] - order[b.severity];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [data, regionFilter, searchQuery, sortOrder]);

  const eventCounts = useMemo(() => {
    if (!data) return {};
    return data.events.reduce((acc, e) => {
      acc[e.region] = (acc[e.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [data]);

  if (!data) {
    return (
      <div className="h-screen bg-[#080b12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Shield size={48} className="text-cyan-500 animate-pulse" />
            <div className="absolute -inset-4 bg-cyan-500/10 rounded-full blur-xl animate-pulse" />
          </div>
          <div className="text-cyan-400 font-mono text-sm tracking-wider uppercase">
            Initializing Visor...
          </div>
          <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = data.intelLinks?.filter(l => l.severity === 'critical').length ?? 0;

  return (
    <div
      className="h-[100dvh] flex flex-col bg-[#080b12] text-white overflow-hidden overflow-x-hidden max-w-[100vw]"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Top Bar */}
      <header className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 bg-[#0a0e16] border-b border-cyan-500/10 shrink-0">
        <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
          <div className="relative shrink-0">
            <Shield size={18} className="text-cyan-400 md:w-6 md:h-6" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm md:text-lg font-bold tracking-wide truncate">
              <span className="text-cyan-400">VISOR</span>
              <span className="text-gray-500 text-[9px] md:text-xs ml-1 md:ml-2 font-mono hidden sm:inline">GLOBAL CONFLICT MONITOR</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-0.5 md:gap-2 shrink-0">
          <button
            onClick={handleToggleMarket}
            className={`flex items-center gap-0.5 md:gap-1.5 px-1 md:px-3 py-1 md:py-1.5 rounded border transition-all text-[8px] md:text-xs font-mono min-h-[36px] md:min-h-0 ${
              marketOpen
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-400'
                : 'border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400'
            }`}
          >
            <BarChart3 size={12} className="md:w-3 md:h-3" />
            <span className="hidden sm:inline">MARKET</span>
          </button>
          <button
            onClick={handleToggleIntel}
            className={`flex items-center gap-0.5 md:gap-1.5 px-1 md:px-3 py-1 md:py-1.5 rounded border transition-all text-[8px] md:text-xs font-mono min-h-[36px] md:min-h-0 ${
              intelOpen
                ? 'border-amber-400/40 bg-amber-500/10 text-amber-400'
                : 'border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400'
            }`}
          >
            <FileWarning size={12} className="md:w-3 md:h-3" />
            <span className="hidden sm:inline">INTEL</span>
            {criticalCount > 0 && (
              <span className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-red-500 text-white text-[8px] md:text-[9px] flex items-center justify-center font-bold">
                {criticalCount}
              </span>
            )}
          </button>
          <span className="text-[8px] text-gray-500 font-mono hidden sm:inline" title="Refresh every 60s; +5 events every 4 min">60s · +5/4m</span>
          <button
            onClick={() => fetchData(true)}
            className={`p-1.5 md:p-2 rounded border border-cyan-500/20 hover:bg-cyan-500/10 transition-all min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 flex items-center justify-center shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={14} className="text-cyan-400 md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </header>

      <StatsBar stats={data.stats} isConnected={isConnected} onCriticalClick={handleCriticalClick} />
      <NewsTicker headlines={data.liveHeadlines} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel — full width on mobile when events tab */}
        <div className={`
          flex flex-col border-r border-cyan-500/10 bg-[#0a0e16]/50 min-w-0
          w-full md:w-96
          ${mobileTab !== 'events' ? 'hidden md:flex' : 'flex'}
        `}>
          <div className="p-1.5 md:p-3 space-y-1.5 md:space-y-2 border-b border-white/5">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 md:pl-9 pr-2 md:pr-3 py-2 md:py-2 bg-white/5 border border-white/10 rounded-lg text-sm md:text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <RegionFilter selected={regionFilter} onChange={setRegionFilter} eventCounts={eventCounts} />
            <div className="flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] text-gray-500 font-mono">{filteredEvents.length} events</span>
              <button
                onClick={() => setSortOrder(s => s === 'newest' ? 'severity' : 'newest')}
                className="flex items-center gap-0.5 text-[9px] md:text-[10px] text-gray-500 hover:text-cyan-400 transition-colors font-mono"
              >
                {sortOrder === 'newest' ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                Sort: {sortOrder === 'newest' ? 'Latest' : 'Severity'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 md:p-3 space-y-1.5 md:space-y-2 custom-scrollbar overscroll-contain">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onClick={handleEventClick}
              />
            ))}
          </div>
        </div>

        {/* Globe — full width on mobile when globe tab */}
        <div className={`
          flex-1 relative min-w-0
          ${mobileTab !== 'globe' ? 'hidden md:block' : 'block'}
        `}>
          <Globe events={data.events} onSelectEvent={handleSelectEvent} selectedEvent={selectedEvent} />

          <div className="absolute top-1.5 right-1.5 md:top-4 md:right-4 bg-[#0d1117]/80 border border-cyan-500/20 rounded-lg p-1.5 md:p-3 backdrop-blur-md">
            <div className="text-[9px] md:text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-0.5 md:mb-1">Global Threat Level</div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`w-3 h-4 md:w-4 md:h-6 rounded-sm ${
                      i <= (data.stats.criticalAlerts >= 3 ? 5 : data.stats.criticalAlerts >= 2 ? 4 : 3)
                        ? i <= 2 ? 'bg-yellow-500' : i <= 4 ? 'bg-orange-500' : 'bg-red-500'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs md:text-sm font-bold text-orange-400 font-mono">ELEVATED</span>
            </div>
          </div>

          <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-[#0d1117]/80 border border-cyan-500/20 rounded-lg p-2 md:p-3 backdrop-blur-md hidden md:block">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Active Sources</div>
            <div className="flex flex-wrap gap-1">
              {['Reuters', 'AP', 'BBC', 'Al Jazeera', 'Al Arabiya', 'ACLED', 'UN OCHA', 'ISW', 'CENTCOM'].map(s => (
                <span key={s} className="text-[9px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-green-400 font-mono">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dedicated Focus / Check panel — hidden on mobile (use detail modal) */}
        {selectedEvent && (
          <div className="hidden md:block">
          <FocusPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            checked={checkedIds.has(selectedEvent.id)}
            onCheck={() => handleCheckEvent(selectedEvent)}
          />
          </div>
        )}

        {/* Critical alerts + market indicators — hidden on mobile */}
        <div className="hidden md:block">
        <FeedSidebar
          events={data.events}
          marketImpacts={data.marketImpacts}
          onEventClick={(e) => { setSelectedEvent(e); setDetailEvent(e); }}
          onMarketClick={handleToggleMarket}
        />
        </div>

        {/* Live tab content on mobile — FeedSidebar + videos stacked */}
        <div className={`
          flex flex-col md:hidden w-full min-w-0
          ${mobileTab !== 'live' ? 'hidden' : 'flex'}
        `}>
          <div className="w-full shrink-0 overflow-x-auto">
            <FeedSidebar
              events={data.events}
              marketImpacts={data.marketImpacts}
              onEventClick={(e) => { setSelectedEvent(e); setDetailEvent(e); }}
              onMarketClick={handleToggleMarket}
              className="!w-full !border-l-0 border-b border-cyan-500/20"
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <VideoPanel videos={data.videos} isExpanded={true} onToggle={() => {}} className="!w-full !border-l-0 border-t border-cyan-500/20" />
          </div>
        </div>

        <VideoPanel videos={data.videos} isExpanded={videoPanelOpen} onToggle={handleToggleVideoPanel} className="hidden md:flex" />
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden flex items-center justify-around py-1.5 px-2 bg-[#0a0e16] border-t border-cyan-500/10 shrink-0 safe-area-bottom">
        <button
          onClick={() => setMobileTab('events')}
          className={`flex flex-col items-center gap-0 py-1.5 px-3 min-w-[64px] rounded-lg transition-colors touch-manipulation ${mobileTab === 'events' ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-500'}`}
        >
          <List size={20} />
          <span className="text-[9px] font-mono">Events</span>
        </button>
        <button
          onClick={() => setMobileTab('globe')}
          className={`flex flex-col items-center gap-0 py-1.5 px-3 min-w-[64px] rounded-lg transition-colors touch-manipulation ${mobileTab === 'globe' ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-500'}`}
        >
          <Globe2 size={20} />
          <span className="text-[9px] font-mono">Globe</span>
        </button>
        <button
          onClick={() => setMobileTab('live')}
          className={`flex flex-col items-center gap-0 py-1.5 px-3 min-w-[64px] rounded-lg transition-colors touch-manipulation ${mobileTab === 'live' ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-500'}`}
        >
          <Video size={20} />
          <span className="text-[9px] font-mono">Live</span>
        </button>
      </nav>

      {detailEvent && <EventDetail event={detailEvent} onClose={() => setDetailEvent(null)} />}
      {marketOpen && (
        <MarketPanel marketImpacts={data.marketImpacts ?? []} onClose={() => setMarketOpen(false)} />
      )}
      {intelOpen && data.intelLinks && (
        <IntelPanel
          links={data.intelLinks}
          marketImpacts={data.marketImpacts}
          onClose={() => setIntelOpen(false)}
        />
      )}
    </div>
  );
}
