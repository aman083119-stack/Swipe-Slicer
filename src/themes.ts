import { Theme } from './types';

export const ROTATING_THEMES: Theme[] = [
  { name: "Cosmic Orbs", desc: "Mysterious elements drifting across the space-time vector.", shapes: ["circle", "ring", "star"], colors: ["#ec4899", "#8b5cf6", "#3b82f6"] }, // Sun
  { name: "Geometry Class", desc: "Clean vector shapes designed with perfect grid geometry.", shapes: ["triangle", "square", "hexagon"], colors: ["#10b981", "#f59e0b", "#3b82f6"] }, // Mon
  { name: "Cyber Neon", desc: "Brilliant luminescent nodes radiating hard cybernetic vibes.", shapes: ["diamond", "rhombus", "star"], colors: ["#06b6d4", "#f43f5e", "#10b981"] }, // Tue
  { name: "Sweet Treats", desc: "Delicious frosted sugary shapes floating through air.", shapes: ["circle", "heart", "clover"], colors: ["#f472b6", "#fbbf24", "#a78bfa"] }, // Wed
  { name: "Ancient Runes", desc: "Monolithic constructs from antiquity bound in neon energy.", shapes: ["square", "triangle", "hexagon"], colors: ["#14b8a6", "#f97316", "#6366f1"] }, // Thu
  { name: "Retro Arcade", desc: "8-bit stylized shapes echoing classic console designs.", shapes: ["rect", "cross", "diamond"], colors: ["#e11d48", "#10b981", "#3b82f6"] }, // Fri
  { name: "Nature's Seeds", desc: "Sprouted organic vector nodes bursting with vibrant energy.", shapes: ["leaf", "heart", "teardrop"], colors: ["#22c55e", "#ec4899", "#eab308"] } // Sat
];

export function getThemeForDay(date: Date = new Date()): Theme {
  const currentDay = date.getDay();
  return ROTATING_THEMES[currentDay];
}

export function drawThemeShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  type: string,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  
  // Setup neon glow
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color + "22"; // Translucent inside fill

  if (type === 'circle') {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  } else if (type === 'star') {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / 5;
    ctx.moveTo(0, -radius);
    for (let i = 0; i < 5; i++) {
      let px = Math.cos(rot) * radius;
      let py = Math.sin(rot) * radius;
      ctx.lineTo(px, py);
      rot += step;
      px = Math.cos(rot) * (radius * 0.4);
      py = Math.sin(rot) * (radius * 0.4);
      ctx.lineTo(px, py);
      rot += step;
    }
    ctx.lineTo(0, -radius);
  } else if (type === 'ring') {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
  } else if (type === 'triangle') {
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 0.9, radius * 0.6);
    ctx.lineTo(-radius * 0.9, radius * 0.6);
  } else if (type === 'square') {
    ctx.rect(-radius * 0.8, -radius * 0.8, radius * 1.6, radius * 1.6);
  } else if (type === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  } else if (type === 'diamond') {
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 0.75, 0);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius * 0.75, 0);
  } else if (type === 'rhombus') {
    ctx.moveTo(0, -radius * 0.7);
    ctx.lineTo(radius * 1.1, -radius * 0.2);
    ctx.lineTo(0, radius * 0.7);
    ctx.lineTo(-radius * 1.1, radius * 0.2);
  } else if (type === 'heart') {
    ctx.moveTo(0, radius * 0.35);
    ctx.bezierCurveTo(-radius * 1.25, -radius * 0.85, -radius * 0.55, -radius * 1.35, 0, -radius * 0.55);
    ctx.bezierCurveTo(radius * 0.55, -radius * 1.35, radius * 1.25, -radius * 0.85, 0, radius * 0.35);
  } else if (type === 'clover') {
    for (let i = 0; i < 4; i++) {
      ctx.bezierCurveTo(-radius * 0.25, -radius, -radius * 0.85, -radius * 0.85, 0, 0);
      ctx.bezierCurveTo(radius * 0.25, -radius, radius * 0.85, -radius * 0.85, 0, 0);
      ctx.rotate(Math.PI / 2);
    }
  } else if (type === 'rect') {
    ctx.rect(-radius, -radius * 0.5, radius * 2, radius);
  } else if (type === 'cross') {
    ctx.rect(-radius * 0.3, -radius, radius * 0.6, radius * 2);
    ctx.rect(-radius, -radius * 0.3, radius * 2, radius * 0.6);
  } else if (type === 'leaf') {
    ctx.moveTo(0, -radius);
    ctx.quadraticCurveTo(radius * 0.85, -radius * 0.55, 0, radius);
    ctx.quadraticCurveTo(-radius * 0.85, -radius * 0.55, 0, -radius);
    ctx.moveTo(0, -radius * 0.5);
    ctx.lineTo(0, radius * 0.8);
  } else if (type === 'clock') {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -radius * 0.5);
    ctx.moveTo(0, 0);
    ctx.lineTo(radius * 0.35, radius * 0.2);
  } else if (type === 'teardrop') {
    ctx.moveTo(0, -radius);
    ctx.quadraticCurveTo(radius * 0.85, radius * 0.25, 0, radius);
    ctx.quadraticCurveTo(-radius * 0.85, radius * 0.25, 0, -radius);
  } else {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawBomb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotAngle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotAngle);

  // Fuse string
  ctx.beginPath();
  ctx.strokeStyle = "#a1a1aa";
  ctx.lineWidth = 3;
  ctx.moveTo(0, -radius + 4);
  ctx.quadraticCurveTo(radius * 0.4, -radius * 1.4, radius * 0.75, -radius * 1.25);
  ctx.stroke();

  // Metallic bomb chassis
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  const bombGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 2, 0, 0, radius);
  bombGrad.addColorStop(0, "#4b5563");
  bombGrad.addColorStop(0.6, "#1f2937");
  bombGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = bombGrad;
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "#ef4444";
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.stroke();

  // Sharp industrial spikes
  ctx.fillStyle = "#1e293b";
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-6, -radius + 1);
    ctx.lineTo(0, -radius - 12);
    ctx.lineTo(6, -radius + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Warning Indicator (Flashing Red center dot)
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = (Math.floor(Date.now() / 150) % 2 === 0) ? "#ef4444" : "#7f1d1d";
  ctx.shadowBlur = 15;
  ctx.fill();

  ctx.restore();
}
