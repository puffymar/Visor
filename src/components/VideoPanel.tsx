'use client';

import { useState } from 'react';
import { VideoFeed } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  Play,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Video,
  X,
  Maximize2,
} from 'lucide-react';

interface VideoPanelProps {
  videos: VideoFeed[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function VideoPanel({ videos, isExpanded, onToggle }: VideoPanelProps) {
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  return (
    <div className={`
      flex flex-col transition-all duration-300 ease-out
      ${isExpanded ? 'w-80' : 'w-14'}
      bg-[#0d1117]/95 border-l border-cyan-500/20
      ${!isExpanded ? 'shadow-[-4px_0_12px_rgba(0,200,255,0.15)]' : ''}
    `}>
      {/* Toggle tab — always clickable; pops out when minimized */}
      <button
        onClick={onToggle}
        className={`
          flex items-center justify-center gap-2 p-3 border-b border-cyan-500/10
          transition-all min-h-[52px]
          ${isExpanded
            ? 'hover:bg-white/5'
            : 'hover:bg-cyan-500/15 hover:border-cyan-500/30 bg-cyan-500/5'
          }
        `}
        title={isExpanded ? 'Collapse Live Feeds' : 'Expand Live Feeds'}
      >
        {isExpanded ? (
          <>
            <ChevronRight size={16} className="text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Live Feeds</span>
          </>
        ) : (
          <>
            <Video size={18} className="text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">LIVE</span>
          </>
        )}
      </button>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {videos.map(video => {
            const isVideoExpanded = expandedVideo === video.id;
            return (
              <div
                key={video.id}
                className="group border border-white/5 rounded-lg overflow-hidden hover:border-cyan-500/20 transition-all duration-300"
              >
                {/* Thumbnail area */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Video size={24} className="text-gray-600" />
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/80 text-white px-1.5 py-0.5 rounded font-mono">
                      {video.duration}
                    </span>
                  )}
                  <span className="absolute top-2 left-2 text-[9px] bg-red-500/80 text-white px-1.5 py-0.5 rounded font-mono uppercase">
                    {video.region}
                  </span>

                  {/* Play overlay */}
                  <button
                    onClick={() => setExpandedVideo(isVideoExpanded ? null : video.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center backdrop-blur-sm">
                      {isVideoExpanded ? <X size={16} className="text-cyan-400" /> : <Play size={16} className="text-cyan-400 ml-0.5" />}
                    </div>
                  </button>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <h4 className="text-xs text-white/90 font-medium leading-tight mb-1 line-clamp-2">
                    {video.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">{video.source}</span>
                    <span className="text-[10px] text-cyan-500/60 font-mono">
                      {formatDistanceToNow(new Date(video.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Expanded video view */}
                {isVideoExpanded && (
                  <div className="border-t border-white/5 p-2.5 bg-black/30">
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors p-2 rounded bg-cyan-500/5 border border-cyan-500/10"
                    >
                      <ExternalLink size={12} />
                      <span>Watch on {video.source}</span>
                      <Maximize2 size={10} className="ml-auto" />
                    </a>
                    <div className="flex gap-1 mt-2">
                      <button className="flex-1 text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-gray-400 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                        <ChevronDown size={10} />
                        Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
