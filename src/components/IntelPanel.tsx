'use client';

import { IntelLink } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, FileWarning, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const SEV_STYLE: Record<string, { border: string; badge: string; text: string }> = {
  critical: { border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'text-red-400' },
  high:     { border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', text: 'text-orange-400' },
  medium:   { border: 'border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'text-yellow-400' },
  low:      { border: 'border-green-500/30', badge: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'text-green-400' },
};

interface IntelPanelProps {
  links: IntelLink[];
  onClose: () => void;
}

export default function IntelPanel({ links, onClose }: IntelPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0a0e16]/98 border-l border-cyan-500/20 backdrop-blur-xl z-50 flex flex-col shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/15 bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <FileWarning size={16} className="text-amber-400" />
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider">Intel Links</h2>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono">
            {links.length}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-colors">
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {links.sort((a, b) => {
          const ord = { critical: 0, high: 1, medium: 2, low: 3 };
          return ord[a.severity] - ord[b.severity];
        }).map(link => {
          const s = SEV_STYLE[link.severity];
          const isOpen = expanded === link.id;
          return (
            <div key={link.id} className={`border ${s.border} rounded-lg bg-white/[0.02] overflow-hidden`}>
              <button
                onClick={() => setExpanded(isOpen ? null : link.id)}
                className="w-full text-left p-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${s.badge}`}>
                    {link.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-white/90 leading-tight">{link.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500 font-mono">{link.source}</span>
                      <span className="text-[10px] text-cyan-500/60 font-mono">
                        {formatDistanceToNow(new Date(link.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={14} className="text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-500 shrink-0" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 border-t border-white/5">
                  <p className="text-xs text-gray-400 leading-relaxed mt-2 mb-3">{link.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono">{link.region}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/5 border border-cyan-500/15 rounded px-2 py-1 font-mono"
                    >
                      <ExternalLink size={10} />
                      Open Source
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
