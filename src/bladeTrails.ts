import { BladeTrailConfig, BladeTrailParticle, SwipePoint } from './types';

export const BLADE_TRAILS: BladeTrailConfig[] = [
  {
    id: 'trail_cyan',
    name: 'Cyber Edge',
    description: 'High-frequency cyan energy katana with luminous plasma wake.',
    style: 'cyan',
    primaryColor: '#38bdf8',
    secondaryColor: '#0284c7',
    coreColor: '#f0f9ff',
    glowBlur: 14,
    particleType: 'sparks',
    iconName: 'Zap',
    unlockHint: 'Default blade trail'
  },
  {
    id: 'trail_embers',
    name: 'Neon Embers',
    description: 'Superheated flame blade that showers upward-drifting fire embers.',
    style: 'embers',
    primaryColor: '#f97316',
    secondaryColor: '#ef4444',
    coreColor: '#fef08a',
    glowBlur: 18,
    particleType: 'embers',
    iconName: 'Flame',
    unlockHint: 'Reward from Daily Missions'
  },
  {
    id: 'trail_rainbow',
    name: 'Rainbow Prism',
    description: 'Refractive chromatic crystal dispersing dazzling prismatic spectra.',
    style: 'rainbow',
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    coreColor: '#ffffff',
    glowBlur: 20,
    particleType: 'stars',
    iconName: 'Sparkles',
    unlockHint: 'Reward from Daily Missions'
  },
  {
    id: 'trail_lightning',
    name: 'Lightning Sparks',
    description: 'Conductive storm arc blade discharging crackling electric forks.',
    style: 'lightning',
    primaryColor: '#a855f7',
    secondaryColor: '#3b82f6',
    coreColor: '#e0e7ff',
    glowBlur: 16,
    particleType: 'lightning',
    iconName: 'Activity',
    unlockHint: 'Reward from Daily Missions'
  },
  {
    id: 'trail_sakura',
    name: 'Sakura Petals',
    description: 'Enchanted floral katana that wafts delicate cherry blossom petals.',
    style: 'sakura',
    primaryColor: '#f472b6',
    secondaryColor: '#fda4af',
    coreColor: '#fff1f2',
    glowBlur: 14,
    particleType: 'petals',
    iconName: 'Heart',
    unlockHint: 'Reward from Daily Missions'
  },
  {
    id: 'trail_solar',
    name: 'Solar Flare',
    description: 'Incandescent stellar plasma radiating blinding coronal heat waves.',
    style: 'solar',
    primaryColor: '#eab308',
    secondaryColor: '#f59e0b',
    coreColor: '#ffffff',
    glowBlur: 22,
    particleType: 'flares',
    iconName: 'Sun',
    unlockHint: 'Reward from Daily Missions'
  },
  {
    id: 'trail_matrix',
    name: 'Cyber Code',
    description: 'Encrypted cyberspace conduit scattering falling green digital bits.',
    style: 'matrix',
    primaryColor: '#22c55e',
    secondaryColor: '#16a34a',
    coreColor: '#bbf7d0',
    glowBlur: 14,
    particleType: 'bits',
    iconName: 'Terminal',
    unlockHint: 'Reward from Daily Missions'
  }
];

export function getBladeTrail(id: string): BladeTrailConfig {
  return BLADE_TRAILS.find(t => t.id === id) || BLADE_TRAILS[0];
}

/**
 * Spawns dynamic flourishing particles along a swipe segment based on equipped trail
 */
