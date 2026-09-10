<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRainCycle } from '../composables/useRainCycle';

const rainCanvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const stormVignetteRef = ref<HTMLElement | null>(null);
let animId: number;

const { intensity, cycleStage } = useRainCycle();

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  thickness: number;
  layer: number; // 0 = far, 1 = mid, 2 = near
  opacity: number;
}

interface Splash {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
}

interface MistPuff {
  x: number;
  y: number;
  vx: number;
  radius: number;
  alpha: number;
}

onMounted(() => {
  const canvas = rainCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dpr = 1;
  let logicalW = window.innerWidth;
  let logicalH = window.innerHeight;
  const isMobile = window.innerWidth < 640 || /Mobi|Android|iPhone/i.test(navigator.userAgent);

  const resize = () => {
    dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);
    logicalW = window.innerWidth;
    logicalH = window.innerHeight;
    canvas.width = logicalW * dpr;
    canvas.height = logicalH * dpr;
    canvas.style.width = logicalW + 'px';
    canvas.style.height = logicalH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  // Pre-rendered Raindrop Sprites with Optical Motion Blur & Droplet Beads
  const createRainSprites = () => {
    const sprites: HTMLCanvasElement[] = [];

    // Layer 0: Far background drizzle veil (fine, semi-translucent, soft motion stretch)
    {
      const c = document.createElement('canvas');
      c.width = 6;
      c.height = 80;
      const sCtx = c.getContext('2d')!;
      const grad = sCtx.createLinearGradient(3, 0, 3, 80);
      grad.addColorStop(0, 'rgba(215, 230, 255, 0)');
      grad.addColorStop(0.5, 'rgba(215, 230, 255, 0.08)');
      grad.addColorStop(0.85, 'rgba(225, 240, 255, 0.28)');
      grad.addColorStop(1, 'rgba(240, 248, 255, 0.5)');
      sCtx.strokeStyle = grad;
      sCtx.lineWidth = 1.4;
      sCtx.lineCap = 'round';
      sCtx.beginPath();
      sCtx.moveTo(3, 0);
      sCtx.lineTo(3, 78);
      sCtx.stroke();
      sprites.push(c);
    }

    // Layer 1: Midground driving rain (balanced motion blur, refractive water tint, droplet bead)
    {
      const c = document.createElement('canvas');
      c.width = 8;
      c.height = 110;
      const sCtx = c.getContext('2d')!;
      const grad = sCtx.createLinearGradient(4, 0, 4, 110);
      grad.addColorStop(0, 'rgba(200, 225, 255, 0)');
      grad.addColorStop(0.4, 'rgba(205, 230, 255, 0.12)');
      grad.addColorStop(0.8, 'rgba(225, 242, 255, 0.45)');
      grad.addColorStop(0.96, 'rgba(245, 250, 255, 0.85)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      sCtx.strokeStyle = grad;
      sCtx.lineWidth = 2.0;
      sCtx.lineCap = 'round';
      sCtx.beginPath();
      sCtx.moveTo(4, 0);
      sCtx.lineTo(4, 107);
      sCtx.stroke();

      // Soft circular droplet bead at bottom
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      sCtx.beginPath();
      sCtx.arc(4, 106, 1.2, 0, Math.PI * 2);
      sCtx.fill();
      sprites.push(c);
    }

    // Layer 2: Foreground kinetic heavy rain (heavy volume, tapered streak, luminous droplet head)
    {
      const c = document.createElement('canvas');
      c.width = 10;
      c.height = 150;
      const sCtx = c.getContext('2d')!;
      const grad = sCtx.createLinearGradient(5, 0, 5, 150);
      grad.addColorStop(0, 'rgba(190, 220, 255, 0)');
      grad.addColorStop(0.35, 'rgba(205, 230, 255, 0.15)');
      grad.addColorStop(0.75, 'rgba(225, 242, 255, 0.55)');
      grad.addColorStop(0.95, 'rgba(245, 252, 255, 0.9)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 1.0)');
      sCtx.strokeStyle = grad;
      sCtx.lineWidth = 2.8;
      sCtx.lineCap = 'round';
      sCtx.beginPath();
      sCtx.moveTo(5, 0);
      sCtx.lineTo(5, 145);
      sCtx.stroke();

      // Luminous droplet head
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      sCtx.beginPath();
      sCtx.arc(5, 144, 1.8, 0, Math.PI * 2);
      sCtx.fill();
      sprites.push(c);
    }

    return sprites;
  };

  const sprites = createRainSprites();

  // Multi-Layer Rain Pools (Rain World 3-Tier Kinetic Weather)
  const MAX_DROPS = isMobile ? 160 : 520;
  const drops: RainDrop[] = [];

  for (let i = 0; i < MAX_DROPS; i++) {
    const rand = Math.random();
    let layer = 1;
    let speed = Math.random() * 24 + 28;
    let length = Math.random() * 65 + 45;
    let thickness = 3.5;
    let opacity = 0.5;

    if (rand < 0.25) {
      // Layer 0: Background dense veil (fast, fine, semi-transparent)
      layer = 0;
      speed = Math.random() * 18 + 32;
      length = Math.random() * 45 + 30;
      thickness = 2.2;
      opacity = 0.35;
    } else if (rand > 0.85) {
      // Layer 2: Foreground massive crushing rods (thick, heavy kinetic energy)
      layer = 2;
      speed = Math.random() * 26 + 42;
      length = Math.random() * 100 + 75;
      thickness = 5.0;
      opacity = 0.85;
    }

    drops.push({
      x: Math.random() * logicalW,
      y: Math.random() * logicalH,
      speed,
      length,
      thickness,
      layer,
      opacity
    });
  }

  // Explosive ground splashes
  const splashes: Splash[] = [];
  const MAX_SPLASHES = isMobile ? 60 : 150;

  // Ground rolling mist particles
  const mistPuffs: MistPuff[] = [];
  const MAX_PUFFS = isMobile ? 12 : 28;
  for (let i = 0; i < MAX_PUFFS; i++) {
    mistPuffs.push({
      x: Math.random() * logicalW,
      y: logicalH - Math.random() * 45,
      vx: (Math.random() - 0.5) * 0.9,
      radius: Math.random() * 45 + 35,
      alpha: Math.random() * 0.4 + 0.1
    });
  }

  let lightningFlash = 0;

  const animate = () => {
    if (!canvas) return;

    const currentInt = intensity.value;

    // Performance optimization: completely clear and idle if totally dry
    if (currentInt <= 0) {
      ctx.clearRect(0, 0, logicalW, logicalH);
      animId = requestAnimationFrame(animate);
      return;
    }

    // Motion blur persistence: clearing with destination-out creates authentic camera shutter persistence
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${0.42 + currentInt * 0.28})`;
    ctx.fillRect(0, 0, logicalW, logicalH);
    ctx.globalCompositeOperation = 'source-over';

    // Active drop count scales with rain cycle intensity
    const activeDrops = Math.max(3, Math.floor(MAX_DROPS * Math.min(1.0, currentInt * 1.15)));

    // 1. Draw Rain Droplets (Vertical with true optical motion blur & translucent water refraction)
    for (let i = 0; i < activeDrops; i++) {
      const drop = drops[i];
      const speedMult = 0.7 + currentInt * 1.0;
      const curSpeed = drop.speed * speedMult;
      const curLength = drop.length * (0.65 + currentInt * 0.85);

      // Rain falls straight down vertically (zero angle slant)
      drop.y += curSpeed;

      // Draw motion-blurred sprite with soft fading tail and droplet tip
      const sprite = sprites[drop.layer];
      const alpha = Math.min(0.95, drop.opacity * (0.35 + currentInt * 0.75));
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, drop.x - drop.thickness / 2, drop.y - curLength, drop.thickness, curLength);

      // Ground impact check
      if (drop.y >= logicalH - 8) {
        if (splashes.length < MAX_SPLASHES && Math.random() < currentInt * (drop.layer === 2 ? 0.85 : 0.4)) {
          const splashBurst = drop.layer === 2 ? (isMobile ? 2 : 4) : (isMobile ? 1 : 2);
          for (let k = 0; k < splashBurst; k++) {
            splashes.push({
              x: drop.x,
              y: logicalH - Math.random() * 6,
              vx: (Math.random() - 0.5) * (3.6 + currentInt * 3.6),
              vy: -Math.random() * (2.8 + currentInt * 4.2) - 1.2,
              size: Math.random() * (drop.layer === 2 ? 2.2 : 1.4) + 0.6,
              life: 1.0,
              maxLife: Math.random() * 0.3 + 0.6
            });
          }
        }

        // Reset drop to top with vertical offset
        drop.y = -curLength - Math.random() * 40;
        drop.x = Math.random() * logicalW;
      }
    }
    ctx.globalAlpha = 1.0;

    // 2. Render Explosive Ground Splashes
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      const splashAlpha = (s.life / s.maxLife) * (0.35 + currentInt * 0.6);
      ctx.fillStyle = `rgba(225, 240, 255, ${splashAlpha})`;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.38; // Earth gravity pulling splash droplets back down
      s.life -= 0.052;

      if (s.life <= 0) {
        splashes.splice(i, 1);
      }
    }

    // 3. Render Ground Volumetric Rolling Mist (Torrential Ground Fog)
    if (currentInt > 0.25) {
      for (let i = 0; i < mistPuffs.length; i++) {
        const puff = mistPuffs[i];
        const mistAlpha = puff.alpha * (currentInt - 0.2) * 0.16;

        const grad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.radius * (0.8 + currentInt * 0.5));
        grad.addColorStop(0, `rgba(220, 235, 255, ${mistAlpha})`);
        grad.addColorStop(1, 'rgba(220, 235, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius * (0.8 + currentInt * 0.5), 0, Math.PI * 2);
        ctx.fill();

        puff.x += puff.vx;
        if (puff.x < -puff.radius) {
          puff.x = logicalW + puff.radius;
        } else if (puff.x > logicalW + puff.radius) {
          puff.x = -puff.radius;
        }
      }
    }

    // 4. Apocalyptic Lightning Flash (Peak Death Rain)
    if (currentInt >= 0.95 && Math.random() > 0.985) {
      lightningFlash = Math.random() * 0.22 + 0.1;
    }
    if (lightningFlash > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash})`;
      ctx.fillRect(0, 0, logicalW, logicalH);
      lightningFlash *= 0.65; // Quick flash decay
    }

    // Update DOM storm vignette opacity for peripheral atmospheric pressure
    if (stormVignetteRef.value) {
      const isTorrential = cycleStage.value === 'HEAVY' || cycleStage.value === 'DEATH_RAIN';
      const vignetteOpacity = isTorrential ? (0.45 + currentInt * 0.4) : (currentInt * 0.25);
      stormVignetteRef.value.style.opacity = String(vignetteOpacity);
    }

    animId = requestAnimationFrame(animate);
  };

  animate();
});

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId);
});
</script>

<template>
  <div 
    ref="containerRef"
    class="fixed inset-0 z-[99998] pointer-events-none overflow-hidden"
  >
    <!-- Rain World Atmospheric Storm Vignette (Tightens during HEAVY & DEATH_RAIN) -->
    <div 
      ref="stormVignetteRef"
      class="absolute inset-0 transition-opacity duration-700 pointer-events-none"
      style="background: radial-gradient(circle at 50% 45%, transparent 35%, rgba(0, 0, 0, 0.65) 75%, rgba(0, 0, 0, 0.92) 100%); opacity: 0;"
    ></div>

    <!-- Multi-Layer Canvas Rain & Explosive Splash Engine -->
    <canvas ref="rainCanvasRef" class="pointer-events-none"></canvas>
  </div>
</template>
