import { DailyMission, DailyMissionsStore } from './types';
import { safeStorage } from './storage';

export const MISSION_TEMPLATES: Omit<DailyMission, 'id' | 'progress' | 'completed' | 'claimed'>[] = [
  {
    title: 'Azure Surge',
    description: 'Slice 20 Blue or Cyan shapes.',
    type: 'slice_color',
    colorKey: 'blue',
    target: 20,
    rewardType: 'multiplier',
    rewardValue: 0.25,
    rewardLabel: '+0.25x Score Multiplier',
    iconName: 'Zap'
  },
  {
    title: 'Emerald Cleave',
    description: 'Slice 20 Green shapes.',
    type: 'slice_color',
    colorKey: 'green',
    target: 20,
    rewardType: 'theme',
    rewardValue: 'theme_emerald',
    rewardLabel: 'Emerald Glade Theme',
    iconName: 'Sparkles'
  },
  {
    title: 'Magenta Blossom',
    description: 'Slice 20 Pink or Rose shapes.',
    type: 'slice_color',
    colorKey: 'pink',
    target: 20,
    rewardType: 'blade_trail',
    rewardValue: 'trail_sakura',
    rewardLabel: 'Sakura Petals Blade Trail',
    iconName: 'Heart'
  },
  {
    title: 'Amber Harvest',
    description: 'Slice 25 Amber or Gold shapes.',
    type: 'slice_color',
    colorKey: 'amber',
    target: 25,
    rewardType: 'blade_trail',
    rewardValue: 'trail_embers',
    rewardLabel: 'Neon Embers Blade Trail',
    iconName: 'Flame'
  },
  {
    title: 'Violet Vortex',
    description: 'Slice 20 Purple or Violet shapes.',
    type: 'slice_color',
    colorKey: 'purple',
    target: 20,
    rewardType: 'multiplier',
    rewardValue: 0.25,
    rewardLabel: '+0.25x Score Multiplier',
    iconName: 'Zap'
  },
  {
    title: 'Danger Slicer',
    description: 'Slice 10 Live Bombs without detonating.',
    type: 'slice_bombs',
    target: 10,
    rewardType: 'blade_trail',
    rewardValue: 'trail_lightning',
    rewardLabel: 'Lightning Sparks Trail',
    iconName: 'Activity'
  },
  {
    title: 'Prismatic Sequence',
    description: 'Achieve a 6x Combo or higher in a single swipe.',
    type: 'reach_combo',
    target: 6,
    rewardType: 'blade_trail',
    rewardValue: 'trail_rainbow',
    rewardLabel: 'Rainbow Prism Trail',
    iconName: 'Sparkles'
  },
  {
    title: 'Precision Flow',
    description: 'Build a streak of 35 consecutive slices.',
    type: 'reach_streak',
    target: 35,
    rewardType: 'theme',
    rewardValue: 'theme_solar',
    rewardLabel: 'Solar Flare Theme',
    iconName: 'Sun'
  },
  {
    title: 'High Caliber',
    description: 'Score 3,000 points in a single run.',
    type: 'score_single_run',
    target: 3000,
    rewardType: 'multiplier',
    rewardValue: 0.50,
    rewardLabel: '+0.50x Score Multiplier',
    iconName: 'TrendingUp'
  },
  {
    title: 'Grand Cleaver',
    description: 'Slice 75 total shapes today.',
    type: 'total_shapes',
    target: 75,
    rewardType: 'blade_trail',
    rewardValue: 'trail_solar',
    rewardLabel: 'Solar Flare Blade Trail',
    iconName: 'Sun'
  },
  {
    title: 'Chrono Specialist',
    description: 'Activate Slo-Mo 3 times by slicing clocks.',
    type: 'slice_slomo',
    target: 3,
    rewardType: 'theme',
    rewardValue: 'theme_obsidian',
    rewardLabel: 'Obsidian Void Theme',
    iconName: 'Clock'
  },
  {
    title: 'Matrix Overload',
    description: 'Slice 100 total shapes today.',
    type: 'total_shapes',
    target: 100,
    rewardType: 'blade_trail',
    rewardValue: 'trail_matrix',
    rewardLabel: 'Cyber Code Blade Trail',
    iconName: 'Terminal'
  },
  {
    title: 'Retro Revival',
    description: 'Build a streak of 45 consecutive slices.',
    type: 'reach_streak',
    target: 45,
    rewardType: 'theme',
    rewardValue: 'theme_vaporwave',
    rewardLabel: 'Vaporwave Retro Theme',
    iconName: 'Sparkles'
  }
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministic pseudo-random generator based on date string
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates 3 balanced daily missions for the specified date
 */
export function generateDailyMissions(dateStr: string): DailyMission[] {
  const baseSeed = hashString(dateStr);
  const shuffled = [...MISSION_TEMPLATES];

  // Shuffle based on seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(baseSeed + i * 17) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Ensure variety in reward types if possible:
  // We prefer 1 multiplier, 1 theme, and 1 blade_trail
  const chosen: DailyMission[] = [];
  const usedRewardTypes = new Set<string>();

  for (const t of shuffled) {
    if (chosen.length >= 3) break;
    if (!usedRewardTypes.has(t.rewardType)) {
      usedRewardTypes.add(t.rewardType);
      chosen.push({
        id: `mission_${dateStr}_${t.type}_${chosen.length + 1}`,
        title: t.title,
        description: t.description,
        type: t.type,
        colorKey: t.colorKey,
        target: t.target,
        progress: 0,
        completed: false,
        claimed: false,
        rewardType: t.rewardType,
        rewardValue: t.rewardValue,
        rewardLabel: t.rewardLabel,
        iconName: t.iconName
      });
    }
  }

  // Fill up if fewer than 3 were picked
  for (const t of shuffled) {
    if (chosen.length >= 3) break;
    if (!chosen.some(c => c.title === t.title)) {
      chosen.push({
        id: `mission_${dateStr}_${t.type}_${chosen.length + 1}`,
        title: t.title,
        description: t.description,
        type: t.type,
        colorKey: t.colorKey,
        target: t.target,
        progress: 0,
        completed: false,
        claimed: false,
        rewardType: t.rewardType,
        rewardValue: t.rewardValue,
        rewardLabel: t.rewardLabel,
        iconName: t.iconName
      });
    }
  }

  return chosen;
}

const MISSIONS_STORAGE_KEY = 'swipeslicermissions';

export function loadDailyMissionsStore(): DailyMissionsStore {
  const todayStr = getTodayDateString();
  const defaultStore: DailyMissionsStore = {
    date: todayStr,
    missions: generateDailyMissions(todayStr),
    claimedMultiplier: 0,
    unlockedThemes: [],
    unlockedTrails: ['trail_cyan'],
    equippedTrailId: 'trail_cyan'
  };

  try {
    const raw = safeStorage.getItem(MISSIONS_STORAGE_KEY);
    if (!raw) return defaultStore;
    const parsed: Partial<DailyMissionsStore> = JSON.parse(raw);

    // If day changed, roll fresh missions while retaining unlocked items and trails
    if (parsed.date !== todayStr) {
      return {
        date: todayStr,
        missions: generateDailyMissions(todayStr),
        claimedMultiplier: 0, // Daily multiplier resets each day
        unlockedThemes: parsed.unlockedThemes || [],
        unlockedTrails: parsed.unlockedTrails || ['trail_cyan'],
        equippedTrailId: parsed.equippedTrailId || 'trail_cyan'
      };
    }

    return {
      date: todayStr,
      missions: Array.isArray(parsed.missions) && parsed.missions.length === 3 ? parsed.missions : generateDailyMissions(todayStr),
      claimedMultiplier: typeof parsed.claimedMultiplier === 'number' ? parsed.claimedMultiplier : 0,
      unlockedThemes: parsed.unlockedThemes || [],
      unlockedTrails: parsed.unlockedTrails || ['trail_cyan'],
      equippedTrailId: parsed.equippedTrailId || 'trail_cyan'
    };
  } catch {
    return defaultStore;
  }
}

export function saveDailyMissionsStore(store: DailyMissionsStore): void {
  try {
    safeStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

/**
 * Classifies a color hex into one of the main mission color keys
 */
export function classifyColor(hex: string): 'blue' | 'green' | 'pink' | 'amber' | 'purple' {
  const h = hex.toLowerCase();
  // Cyan / Blue / Indigo
  if (['#3b82f6', '#06b6d4', '#38bdf8', '#0284c7', '#6366f1', '#14b8a6'].includes(h)) {
    return 'blue';
  }
  // Green / Emerald
  if (['#10b981', '#22c55e', '#16a34a', '#86efac'].includes(h)) {
    return 'green';
  }
  // Pink / Rose / Red
  if (['#ec4899', '#f43f5e', '#f472b6', '#e11d48', '#fb7185', '#ef4444'].includes(h)) {
    return 'pink';
  }
  // Amber / Yellow / Orange
  if (['#f59e0b', '#fbbf24', '#f97316', '#eab308', '#fef08a'].includes(h)) {
    return 'amber';
  }
  // Purple / Violet
  if (['#8b5cf6', '#a78bfa', '#a855f7', '#c084fc'].includes(h)) {
    return 'purple';
  }
  return 'blue';
}

/**
 * Evaluates game events against active daily missions
 */
export function checkMissionProgress(
  store: DailyMissionsStore,
  event: {
    type: 'slice_shape' | 'slice_bomb' | 'slice_slomo' | 'combo' | 'streak' | 'score';
    color?: string;
    value?: number;
  }
): { updatedStore: DailyMissionsStore; newlyCompleted: DailyMission[] } {
  const todayStr = getTodayDateString();
  // Ensure store is for today
  let currentStore = store;
  if (currentStore.date !== todayStr) {
    currentStore = {
      date: todayStr,
      missions: generateDailyMissions(todayStr),
      claimedMultiplier: 0,
      unlockedThemes: store.unlockedThemes,
      unlockedTrails: store.unlockedTrails,
      equippedTrailId: store.equippedTrailId
    };
  }

  const newlyCompleted: DailyMission[] = [];
  let changed = false;

  const updatedMissions = currentStore.missions.map(mission => {
    if (mission.completed) return mission;

    let newProgress = mission.progress;

    if (event.type === 'slice_shape' && mission.type === 'total_shapes') {
      newProgress += 1;
      changed = true;
    } else if (event.type === 'slice_shape' && mission.type === 'slice_color' && event.color) {
      const colorCategory = classifyColor(event.color);
      if (mission.colorKey === colorCategory) {
        newProgress += 1;
        changed = true;
      }
    } else if (event.type === 'slice_bomb' && mission.type === 'slice_bombs') {
      newProgress += 1;
      changed = true;
    } else if (event.type === 'slice_slomo' && mission.type === 'slice_slomo') {
      newProgress += 1;
      changed = true;
    } else if (event.type === 'combo' && mission.type === 'reach_combo' && event.value) {
      if (event.value > newProgress) {
        newProgress = event.value;
        changed = true;
      }
    } else if (event.type === 'streak' && mission.type === 'reach_streak' && event.value) {
      if (event.value > newProgress) {
        newProgress = event.value;
        changed = true;
      }
    } else if (event.type === 'score' && mission.type === 'score_single_run' && event.value) {
      if (event.value > newProgress) {
        newProgress = event.value;
        changed = true;
      }
    }

    const completed = newProgress >= mission.target;
    if (completed && !mission.completed) {
      newlyCompleted.push({
        ...mission,
        progress: Math.min(newProgress, mission.target),
        completed: true
      });
      changed = true;
      return {
        ...mission,
        progress: Math.min(newProgress, mission.target),
        completed: true
      };
    }

    if (newProgress !== mission.progress) {
      return {
        ...mission,
        progress: newProgress
      };
    }

    return mission;
  });

  if (!changed) {
    return { updatedStore: currentStore, newlyCompleted: [] };
  }

  const updatedStore: DailyMissionsStore = {
    ...currentStore,
    missions: updatedMissions
  };

  saveDailyMissionsStore(updatedStore);
  return { updatedStore, newlyCompleted };
}

/**
 * Claims reward for a completed mission
 */
export function claimMissionReward(
  store: DailyMissionsStore,
  missionId: string
): DailyMissionsStore {
  const mission = store.missions.find(m => m.id === missionId);
  if (!mission || !mission.completed || mission.claimed) return store;

  let newMultiplier = store.claimedMultiplier;
  const newThemes = [...store.unlockedThemes];
  const newTrails = [...store.unlockedTrails];

  if (mission.rewardType === 'multiplier' && typeof mission.rewardValue === 'number') {
    newMultiplier = Math.round((newMultiplier + mission.rewardValue) * 100) / 100;
  } else if (mission.rewardType === 'theme' && typeof mission.rewardValue === 'string') {
    if (!newThemes.includes(mission.rewardValue)) {
      newThemes.push(mission.rewardValue);
    }
  } else if (mission.rewardType === 'blade_trail' && typeof mission.rewardValue === 'string') {
    if (!newTrails.includes(mission.rewardValue)) {
      newTrails.push(mission.rewardValue);
    }
  }

  const updatedMissions = store.missions.map(m =>
    m.id === missionId ? { ...m, claimed: true } : m
  );

  const updatedStore: DailyMissionsStore = {
    ...store,
    missions: updatedMissions,
    claimedMultiplier: newMultiplier,
    unlockedThemes: newThemes,
    unlockedTrails: newTrails
  };

  saveDailyMissionsStore(updatedStore);
  return updatedStore;
}
