'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Headline {
  title: string;
  link: string;
  source: string;
  timestamp: string;
}

interface NewsTickerProps {
  headlines: Headline[];
}

export default function NewsTicker({ headlines }: NewsTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;

    let animFrame: number;

    const scroll = () => {
      scrollPosRef.current += 0.5;
      if (scrollPosRef.current >= el.scrollWidth / 2) scrollPosRef.current = 0;
      el.scrollLeft = scrollPosRef.current;
      animFrame = requestAnimationFrame(scroll);
    };

    animFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animFrame);
  }, [isPaused]);

  if (headlines.length === 0) return null;

  // Double the headlines for seamless scrolling
  const doubled = [...headlines, ...headlines];

  return (
    <div className="flex items-center bg-[#0a0e16] border-b border-cyan-500/10 overflow-hidden">
      {/* Label */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border-r border-red-500/20 shrink-0">
        <AlertTriangle size={12} className="text-red-400" />
        <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">Breaking</span>
      </div>

      {/* Scrolling ticker */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex-1 overflow-hidden whitespace-nowrap py-1.5"
      >
        <div className="inline-flex items-center gap-8">
          {doubled.map((h, i) => (
            <a
              key={`${h.title}-${i}`}
              href={h.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <span className="text-[9px] text-cyan-500/50 font-mono uppercase">{h.source}</span>
              <span className="text-gray-600">|</span>
              <span>{h.title}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
