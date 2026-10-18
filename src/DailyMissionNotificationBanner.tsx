import React from 'react';
import { Calendar, Gift, Sparkles } from 'lucide-react';
import { DailyMission } from './types';

interface DailyMissionNotificationBannerProps {
  mission: DailyMission | null;
  onOpenMissions?: () => void;
}

export function DailyMissionNotificationBanner({
  mission,
  onOpenMissions
}: DailyMissionNotificationBannerProps) {
  if (!mission) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-300 ease-out animate-in slide-in-from-top-6 fade-in cursor-pointer"
      onClick={onOpenMissions}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-950/95 border border-emerald-500/50 rounded-xl shadow-2xl backdrop-blur-md max-w-sm sm:max-w-md hover:border-emerald-400 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Daily Mission Complete!
            </span>
          </div>
          <h4 className="text-xs font-semibold text-zinc-100 truncate">
            {mission.title}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate">
            Reward: <span className="text-amber-300 font-medium">{mission.rewardLabel}</span> (Tap to view)
          </p>
        </div>
      </div>
    </div>
  );
}
