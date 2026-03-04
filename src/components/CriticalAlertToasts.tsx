'use client';

import { useEffect, useState, useRef } from 'react';
import { ConflictEvent } from '@/lib/types';
import { AlertTriangle, X } from 'lucide-react';

const DISMISS_MS = 10000;
const CRITICAL_KEYWORDS = ['iran', 'israel', 'gaza', 'hezbollah', 'houthi', 'nuclear', 'war', 'strike', 'missile'];

function isHighPriorityCritical(event: ConflictEvent): boolean {
  const text = `${event.title} ${event.description} ${event.country} ${event.region}`.toLowerCase();
  return event.severity === 'critical' && CRITICAL_KEYWORDS.some(kw => text.includes(kw));
}

interface ToastItem {
  id: string;
  event: ConflictEvent;
  shownAt: number;
}

interface CriticalAlertToastsProps {
  events: ConflictEvent[];
  onClick: (event: ConflictEvent) => void;
}

export default function CriticalAlertToasts({ events, onClick }: CriticalAlertToastsProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const critical = events.filter(isHighPriorityCritical).slice(0, 3);
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

  if (toasts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-2 min-w-[200px]">
      {toasts.map(toast => {
        const elapsed = Date.now() - toast.shownAt;
        const progress = Math.min(1, elapsed / DISMISS_MS);

        return (
          <div
            key={toast.id}
            className="relative overflow-hidden rounded-lg border border-red-500/40 bg-red-500/10 backdrop-blur-md shadow-lg transition-all duration-300"
          >
            <button
              onClick={() => onClick(toast.event)}
              className="w-full text-left p-3 pr-8 hover:bg-red-500/10 transition-colors"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[9px] font-mono text-red-400 uppercase tracking-wider mb-0.5">CRITICAL</div>
                  <h4 className="text-xs font-medium text-white leading-tight line-clamp-2">{toast.event.title}</h4>
                  <div className="text-[10px] text-gray-400 mt-1">{toast.event.country} · {toast.event.region}</div>
                </div>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(toast.id); }}
              className="absolute top-2 right-2 p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-red-500/50"
              style={{ width: `${(1 - progress) * 100}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
