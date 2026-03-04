'use client';

import { Globe2, MapPin } from 'lucide-react';

const REGIONS = ['All', 'Middle East', 'Eastern Europe', 'Africa', 'Southeast Asia'] as const;
type Region = (typeof REGIONS)[number];

interface RegionFilterProps {
  selected: string;
  onChange: (region: string) => void;
  eventCounts: Record<string, number>;
}

export default function RegionFilter({ selected, onChange, eventCounts }: RegionFilterProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-white/[0.02] rounded-lg border border-white/5">
      {REGIONS.map(region => {
        const count = region === 'All'
          ? Object.values(eventCounts).reduce((a, b) => a + b, 0)
          : eventCounts[region] || 0;
        const isActive = selected === region;

        return (
          <button
            key={region}
            onClick={() => onChange(region)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-200
              ${isActive
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-500 hover:text-gray-400 hover:bg-white/5 border border-transparent'
              }
            `}
          >
            {region === 'All' ? <Globe2 size={11} /> : <MapPin size={11} />}
            <span>{region}</span>
            <span className={`text-[9px] px-1 py-0.5 rounded ${isActive ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
