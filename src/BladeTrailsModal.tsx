import React, { useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Flame,
  Heart,
  Sun,
  Activity,
  Terminal,
  Check,
  Lock,
  Swords
} from 'lucide-react';
import { BladeTrailConfig } from './types';
import { BLADE_TRAILS } from './bladeTrails';
import { sound } from './sound';

interface BladeTrailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedTrailIds: string[];
  equippedTrailId: string;
  onEquipTrail: (trailId: string) => void;
}

export function BladeTrailsModal({
  isOpen,
  onClose,
  unlockedTrailIds,
  equippedTrailId,
  onEquipTrail
}: BladeTrailsModalProps) {
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

  const renderIcon = (name: string, isEquipped: boolean) => {
    const iconClass = `w-5 h-5 ${isEquipped ? 'text-cyan-400' : 'text-zinc-400'}`;
    switch (name) {
      case 'Zap': return <Zap className={iconClass} />;
      case 'Flame': return <Flame className={iconClass} />;
      case 'Sparkles': return <Sparkles className={iconClass} />;
      case 'Activity': return <Activity className={iconClass} />;
      case 'Heart': return <Heart className={iconClass} />;
      case 'Sun': return <Sun className={iconClass} />;
      case 'Terminal': return <Terminal className={iconClass} />;
      default: return <Swords className={iconClass} />;
    }
  };

  const handleEquip = (trail: BladeTrailConfig) => {
    sound.playEquipTrail();
    onEquipTrail(trail.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blade-trails-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="blade-trails-modal-title" className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Blade Trails
              </h3>
              <p className="text-xs text-zinc-400">
                Unlock dynamic swipe flourishes, embers, and lightning sparks!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Close blade trails modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trail List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {BLADE_TRAILS.map((trail) => {
            const isUnlocked = unlockedTrailIds.includes(trail.id);
            const isEquipped = equippedTrailId === trail.id;

            return (
              <div
                key={trail.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                  isEquipped
                    ? 'bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : isUnlocked
                    ? 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    : 'bg-zinc-950/40 border-zinc-800/60 opacity-65'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Trail Color / Icon preview */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border relative overflow-hidden"
                    style={{
                      background: `radial-gradient(circle, ${trail.primaryColor}22 0%, #09090b 100%)`,
                      borderColor: isEquipped ? trail.primaryColor : '#27272a'
                    }}
                  >
                    {renderIcon(trail.iconName, isEquipped)}
                    {/* Glowing Accent Pill */}
                    <div
                      className="absolute bottom-1 w-5 h-1 rounded-full shadow-sm"
                      style={{
                        backgroundColor: trail.primaryColor,
                        boxShadow: `0 0 6px ${trail.primaryColor}`
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-zinc-100 truncate">
                        {trail.name}
                      </h4>
                      {isEquipped && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                          Equipped
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {trail.description}
                    </p>
                    {!isUnlocked && (
                      <span className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-0.5 font-medium">
                        <Lock className="w-3 h-3" /> {trail.unlockHint}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {isEquipped ? (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleEquip(trail)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-cyan-300 transition-colors cursor-pointer border border-zinc-700"
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
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/70 flex justify-between items-center text-xs text-zinc-400">
          <span>{unlockedTrailIds.length} of {BLADE_TRAILS.length} Blade Trails unlocked</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