export function spawnTrailParticles(
  trail: BladeTrailConfig,
  p1: SwipePoint,
  p2: SwipePoint,
  isComboActive: boolean
): BladeTrailParticle[] {
  const particles: BladeTrailParticle[] = [];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 4) return particles;

  const count = Math.min(6, Math.max(1, Math.floor(dist / 14))) * (isComboActive ? 2 : 1);

  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const bx = p1.x + dx * t + (Math.random() - 0.5) * 6;
    const by = p1.y + dy * t + (Math.random() - 0.5) * 6;

    if (trail.style === 'embers') {
      // Rising fire embers
      particles.push({
        x: bx,
        y: by,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2.2 - 0.6, // Float upwards
        size: Math.random() * 3.5 + 2,
        color: Math.random() > 0.4 ? '#f97316' : (Math.random() > 0.5 ? '#fef08a' : '#ef4444'),
        alpha: 1.0,
        decay: Math.random() * 0.035 + 0.02,
        type: 'ember'
      });
    } else if (trail.style === 'rainbow') {
      // Shimmering prism stars
      const rainbowHues = ['#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
      particles.push({
        x: bx,
        y: by,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        size: Math.random() * 4 + 2,
        color: rainbowHues[Math.floor(Math.random() * rainbowHues.length)],
        alpha: 1.0,
        decay: Math.random() * 0.04 + 0.025,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.15,
        type: 'star'
      });
    } else if (trail.style === 'lightning') {
      // Crackling high-velocity electric sparks
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 1.5;
      particles.push({
        x: bx,
        y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        color: Math.random() > 0.3 ? '#c084fc' : '#60a5fa',
        alpha: 1.0,
        decay: Math.random() * 0.06 + 0.04, // Very snappy
        type: 'lightning'
      });
    } else if (trail.style === 'sakura') {
      // Fluttering cherry blossom petals
      particles.push({
        x: bx,
        y: by,
        vx: (Math.random() - 0.3) * 1.4,
        vy: Math.random() * 1.5 + 0.4, // Gently float down
        size: Math.random() * 4 + 2.5,
        color: Math.random() > 0.3 ? '#f472b6' : '#fb7185',
        alpha: 0.9,
        decay: Math.random() * 0.025 + 0.015,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08,
        type: 'petal'
      });
    } else if (trail.style === 'solar') {
      // Expanding stellar solar sparks
      particles.push({
        x: bx,
        y: by,
        vx: (Math.random() - 0.5) * 2.8,
        vy: (Math.random() - 0.5) * 2.8,
        size: Math.random() * 4.5 + 2,
        color: Math.random() > 0.4 ? '#fbbf24' : '#ffffff',
        alpha: 1.0,
        decay: Math.random() * 0.04 + 0.03,
        type: 'flare'
      });
    } else if (trail.style === 'matrix') {
      // Falling green digital square bits
      particles.push({
        x: bx,
        y: by,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 2.2 + 0.8, // Fall downward
        size: Math.random() * 3.5 + 2,
        color: Math.random() > 0.3 ? '#22c55e' : '#86efac',
        alpha: 1.0,
        decay: Math.random() * 0.035 + 0.02,
        type: 'bit'
      });
    } else {
      // Default Cyan sparks
      particles.push({
        x: bx,
        y: by,
        vx: (Math.random() - 0.5) * 2.0,
        vy: (Math.random() - 0.5) * 2.0,
        size: Math.random() * 3 + 1.5,
        color: Math.random() > 0.3 ? '#38bdf8' : '#e0f2fe',
        alpha: 1.0,
        decay: Math.random() * 0.05 + 0.03,
        type: 'spark'
      });
    }
  }

  return particles;
}

/**
 * Draws the active blade trail path on the Canvas with rich multi-pass flourishes
 */
export function drawBladeTrail(
  ctx: CanvasRenderingContext2D,
  points: SwipePoint[],
  trail: BladeTrailConfig,
  isComboActive: boolean,
  chainColor: string | null = null
) {
  if (points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const baseWidth = isComboActive ? 9 : 6;

  if (trail.style === 'rainbow') {
    // Multi-color chromatic stroke
    const rainbowColors = [
      '#f43f5e', // red/pink
      '#fbbf24', // yellow
      '#10b981', // green
      '#06b6d4', // cyan
      '#8b5cf6', // violet
      '#ec4899'  // magenta
    ];

    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const progress = i / points.length;
      const color = rainbowColors[i % rainbowColors.length];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = baseWidth * (0.4 + progress * 0.8);
      ctx.shadowColor = color;
      ctx.shadowBlur = trail.glowBlur;
      ctx.stroke();
    }

    // Inner bright core
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isComboActive ? 3.5 : 2;
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#ffffff';
    ctx.stroke();

  } else if (trail.style === 'lightning') {
    // Crackling jagged electric path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      // Add slight electric jitter mid-point
      const mx = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 5;
      const my = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 5;
      ctx.lineTo(mx, my);
      ctx.lineTo(p2.x, p2.y);
    }

    // Outer glow
    ctx.strokeStyle = isComboActive ? '#ec4899' : trail.primaryColor;
    ctx.lineWidth = baseWidth + 2;
    ctx.shadowColor = trail.primaryColor;
    ctx.shadowBlur = trail.glowBlur;
    ctx.stroke();

    // Secondary electric core
    ctx.strokeStyle = trail.secondaryColor;
    ctx.lineWidth = baseWidth * 0.6;
    ctx.stroke();

    // Hot central core
    ctx.strokeStyle = trail.coreColor;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffffff';
    ctx.stroke();

  } else if (trail.style === 'embers') {
    // Warm flame blade
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = isComboActive ? '#ef4444' : trail.primaryColor;
    ctx.lineWidth = baseWidth + 3;
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = trail.glowBlur;
    ctx.stroke();

    ctx.strokeStyle = trail.coreColor;
    ctx.lineWidth = baseWidth * 0.4;
    ctx.stroke();

  } else {
    // Standard / Solar / Sakura / Matrix
    const strokeColor = isComboActive
      ? '#f43f5e'
      : (chainColor || trail.primaryColor);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    // Outer neon glow
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = baseWidth;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = trail.glowBlur;
    ctx.stroke();

    // Inner bright core
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = trail.coreColor;
    ctx.lineWidth = Math.max(2, baseWidth * 0.35);
    ctx.shadowBlur = 4;
    ctx.shadowColor = trail.coreColor;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws all currently active blade trail particles
 */
export function drawBladeTrailParticles(
  ctx: CanvasRenderingContext2D,
  particles: BladeTrailParticle[]
) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'star') {
      // 4-pointed sparkle
      ctx.translate(p.x, p.y);
      if (p.angle) ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const s = p.size;
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();

    } else if (p.type === 'petal') {
      // Cherry blossom petal
      ctx.translate(p.x, p.y);
      if (p.angle) ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (p.type === 'bit') {
      // Digital square bit
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);

    } else {
      // Glowing circular particle / ember / spark
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
