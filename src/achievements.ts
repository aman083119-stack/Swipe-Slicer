import { Achievement, AchievementProgressStore, AchievementState } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  // Bombs
  {
    id: 'bomb_1',
    title: 'Bomb Defuser',
    description: 'Slice your first live bomb.',
    category: 'bombs',
    targetValue: 1,
    iconName: 'Bomb'
  },
  {
    id: 'bomb_25',
    title: 'Demolition Specialist',
    description: 'Slice 25 bombs across all runs.',
    category: 'bombs',
    targetValue: 25,
    iconName: 'Flame'
  },
  {
    id: 'bomb_100',
    title: 'Bomb Sweeper',
    description: 'Slice 100 bombs across all runs.',
    category: 'bombs',
    targetValue: 100,
    iconName: 'ShieldAlert'
  },

  // Combos
  {
    id: 'combo_5',
    title: 'Swift Edge',
    description: 'Reach a 5x combo in a single swipe.',
    category: 'combos',
    targetValue: 5,
    iconName: 'Zap'
  },
  {
    id: 'combo_10',
    title: 'Flurry Slicer',
    description: 'Reach a 10x combo in a single swipe.',
    category: 'combos',
    targetValue: 10,
    iconName: 'Sparkles'
  },
  {
    id: 'combo_25',
    title: 'Blade Dance',
    description: 'Reach a 25x combo in a single swipe.',
    category: 'combos',
    targetValue: 25,
    iconName: 'Swords'
  },
  {
    id: 'combo_100',
    title: 'Century Combo',
    description: 'Reach a legendary 100x combo.',
    category: 'combos',
    targetValue: 100,
    iconName: 'Crown'
  },

  // Streaks
  {
    id: 'streak_20',
    title: 'Sharp Focus',
    description: 'Maintain an unbroken 20-cut streak.',
    category: 'streaks',
    targetValue: 20,
    iconName: 'Target'
  },
  {
    id: 'streak_50',
    title: 'Master of Flow',
    description: 'Maintain an unbroken 50-cut streak.',
    category: 'streaks',
    targetValue: 50,
    iconName: 'Activity'
  },
  {
    id: 'streak_100',
    title: 'Zen Blade',
    description: 'Maintain an unbroken 100-cut streak.',
    category: 'streaks',
    targetValue: 100,
    iconName: 'Award'
  },

  // Score
  {
    id: 'score_1000',
    title: 'High Scorer',
    description: 'Score 1,000 points in a single run.',
    category: 'score',
    targetValue: 1000,
    iconName: 'TrendingUp'
  },
  {
    id: 'score_5000',
    title: 'Arcade Veteran',
    description: 'Score 5,000 points in a single run.',
    category: 'score',
    targetValue: 5000,
    iconName: 'Star'
  },
  {
    id: 'score_10000',
    title: 'Legendary Slicer',
    description: 'Score 10,000 points in a single run.',
    category: 'score',
    targetValue: 10000,
    iconName: 'Trophy'
  },

  // Slices
  {
    id: 'slice_100',
    title: 'Blade Initiate',
    description: 'Slice 100 total objects across all sessions.',
    category: 'slices',
    targetValue: 100,
    iconName: 'Crosshair'
  },
  {
    id: 'slice_500',
    title: 'Blade Master',
    description: 'Slice 500 total objects across all sessions.',
    category: 'slices',
    targetValue: 500,
    iconName: 'CheckCircle2'
  },
  {
    id: 'slice_1000',
    title: 'Supreme Samurai',
    description: 'Slice 1,000 total objects across all sessions.',
    category: 'slices',
    targetValue: 1000,
    iconName: 'Medal'
  }
];

const STORAGE_KEY = 'swipeslicerachievements';

export function loadAchievementProgress(): AchievementProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalBombsSliced: Number(parsed.totalBombsSliced) || 0,
        highestCombo: Number(parsed.highestCombo) || 0,
        highestStreak: Number(parsed.highestStreak) || 0,
        highScore: Number(parsed.highScore) || 0,
        totalShapesSliced: Number(parsed.totalShapesSliced) || 0,
        unlockedIds: parsed.unlockedIds && typeof parsed.unlockedIds === 'object' ? parsed.unlockedIds : {}
      };
    }
  } catch (err) {
    console.error('Failed to load achievement progress:', err);
  }

  return {
    totalBombsSliced: 0,
    highestCombo: 0,
    highestStreak: 0,
    highScore: 0,
    totalShapesSliced: 0,
    unlockedIds: {}
  };
}

export function saveAchievementProgress(store: AchievementProgressStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save achievement progress:', err);
  }
}

export function getAchievementMetric(
  ach: Achievement,
  store: AchievementProgressStore,
  currentRun?: { combo: number; streak: number; score: number }
): number {
  switch (ach.category) {
    case 'bombs':
      return store.totalBombsSliced;
    case 'combos':
      return Math.max(store.highestCombo, currentRun?.combo || 0);
    case 'streaks':
      return Math.max(store.highestStreak, currentRun?.streak || 0);
    case 'score':
      return Math.max(store.highScore, currentRun?.score || 0);
    case 'slices':
      return store.totalShapesSliced;
    default:
      return 0;
  }
}

export function getAchievementState(
  ach: Achievement,
  store: AchievementProgressStore,
  currentRun?: { combo: number; streak: number; score: number }
): AchievementState {
  const isUnlocked = Boolean(store.unlockedIds[ach.id]);
  const metricValue = getAchievementMetric(ach, store, currentRun);

  return {
    unlocked: isUnlocked,
    unlockedAt: store.unlockedIds[ach.id],
    currentValue: metricValue
  };
}

/**
 * Checks for any newly unlocked achievements based on updated progress
 * Returns an array of achievements that were newly unlocked
 */
export function checkNewUnlocks(
  store: AchievementProgressStore,
  currentRun?: { combo: number; streak: number; score: number }
): { updatedStore: AchievementProgressStore; newUnlocks: Achievement[] } {
  const newUnlocks: Achievement[] = [];
  const updatedUnlockedIds = { ...store.unlockedIds };

  for (const ach of ACHIEVEMENTS) {
    if (!updatedUnlockedIds[ach.id]) {
      const metric = getAchievementMetric(ach, store, currentRun);
      if (metric >= ach.targetValue) {
        const timestamp = new Date().toISOString();
        updatedUnlockedIds[ach.id] = timestamp;
        newUnlocks.push(ach);
      }
    }
  }

  const updatedStore: AchievementProgressStore = {
    ...store,
    unlockedIds: updatedUnlockedIds
  };

  if (newUnlocks.length > 0) {
    saveAchievementProgress(updatedStore);
  }

  return { updatedStore, newUnlocks };
}
