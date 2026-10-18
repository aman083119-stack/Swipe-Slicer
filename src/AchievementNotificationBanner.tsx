import React from 'react';
import { Trophy } from 'lucide-react';
import { AchievementNotificationItem } from './types';

interface AchievementNotificationBannerProps {
  notification: AchievementNotificationItem | null;
}

export function AchievementNotificationBanner({
  notification
}: AchievementNotificationBannerProps) {
  if (!notification) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ease-out animate-in slide-in-from-top-6 fade-in"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-950/90 border border-amber-500/40 rounded-xl shadow-2xl backdrop-blur-md max-w-sm sm:max-w-md">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Achievement Unlocked!
            </span>
          </div>
          <h4 className="text-xs font-semibold text-zinc-100 truncate">
            {notification.title}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate">
            {notification.description}
          </p>
        </div>
      </div>
    </div>
  );
}
