<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRainCycle } from '../composables/useRainCycle';

const rainCanvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const stormVignetteRef = ref<HTMLElement | null>(null);
let animId: number;

const { intensity, cycleStage } = useRainCycle();

// Rain World Atmospheric Color Grading: Gritty industrial desaturation & contrast wash
const atmosphereStyle = computed(() => {
  const int = intensity.value;
  if (int <= 0.03) {
    return {
      opacity: '0',
      backdropFilter: 'none',
      backgroundColor: 'transparent'
    };
  }

  // Desaturate progressively down to 0.42 (gritty slate/charcoal tone)
  const sat = Math.max(0.42, 1.0 - int * 0.58);
  // Enhance contrast to deepen heavy shadows
  const contrast = 1.0 + Math.min(0.32, int * 0.32);
  // Pull down brightness for apocalyptic gloom
  const brightness = Math.max(0.72, 1.0 - int * 0.28);
  // Subtle optical drenching blur at extreme death rain
  const blur = int > 0.85 ? (int - 0.85) * 2.2 : 0;

  // Dark industrial murky tint
  const overlayAlpha = Math.min(0.32, int * 0.32);

  return {
    opacity: '1',
    backdropFilter: `saturate(${sat.toFixed(2)}) contrast(${contrast.toFixed(2)}) brightness(${brightness.toFixed(2)})${blur > 0.1 ? ` blur(${blur.toFixed(1)}px)` : ''}`,
    backgroundColor: `rgba(10, 20, 26, ${overlayAlpha.toFixed(2)})`
  };
});

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  thickness: number;
  layer: number; // 0 = far, 1 = mid, 2 = near
  opacity: number;
}

interface WaterCurtain {
  x: number;
  width: number;
  speed: number;
  phase: number;
  opacity: number;
  subStreams: { offset: number; width: number; speedMult: number }[];
}

interface Rivulet {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  wobble: number;
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
  vy: number;
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

  // 1. Pre-rendered Raindrop Sprites with Optical Motion Blur & Droplet Beads
  const createRainSprites = () => {
    const sprites: HTMLCanvasElement[] = [];

    // Layer 0: Far background drizzle veil
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

    // Layer 1: Midground driving rain
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

      sCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      sCtx.beginPath();
      sCtx.arc(4, 106, 1.2, 0, Math.PI * 2);
      sCtx.fill();
      sprites.push(c);
    }

    // Layer 2: Foreground kinetic heavy rain rods
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

