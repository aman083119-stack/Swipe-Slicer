export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'STATS';

export interface Theme {
  name: string;
  desc: string;
  shapes: string[];
  colors: string[];
}

export interface Shape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isBomb: boolean;
  isPowerUp?: boolean;
  shapeType: string;
  color: string;
  angle: number;
  spinSpeed: number;
  sliced: boolean;
  ghosts?: { x: number; y: number; angle: number }[];
}

export interface SplitHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  shapeType: string;
  color: string;
  angle: number;
  spin: number;
  alpha: number;
  side: number; // -1 for left side, 1 for right side
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  vy: number;
  life: number; // Remaining lifetime in ms
}

export interface SwipePoint {
  x: number;
  y: number;
  time: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  speed: number;
}

export type AchievementCategory = 'bombs' | 'combos' | 'streaks' | 'score' | 'slices';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  targetValue: number;
  iconName: string;
}

export interface AchievementState {
  unlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
}

export interface AchievementProgressStore {
  totalBombsSliced: number;
  highestCombo: number;
  highestStreak: number;
  highScore: number;
  totalShapesSliced: number;
  unlockedIds: Record<string, string>; // achievementId -> ISO date string
}

export interface AchievementNotificationItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  timestamp: number;
}

// Daily Missions & Blade Trails Types
export type DailyMissionType =
  | 'slice_color'
  | 'slice_bombs'
  | 'reach_combo'
  | 'reach_streak'
  | 'score_single_run'
  | 'total_shapes'
  | 'slice_slomo';

export type DailyMissionRewardType = 'multiplier' | 'theme' | 'blade_trail';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: DailyMissionType;
  colorKey?: 'blue' | 'green' | 'pink' | 'amber' | 'purple';
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardType: DailyMissionRewardType;
  rewardValue: string | number;
  rewardLabel: string;
  iconName: string;
}

export interface DailyMissionsStore {
  date: string; // YYYY-MM-DD
  missions: DailyMission[];
  claimedMultiplier: number; // e.g. 0, 0.25, 0.50
  unlockedThemes: string[];
  unlockedTrails: string[];
  equippedTrailId: string;
}

export type BladeTrailStyle =
  | 'cyan'
  | 'embers'
  | 'rainbow'
  | 'lightning'
  | 'sakura'
  | 'solar'
  | 'matrix';

export interface BladeTrailConfig {
  id: string;
  name: string;
  description: string;
  style: BladeTrailStyle;
  primaryColor: string;
  secondaryColor: string;
  coreColor: string;
  glowBlur: number;
  particleType: 'sparks' | 'embers' | 'stars' | 'lightning' | 'petals' | 'flares' | 'bits';
  iconName: string;
  unlockHint: string;
}

export interface BladeTrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  angle?: number;
  spin?: number;
  type?: string;
}
