'use client';

import { ConflictEvent } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  Crosshair,
  Rocket,
  Shield,
  Zap,
  Anchor,
  Radio,
  Target,
  AlertTriangle,
} from 'lucide-react';

const TYPE_ICONS: Record<ConflictEvent['type'], typeof Crosshair> = {
  airstrike: Target,
  missile: Rocket,
  ground_combat: Shield,
  naval: Anchor,
  drone: Radio,
  shelling: Zap,
  cyber: Zap,
  other: AlertTriangle,
};

const SEVERITY_STYLES: Record<ConflictEvent['severity'], { border: string; bg: string; badge: string; text: string }> = {
  critical: { border: 'border-red-500/40', bg: 'bg-red-500/5', badge: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'text-red-400' },
  high: { border: 'border-orange-500/40', bg: 'bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', text: 'text-orange-400' },
  medium: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'text-yellow-400' },
  low: { border: 'border-green-500/40', bg: 'bg-green-500/5', badge: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'text-green-400' },
};

interface EventCardProps {
  event: ConflictEvent;
  isSelected: boolean;
  onClick: () => void;
}

export default function EventCard({ event, isSelected, onClick }: EventCardProps) {
  const Icon = TYPE_ICONS[event.type];
  const styles = SEVERITY_STYLES[event.severity];
  const timeAgo = formatDistanceToNow(new Date(event.timestamp), { addSuffix: true });

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 rounded-lg border cursor-pointer transition-all duration-300
        ${styles.border} ${styles.bg}
        ${isSelected ? 'ring-1 ring-cyan-400/50 bg-cyan-500/5' : 'hover:bg-white/[0.02]'}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className={`p-1.5 rounded ${styles.badge} border`}>
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {event.ongoing && (
              <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/30 font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
            <span className={`text-[10px] font-mono uppercase tracking-wider ${styles.text}`}>
              {event.severity}
            </span>
          </div>
          <h3 className="text-sm font-medium text-white/90 leading-tight truncate">{event.title}</h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-2">
        {event.description}
      </p>

      {/* Damage estimate if available */}
      {event.estimatedDamage && (
        <div className="text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1 mb-2">
          Damage: {event.estimatedDamage}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5">
          <Crosshair size={10} className="text-gray-500" />
          <span className="text-gray-500">{event.country}</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500">{event.source}</span>
        </div>
        <span className="text-cyan-500/70 font-mono">{timeAgo}</span>
      </div>

      {/* Parties involved */}
      <div className="flex flex-wrap gap-1 mt-2">
        {event.parties.map(p => (
          <span key={p} className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
