'use client';

import { useEffect, useState, useRef } from 'react';
import { ConflictEvent } from '@/lib/types';
import { MarketImpactAssessment } from '@/lib/types';
import { AlertTriangle, X, BarChart3 } from 'lucide-react';

const DISMISS_MS = 10000;

interface ToastItem {
  id: string;
  event: ConflictEvent;
  shownAt: number;
}

interface FeedSidebarProps {
  events: ConflictEvent[];
  marketImpacts?: MarketImpactAssessment[];
  onEventClick: (event: ConflictEvent) => void;
  onMarketClick?: () => void;
  className?: string;
}

export default function FeedSidebar({ events, marketImpacts = [], onEventClick, onMarketClick, className = '' }: FeedSidebarProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());

  // Show top 3 critical events (any critical, not keyword-filtered)
  useEffect(() => {
    const critical = events
      .filter(e => e.severity === 'critical')
      .slice(0, 3);

    if (critical.length === 0) return;

    const newOnes = critical.filter(e => !shownIdsRef.current.has(e.id));
    newOnes.forEach(e => shownIdsRef.current.add(e.id));

    if (newOnes.length === 0) return;

    const items: ToastItem[] = newOnes.map(e => ({
      id: `toast-${e.id}-${Date.now()}`,
      event: e,
      shownAt: Date.now(),
    }));

    setToasts(prev => [...prev, ...items].slice(-5));
  }, [events]);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(t => now - t.shownAt < DISMISS_MS));
    }, 500);
    return () => clearInterval(timer);
  }, [toasts.length]);

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const topMarket = marketImpacts[0];

  return (
    <div className={`flex flex-col gap-3 w-[220px] md:w-[220px] shrink-0 border-l border-cyan-500/20 bg-[#0a0e16]/80 backdrop-blur-md p-2 ${className}`}>
      {/* Market indicators — always visible */}
      {topMarket && (
        <button
          onClick={onMarketClick}
          className="w-full text-left rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 hover:bg-emerald-500/15 transition-colors"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 size={12} className="text-emerald-400" />
            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Market Impact</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-300 mb-0.5">{topMarket.impact}</div>
          {topMarket.indices && (
            <div className="text-[10px] text-cyan-400/80 font-mono">{topMarket.indices}</div>
          )}
          <div className="text-[9px] text-gray-500 mt-1 line-clamp-1">{topMarket.headline}</div>
        </button>
      )}

      {/* Additional market snippets */}
      {marketImpacts.length > 1 && (
        <div className="space-y-1">
          {marketImpacts.slice(1, 3).map(m => (
            <div
              key={m.id}
              className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5"
            >
              <div className="text-[10px] font-mono text-emerald-400/90">{m.impact}</div>
              <div className="text-[9px] text-gray-500 line-clamp-1">{m.headline}</div>
            </div>
          ))}
        </div>
      )}

      {/* Critical alerts */}
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <AlertTriangle size={11} className="text-red-400" />
          <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider">Critical</span>
        </div>
        {toasts.length === 0 ? (
          <div className="text-[10px] text-gray-600 font-mono py-2">No active critical alerts</div>
        ) : (
          toasts.map(toast => {
            const elapsed = Date.now() - toast.shownAt;
            const progress = Math.min(1, elapsed / DISMISS_MS);

            return (
              <div
                key={toast.id}
                className="relative overflow-hidden rounded-lg border border-red-500/40 bg-red-500/10"
              >
                <button
                  onClick={() => onEventClick(toast.event)}
                  className="w-full text-left p-2.5 pr-7 hover:bg-red-500/15 transition-colors"
                >
                  <div className="text-[9px] font-mono text-red-400 uppercase mb-0.5">CRITICAL</div>
                  <h4 className="text-xs font-medium text-white leading-tight line-clamp-2">{toast.event.title}</h4>
                  <div className="text-[10px] text-gray-400 mt-0.5">{toast.event.country} · {toast.event.region}</div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDismiss(toast.id); }}
                  className="absolute top-1.5 right-1.5 p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-white"
                >
                  <X size={10} />
                </button>
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-red-500/50"
                  style={{ width: `${(1 - progress) * 100}%` }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