      sCtx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      sCtx.beginPath();
      sCtx.arc(5, 144, 1.8, 0, Math.PI * 2);
      sCtx.fill();
      sprites.push(c);
    }

    return sprites;
  };

  const sprites = createRainSprites();

  // 2. Cascading Downpour Curtains (Rain World Torrential Waterfall Sheets)
  const curtainCount = isMobile ? 4 : 8;
  const curtains: WaterCurtain[] = [];
  for (let i = 0; i < curtainCount; i++) {
    const width = Math.random() * 140 + 100;
    const subCount = Math.floor(Math.random() * 4) + 3;
    const subStreams = [];
    for (let k = 0; k < subCount; k++) {
      subStreams.push({
        offset: Math.random() * width,
        width: Math.random() * 2.5 + 1.0,
        speedMult: Math.random() * 0.4 + 0.8
      });
    }
    curtains.push({
      x: (i / curtainCount) * (logicalW + 200) - 100 + (Math.random() - 0.5) * 80,
      width,
      speed: Math.random() * 35 + 55,
      phase: Math.random() * 1000,
      opacity: Math.random() * 0.4 + 0.6,
      subStreams
    });
  }

  // 3. Screen Streaming Rivulets (Water sliding down the lens)
  const rivuletCount = isMobile ? 8 : 18;
  const rivulets: Rivulet[] = [];
  for (let i = 0; i < rivuletCount; i++) {
    rivulets.push({
      x: Math.random() * logicalW,
      y: Math.random() * logicalH,
      speed: Math.random() * 6 + 5,
      length: Math.random() * 70 + 50,
      width: Math.random() * 2.0 + 1.2,
      wobble: Math.random() * 100
    });
  }

  // 4. Kinetic Droplet Pool
  const MAX_DROPS = isMobile ? 160 : 480;
  const drops: RainDrop[] = [];

  for (let i = 0; i < MAX_DROPS; i++) {
    const rand = Math.random();
    let layer = 1;
    let speed = Math.random() * 24 + 28;
    let length = Math.random() * 65 + 45;
    let thickness = 3.5;
    let opacity = 0.5;

    if (rand < 0.25) {
      layer = 0;
      speed = Math.random() * 18 + 32;
      length = Math.random() * 45 + 30;
      thickness = 2.2;
      opacity = 0.35;
    } else if (rand > 0.85) {
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

  // 5. Explosive Ground Splashes
  const splashes: Splash[] = [];
  const MAX_SPLASHES = isMobile ? 60 : 160;

  // 6. Ground Boiling Vapor & Mist Plumes
  const mistPuffs: MistPuff[] = [];
  const MAX_PUFFS = isMobile ? 14 : 32;
  for (let i = 0; i < MAX_PUFFS; i++) {
    mistPuffs.push({
      x: Math.random() * logicalW,
      y: logicalH - Math.random() * 55,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 0.6 - 0.2, // boiling rising vapor
      radius: Math.random() * 50 + 35,
      alpha: Math.random() * 0.4 + 0.15
    });
  }

  let lightningFlash = 0;
  let lastFrameTime = performance.now();

  const animate = () => {
    if (!canvas) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    const currentInt = intensity.value;

    // Completely idle if totally dry
    if (currentInt <= 0) {
      ctx.clearRect(0, 0, logicalW, logicalH);
      animId = requestAnimationFrame(animate);
      return;
    }

    // Motion blur persistence clear
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${0.40 + currentInt * 0.26})`;
    ctx.fillRect(0, 0, logicalW, logicalH);
    ctx.globalCompositeOperation = 'source-over';

    // ==============================================================
    // PHASE A: Cascading Water Curtains (Heavy & Death Rain Sheets)
    // ==============================================================
    if (currentInt > 0.35) {
      const curtainStrength = Math.min(1.0, (currentInt - 0.35) / 0.65);

      for (let i = 0; i < curtains.length; i++) {
        const c = curtains[i];
        c.phase += c.speed * dt * (0.8 + currentInt * 0.8);

        // Soft vertical curtain band
        const grad = ctx.createLinearGradient(c.x, 0, c.x + c.width, 0);
        const coreAlpha = c.opacity * curtainStrength * 0.12;
        grad.addColorStop(0, 'rgba(180, 215, 235, 0)');
        grad.addColorStop(0.5, `rgba(195, 230, 252, ${coreAlpha})`);
        grad.addColorStop(1, 'rgba(180, 215, 235, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(c.x, 0, c.width, logicalH);

        // Streaming vertical cascading water rib-lines
        ctx.strokeStyle = `rgba(220, 240, 255, ${c.opacity * curtainStrength * 0.22})`;
        for (let k = 0; k < c.subStreams.length; k++) {
          const sub = c.subStreams[k];
          const streamX = c.x + sub.offset;
          const yHead = ((c.phase * sub.speedMult * 40) % (logicalH + 300)) - 150;

          ctx.lineWidth = sub.width * (0.8 + currentInt * 0.5);
          ctx.beginPath();
          ctx.moveTo(streamX, yHead);
          ctx.lineTo(streamX, yHead + 160 + currentInt * 120);
          ctx.stroke();
        }
      }
    }

    // ==============================================================
    // PHASE B: Screen Streaming Rivulets (Water streaming down camera lens)
    // ==============================================================
    if (currentInt > 0.45) {
      const rivuletAlpha = Math.min(0.5, (currentInt - 0.45) * 0.8);
      for (let i = 0; i < rivulets.length; i++) {
        const r = rivulets[i];
        r.y += r.speed * (0.7 + currentInt * 0.8);
        r.wobble += dt * 3;

        // Rivulet body with subtle sinusoidal trail
        const wobX = r.x + Math.sin(r.y * 0.04 + r.wobble) * 3.5;
        const rivGrad = ctx.createLinearGradient(wobX, r.y - r.length, wobX, r.y);
        rivGrad.addColorStop(0, 'rgba(195, 225, 248, 0)');
        rivGrad.addColorStop(0.7, `rgba(215, 238, 255, ${rivuletAlpha * 0.6})`);
        rivGrad.addColorStop(1, `rgba(245, 252, 255, ${rivuletAlpha * 0.95})`);

        ctx.strokeStyle = rivGrad;
        ctx.lineWidth = r.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wobX, r.y - r.length);
        ctx.lineTo(wobX, r.y);
        ctx.stroke();

        // Droplet accumulation node at tip
        ctx.fillStyle = `rgba(255, 255, 255, ${rivuletAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(wobX, r.y, r.width * 1.1, 0, Math.PI * 2);
        ctx.fill();

        if (r.y - r.length > logicalH) {
          r.y = -Math.random() * 60;
          r.x = Math.random() * logicalW;
        }
      }
    }

    // ==============================================================
    // PHASE C: Kinetic Raindrops (Multi-Layer Sprites with Motion Blur)
    // ==============================================================
    const activeDrops = Math.max(3, Math.floor(MAX_DROPS * Math.min(1.0, currentInt * 1.15)));
    for (let i = 0; i < activeDrops; i++) {
      const drop = drops[i];
      const speedMult = 0.7 + currentInt * 1.0;
      const curSpeed = drop.speed * speedMult;
      const curLength = drop.length * (0.65 + currentInt * 0.85);

      drop.y += curSpeed;

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

        drop.y = -curLength - Math.random() * 40;
        drop.x = Math.random() * logicalW;
      }
    }
    ctx.globalAlpha = 1.0;

    // ==============================================================
    // PHASE D: Explosive Ground Splashes
    // ==============================================================
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      const splashAlpha = (s.life / s.maxLife) * (0.35 + currentInt * 0.6);
      ctx.fillStyle = `rgba(225, 240, 255, ${splashAlpha})`;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.38;
      s.life -= 0.052;

      if (s.life <= 0) {
        splashes.splice(i, 1);
      }
    }

    // ==============================================================
    // PHASE E: Ground Boiling Vapor & Mist Plumes (No water rising)
    // ==============================================================
    if (currentInt > 0.25) {
      for (let i = 0; i < mistPuffs.length; i++) {
        const puff = mistPuffs[i];
        const mistAlpha = puff.alpha * (currentInt - 0.2) * 0.18;

        const grad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.radius * (0.8 + currentInt * 0.5));
        grad.addColorStop(0, `rgba(220, 235, 255, ${mistAlpha})`);
        grad.addColorStop(0.6, `rgba(200, 220, 245, ${mistAlpha * 0.4})`);
        grad.addColorStop(1, 'rgba(220, 235, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius * (0.8 + currentInt * 0.5), 0, Math.PI * 2);
        ctx.fill();

        puff.x += puff.vx;
        puff.y += puff.vy * (0.8 + currentInt * 1.2); // rising steam vapor

        // Respawn vapor near bottom
        if (puff.y < logicalH - 90 || puff.x < -puff.radius || puff.x > logicalW + puff.radius) {
          puff.x = Math.random() * logicalW;
          puff.y = logicalH - Math.random() * 30;
        }
      }
    }

    // ==============================================================
    // PHASE F: Apocalyptic Lightning Flash (Peak Death Rain)
    // ==============================================================
    if (currentInt >= 0.95 && Math.random() > 0.985) {
      lightningFlash = Math.random() * 0.22 + 0.1;
    }
    if (lightningFlash > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash})`;
      ctx.fillRect(0, 0, logicalW, logicalH);
      lightningFlash *= 0.65;
    }

    // Update DOM storm vignette opacity
    if (stormVignetteRef.value) {
      const isTorrential = cycleStage.value === 'HEAVY' || cycleStage.value === 'DEATH_RAIN';
      const vignetteOpacity = isTorrential ? (0.45 + currentInt * 0.4) : (currentInt * 0.22);
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
    <!-- Rain World Atmospheric Color Grading & Desaturation Filter -->
    <div 
      class="absolute inset-0 pointer-events-none transition-all duration-700"
      :style="atmosphereStyle"
    ></div>

    <!-- Rain World Atmospheric Storm Vignette (Tightens during HEAVY & DEATH_RAIN) -->
    <div 
      ref="stormVignetteRef"
      class="absolute inset-0 transition-opacity duration-700 pointer-events-none"
      style="background: radial-gradient(circle at 50% 45%, transparent 35%, rgba(10, 18, 22, 0.7) 75%, rgba(4, 8, 10, 0.94) 100%); opacity: 0;"
    ></div>

    <!-- Multi-Layer Canvas Rain, Downpour Curtains, Water Rivulets & Splash Engine -->
    <canvas ref="rainCanvasRef" class="pointer-events-none"></canvas>
  </div>
</template>

