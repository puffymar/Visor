'use client';

import { ConflictEvent } from '@/lib/types';
import {
  X,
  ExternalLink,
  MapPin,
  Users,
  Flame,
  Clock,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface EventDetailProps {
  event: ConflictEvent;
  onClose: () => void;
}

export default function EventDetail({ event, onClose }: EventDetailProps) {
  const severityColor = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
  }[event.severity];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-8" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="bg-[#0d1117] border border-cyan-500/20 rounded-xl max-w-2xl w-full max-h-[90dvh] md:max-h-[80vh] overflow-y-auto shadow-2xl shadow-cyan-500/5">
        {/* Header */}
        <div className="flex items-start justify-between p-3 md:p-5 border-b border-white/5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono uppercase ${severityColor}`}>
                {event.severity}
              </span>
              <span className="text-xs text-gray-500 font-mono uppercase">
                {event.type.replace('_', ' ')}
              </span>
              {event.ongoing && (
                <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <h2 className="text-base md:text-xl font-semibold text-white leading-tight">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 md:p-5 space-y-3 md:space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={MapPin} label="Location" value={`${event.country} — ${event.region}`} />
            <InfoRow icon={Clock} label="Time" value={`${format(new Date(event.timestamp), 'HH:mm:ss')} (${formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })})`} />
            <InfoRow icon={Shield} label="Source" value={event.source} />
            <InfoRow
              icon={AlertTriangle}
              label="Status"
              value={event.ongoing ? 'Ongoing' : 'Concluded'}
              valueColor={event.ongoing ? 'text-red-400' : 'text-green-400'}
            />
          </div>

          {/* Casualties & Damage */}
          {(event.estimatedCasualties || event.estimatedDamage) && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={12} />
                Impact Assessment
              </h3>
              {event.estimatedCasualties && (
                <div className="text-sm text-gray-300 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                  <span className="text-red-400 font-medium">Casualties:</span> {event.estimatedCasualties}
                </div>
              )}
              {event.estimatedDamage && (
                <div className="text-sm text-gray-300 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                  <span className="text-amber-400 font-medium">Damage:</span> {event.estimatedDamage}
                </div>
              )}
            </div>
          )}

          {/* Parties */}
          <div>
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Users size={12} />
              Parties Involved
            </h3>
            <div className="flex flex-wrap gap-2">
              {event.parties.map(p => (
                <span key={p} className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Source link */}
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10"
          >
            <ExternalLink size={14} />
            <span>View source: {event.source}</span>
          </a>

          {/* Coordinates */}
          <div className="text-[10px] text-gray-600 font-mono text-right">
            {event.lat.toFixed(4)}°N, {event.lng.toFixed(4)}°E
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueColor = 'text-gray-300' }: {
  icon: typeof MapPin;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
      <Icon size={14} className="text-gray-500 mt-0.5 shrink-0" />
      <div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
        <div className={`text-sm ${valueColor}`}>{value}</div>
      </div>
    </div>
  );
}
