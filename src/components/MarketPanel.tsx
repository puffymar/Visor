'use client';

import { MarketImpactAssessment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { X, BarChart3, ExternalLink, TrendingUp } from 'lucide-react';

interface MarketPanelProps {
  marketImpacts: MarketImpactAssessment[];
  onClose: () => void;
}

const TRADING_LINKS = [
  { name: 'TradingView', url: 'https://www.tradingview.com', desc: 'Charts & analysis' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com', desc: 'Market data' },
  { name: 'Bloomberg', url: 'https://www.bloomberg.com/markets', desc: 'Markets & news' },
  { name: 'Reuters Markets', url: 'https://www.reuters.com/markets', desc: 'Real-time quotes' },
];

export default function MarketPanel({ marketImpacts, onClose }: MarketPanelProps) {
  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop — click to minimize */}
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close market panel"
      />
      <div className="absolute inset-y-0 right-0 w-[420px] bg-[#0a0e16]/98 border-l border-emerald-500/20 backdrop-blur-xl flex flex-col shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20 bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-400" />
            <h2 className="text-sm font-bold font-mono text-emerald-400 uppercase tracking-wider">Trading & Market</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400/80 hover:text-emerald-400 text-xs font-mono transition-colors"
          >
            <X size={14} />
            Minimize
          </button>
        </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Go to trading section */}
        <div>
          <h3 className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} />
            Trading Platforms
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {TRADING_LINKS.map(link => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group"
              >
                <ExternalLink size={12} className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate">{link.name}</div>
                  <div className="text-[10px] text-gray-500">{link.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Market impact assessments */}
        <div>
          <h3 className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-2">
            Conflict → Market Impact
          </h3>
          <div className="space-y-3">
            {marketImpacts.map(m => (
              <div key={m.id} className="border border-emerald-500/20 rounded-lg bg-emerald-500/5 p-3">
                <h4 className="text-xs font-medium text-white leading-tight mb-2">{m.headline}</h4>
                <div className="text-[11px] font-mono text-emerald-400 mb-1.5">{m.impact}</div>
                {m.indices && (
                  <div className="text-[10px] text-cyan-400/80 font-mono mb-1.5">{m.indices}</div>
                )}
                <p className="text-[11px] text-gray-400 leading-relaxed mb-2">{m.reasoning}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono uppercase ${
                    m.confidence === 'high' ? 'text-green-400' : m.confidence === 'medium' ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {m.confidence} confidence
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">
                    {formatDistanceToNow(new Date(m.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
