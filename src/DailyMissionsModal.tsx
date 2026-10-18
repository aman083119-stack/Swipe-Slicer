import React, { useState, useEffect } from 'react';
import {
  Calendar,
  X,
  Zap,
  Sparkles,
  Flame,
  Heart,
  Sun,
  Activity,
  Clock,
  Terminal,
  TrendingUp,
  CheckCircle2,
  Gift,
  Lock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { DailyMission, DailyMissionsStore } from './types';
import { claimMissionReward } from './missions';
import { sound } from './sound';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionsStore: DailyMissionsStore;
  onUpdateStore: (newStore: DailyMissionsStore) => void;
  onOpenBladeTrails: () => void;
}

export function DailyMissionsModal({
  isOpen,
  onClose,
  missionsStore,
  onUpdateStore,
  onOpenBladeTrails
}: DailyMissionsModalProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null);

  // Calculate time remaining until midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Escape to close
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

  const renderIcon = (name: string, completed: boolean) => {
    const iconClass = `w-5 h-5 ${completed ? 'text-amber-400' : 'text-zinc-400'}`;
    switch (name) {
      case 'Zap': return <Zap className={iconClass} />;
      case 'Sparkles': return <Sparkles className={iconClass} />;
      case 'Flame': return <Flame className={iconClass} />;
      case 'Heart': return <Heart className={iconClass} />;
      case 'Sun': return <Sun className={iconClass} />;
      case 'Activity': return <Activity className={iconClass} />;
      case 'Clock': return <Clock className={iconClass} />;
      case 'Terminal': return <Terminal className={iconClass} />;
      case 'TrendingUp': return <TrendingUp className={iconClass} />;
      default: return <Gift className={iconClass} />;
    }
  };

  const handleClaim = (mission: DailyMission) => {
    if (!mission.completed || mission.claimed) return;
    sound.playClaimReward();
    setJustClaimedId(mission.id);
    const updated = claimMissionReward(missionsStore, mission.id);
    onUpdateStore(updated);

    setTimeout(() => {
      setJustClaimedId(null);
    }, 1500);
  };

  const unclaimedCount = missionsStore.missions.filter(m => m.completed && !m.claimed).length;
  const currentMultiplier = Math.round((1.0 + missionsStore.claimedMultiplier) * 100) / 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-missions-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 id="daily-missions-modal-title" className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  Daily Missions
                  {unclaimedCount > 0 && (
                    <span className="text-[10px] bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-full font-extrabold uppercase animate-pulse">
                      {unclaimedCount} Ready
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-400">
                  Complete 3 fresh objectives daily for multipliers and style unlocks!
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              aria-label="Close daily missions modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Bar: Active Multiplier & Reset Timer */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-zinc-950/70 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Score Bonus
              </span>
              <span className="font-bold text-amber-400">
                {currentMultiplier}x
              </span>
            </div>
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Resets In
              </span>
              <span className="font-mono font-medium text-cyan-400 text-[11px]">
                {timeRemaining || '--:--:--'}
              </span>
            </div>
          </div>
        </div>

        {/* Mission Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {missionsStore.missions.map((mission, idx) => {
            const isCompleted = mission.completed;
            const isClaimed = mission.claimed;
            const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));

            return (
              <div
                key={mission.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                  isClaimed
                    ? 'bg-zinc-950/40 border-zinc-800/60 opacity-80'
                    : isCompleted
                    ? 'bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Reward Banner */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCompleted
                          ? 'bg-amber-500/20 border-amber-500/40'
                          : 'bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      {renderIcon(mission.iconName, isCompleted)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Objective {idx + 1}
                        </span>
                        {isClaimed && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Claimed
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">
                        {mission.title}
                      </h4>
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 ${
                        mission.rewardType === 'multiplier'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : mission.rewardType === 'theme'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      <Gift className="w-3 h-3" /> {mission.rewardLabel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-3">
                  {mission.description}
                </p>

                {/* Progress bar & Claim button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] mb-1 font-medium">
                      <span className="text-zinc-400">Progress</span>
                      <span className={isCompleted ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                        {mission.progress} / {mission.target} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Action */}
                  <div className="shrink-0 pl-1">
                    {isClaimed ? (
                      <span className="text-xs text-zinc-500 font-medium px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 inline-block">
                        Claimed
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => handleClaim(mission)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md ${
                          justClaimedId === mission.id
                            ? 'bg-emerald-500 text-zinc-950 scale-95'
                            : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 hover:shadow-amber-500/30'
                        }`}
                      >
                        {justClaimedId === mission.id ? 'Claimed!' : 'Claim'}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-500 font-medium px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 inline-block">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick link to Blade Trails modal */}
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-zinc-950 to-zinc-950 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-zinc-200">
                  Custom Blade Trails
                </h5>
                <p className="text-[11px] text-zinc-400">
                  {missionsStore.unlockedTrails.length} styles unlocked
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenBladeTrails();
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              Equip Trails <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/70 flex justify-between items-center text-xs text-zinc-400">
          <span>Daily objectives update every midnight</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
