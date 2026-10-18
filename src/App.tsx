import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Sparkles, TrendingUp, Pause, Play, Clapperboard, RotateCcw, CheckCircle2, Globe, Trophy } from 'lucide-react';
import { GameState, Shape, SplitHalf, Particle, FloatingText, SwipePoint, Theme, AchievementProgressStore, AchievementNotificationItem } from './types';
import { sound } from './sound';
import { getThemeForDay, drawThemeShape, drawBomb } from './themes';
import { playables, PlayablesSaveData } from './playables';
import { ACHIEVEMENTS, loadAchievementProgress, saveAchievementProgress, checkNewUnlocks } from './achievements';
import { AchievementsModal } from './AchievementsModal';
import { AchievementNotificationBanner } from './AchievementNotificationBanner';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 800;

function adjustColorLuminance(hex: string, lum: number): string {
  let c = hex.replace(/[^0-9a-f]/gi, '');
  if (c.length < 6) {
    c = (c[0] || 'f') + (c[0] || 'f') + (c[1] || '4') + (c[1] || '4') + (c[2] || '3') + (c[2] || '3');
  }
  let rgb = '#';
  for (let i = 0; i < 3; i++) {
    let num = parseInt(c.substr(i * 2, 2), 16);
    num = Math.round(Math.min(Math.max(0, num + (num * lum)), 255));
    let str = num.toString(16);
    rgb += ('00' + str).substr(str.length);
  }
  return rgb;
}

interface ThemeShapePreviewProps {
  shape: string;
  color: string;
  key?: string;
}

