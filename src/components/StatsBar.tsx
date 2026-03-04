'use client';

import { GlobalStats } from '@/lib/types';
import { Activity, AlertTriangle, Globe2, Flame, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatsBarProps {
  stats: GlobalStats;
  isConnected: boolean;
  onCriticalClick?: () => void;
}

export default function StatsBar({ stats, isConnected, onCriticalClick }: StatsBarProps) {
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
    <div className="flex items-center gap-1.5 md:gap-4 px-2 md:px-4 py-2 bg-[#0d1117]/80 border-b border-cyan-500/10 overflow-x-auto overflow-y-hidden scrollbar-hide">
      {statItems.map((item) => {
        const Icon = item.icon;
        const isCritical = item.label === 'Critical Alerts';
        const El = isCritical && onCriticalClick ? 'button' : 'div';
        return (
          <El
            key={item.label}
            onClick={isCritical && onCriticalClick ? onCriticalClick : undefined}
            className={`flex items-center gap-1 md:gap-2 px-1.5 md:px-3 py-1.5 rounded-md border shrink-0 ${item.borderColor} ${item.bgColor} ${isCritical && onCriticalClick ? 'cursor-pointer hover:ring-1 hover:ring-amber-400/40 transition-all min-h-[40px] md:min-h-0' : ''}`}
          >
            <Icon size={12} className={`${item.color} shrink-0 md:w-3.5 md:h-3.5`} />
            <div className="flex flex-col md:flex-row md:items-baseline gap-0 md:gap-1.5">
              <span className={`text-sm md:text-lg font-bold font-mono leading-tight ${item.color}`}>{item.value}</span>
              <span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-wider leading-tight">{item.label}</span>
            </div>
          </El>
        );
      })}

      <div className="ml-auto flex items-center gap-1.5 md:gap-3 shrink-0">
        {/* Connection status */}
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase">
            {isConnected ? 'Live' : 'Reconnecting...'}
          </span>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-gray-500 font-mono">
          <Clock size={10} className="shrink-0" />
          <span className="whitespace-nowrap">{formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}
