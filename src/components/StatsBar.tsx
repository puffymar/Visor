'use client';

import { GlobalStats } from '@/lib/types';
import { Activity, AlertTriangle, Globe2, Flame, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatsBarProps {
  stats: GlobalStats;
  isConnected: boolean;
}

export default function StatsBar({ stats, isConnected }: StatsBarProps) {
  const statItems = [
    {
      icon: Flame,
      label: 'Active Conflicts',
      value: stats.activeConflicts,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    {
      icon: Activity,
      label: 'Events Today',
      value: stats.eventsToday,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      icon: Globe2,
      label: 'Countries',
      value: stats.countriesAffected,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: AlertTriangle,
      label: 'Critical Alerts',
      value: stats.criticalAlerts,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[#0d1117]/80 border-b border-cyan-500/10">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${item.borderColor} ${item.bgColor}`}
          >
            <Icon size={14} className={item.color} />
            <div className="flex items-baseline gap-1.5">
              <span className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</span>
            </div>
          </div>
        );
      })}

      <div className="ml-auto flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] text-gray-500 font-mono uppercase">
            {isConnected ? 'Live' : 'Reconnecting...'}
          </span>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
          <Clock size={10} />
          <span>Updated {formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}
