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

  // Multi-Layer Rain Pools (Rain World 3-Tier Kinetic Weather)
  const MAX_DROPS = isMobile ? 180 : 650;
  const drops: RainDrop[] = [];

  for (let i = 0; i < MAX_DROPS; i++) {
    // 60% midground, 25% background veil, 15% foreground crushing rods
    const rand = Math.random();
    let layer = 1;
    let speed = Math.random() * 26 + 28;
    let length = Math.random() * 65 + 40;
    let thickness = 0.8;
    let opacity = 0.35;

    if (rand < 0.25) {
      // Layer 0: Background dense veil (fast, fine, semi-transparent)
      layer = 0;
      speed = Math.random() * 20 + 35;
      length = Math.random() * 45 + 30;
      thickness = 0.5;
      opacity = 0.2;
    } else if (rand > 0.85) {
      // Layer 2: Foreground massive crushing rods (thick, heavy kinetic energy)
      layer = 2;
      speed = Math.random() * 30 + 45;
      length = Math.random() * 110 + 70;
      thickness = Math.random() * 1.4 + 1.2;
      opacity = 0.75;
    }

    drops.push({
      x: Math.random() * (logicalW + 400) - 200,
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
  const MAX_SPLASHES = isMobile ? 60 : 160;

  // Ground rolling mist particles
  const mistPuffs: MistPuff[] = [];
  const MAX_PUFFS = isMobile ? 12 : 28;
  for (let i = 0; i < MAX_PUFFS; i++) {
    mistPuffs.push({
      x: Math.random() * logicalW,
      y: logicalH - Math.random() * 45,
      vx: (Math.random() - 0.5) * 1.2 - 1.0, // wind drift to left
      radius: Math.random() * 40 + 30,
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

    // Motion blur clear trail: clear faster in heavy rain for sharp kinetic speed lines
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${0.35 + currentInt * 0.35})`;
    ctx.fillRect(0, 0, logicalW, logicalH);
    ctx.globalCompositeOperation = 'source-over';

    // Wind shear angle: rain drives diagonally with heavy wind (approx -18 deg)
    const windAngle = -0.32; // rad
    const windSin = Math.sin(windAngle);
    const windCos = Math.cos(windAngle);

    // Active drop count scales with rain cycle intensity
    const activeDrops = Math.max(3, Math.floor(MAX_DROPS * Math.min(1.0, currentInt * 1.15)));

    // 1. Draw Rain Droplets (All 3 Parallax Layers)
    for (let i = 0; i < activeDrops; i++) {
      const drop = drops[i];
      const speedMult = 0.6 + currentInt * 1.1;
      const curSpeed = drop.speed * speedMult;
      const curLength = drop.length * (0.6 + currentInt * 0.8);

      const vx = curSpeed * windSin;
      const vy = curSpeed * windCos;

      // Color & alpha modulation
      const alpha = Math.min(0.9, drop.opacity * (0.3 + currentInt * 0.85));
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = drop.thickness * (0.8 + currentInt * 0.5);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + curLength * windSin, drop.y + curLength * windCos);
      ctx.stroke();

      drop.x += vx;
      drop.y += vy;

      // Ground impact or off-screen boundary check
      if (drop.y >= logicalH - 12 || drop.x < -150) {
        // Spawn explosive bouncing water splashes only when impacting visible floor
        if (drop.y >= logicalH - 12 && drop.x >= -20 && drop.x <= logicalW + 20) {
          if (splashes.length < MAX_SPLASHES && Math.random() < currentInt * (drop.layer === 2 ? 0.85 : 0.4)) {
            const splashBurst = drop.layer === 2 ? (isMobile ? 3 : 5) : (isMobile ? 1 : 2);
            for (let k = 0; k < splashBurst; k++) {
              splashes.push({
                x: drop.x,
                y: logicalH - Math.random() * 8,
                vx: (Math.random() - 0.65) * (4.5 + currentInt * 4.0),
                vy: -Math.random() * (3.5 + currentInt * 5.0) - 1.8,
                size: Math.random() * (drop.layer === 2 ? 2.6 : 1.6) + 0.8,
                life: 1.0,
                maxLife: Math.random() * 0.35 + 0.65
              });
            }
          }
        }

        // Reset drop to top with wind offset
        drop.y = -curLength - Math.random() * 50;
        drop.x = Math.random() * (logicalW + 450) - 50;
      }
    }

    // 2. Render Explosive Ground Splashes
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      const splashAlpha = (s.life / s.maxLife) * (0.4 + currentInt * 0.6);
      ctx.fillStyle = `rgba(255, 255, 255, ${splashAlpha})`;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.42; // Earth gravity pulling splash droplets back down
      s.life -= 0.055;

      if (s.life <= 0) {
        splashes.splice(i, 1);
      }
    }

    // 3. Render Ground Volumetric Rolling Mist (Torrential Ground Fog)
    if (currentInt > 0.25) {
      for (let i = 0; i < mistPuffs.length; i++) {
        const puff = mistPuffs[i];
        const mistAlpha = puff.alpha * (currentInt - 0.2) * 0.18;

        const grad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.radius * (0.8 + currentInt * 0.5));
        grad.addColorStop(0, `rgba(255, 255, 255, ${mistAlpha})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius * (0.8 + currentInt * 0.5), 0, Math.PI * 2);
        ctx.fill();

        puff.x += puff.vx * (1.0 + currentInt * 1.5);
        if (puff.x < -puff.radius) {
          puff.x = logicalW + puff.radius;
          puff.y = logicalH - Math.random() * (45 + currentInt * 35);
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
