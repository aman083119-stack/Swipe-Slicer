import React, { useState, useEffect } from 'react';
import {
  Trophy,
  X,
  Bomb,
  Flame,
  ShieldAlert,
  Zap,
  Sparkles,
  Swords,
  Crown,
  Target,
  Activity,
  Award,
  Star,
  Crosshair,
  CheckCircle2,
  Medal,
  Lock,
  TrendingUp
} from 'lucide-react';
import { Achievement, AchievementProgressStore } from './types';
import { ACHIEVEMENTS, getAchievementState } from './achievements';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressStore: AchievementProgressStore;
  currentRun?: { combo: number; streak: number; score: number };
}

export function AchievementsModal({
  isOpen,
  onClose,
  progressStore,
  currentRun
}: AchievementsModalProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderIcon = (name: string, unlocked: boolean) => {
    const iconProps = {
      className: `w-5 h-5 ${unlocked ? 'text-amber-400' : 'text-zinc-500'}`
    };

    switch (name) {
      case 'Bomb':
        return <Bomb {...iconProps} />;
      case 'Flame':
        return <Flame {...iconProps} />;
      case 'ShieldAlert':
        return <ShieldAlert {...iconProps} />;
      case 'Zap':
        return <Zap {...iconProps} />;
      case 'Sparkles':
        return <Sparkles {...iconProps} />;
      case 'Swords':
        return <Swords {...iconProps} />;
      case 'Crown':
        return <Crown {...iconProps} />;
      case 'Target':
        return <Target {...iconProps} />;
      case 'Activity':
        return <Activity {...iconProps} />;
      case 'Award':
        return <Award {...iconProps} />;
      case 'TrendingUp':
        return <TrendingUp {...iconProps} />;
      case 'Star':
        return <Star {...iconProps} />;
      case 'Trophy':
        return <Trophy {...iconProps} />;
      case 'Crosshair':
        return <Crosshair {...iconProps} />;
      case 'CheckCircle2':
        return <CheckCircle2 {...iconProps} />;
      case 'Medal':
        return <Medal {...iconProps} />;
      default:
        return <Award {...iconProps} />;
    }
  };

  const achievementsWithState = ACHIEVEMENTS.map((ach) => {
    const state = getAchievementState(ach, progressStore, currentRun);
    return { ach, state };
  });

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = achievementsWithState.filter((item) => item.state.unlocked).length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  const filteredItems = achievementsWithState.filter(({ state }) => {
    if (filter === 'unlocked') return state.unlocked;
    if (filter === 'locked') return !state.unlocked;
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 id="achievements-title" className="text-lg font-bold text-zinc-100 tracking-tight">
                Achievements
              </h2>
              <p className="text-xs text-zinc-400">
                {unlockedCount} of {totalCount} Unlocked · {completionPercentage}% Completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close achievements modal"
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="px-6 pt-4 pb-2 bg-zinc-900/20">
          <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
            <span>Overall Progress</span>
            <span className="font-mono tabular-nums text-amber-400 font-semibold">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="px-6 py-3 border-b border-zinc-800/60 bg-zinc-950 flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'unlocked'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'locked'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Locked ({totalCount - unlockedCount})
          </button>
        </div>

        {/* Achievements List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 divide-y divide-zinc-900">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No achievements found in this view.
            </div>
          ) : (
            filteredItems.map(({ ach, state }) => {
              const current = Math.min(state.currentValue, ach.targetValue);
              const pct = Math.min(100, Math.round((current / ach.targetValue) * 100));

              return (
                <div
                  key={ach.id}
                  className={`pt-3 first:pt-0 flex items-start gap-4 transition-opacity ${
                    state.unlocked ? 'opacity-100' : 'opacity-85'
                  }`}
                >
                  <div
                    className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border transition-colors ${
                      state.unlocked
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-sm'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {renderIcon(ach.iconName, state.unlocked)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-100 truncate">
                          {ach.title}
                        </h3>
                        {state.unlocked && (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono tabular-nums text-zinc-400 shrink-0">
                        {current.toLocaleString()} / {ach.targetValue.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                      {ach.description}
                    </p>

                    {/* Milestone Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            state.unlocked
                              ? 'bg-amber-400'
                              : 'bg-zinc-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-zinc-500 shrink-0 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
