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
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface FocusPanelProps {
  event: ConflictEvent | null;
  onClose: () => void;
  checked?: boolean;
  onCheck?: () => void;
}

export default function FocusPanel({ event, onClose, checked = false, onCheck }: FocusPanelProps) {
  if (!event) return null;

  const severityColor = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
  }[event.severity];

  return (
    <div className="w-80 flex flex-col border-l border-cyan-500/20 bg-[#0a0e16]/95 backdrop-blur-md">
      <div className="flex items-center justify-between p-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
            FOCUS / CHECK
          </span>
          {checked && (
            <CheckCircle2 size={14} className="text-green-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {onCheck && (
            <button
              onClick={onCheck}
              className={`p-1.5 rounded-md border text-xs font-mono transition-all ${
                checked
                  ? 'border-green-500/40 bg-green-500/20 text-green-400'
                  : 'border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400'
              }`}
            >
              {checked ? 'CHECKED' : 'CHECK'}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase ${severityColor}`}>
            {event.severity}
          </span>
          <span className="text-[10px] text-gray-500 font-mono uppercase">
            {event.type.replace('_', ' ')}
          </span>
          {event.ongoing && (
            <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        <h2 className="text-base font-semibold text-white leading-tight">{event.title}</h2>
        <p className="text-sm text-gray-400 leading-relaxed">{event.description}</p>

        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
            <MapPin size={14} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Location</div>
              <div className="text-sm text-gray-300">{event.country} — {event.region}</div>
              <div className="text-[10px] text-gray-600 font-mono mt-1">
                {event.lat.toFixed(4)}°N, {event.lng.toFixed(4)}°E
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
            <Clock size={14} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Time</div>
              <div className="text-sm text-gray-300">
                {format(new Date(event.timestamp), 'HH:mm:ss')} ({formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })})
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
            <Shield size={14} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Source</div>
              <div className="text-sm text-gray-300">{event.source}</div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
            <AlertTriangle size={14} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Status</div>
              <div className={`text-sm ${event.ongoing ? 'text-red-400' : 'text-green-400'}`}>
                {event.ongoing ? 'Ongoing' : 'Concluded'}
              </div>
            </div>
          </div>
        </div>

        {(event.estimatedCasualties || event.estimatedDamage) && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame size={12} />
              Impact Assessment
            </h3>
            {event.estimatedCasualties && (
              <div className="text-sm text-gray-300 bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
                <span className="text-red-400 font-medium">Casualties:</span> {event.estimatedCasualties}
              </div>
            )}
            {event.estimatedDamage && (
              <div className="text-sm text-gray-300 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5">
                <span className="text-amber-400 font-medium">Damage:</span> {event.estimatedDamage}
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Users size={12} />
            Parties Involved
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {event.parties.map(p => (
              <span key={p} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-300">
                {p}
              </span>
            ))}
          </div>
        </div>

        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10"
        >
          <ExternalLink size={14} />
          <span>View source: {event.source}</span>
        </a>
      </div>
    </div>
  );
}
