'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ConflictEvent, VideoFeed, GlobalStats } from '@/lib/types';
import StatsBar from './StatsBar';
import NewsTicker from './NewsTicker';
import EventCard from './EventCard';
import EventDetail from './EventDetail';
import VideoPanel from './VideoPanel';
import RegionFilter from './RegionFilter';
import { Shield, RefreshCw, Search, ChevronUp, ChevronDown } from 'lucide-react';

const Globe = dynamic(() => import('./Globe'), { ssr: false });

interface DashboardData {
  events: ConflictEvent[];
  videos: VideoFeed[];
  stats: GlobalStats;
  liveHeadlines: { title: string; link: string; source: string; timestamp: string }[];
  timestamp: string;
}

const REFRESH_INTERVAL = 60000; // 60 seconds

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
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch('/api/conflicts', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json: DashboardData = await res.json();

      setData(prev => {
        // Seamless merge: preserve selection state
        if (prev && selectedEvent) {
          const updated = json.events.find(e => e.id === selectedEvent.id);
          if (updated) setSelectedEvent(updated);
        }
        return json;
      });

      setIsConnected(true);
      lastFetchRef.current = Date.now();
    } catch {
      setIsConnected(false);
    } finally {
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [selectedEvent]);

  // Initial fetch + polling
  useEffect(() => {
    fetchData(true);

    refreshTimerRef.current = setInterval(() => {
      fetchData(false);
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [fetchData]);

  // Filter & sort events
  const filteredEvents = data?.events.filter(e => {
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
  }) ?? [];

  // Event counts by region
  const eventCounts = data?.events.reduce((acc, e) => {
    acc[e.region] = (acc[e.region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

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

  return (
    <div className="h-screen flex flex-col bg-[#080b12] text-white overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0a0e16] border-b border-cyan-500/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield size={24} className="text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">
              <span className="text-cyan-400">VISOR</span>
              <span className="text-gray-500 text-xs ml-2 font-mono">GLOBAL CONFLICT MONITOR</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">
            Auto-refresh: 60s
          </span>
          <button
            onClick={() => fetchData(true)}
            className={`p-1.5 rounded-md border border-cyan-500/20 hover:bg-cyan-500/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={14} className="text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <StatsBar stats={data.stats} isConnected={isConnected} />

      {/* News Ticker */}
      <NewsTicker headlines={data.liveHeadlines} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Event List */}
        <div className="w-96 flex flex-col border-r border-cyan-500/10 bg-[#0a0e16]/50">
          {/* Search & Filter */}
          <div className="p-3 space-y-2 border-b border-white/5">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            {/* Region filter */}
            <RegionFilter
              selected={regionFilter}
              onChange={setRegionFilter}
              eventCounts={eventCounts}
            />

            {/* Sort */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-mono">
                {filteredEvents.length} events
              </span>
              <button
                onClick={() => setSortOrder(s => s === 'newest' ? 'severity' : 'newest')}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-400 transition-colors font-mono"
              >
                {sortOrder === 'newest' ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                Sort: {sortOrder === 'newest' ? 'Latest' : 'Severity'}
              </button>
            </div>
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onClick={() => {
                  setSelectedEvent(event);
                  setDetailEvent(event);
                }}
              />
            ))}
          </div>
        </div>

        {/* Center - Globe */}
        <div className="flex-1 relative">
          <Globe
            events={data.events}
            onSelectEvent={(event) => {
              setSelectedEvent(event);
            }}
            selectedEvent={selectedEvent}
          />

          {/* Globe overlay: threat level */}
          <div className="absolute top-4 right-4 bg-[#0d1117]/80 border border-cyan-500/20 rounded-lg p-3 backdrop-blur-md">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Global Threat Level</div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-6 rounded-sm ${
                      i <= (data.stats.criticalAlerts >= 3 ? 5 : data.stats.criticalAlerts >= 2 ? 4 : 3)
                        ? i <= 2 ? 'bg-yellow-500' : i <= 4 ? 'bg-orange-500' : 'bg-red-500'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-orange-400 font-mono">ELEVATED</span>
            </div>
          </div>

          {/* Globe overlay: sources */}
          <div className="absolute bottom-4 right-4 bg-[#0d1117]/80 border border-cyan-500/20 rounded-lg p-3 backdrop-blur-md">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Active Sources</div>
            <div className="flex flex-wrap gap-1">
              {['Reuters', 'AP', 'BBC', 'ACLED', 'UN OCHA', 'ISW', 'CENTCOM'].map(s => (
                <span key={s} className="text-[9px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-green-400 font-mono">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Videos */}
        <VideoPanel
          videos={data.videos}
          isExpanded={videoPanelOpen}
          onToggle={() => setVideoPanelOpen(v => !v)}
        />
      </div>

      {/* Detail Modal */}
      {detailEvent && (
        <EventDetail
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
        />
      )}
    </div>
  );
}
