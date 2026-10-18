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