function ThemeShapePreview({ shape, color }: ThemeShapePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 44, 44);
    drawThemeShape(ctx, 22, 22, 14, shape, color);
  }, [shape, color]);

  return (
    <canvas
      ref={canvasRef}
      width={44}
      height={44}
      className="bg-zinc-950/60 rounded-xl border border-zinc-800 p-1 shadow-sm"
    />
  );
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [scoreState, setScoreState] = useState<number>(0);
  const [livesState, setLivesState] = useState<number>(3);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [muted, setMuted] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<Theme>(() => getThemeForDay());
  const [sloMoTimeLeft, setSloMoTimeLeft] = useState<number>(0);

  const [comboCount, setComboCount] = useState<number>(0);
  const [comboVisible, setComboVisible] = useState<boolean>(false);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

  // YouTube Playables SDK State
  const [userLanguage, setUserLanguage] = useState<string>('en');
  const [isInPlayables, setIsInPlayables] = useState<boolean>(false);
  const [adLoading, setAdLoading] = useState<boolean>(false);
  const [hasRevivedThisRun, setHasRevivedThisRun] = useState<boolean>(false);
  const hasRevivedThisRunRef = useRef<boolean>(false);
  const firstFrameReportedRef = useRef<boolean>(false);

  const [highscore, setHighscore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('swipeslicerscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Game Engine Refs for zero-lag physics ticks
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>('MENU');
  
  const activeShapesRef = useRef<Shape[]>([]);
  const splitHalvesRef = useRef<SplitHalf[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const swipePointsRef = useRef<SwipePoint[]>([]);

  const swipeChainColorRef = useRef<string | null>(null);
  const swipeComboCountRef = useRef<number>(0);

  const sloMoActiveRef = useRef<boolean>(false);
  const sloMoTimeRemainingRef = useRef<number>(0);

  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const lastLaunchTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isDrawingRef = useRef<boolean>(false);
  const gameTimeRef = useRef<number>(0);
  const launchIntervalRef = useRef<number>(1800);

  // New features tracking
  const totalSlicesRef = useRef<number>(0);
  const highestComboRef = useRef<number>(0);
  const totalSpawnedNormalRef = useRef<number>(0);
  const totalSlicedNormalRef = useRef<number>(0);
  const streakRef = useRef<number>(0);
  const shockwavesRef = useRef<import('./types').Shockwave[]>([]);

  // Screen shake refs
  const shakeTimeRemainingRef = useRef<number>(0);
  const shakeIntensityRef = useRef<number>(0);

  // Difficulty and Leaderboard state
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const difficultyRef = useRef<'easy' | 'medium' | 'hard'>('medium');

  const [leaderboard, setLeaderboard] = useState<{ score: number; date: string; difficulty: string }[]>(() => {
    try {
      const saved = localStorage.getItem('swipeslicerleaderboard');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
    } catch {}
    return [];
  });

  const [streak, setStreak] = useState<number>(0);
  const [statsSummary, setStatsSummary] = useState<{
    totalSlices: number;
    highestCombo: number;
    accuracy: number;
  } | null>(null);

  // Achievements State & Store
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);
  const [achievementStore, setAchievementStore] = useState<AchievementProgressStore>(() => loadAchievementProgress());
  const achievementStoreRef = useRef<AchievementProgressStore>(achievementStore);
  const [activeNotification, setActiveNotification] = useState<AchievementNotificationItem | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    achievementStoreRef.current = achievementStore;
  }, [achievementStore]);

  const triggerAchievementCheck = (currentRun?: { combo: number; streak: number; score: number }) => {
    const { updatedStore, newUnlocks } = checkNewUnlocks(achievementStoreRef.current, currentRun);
    if (newUnlocks.length > 0) {
      achievementStoreRef.current = updatedStore;
      setAchievementStore(updatedStore);
      sound.playAchievement();

      const latest = newUnlocks[0];
      setActiveNotification({
        id: latest.id,
        title: latest.title,
        description: latest.description,
        iconName: latest.iconName,
        timestamp: Date.now()
      });

      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      notificationTimerRef.current = setTimeout(() => {
        setActiveNotification(null);
      }, 3500);
    }
  };

  // Synchronize state value to refs for tick-access
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  const triggerScreenShake = (durationMs: number, intensity: number) => {
    shakeTimeRemainingRef.current = durationMs;
    shakeIntensityRef.current = intensity;
  };

  const persistSaveData = (
    scoreVal: number,
    leaderboardVal: { score: number; date: string; difficulty: string }[],
    diffVal: 'easy' | 'medium' | 'hard',
    mutedVal: boolean
  ) => {
    const data: PlayablesSaveData = {
      highscore: Math.max(scoreVal, highscore),
      leaderboard: leaderboardVal,
      difficulty: diffVal,
      soundMuted: mutedVal,
      version: 1,
      achievements: achievementStoreRef.current
    };
    playables.saveData(data);
  };

  // YouTube Playables SDK Lifecycle, Audio, Pause/Resume & Cloud Save Initialization
  useEffect(() => {
    setIsInPlayables(playables.isInPlayables());

    // 1. Language detection
    playables.getLanguage().then((lang) => {
      if (lang) setUserLanguage(lang);
    });

    // 2. Audio enabled check from YouTube system settings
    const initialAudio = playables.isAudioEnabled();
    setMuted(!initialAudio);
    sound.setMute(!initialAudio);

    // 3. Audio enabled change listener
    const unsubAudio = playables.onAudioEnabledChange((enabled) => {
      setMuted(!enabled);
      sound.setMute(!enabled);
    });

    // 4. YouTube Pause listener (user minimizes tab, locks screen, etc.)
    const unsubPause = playables.onPause(() => {
      if (gameStateRef.current === 'PLAYING') {
        setGameState('PAUSED');
        playables.saveData({
          highscore: scoreRef.current > highscore ? scoreRef.current : highscore,
          leaderboard,
          difficulty: difficultyRef.current,
          soundMuted: sound.isMuted(),
          version: 1
        });
      }
    });

    // 5. YouTube Resume listener
    const unsubResume = playables.onResume(() => {
      // Retain paused state so player can click Resume safely
    });

    // 6. Load Cloud Data from YouTube Playables / LocalStorage
    playables.loadData().then((saved) => {
      if (saved) {
        if (typeof saved.highscore === 'number' && saved.highscore > 0) {
          setHighscore((prev) => Math.max(prev, saved.highscore));
        }
        if (Array.isArray(saved.leaderboard) && saved.leaderboard.length > 0) {
          setLeaderboard(saved.leaderboard);
        }
        if (saved.difficulty && ['easy', 'medium', 'hard'].includes(saved.difficulty)) {
          setDifficulty(saved.difficulty);
          difficultyRef.current = saved.difficulty;
        }
        if (typeof saved.soundMuted === 'boolean') {
          setMuted(saved.soundMuted);
          sound.setMute(saved.soundMuted);
        }
        if (saved.achievements && typeof saved.achievements === 'object') {
          const merged: AchievementProgressStore = {
            totalBombsSliced: Math.max(achievementStoreRef.current.totalBombsSliced, Number(saved.achievements.totalBombsSliced) || 0),
            highestCombo: Math.max(achievementStoreRef.current.highestCombo, Number(saved.achievements.highestCombo) || 0),
            highestStreak: Math.max(achievementStoreRef.current.highestStreak, Number(saved.achievements.highestStreak) || 0),
            highScore: Math.max(achievementStoreRef.current.highScore, Number(saved.achievements.highScore) || 0),
            totalShapesSliced: Math.max(achievementStoreRef.current.totalShapesSliced, Number(saved.achievements.totalShapesSliced) || 0),
            unlockedIds: { ...achievementStoreRef.current.unlockedIds, ...(saved.achievements.unlockedIds || {}) }
          };
          achievementStoreRef.current = merged;
          setAchievementStore(merged);
          saveAchievementProgress(merged);
        }
      }

      // 7. Notify YouTube that the game is loaded and ready for player interaction
      playables.gameReady();
    });

    // Attach global window error/warning logger to YouTube Health API
    const handleGlobalError = () => {
      playables.logError();
    };
    window.addEventListener('error', handleGlobalError);

    return () => {
      unsubAudio();
      unsubPause();
      unsubResume();
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  const updateLeaderboard = (newScore: number) => {
    if (newScore <= 0) return;
    setLeaderboard(prev => {
      const entry = {
        score: newScore,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        difficulty: difficultyRef.current
      };
      const updated = [...prev, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      persistSaveData(newScore, updated, difficultyRef.current, muted);
      return updated;
    });
  };

  // Handle combo badging
  const showComboBadge = (mult: number) => {
    setComboCount(mult);
    setComboVisible(true);
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    comboTimerRef.current = setTimeout(() => {
      setComboVisible(false);
    }, 1500);
  };

  // Sound Engine Mute sync
  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    sound.setMute(nextMuted);
    persistSaveData(highscore, leaderboard, difficulty, nextMuted);
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * GAME_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * GAME_HEIGHT;
    return { x, y };
  };

  // Launching wave math matching the original specs exactly, plus difficulty scaling
  const launchWave = () => {
    const scoreVal = scoreRef.current;
    let difficultyMultiplier = 1.0;
    let densityModifier = 1.0;

    if (scoreVal >= 5000) {
      difficultyMultiplier = 1.45;
      densityModifier = 2.0;
    } else if (scoreVal >= 2500) {
      difficultyMultiplier = 1.30;
      densityModifier = 1.6;
    } else if (scoreVal >= 1000) {
      difficultyMultiplier = 1.15;
      densityModifier = 1.3;
    }

    // Apply selected difficulty scaling bias
    let diffBias = 1.0;
    let densBias = 1.0;
    if (difficultyRef.current === 'easy') {
      diffBias = 0.85;
      densBias = 0.75;
    } else if (difficultyRef.current === 'hard') {
      diffBias = 1.25;
      densBias = 1.35;
    }

    difficultyMultiplier *= diffBias;
    densityModifier *= densBias;

    let quantity = 1 + Math.floor(Math.random() * 2);
    if (scoreVal > 120) quantity += 1;
    if (scoreVal > 350) quantity += 1;

    // Apply density scaling
    if (densityModifier > 1.0 && Math.random() < (densityModifier - 1.0)) {
      quantity += 1;
    }

    // High bomb-wave configuration based on difficulty
    const isLargeBombWave = scoreVal > 100 && Math.random() < (difficultyRef.current === 'easy' ? 0.12 : difficultyRef.current === 'hard' ? 0.35 : 0.25);

    for (let i = 0; i < quantity; i++) {
      const segmentWidth = GAME_WIDTH / (quantity + 1);
      const spawnX = segmentWidth * (i + 1) + (Math.random() * 30 - 15);
      const spawnY = GAME_HEIGHT + 40;

      const targetPeakY = 150 + Math.random() * 180;
      const gravity = 0.28;
      const timeToPeak = Math.sqrt((2 * (spawnY - targetPeakY)) / gravity);
      let launchVelocityY = -gravity * timeToPeak;

      const centerOffset = GAME_WIDTH / 2 - spawnX;
      let launchVelocityX = (centerOffset / timeToPeak) + (Math.random() * 1.5 - 0.75);

      // Apply difficulty multipliers
      launchVelocityX *= difficultyMultiplier;
      launchVelocityY *= difficultyMultiplier;

      let isBomb = false;
      if (isLargeBombWave) {
        const largeChance = difficultyRef.current === 'easy' ? 0.40 : difficultyRef.current === 'hard' ? 0.80 : 0.65;
        isBomb = Math.random() < largeChance;
      } else {
        let bombChance = Math.min(0.35, 0.08 + (scoreVal / 1500));
        if (difficultyRef.current === 'easy') {
          bombChance = Math.min(0.20, 0.04 + (scoreVal / 3000));
        } else if (difficultyRef.current === 'hard') {
          bombChance = Math.min(0.55, 0.15 + (scoreVal / 1000));
        }
        isBomb = Math.random() < bombChance;
      }

      // 10% chance to spawn Slo-Mo power-up clock shape instead of standard shape
      let isPowerUp = false;
      let shapeType = '';
      let color = '';

      if (!isBomb && Math.random() < 0.10) {
        isPowerUp = true;
        shapeType = 'clock';
        color = '#22d3ee'; // bright neon cyan
      } else {
        const randomTypeIndex = Math.floor(Math.random() * activeTheme.shapes.length);
        shapeType = activeTheme.shapes[randomTypeIndex];
        color = activeTheme.colors[Math.floor(Math.random() * activeTheme.colors.length)];
      }

      activeShapesRef.current.push({
        x: spawnX,
        y: spawnY,
        vx: launchVelocityX,
        vy: launchVelocityY,
        radius: 28 + Math.random() * 6,
        isBomb,
        isPowerUp,
        shapeType,
        color,
        angle: Math.random() * Math.PI,
        spinSpeed: (Math.random() * 0.04 - 0.02),
        sliced: false,
        ghosts: []
      });

      if (!isBomb && !isPowerUp) {
        totalSpawnedNormalRef.current++;
      }
    }
  };

  const loseLife = () => {
    livesRef.current--;
    setLivesState(livesRef.current);
    if (livesRef.current <= 0) {
      endGameRun("Too many items escaped your blade.");
    }
  };

  const endGameRun = (reason: string) => {
    // Capture final run metrics
    const accuracyVal = totalSpawnedNormalRef.current > 0
      ? Math.round((totalSlicedNormalRef.current / totalSpawnedNormalRef.current) * 100)
      : 0;

    setStatsSummary({
      totalSlices: totalSlicesRef.current,
      highestCombo: highestComboRef.current,
      accuracy: Math.min(100, accuracyVal)
    });

    const finalScore = scoreRef.current;
    if (finalScore > highscore) {
      setHighscore(finalScore);
    }

    // Submit score to YouTube Playables Leaderboards
    playables.sendScore(finalScore);

    // Save achievements progress
    if (finalScore > achievementStoreRef.current.highScore) {
      achievementStoreRef.current.highScore = finalScore;
    }
    saveAchievementProgress(achievementStoreRef.current);
    triggerAchievementCheck({
      combo: highestComboRef.current,
      streak: streakRef.current,
      score: finalScore
    });

    // Persist to YouTube Cloud Save & LocalStorage
    persistSaveData(finalScore, leaderboard, difficultyRef.current, muted);

    updateLeaderboard(finalScore);

    setGameState('GAMEOVER');
    setGameOverReason(reason);
  };

  const triggerBombBlast = (bx: number, by: number, objectColor: string = '#f43f5e') => {
    sound.playBomb();
    triggerScreenShake(600, 24); // Strong screen shake on bomb blast

    // Vibrate with a strong pulse pattern for bomb explosions
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 150, 50, 200]);
    }

    // Spawn massive burst particles dynamically colored by the object that spawned it!
    const blastParticlesCount = 48;
    for (let i = 0; i < blastParticlesCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 14;

      // Dynamic tonal variations (bright highlight, deep core, exact object color)
      let particleColor = objectColor;
      const roll = Math.random();
      if (roll < 0.35) {
        particleColor = adjustColorLuminance(objectColor, 0.4);
      } else if (roll < 0.65) {
        particleColor = adjustColorLuminance(objectColor, -0.3);
      }

      particlesRef.current.push({
        x: bx,
        y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 7,
        color: particleColor,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.008
      });
    }

    endGameRun("You sliced a live payload bomb!");
  };

  const spawnSplatterHalves = (s: Shape, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const speedFactor = 3.5;

    // Left Half
    splitHalvesRef.current.push({
      x: s.x,
      y: s.y,
      vx: s.vx + (nx * speedFactor) - 1,
      vy: s.vy + (ny * speedFactor) - 1.5,
      radius: s.radius,
      shapeType: s.shapeType,
      color: s.color,
      angle: s.angle,
      spin: s.spinSpeed * 2.5 - 0.06,
      alpha: 1,
      side: -1
    });

    // Right Half
    splitHalvesRef.current.push({
      x: s.x,
      y: s.y,
      vx: s.vx - (nx * speedFactor) + 1,
      vy: s.vy - (ny * speedFactor) - 1.5,
      radius: s.radius,
      shapeType: s.shapeType,
      color: s.color,
      angle: s.angle,
      spin: s.spinSpeed * 2.5 + 0.06,
      alpha: 1,
      side: 1
    });
  };

  const spawnSplatterSparks = (x: number, y: number, color: string) => {
    const count = 16 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 7.5;
      const roll = Math.random();
      const sparkColor = roll < 0.33 ? adjustColorLuminance(color, 0.35) : roll < 0.66 ? color : adjustColorLuminance(color, -0.25);

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4.5,
        color: sparkColor,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.025
      });
    }
  };

  // Segment collision query helper
  const getSqDistToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    let dx = x2 - x1;
    let dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      return (px - x1) ** 2 + (py - y1) ** 2;
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return (px - closestX) ** 2 + (py - closestY) ** 2;
  };

  const processSwipeSegment = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    if (gameStateRef.current !== 'PLAYING') return;

    let hitDetectedThisTick = false;
    const activeShapes = activeShapesRef.current;

    for (let i = 0; i < activeShapes.length; i++) {
      const s = activeShapes[i];
      if (s.sliced) continue;

      const sqDist = getSqDistToSegment(s.x, s.y, p1.x, p1.y, p2.x, p2.y);
      const interactionRadius = s.radius * 1.15;

      if (sqDist < interactionRadius * interactionRadius) {
        s.sliced = true;
        hitDetectedThisTick = true;

        if (s.isBomb) {
          achievementStoreRef.current.totalBombsSliced++;
          saveAchievementProgress(achievementStoreRef.current);
          triggerAchievementCheck({
            combo: swipeComboCountRef.current,
            streak: streakRef.current,
            score: scoreRef.current
          });
          triggerBombBlast(s.x, s.y, s.color || '#f43f5e');
          return;
        }

        // Check for 'Slo-Mo' power-up clock shape
        if (s.isPowerUp) {
          sloMoActiveRef.current = true;
          sloMoTimeRemainingRef.current = 5000; // 5 seconds
          setSloMoTimeLeft(5);

          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 50, 30]); // Tri-pulse vibration
          }

          sound.playCombo(6); // Ascending scale play

          const basePowerupScore = 20;
          scoreRef.current += basePowerupScore;
          setScoreState(scoreRef.current);
          totalSlicesRef.current++;

          achievementStoreRef.current.totalShapesSliced++;
          triggerAchievementCheck({
            combo: swipeComboCountRef.current,
            streak: streakRef.current,
            score: scoreRef.current
          });

          spawnSplatterHalves(s, p1, p2);
          spawnSplatterSparks(s.x, s.y, '#22d3ee');

          floatingTextsRef.current.push({
            x: s.x,
            y: s.y - 10,
            text: "+20 (SLO-MO!)",
            color: '#22d3ee',
            size: 24,
            vy: -1.2,
            life: 1200
          });

          activeShapes.splice(i, 1);
          i--;
          continue;
        }

        // Standard slice haptic feedback pulse
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }

        // Multi-swipe combo resolver
        if (swipeChainColorRef.current === null) {
          swipeChainColorRef.current = s.color;
          swipeComboCountRef.current = 1;
        } else if (s.color === swipeChainColorRef.current) {
          swipeComboCountRef.current++;
        } else {
          // Color crossed: reset with new pivot index
          swipeChainColorRef.current = s.color;
          swipeComboCountRef.current = 1;
        }

        // Increment trackers and streak
        totalSlicedNormalRef.current++;
        totalSlicesRef.current++;
        streakRef.current++;
        setStreak(streakRef.current);

        // Update highest combo
        if (swipeComboCountRef.current > highestComboRef.current) {
          highestComboRef.current = swipeComboCountRef.current;
        }

        // Update and check achievement milestones
        achievementStoreRef.current.totalShapesSliced++;
        if (swipeComboCountRef.current > achievementStoreRef.current.highestCombo) {
          achievementStoreRef.current.highestCombo = swipeComboCountRef.current;
        }
        if (streakRef.current > achievementStoreRef.current.highestStreak) {
          achievementStoreRef.current.highestStreak = streakRef.current;
        }

        const baseSliceScore = 10;
        let rewardedScore = baseSliceScore * swipeComboCountRef.current;

        // Apply Streak Multiplier
        let streakMultiplier = 1.0;
        if (streakRef.current >= 50) {
          streakMultiplier = 3.0;
        } else if (streakRef.current >= 30) {
          streakMultiplier = 2.0;
        } else if (streakRef.current >= 20) {
          streakMultiplier = 1.5;
        } else if (streakRef.current >= 10) {
          streakMultiplier = 1.2;
        }

        if (streakMultiplier > 1.0) {
          rewardedScore = Math.round(rewardedScore * streakMultiplier);
        }

        scoreRef.current += rewardedScore;
        setScoreState(scoreRef.current);

        if (scoreRef.current > achievementStoreRef.current.highScore) {
          achievementStoreRef.current.highScore = scoreRef.current;
        }
        triggerAchievementCheck({
          combo: swipeComboCountRef.current,
          streak: streakRef.current,
          score: scoreRef.current
        });

        // Emit shockwaves for combo of 5 or more
        if (swipeComboCountRef.current >= 5) {
          triggerScreenShake(300, 10); // Shake screen on high combo!
          shockwavesRef.current.push({
            x: s.x,
            y: s.y,
            radius: 10,
            maxRadius: 200,
            color: s.color,
            alpha: 1.0,
            speed: 0.35
          });
        }

        if (swipeComboCountRef.current >= 3) {
          sound.playCombo(swipeComboCountRef.current);
          showComboBadge(swipeComboCountRef.current);
        } else {
          // Pitch-shifted playSlice
          sound.playSlice(swipeComboCountRef.current);
        }

        spawnSplatterHalves(s, p1, p2);
        spawnSplatterSparks(s.x, s.y, s.color);

        let popText = `+${rewardedScore}`;
        if (streakMultiplier > 1.0) {
          popText += ` (${streakMultiplier}x Streak)`;
        } else if (swipeComboCountRef.current > 1) {
          popText += ` (${swipeComboCountRef.current}x)`;
        }

        floatingTextsRef.current.push({
          x: s.x,
          y: s.y - 10,
          text: popText,
          color: swipeComboCountRef.current >= 3 ? '#f43f5e' : s.color,
          size: swipeComboCountRef.current >= 3 ? 24 : 16,
          vy: -1.2,
          life: 800
        });

        activeShapes.splice(i, 1);
        i--;
      }
    }

    if (hitDetectedThisTick && Math.random() < 0.25) {
      sound.playSwoosh();
    }
  };

  const updateGame = (dt: number) => {
    gameTimeRef.current += dt;

    const now = Date.now();

    // Decay and update Slo-Mo power-up state
    if (sloMoActiveRef.current) {
      sloMoTimeRemainingRef.current -= dt;
      if (sloMoTimeRemainingRef.current <= 0) {
        sloMoActiveRef.current = false;
        sloMoTimeRemainingRef.current = 0;
        setSloMoTimeLeft(0);
      } else {
        setSloMoTimeLeft(Math.ceil(sloMoTimeRemainingRef.current / 1000));
      }
    }

    const speedMultiplier = sloMoActiveRef.current ? 0.40 : 1.0;

    // Difficulty scaling density modifier
    const scoreVal = scoreRef.current;
    let densityModifier = 1.0;
    if (scoreVal >= 5000) {
      densityModifier = 2.0;
    } else if (scoreVal >= 2500) {
      densityModifier = 1.6;
    } else if (scoreVal >= 1000) {
      densityModifier = 1.3;
    }

    const scoreBasedInterval = Math.max(850, launchIntervalRef.current - (scoreVal * 1.5));
    const dynamicInterval = scoreBasedInterval / densityModifier;

    if (now - lastLaunchTimeRef.current > dynamicInterval) {
      launchWave();
      lastLaunchTimeRef.current = now;
    }

    // 1. Shapes Update
    const activeShapes = activeShapesRef.current;
    for (let i = activeShapes.length - 1; i >= 0; i--) {
      const s = activeShapes[i];

      // Record ghost positions for trail rendering before updates
      if (!s.ghosts) s.ghosts = [];
      s.ghosts.push({ x: s.x, y: s.y, angle: s.angle });
      if (s.ghosts.length > 5) {
        s.ghosts.shift();
      }

      s.x += s.vx * speedMultiplier;
      s.y += s.vy * speedMultiplier;
      s.vy += 0.25 * speedMultiplier; // gravity pulls
      s.angle += s.spinSpeed * speedMultiplier;

      if (s.isBomb && Math.random() < 0.4) {
        const fuseRad = s.radius;
        const sx = s.x + Math.cos(s.angle - 0.5) * fuseRad;
        const sy = s.y + Math.sin(s.angle - 0.5) * fuseRad;
        particlesRef.current.push({
          x: sx,
          y: sy,
          vx: (Math.random() * 3 - 1.5) * speedMultiplier,
          vy: (Math.random() * -2 - 1) * speedMultiplier,
          size: 2.5 + Math.random() * 2,
          color: "#f97316",
          alpha: 1,
          decay: 0.04
        });
      }

      if (s.y > GAME_HEIGHT + 60 && s.vy > 0) {
        if (!s.isBomb && !s.isPowerUp) {
          loseLife();
          streakRef.current = 0;
          setStreak(0);
        }
        activeShapes.splice(i, 1);
      }
    }

    // 2. Halves Animation Update
    const splitHalves = splitHalvesRef.current;
    for (let i = splitHalves.length - 1; i >= 0; i--) {
      const h = splitHalves[i];
      h.x += h.vx * speedMultiplier;
      h.y += h.vy * speedMultiplier;
      h.vy += 0.28 * speedMultiplier;
      h.angle += h.spin * speedMultiplier;
      h.alpha -= 0.015 * speedMultiplier;

      if (h.alpha <= 0 || h.y > GAME_HEIGHT + 60) {
        splitHalves.splice(i, 1);
      }
    }

    // 3. Spray Particles Decay
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;
      p.alpha -= p.decay * speedMultiplier;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // 4. Score Texts Floating
    const floatingTexts = floatingTextsRef.current;
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const t = floatingTexts[i];
      t.y += t.vy * speedMultiplier;
      t.life -= dt * speedMultiplier;
      if (t.life <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    // Clean old points
    const swipePoints = swipePointsRef.current;
    while (swipePoints.length > 0 && now - swipePoints[0].time > 130) {
      swipePoints.shift();
    }

    // 5. Shockwave Animations Update
    const shockwaves = shockwavesRef.current;
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += sw.speed * dt * speedMultiplier;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        shockwaves.splice(i, 1);
      }
    }
  };

  const startGame = () => {
    hasRevivedThisRunRef.current = false;
    setHasRevivedThisRun(false);

    scoreRef.current = 0;
    livesRef.current = 3;
    activeShapesRef.current = [];
    splitHalvesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    swipePointsRef.current = [];
    swipeChainColorRef.current = null;
    swipeComboCountRef.current = 0;
    lastLaunchTimeRef.current = Date.now();
    lastTimeRef.current = Date.now();

    if (difficultyRef.current === 'easy') {
      launchIntervalRef.current = 2400;
    } else if (difficultyRef.current === 'hard') {
      launchIntervalRef.current = 1200;
    } else {
      launchIntervalRef.current = 1800;
    }

    sloMoActiveRef.current = false;
    sloMoTimeRemainingRef.current = 0;
    setSloMoTimeLeft(0);

    // Reset trackers
    totalSlicesRef.current = 0;
    highestComboRef.current = 0;
    totalSpawnedNormalRef.current = 0;
    totalSlicedNormalRef.current = 0;
    streakRef.current = 0;
    shockwavesRef.current = [];
    setStreak(0);
    setStatsSummary(null);

    setScoreState(0);
    setLivesState(3);
    setComboVisible(false);

    sound.init();
    setGameState('PLAYING');
  };

  const pauseGame = () => {
    if (gameStateRef.current === 'PLAYING') {
      setGameState('PAUSED');
      persistSaveData(highscore, leaderboard, difficultyRef.current, sound.isMuted());
    }
  };

  const resumeGame = () => {
    if (gameStateRef.current === 'PAUSED') {
      sound.init();
      lastTimeRef.current = Date.now();
      lastLaunchTimeRef.current = Date.now();
      setGameState('PLAYING');
    }
  };

  // Rewarded Ad integration: "Second Chance Revive"
  const handleWatchReviveAd = async () => {
    if (adLoading || hasRevivedThisRunRef.current) return;
    setAdLoading(true);
    try {
      const rewardEarned = await playables.requestRewardedAd('second-chance-revive-1');
      if (rewardEarned) {
        // Clear active items on canvas
        activeShapesRef.current = [];
        swipePointsRef.current = [];
        swipeChainColorRef.current = null;
        swipeComboCountRef.current = 0;
        lastLaunchTimeRef.current = Date.now();
        lastTimeRef.current = Date.now();

        // Restore 2 strikes
        livesRef.current = 2;
        setLivesState(2);
        hasRevivedThisRunRef.current = true;
        setHasRevivedThisRun(true);

        sound.init();
        sound.playCombo(5);

        floatingTextsRef.current.push({
          x: GAME_WIDTH / 2,
          y: GAME_HEIGHT / 2,
          text: "+2 LIVES REVIVED!",
          color: '#34d399',
          size: 26,
          vy: -1.2,
          life: 1400
        });

        setGameState('PLAYING');
      }
    } catch {
      playables.logWarning();
    } finally {
      setAdLoading(false);
    }
  };

  // Interstitial Ad navigation between game runs
  const handleTryAgain = async () => {
    await playables.requestInterstitialAd();
    startGame();
  };

  const handleReturnToMenu = async () => {
    await playables.requestInterstitialAd();
    setGameState('MENU');
  };

  // Handle Input starts (Mouse and Touch)
  const handleInputStart = (clientX: number, clientY: number) => {
    if (gameStateRef.current !== 'PLAYING') return;
    isDrawingRef.current = true;
    swipePointsRef.current = [];
    swipeChainColorRef.current = null;
    swipeComboCountRef.current = 0;

    const coords = getCanvasCoordinates(clientX, clientY);
    swipePointsRef.current.push({ x: coords.x, y: coords.y, time: Date.now() });
  };

  const handleInputMove = (clientX: number, clientY: number) => {
    if (gameStateRef.current !== 'PLAYING' || !isDrawingRef.current) return;
    const coords = getCanvasCoordinates(clientX, clientY);
    const newPoint = { x: coords.x, y: coords.y, time: Date.now() };

    const pts = swipePointsRef.current;
    if (pts.length > 0) {
      const lastPoint = pts[pts.length - 1];
      processSwipeSegment(lastPoint, newPoint);
    }

    pts.push(newPoint);
  };

  const handleInputEnd = () => {
    isDrawingRef.current = false;
    swipeChainColorRef.current = null;
    swipeComboCountRef.current = 0;
  };

  // Standard React Canvas Mounting loop
  useEffect(() => {
    let animationId: number;

    const tick = (now: number) => {
      // Notify YouTube Playables that canvas rendering has begun
      if (!firstFrameReportedRef.current) {
        firstFrameReportedRef.current = true;
        playables.firstFrameReady();
      }

      let dt = now - lastTimeRef.current;
      if (!dt || dt > 200) dt = 16.66;
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();

          // Apply screen shake translation
          if (shakeTimeRemainingRef.current > 0) {
            shakeTimeRemainingRef.current -= dt;
            const dx = (Math.random() - 0.5) * shakeIntensityRef.current;
            const dy = (Math.random() - 0.5) * shakeIntensityRef.current;
            ctx.translate(dx, dy);
          }

          // DRAWING LAYER 0: Custom Dynamic Gradient Background
          const nowMs = Date.now();
          const comboFactor = Math.min(10, swipeComboCountRef.current || 1);
          const pulseSpeed = 0.002 + (comboFactor * 0.001);
          const pulse = Math.sin(nowMs * pulseSpeed) * 0.5 + 0.5; // 0 to 1
          
          const isSloMo = sloMoActiveRef.current;
          
          let glowColor = { r: 9, g: 9, b: 11 };
          if (isSloMo) {
            glowColor = { 
              r: Math.floor(6 + pulse * 10), 
              g: Math.floor(60 + pulse * 80), 
              b: Math.floor(100 + pulse * 100) 
            };
          } else if (comboFactor >= 3 && swipeChainColorRef.current) {
            glowColor = { 
              r: Math.floor(25 + pulse * comboFactor * 12), 
              g: 9, 
              b: Math.floor(25 + pulse * comboFactor * 15) 
            };
          } else {
            glowColor = {
              r: Math.floor(9 + pulse * 6),
              g: Math.floor(9 + pulse * 6),
              b: Math.floor(11 + pulse * 8)
            };
          }

          const grad = ctx.createRadialGradient(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            10,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_HEIGHT * 0.8
          );
          grad.addColorStop(0, `rgb(${glowColor.r}, ${glowColor.g}, ${glowColor.b})`);
          grad.addColorStop(1, '#09090b');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
          
          // DRAWING LAYER 0.5: Shockwaves
          const shockwaves = shockwavesRef.current;
          for (let i = 0; i < shockwaves.length; i++) {
            const sw = shockwaves[i];
            ctx.save();
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = Math.max(0, sw.alpha);
            ctx.lineWidth = 4 * sw.alpha;
            ctx.shadowBlur = 15;
            ctx.shadowColor = sw.color;
            ctx.stroke();
            ctx.restore();
          }

          if (gameStateRef.current === 'PLAYING') {
            updateGame(dt);
          }

          // DRAWING LAYER 1: Sliced Halves
          const splitHalves = splitHalvesRef.current;
          for (let i = 0; i < splitHalves.length; i++) {
            const h = splitHalves[i];
            ctx.save();
            ctx.globalAlpha = h.alpha;
            ctx.translate(h.x, h.y);
            ctx.rotate(h.angle);

            ctx.beginPath();
            if (h.side === -1) {
              ctx.rect(-h.radius * 2, -h.radius * 2, h.radius * 2, h.radius * 4);
            } else {
              ctx.rect(0, -h.radius * 2, h.radius * 2, h.radius * 4);
            }
            ctx.clip();

            drawThemeShape(ctx, 0, 0, h.radius, h.shapeType, h.color);
            ctx.restore();
          }

          // DRAWING LAYER 2: Particles
          const particles = particlesRef.current;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // DRAWING LAYER 3: Active Shapes
          const activeShapes = activeShapesRef.current;
          for (let i = 0; i < activeShapes.length; i++) {
            const s = activeShapes[i];

            // Render ghost trailing effects
            if (s.ghosts) {
              for (let gIdx = 0; gIdx < s.ghosts.length; gIdx++) {
                const ghost = s.ghosts[gIdx];
                const trailAlpha = ((gIdx + 1) / (s.ghosts.length + 1)) * 0.28;
                ctx.save();
                ctx.globalAlpha = trailAlpha;
                if (s.isBomb) {
                  drawBomb(ctx, ghost.x, ghost.y, s.radius, ghost.angle);
                } else {
                  drawThemeShape(ctx, ghost.x, ghost.y, s.radius, s.shapeType, s.color);
                }
                ctx.restore();
              }
            }

            if (s.isBomb) {
              drawBomb(ctx, s.x, s.y, s.radius, s.angle);
            } else {
              drawThemeShape(ctx, s.x, s.y, s.radius, s.shapeType, s.color);
            }
          }

          // DRAWING LAYER 4: Touch/Mouse Neon trail
          const swipePoints = swipePointsRef.current;
          if (swipePoints.length > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(swipePoints[0].x, swipePoints[0].y);
            for (let i = 1; i < swipePoints.length; i++) {
              ctx.lineTo(swipePoints[i].x, swipePoints[i].y);
            }

            const isComboActive = swipeComboCountRef.current >= 3;
            const strokeColor = isComboActive ? '#f43f5e' : (swipeChainColorRef.current || '#3b82f6');
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = isComboActive ? 8 : 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();
          }

          // DRAWING LAYER 5: Scores floating
          const floatingTexts = floatingTextsRef.current;
          for (let i = 0; i < floatingTexts.length; i++) {
            const t = floatingTexts[i];
            ctx.save();
            ctx.font = `bold ${t.size}px 'Space Grotesk', sans-serif`;
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 6;
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
          }

          ctx.restore(); // Restore from screen shake translation
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Bind non-passive touch listeners directly to canvas to prevent mobile panning/bouncing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches && e.touches.length > 0) {
        handleInputStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches && e.touches.length > 0) {
        handleInputMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleInputEnd();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeTheme]);

  return (
    <div className="bg-zinc-950 text-slate-100 flex flex-col items-center justify-center min-h-screen overflow-hidden p-4">
      {/* Main Game Container */}
      <div className="relative w-full max-w-lg aspect-[3/4] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-neon flex flex-col overflow-hidden">
        
        {/* Top HUD Bar */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-zinc-950/80 to-transparent pointer-events-none select-none">
          {/* Score & Chain Combo */}
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Score</span>
            <span className="text-3xl font-bold text-white glow-blue">{scoreState}</span>
            <div
              className={`mt-1 px-2 py-0.5 rounded bg-pink-500/20 border border-pink-500/40 text-pink-400 text-xs font-bold self-start transition-opacity duration-200 ${
                comboVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Combo x{comboCount}
            </div>
          </div>

          {/* Theme Badge & Streak */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Daily Theme</span>
              <div className="px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 flex items-center gap-1.5 shadow-sm">
                <span>{activeTheme.name}</span>
              </div>
            </div>

            {/* Streak Indicator */}
            {gameState === 'PLAYING' && streak > 0 && (
              <div className="animate-bounce flex flex-col items-center">
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-black border tracking-wide transition-all duration-300 flex items-center gap-1 shadow-sm ${
                  streak >= 50
                    ? "border-yellow-500 bg-yellow-950/60 text-yellow-400 glow-yellow"
                    : streak >= 30
                    ? "border-amber-500 bg-amber-950/60 text-amber-400 glow-amber"
                    : streak >= 20
                    ? "border-purple-500 bg-purple-950/60 text-purple-400 glow-purple"
                    : streak >= 10
                    ? "border-cyan-500 bg-cyan-950/60 text-cyan-400 glow-cyan"
                    : "border-zinc-700 bg-zinc-800/80 text-zinc-300"
                }`}>
                  <span>🔥</span>
                  <span>{streak} STREAK</span>
                  {streak >= 10 && (
                    <span className="text-[8px] opacity-90">
                      x{streak >= 50 ? '3.0' : streak >= 30 ? '2.0' : streak >= 20 ? '1.5' : '1.2'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lives (Strikes counter) & Pause */}
          <div className="flex flex-col items-end pointer-events-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Strikes</span>
              {gameState === 'PLAYING' && (
                <button
                  onClick={pauseGame}
                  className="w-6 h-6 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-sm active:scale-95"
                  title="Pause Game"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 mt-1" id="strikes-container">
              {[0, 1, 2].map((index) => {
                const isLit = index < (3 - livesState);
                return (
                  <div
                    key={index}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isLit
                        ? "border-red-500 bg-red-950/40 text-red-500 glow-pink"
                        : "border-zinc-700 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    X
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tip Banner or Slo-Mo active badge during play */}
        {gameState === 'PLAYING' && (
          sloMoTimeLeft > 0 ? (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 animate-pulse">
              <p className="text-xs font-bold text-cyan-400 bg-cyan-950/90 px-5 py-2 rounded-full border border-cyan-500/50 shadow-lg shadow-cyan-500/20 flex items-center gap-1.5">
                <span className="inline-block animate-spin">⏳</span> SLO-MO ACTIVE: {sloMoTimeLeft}s
              </p>
            </div>
          ) : (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10 transition-opacity duration-500">
              <p className="text-xs text-zinc-400 bg-zinc-950/80 px-4 py-1.5 rounded-full border border-zinc-800">
                Chain <span className="text-pink-400 font-bold">same-color</span> shapes in a single swipe for huge combo points!
              </p>
            </div>
          )
        )}

        {/* Canvas Game Port */}
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
          onMouseUp={handleInputEnd}
          onMouseLeave={handleInputEnd}
          className="w-full h-full block cursor-crosshair bg-gradient-to-b from-zinc-900 to-zinc-950"
        />

        {/* Pause Overlay Screen */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col justify-center items-center p-8 z-20 select-none animate-fadeIn">
            <div className="w-full max-w-xs text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-yellow-400 mx-auto mb-4 shadow-lg rotate-6">
                <Pause className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight">Run Paused</h2>
              <p className="text-zinc-400 text-xs mb-6">Take a breath — your score and strikes are safe.</p>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 flex justify-between items-center">
                <div className="text-left">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Current Score</span>
                  <span className="text-2xl font-black text-white glow-blue">{scoreState}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Lives Left</span>
                  <span className="text-2xl font-black text-emerald-400">{livesState}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={resumeGame}
                  className="px-6 py-3.5 w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Resume Run
                </button>
                <button
                  onClick={handleTryAgain}
                  className="px-6 py-3 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart Run
                </button>
                <button
                  onClick={() => setIsAchievementsOpen(true)}
                  className="px-6 py-2.5 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-semibold text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Achievements ({Object.keys(achievementStore.unlockedIds).length}/{ACHIEVEMENTS.length})
                </button>
                <button
                  onClick={handleReturnToMenu}
                  className="px-6 py-2 w-full text-zinc-500 hover:text-zinc-300 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
                >
                  Quit to Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start Overlay Screen */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col justify-start items-center p-8 z-20 transition-all duration-300 overflow-y-auto">
            <div className="w-full max-w-xs flex flex-col items-center text-center my-auto py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg mb-3 rotate-12">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-400">
                SWIPE SLICER
              </h1>
              <p className="text-zinc-400 text-xs mb-3.5">
                Slice same-color items in single drags to assemble huge combo chains. Do not touch the red active bombs!
              </p>

              {/* YouTube Playables SDK Status Bar */}
              <div className="mb-4 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex items-center justify-between w-full text-[10px]">
                <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span>Playables SDK</span>
                  {isInPlayables && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="flex items-center gap-1 text-[9px] text-zinc-400" title="Cloud Save Sync Active">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span>Cloud Sync</span>
                  </span>
                  <span className="flex items-center gap-1 uppercase font-bold text-zinc-500 text-[9px]">
                    <Globe className="w-2.5 h-2.5" />
                    <span>{userLanguage.split('-')[0]}</span>
                  </span>
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="w-full mb-4 text-left select-none">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 text-center">
                  Select Difficulty
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => {
                    const isActive = difficulty === diff;
                    const activeStyles = {
                      easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                      hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    };
                    return (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`py-1.5 text-[11px] font-bold capitalize rounded-lg border transition-all cursor-pointer ${
                          isActive
                            ? activeStyles[diff] + ' shadow-sm shadow-black/40'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                        }`}
                      >
                        {diff}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Achievements Entry Card */}
              <button
                onClick={() => setIsAchievementsOpen(true)}
                className="mb-4 px-3.5 py-2.5 w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 rounded-2xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block group-hover:text-white">Achievements</span>
                    <span className="text-[10px] text-zinc-500">Track milestones & unlocks</span>
                  </div>
                </div>
                <span className="font-mono tabular-nums text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  {Object.keys(achievementStore.unlockedIds).length} / {ACHIEVEMENTS.length}
                </span>
              </button>

              {/* Dynamic Theme Preview */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 w-full text-left mb-4 select-none">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Today's Rotation</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">ACTIVE</span>
                </div>
                <h3 className="text-base font-bold text-white mb-0.5">{activeTheme.name}</h3>
                <p className="text-[11px] text-zinc-400 mb-2.5">{activeTheme.desc}</p>
                <div className="flex gap-1.5">
                  {activeTheme.shapes.map((shape, idx) => (
                    <ThemeShapePreview
                      key={shape}
                      shape={shape}
                      color={activeTheme.colors[idx % activeTheme.colors.length]}
                    />
                  ))}
                </div>
              </div>

              {/* Session Leaderboard */}
              {leaderboard.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 w-full text-left mb-4 select-none shadow-md">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 text-center">Session Top Runs</h3>
                  <div className="flex flex-col gap-1.5">
                    {leaderboard.map((item, idx) => {
                      const medalColors = [
                        'text-yellow-400 font-extrabold',
                        'text-zinc-300 font-bold',
                        'text-amber-600 font-medium',
                        'text-zinc-500',
                        'text-zinc-500'
                      ];
                      const diffColors = {
                        easy: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
                        medium: 'border-blue-500/30 text-blue-400 bg-blue-950/20',
                        hard: 'border-rose-500/30 text-rose-400 bg-rose-950/20'
                      };
                      return (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-zinc-800/40 last:border-0 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-3.5 text-center text-[10px] ${medalColors[idx]}`}>{idx + 1}</span>
                            <span className="font-extrabold text-white">{item.score}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1 py-0.2 rounded text-[7px] border uppercase font-black ${diffColors[item.difficulty as 'easy' | 'medium' | 'hard']}`}>
                              {item.difficulty}
                            </span>
                            <span className="text-zinc-500 text-[8px] font-medium">{item.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={startGame}
                className="px-8 py-3.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                Slice to Begin
              </button>

              <div className="mt-4 text-[10px] text-zinc-600">
                Mouse drag or Swipe screen to slice • Audio is synthesized live
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay Screen */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col justify-center items-center p-8 z-20">
            <div className="text-center max-w-xs w-full">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-1">Run Concluded</h2>
              <p className="text-zinc-500 text-xs mb-5">{gameOverReason}</p>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5 flex flex-col gap-2.5 select-none">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="text-zinc-500 text-xs uppercase tracking-wider">Final Score</span>
                  <span className="text-2xl font-bold text-white">{scoreState}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs uppercase tracking-wider">Best Highscore</span>
                  <span className="text-xl font-bold text-emerald-400">{highscore}</span>
                </div>
              </div>

              {/* Rewarded Ad Option: Second Chance Revive */}
              {!hasRevivedThisRun && (
                <button
                  onClick={handleWatchReviveAd}
                  disabled={adLoading}
                  className="mb-3 px-6 py-3 w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Clapperboard className="w-4 h-4" />
                  {adLoading ? 'Loading Playable Ad...' : 'Revive Blade (+2 Strikes)'}
                </button>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setGameState('STATS')}
                  className="px-6 py-3 w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  View Run Stats
                </button>
                <button
                  onClick={() => setIsAchievementsOpen(true)}
                  className="px-6 py-2.5 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-semibold text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Achievements ({Object.keys(achievementStore.unlockedIds).length}/{ACHIEVEMENTS.length})
                </button>
                <button
                  onClick={handleTryAgain}
                  className="px-6 py-2.5 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Stats Summary Screen */}
        {gameState === 'STATS' && statsSummary && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col justify-start items-center p-8 z-20 select-none overflow-y-auto">
            <div className="w-full max-w-sm text-center my-auto py-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-cyan-500/10 rotate-3">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
                Run Analytics
              </h2>
              <p className="text-zinc-500 text-xs mb-6 uppercase tracking-widest font-semibold">Performance Breakdown</p>

              {/* Stats Grid */}
              <div className="flex flex-col gap-4 mb-6">
                {/* Accuracy Gauge card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Slice Accuracy</span>
                  <div className="relative flex items-center justify-center w-24 h-24 my-2">
                    {/* SVG Circular Progress Gauge */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        className="stroke-zinc-800 fill-transparent"
                        strokeWidth="8"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        className="stroke-cyan-500 fill-transparent transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - statsSummary.accuracy / 100)}
                        strokeLinecap="round"
                        style={{ filter: "drop-shadow(0 0 4px #06b6d4)" }}
                      />
                    </svg>
                    <span className="absolute text-xl font-black text-white">{statsSummary.accuracy}%</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Sliced {totalSlicedNormalRef.current} / {totalSpawnedNormalRef.current} launched targets
                  </p>
                </div>

                {/* Two Column Grid for Slices and Combo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Total Slices</span>
                    <span className="text-3xl font-extrabold text-white glow-blue">{statsSummary.totalSlices}</span>
                    <span className="text-[10px] text-zinc-400 mt-1">Slices registered</span>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Highest Combo</span>
                    <span className="text-3xl font-extrabold text-pink-500 glow-pink">x{statsSummary.highestCombo}</span>
                    <span className="text-[10px] text-zinc-400 mt-1">Combo chain</span>
                  </div>
                </div>
              </div>

              {/* Leaderboard Section */}
              {leaderboard.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 w-full text-left mb-6 select-none shadow-md">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 text-center">Your High Scores This Session</h3>
                  <div className="flex flex-col gap-1.5">
                    {leaderboard.map((item, idx) => {
                      const medalColors = [
                        'text-yellow-400 font-extrabold',
                        'text-zinc-300 font-bold',
                        'text-amber-600 font-medium',
                        'text-zinc-500',
                        'text-zinc-500'
                      ];
                      const diffColors = {
                        easy: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
                        medium: 'border-blue-500/30 text-blue-400 bg-blue-950/20',
                        hard: 'border-rose-500/30 text-rose-400 bg-rose-950/20'
                      };
                      return (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-zinc-800/40 last:border-0 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-3.5 text-center text-[10px] ${medalColors[idx]}`}>{idx + 1}</span>
                            <span className="font-extrabold text-white">{item.score}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1 py-0.2 rounded text-[7px] border uppercase font-black ${diffColors[item.difficulty as 'easy' | 'medium' | 'hard']}`}>
                              {item.difficulty}
                            </span>
                            <span className="text-zinc-500 text-[8px] font-medium">{item.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleTryAgain}
                  className="px-8 py-3.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold text-base shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setIsAchievementsOpen(true)}
                  className="px-8 py-3 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Achievements ({Object.keys(achievementStore.unlockedIds).length}/{ACHIEVEMENTS.length})
                </button>
                <button
                  onClick={handleReturnToMenu}
                  className="px-8 py-2.5 w-full text-zinc-500 hover:text-zinc-300 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Return to Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audio control toggle */}
        <button
          onClick={handleToggleMute}
          className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white transition-colors active:scale-95 cursor-pointer"
          title={muted ? "Unmute Audio" : "Mute Audio"}
        >
          {muted ? (
            <VolumeX className="w-5 h-5 text-red-400 animate-pulse" />
          ) : (
            <Volume2 className="w-5 h-5 text-emerald-400" />
          )}
        </button>

        {/* In-Game Unlock Notification Toast Banner */}
        <AchievementNotificationBanner notification={activeNotification} />

        {/* Dedicated Achievements Modal */}
        <AchievementsModal
          isOpen={isAchievementsOpen}
          onClose={() => setIsAchievementsOpen(false)}
          progressStore={achievementStore}
          currentRun={{
            combo: swipeComboCountRef.current,
            streak: streakRef.current,
            score: scoreRef.current
          }}
        />
      </div>
    </div>
  );
}
