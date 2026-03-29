<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Blurred Floating Bubbles Background
 * Adapted from 2025-blog-public reference project
 * - Circles spawn with Poisson-ish spacing
 * - Movement = Perlin-ish flow field + soft separation
 * - Coverage control prevents big empty holes
 * - Constrained to bottom band of the viewport
 */

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animRef: number | null = null;
const isVisible = ref(false);

// Simple pseudo-noise generator
function makeNoise2D() {
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

  const grad: number[][] = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];

  function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
  function dot(g: number[], x: number, y: number) { return g[0] * x + g[1] * y; }

  return function noise2D(x: number, y: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = perm[X] + Y;
    const b = perm[X + 1] + Y;
    const g00 = grad[perm[a]! & 7]!;
    const g10 = grad[perm[b]! & 7]!;
    const g01 = grad[perm[a + 1]! & 7]!;
    const g11 = grad[perm[b + 1]! & 7]!;
    return lerp(
      lerp(dot(g00, x, y), dot(g10, x - 1, y), u),
      lerp(dot(g01, x, y - 1), dot(g11, x - 1, y - 1), u),
      v
    );
  };
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

const colors: string[] = [
  '#84C93C', '#6BA32A', '#a8e6cf',
  '#88d8b0', '#6bc5a0', '#c8f0e0'
];

