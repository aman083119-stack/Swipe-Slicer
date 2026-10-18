import React, { useEffect } from 'react';
import { X, Palette, Check, Lock, Sparkles, Sun, Shuffle } from 'lucide-react';
import { Theme } from './types';
import { ALL_THEMES, UNLOCKABLE_THEMES, getThemeForDay } from './themes';
import { sound } from './sound';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: Theme;
  unlockedThemeIds: string[];
  onSelectTheme: (theme: Theme, isDailyAuto: boolean) => void;
  isDailyAuto: boolean;
}

export function ThemeSelectorModal({
  isOpen,
  onClose,
  activeTheme,
  unlockedThemeIds,
  onSelectTheme,
  isDailyAuto
}: ThemeSelectorModalProps) {
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

  const dailyTheme = getThemeForDay();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 id="theme-modal-title" className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Themes & Colors
              </h3>
              <p className="text-xs text-zinc-400">
                Choose your aesthetic or unlock exclusive styles via Daily Missions!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Close themes modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* Daily Rotating Option */}
          <div
            onClick={() => {
              sound.playEquipTrail();
              onSelectTheme(dailyTheme, true);
            }}
            className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
              isDailyAuto
                ? 'bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Shuffle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-zinc-100">
                    Daily Rotating Theme
                  </h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    Auto ({dailyTheme.name})
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate">
                  Automatically changes every day of the week.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {isDailyAuto ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Select
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-1">
              All Themes & Unlocks
            </span>
          </div>

          {/* List of all themes */}
          {ALL_THEMES.map((theme) => {
            const unlockable = UNLOCKABLE_THEMES.find(u => u.name === theme.name);
            const isUnlocked = !unlockable || unlockedThemeIds.includes(unlockable.id);
            const isCurrent = !isDailyAuto && activeTheme.name === theme.name;

            return (
              <div
                key={theme.name}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border-purple-500/60 shadow-lg shadow-purple-500/10'
                    : isUnlocked
                    ? 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    : 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Swatch dots */}
                  <div className="flex gap-1 shrink-0 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                    {theme.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}66` }}
                      />
                    ))}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-zinc-100 truncate">
                        {theme.name}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {theme.desc}
                    </p>
                    {!isUnlocked && unlockable && (
                      <span className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-0.5 font-medium">
                        <Lock className="w-3 h-3" /> {unlockable.unlockHint}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isCurrent ? (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => {
                        sound.playEquipTrail();
                        onSelectTheme(theme, false);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-purple-300 transition-colors cursor-pointer border border-zinc-700"
                    >
                      Equip
                    </button>
                  ) : (
                    <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