onMounted(() => {
  setTimeout(() => { isVisible.value = true; }, 100);

  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(width * DPR);
  canvas.height = Math.floor(height * DPR);
  ctx.scale(DPR, DPR);

  const noise = makeNoise2D();
  const count = 6;
  const minRadius = 200;
  const maxRadius = 380;
  const bottomBandStart = 0.75;
  const speed = 0.1;
  const noiseScale = 0.0008;
  const noiseTimeScale = 0.00015;
  const targetFps = 6;
  const FRAME_INTERVAL = 1000 / targetFps;

  // Occupancy grid
  const gridCell = 80;
  let gridCols = 0, gridRows = 0;
  let grid: Float32Array = new Float32Array(0);

  function allocateGrid() {
    gridCols = Math.max(1, Math.ceil(width / gridCell));
    gridRows = Math.max(1, Math.ceil(height / gridCell));
    grid = new Float32Array(gridCols * gridRows);
  }

  function stampOccupancy(x: number, y: number, r: number) {
    const c0 = Math.floor((x - r) / gridCell);
    const c1 = Math.floor((x + r) / gridCell);
    const r0 = Math.floor((y - r) / gridCell);
    const r1 = Math.floor((y + r) / gridCell);
    for (let cy = r0; cy <= r1; cy++) {
      for (let cx = c0; cx <= c1; cx++) {
        if (cx < 0 || cy < 0 || cx >= gridCols || cy >= gridRows) continue;
        grid[cy * gridCols + cx] += 0.5;
      }
    }
  }

  function lowestOccupancyTarget() {
    const startRow = Math.floor(gridRows * bottomBandStart);
    let bestIdx = startRow * gridCols;
    let bestVal = Infinity;
    for (let cy = startRow; cy < gridRows; cy++) {
      for (let cx = 0; cx < gridCols; cx++) {
        const idx = cy * gridCols + cx;
        if (grid[idx] < bestVal) {
          bestVal = grid[idx];
          bestIdx = idx;
        }
      }
    }
    return {
      tx: ((bestIdx % gridCols) + 0.5) * gridCell,
      ty: (Math.floor(bestIdx / gridCols) + 0.5) * gridCell
    };
  }

  allocateGrid();

  // Poisson-ish initial placement
  interface Bubble {
    x: number; y: number; r: number;
    color: string; vx: number; vy: number;
    jitter: number; blur: number;
  }

  const bubbles: Bubble[] = [];
  const minDist = Math.max(minRadius * 0.2, 80);
  const maxTries = 5000;
  let tries = 0;

  while (bubbles.length < count && tries < maxTries) {
    tries++;
    const r = rand(minRadius, maxRadius);
    const x = rand(-r / 2, width + r / 2);
    const y = rand(height * bottomBandStart, height * 1.2);
    let ok = true;
    for (const b of bubbles) {
      const dx = b.x - x;
      const dy = b.y - y;
      if (Math.hypot(dx, dy) < (b.r + r) * 0.6 || Math.hypot(dx, dy) < minDist) {
        ok = false;
        break;
      }
    }
    if (ok) {
      bubbles.push({
        x, y, r,
        color: colors[bubbles.length % colors.length],
        vx: rand(-0.2, 0.2),
        vy: rand(-0.2, 0.2),
        jitter: rand(0.6, 1.2),
        blur: rand(180, 350)
      });
    }
  }

  let lastTime = 0;
  let accumulatedTime = 0;

  function updatePhysics(t: number) {
    const { tx, ty } = lowestOccupancyTarget();

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i]!;
      if (!b) continue;

      const n = noise(b.x * noiseScale, b.y * noiseScale + t * noiseTimeScale);
      const angle = n * Math.PI * 2;
      const fx = Math.cos(angle) * speed * b.jitter;
      const fy = Math.sin(angle) * speed * b.jitter;

      let sx = 0, sy = 0;
      for (let j = 0; j < bubbles.length; j++) {
        if (j !== i) {
          const o = bubbles[j]!;
          if (!o) continue;
          const dx = b.x - o.x;
          const dy = b.y - o.y;
          const d2 = dx * dx + dy * dy;
          const minD = (b.r + o.r) * 0.4;
          if (d2 < minD * minD && d2 > 0.001) {
            const d = Math.sqrt(d2);
            const push = (minD - d) / minD;
            sx += (dx / d) * push * 0.8;
            sy += (dy / d) * push * 0.8;
          }
        }
      }

      const dxT = tx - b.x;
      const dyT = ty - b.y;
      const dT = Math.hypot(dxT, dyT) + 1e-3;
      const cx = (dxT / dT) * 0.05;
      const cy = (dyT / dT) * 0.05;

      const bandMin = height * bottomBandStart;
      const bandMax = height * 1.5;
      let bx = 0, by = 0;
      if (b.y < bandMin) by += (bandMin - b.y) * 0.01;
      if (b.y > bandMax) by -= (b.y - bandMax) * 0.01;

      b.vx += fx + sx + cx + bx;
      b.vy += fy + sy + cy + by;

      const damping = 0.95;
      b.vx *= damping;
      b.vy *= damping;

      const maxVel = 2;
      const vel = Math.hypot(b.vx, b.vy);
      if (vel > maxVel) {
        b.vx = (b.vx / vel) * maxVel;
        b.vy = (b.vy / vel) * maxVel;
      }

      b.x += b.vx;
      b.y += b.vy;

      if (b.x < -b.r - b.blur / 3) b.x = width + b.r + b.blur / 3;
      if (b.x > width + b.r + b.blur / 3) b.x = -b.r - b.blur / 3;
      b.y = Math.min(Math.max(b.y, bandMin - b.r * 0.25), bandMax + b.r * 0.25);

      stampOccupancy(b.x, b.y, b.r * 0.6);
    }
  }

  // Check if dark mode is active
  function isDarkMode() {
    return document.documentElement.classList.contains('dark');
  }

  function draw() {
    const darkMode = isDarkMode();
    const baseAlpha = darkMode ? 0.2 : 0.4;

    for (const b of bubbles) {
      if (!b) continue;
      ctx.save();
      ctx.filter = `blur(${b.blur}px)`;
      ctx.globalAlpha = baseAlpha;
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function frame(t: number) {
    if (!ctx) return;

    if (document.hidden) {
      animRef = requestAnimationFrame(frame);
      return;
    }

    const deltaTime = lastTime ? t - lastTime : 0;
    lastTime = t;
    accumulatedTime += deltaTime;

    if (accumulatedTime < FRAME_INTERVAL) {
      animRef = requestAnimationFrame(frame);
      return;
    }
    accumulatedTime = 0;

    ctx.clearRect(0, 0, width, height);
    updatePhysics(t);
    draw();

    animRef = requestAnimationFrame(frame);
  }

  // Resize observer
  let resizeTimer: number | null = null;
  const ro = new ResizeObserver(() => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const nextW = canvas.clientWidth;
      const nextH = canvas.clientHeight;
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(DPR, DPR);
      allocateGrid();
      draw();
      resizeTimer = null;
    }, 1000);
  });
  ro.observe(canvas);

  // Initial draw then start animation
  draw();
  if (window.innerWidth < 640) {
    setTimeout(() => { animRef = requestAnimationFrame(frame); }, 1500);
  } else {
    animRef = requestAnimationFrame(frame);
  }

  onUnmounted(() => {
    if (animRef) cancelAnimationFrame(animRef);
    ro.disconnect();
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
  });
});
</script>

<template>
  <div
    class="fixed inset-0 z-0 overflow-hidden transition-opacity duration-1000"
    :class="isVisible ? 'opacity-100' : 'opacity-0'"
    style="filter: blur(50px)"
  >
    <canvas ref="canvasRef" class="w-full h-full block"></canvas>
  </div>
</template>
