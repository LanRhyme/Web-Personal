<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRainCycle } from '../composables/useRainCycle';

const rainCanvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const stormVignetteRef = ref<HTMLElement | null>(null);
let animId: number;

const { intensity, cycleStage } = useRainCycle();

// Rain World Atmospheric Color Grading: Gritty industrial desaturation, contrast wash & slight background blur
const atmosphereStyle = computed(() => {
  const int = intensity.value;
  if (int <= 0.03) {
    return {
      opacity: '0',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      backgroundColor: 'transparent'
    };
  }

  // Desaturate progressively down to 0.40 (gritty slate/charcoal tone)
  const sat = Math.max(0.40, 1.0 - int * 0.60);
  // Enhance contrast to deepen heavy shadows
  const contrast = 1.0 + Math.min(0.30, int * 0.30);
  // Pull down brightness for apocalyptic gloom
  const brightness = Math.max(0.74, 1.0 - int * 0.26);
  // Slight background optical blur during heavy rain (0px -> 1.8px max, keeping text readable)
  const blur = int > 0.25 ? Math.min(1.8, (int - 0.25) * 2.4) : 0;

  // Dark industrial murky tint
  const overlayAlpha = Math.min(0.30, int * 0.30);
  const filterStr = `saturate(${sat.toFixed(2)}) contrast(${contrast.toFixed(2)}) brightness(${brightness.toFixed(2)})${blur > 0.05 ? ` blur(${blur.toFixed(2)}px)` : ''}`;

  return {
    opacity: '1',
    backdropFilter: filterStr,
    WebkitBackdropFilter: filterStr,
    backgroundColor: `rgba(10, 20, 26, ${overlayAlpha.toFixed(2)})`
  };
});

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  thickness: number;
  layer: number; // 0 = misty far, 1 = clean mid, 2 = razor-sharp foreground
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

  // 1. Cascading Downpour Curtains (Rain World Distant Foggy Water Curtains)
  const curtainCount = isMobile ? 4 : 8;
  const curtains: WaterCurtain[] = [];
  for (let i = 0; i < curtainCount; i++) {
    const width = Math.random() * 140 + 100;
    const subCount = Math.floor(Math.random() * 4) + 3;
    const subStreams = [];
    for (let k = 0; k < subCount; k++) {
      subStreams.push({
        offset: Math.random() * width,
        width: Math.random() * 2.0 + 0.8,
        speedMult: Math.random() * 0.4 + 0.8
      });
    }
    curtains.push({
      x: (i / curtainCount) * (logicalW + 200) - 100 + (Math.random() - 0.5) * 80,
      width,
      speed: Math.random() * 30 + 50,
      phase: Math.random() * 1000,
      opacity: Math.random() * 0.35 + 0.45,
      subStreams
    });
  }

  // 2. Screen Streaming Rivulets (Water streaming down camera lens with crisp glints)
  const rivuletCount = isMobile ? 8 : 16;
  const rivulets: Rivulet[] = [];
  for (let i = 0; i < rivuletCount; i++) {
    rivulets.push({
      x: Math.random() * logicalW,
      y: Math.random() * logicalH,
      speed: Math.random() * 5 + 4,
      length: Math.random() * 65 + 45,
      width: Math.random() * 1.8 + 1.2,
      wobble: Math.random() * 100
    });
  }

  // Pre-rendered sprite canvases for soft motion-blurred rain falling vertically
  const createRainSprites = () => {
    const sprites: HTMLCanvasElement[] = [];

    // Layer 0: Distant misty rain (Soft, narrow, translucent gradient)
    {
      const c = document.createElement('canvas');
      c.width = 6;
      c.height = 70;
      const sCtx = c.getContext('2d')!;
      const grad = sCtx.createLinearGradient(3, 0, 3, 70);
      grad.addColorStop(0, 'rgba(180, 215, 255, 0)');
      grad.addColorStop(0.5, 'rgba(195, 225, 255, 0.2)');
      grad.addColorStop(0.9, 'rgba(215, 235, 255, 0.55)');
      grad.addColorStop(1, 'rgba(235, 245, 255, 0.75)');
      sCtx.strokeStyle = grad;
      sCtx.lineWidth = 1.2;
      sCtx.lineCap = 'round';
      sCtx.beginPath();
      sCtx.moveTo(3, 0);
      sCtx.lineTo(3, 68);
      sCtx.stroke();
      sprites.push(c);
    }

    // Layer 1: Midground driving rain (Clean, bright with soft head)
    {
      const c = document.createElement('canvas');
      c.width = 8;
      c.height = 110;
      const sCtx = c.getContext('2d')!;
      const grad = sCtx.createLinearGradient(4, 0, 4, 110);
      grad.addColorStop(0, 'rgba(200, 225, 255, 0)');
      grad.addColorStop(0.4, 'rgba(205, 230, 255, 0.15)');
      grad.addColorStop(0.8, 'rgba(225, 242, 255, 0.5)');
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

    // Layer 2: Foreground kinetic heavy rain rods (Crisp and brilliant)
    {
      const c = document.createElement('canvas');
      c.width = 10;
      c.height = 150;
      const sCtx = c.getContext('2d')!;
      const grad = sCtx.createLinearGradient(5, 0, 5, 150);
      grad.addColorStop(0, 'rgba(190, 220, 255, 0)');
      grad.addColorStop(0.35, 'rgba(205, 230, 255, 0.18)');
      grad.addColorStop(0.75, 'rgba(225, 242, 255, 0.6)');
      grad.addColorStop(0.95, 'rgba(245, 252, 255, 0.92)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 1.0)');
      sCtx.strokeStyle = grad;
      sCtx.lineWidth = 2.8;
      sCtx.lineCap = 'round';
      sCtx.beginPath();
      sCtx.moveTo(5, 0);
      sCtx.lineTo(5, 145);
      sCtx.stroke();

      sCtx.fillStyle = '#ffffff';
      sCtx.beginPath();
      sCtx.arc(5, 144, 1.6, 0, Math.PI * 2);
      sCtx.fill();
      sprites.push(c);
    }

    return sprites;
  };

  const sprites = createRainSprites();

  // 3. Multi-Tier Rain Pools (Partly misty far veil, partly razor-sharp foreground)
  const MAX_DROPS = isMobile ? 180 : 500;
  const drops: RainDrop[] = [];

  for (let i = 0; i < MAX_DROPS; i++) {
    const rand = Math.random();
    let layer = 1; // 0 = misty veil, 1 = crisp mid, 2 = razor-sharp foreground
    let speed = Math.random() * 24 + 28;
    let length = Math.random() * 65 + 45;
    let thickness = 1.4;
    let opacity = 0.7;

    if (rand < 0.35) {
      // Layer 0: Misty / foggy distant veil (soft, low alpha, diffused)
      layer = 0;
      speed = Math.random() * 16 + 26;
      length = Math.random() * 40 + 25;
      thickness = 0.9;
      opacity = 0.28;
    } else if (rand > 0.82) {
      // Layer 2: Foreground kinetic heavy rain (crystal-clear, razor-sharp, high-contrast)
      layer = 2;
      speed = Math.random() * 28 + 44;
      length = Math.random() * 110 + 80;
      thickness = 2.4;
      opacity = 0.95;
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

  // 4. Explosive Ground Splashes
  const splashes: Splash[] = [];
  const MAX_SPLASHES = isMobile ? 60 : 160;

  // 5. Ground Boiling Vapor & Mist Plumes
  const mistPuffs: MistPuff[] = [];
  const MAX_PUFFS = isMobile ? 14 : 30;
  for (let i = 0; i < MAX_PUFFS; i++) {
    mistPuffs.push({
      x: Math.random() * logicalW,
      y: logicalH - Math.random() * 50,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -Math.random() * 0.6 - 0.2,
      radius: Math.random() * 45 + 30,
      alpha: Math.random() * 0.35 + 0.12
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

    // Completely clean canvas clear on every frame: NO smudging, NO muddy blur
    ctx.clearRect(0, 0, logicalW, logicalH);

    if (currentInt <= 0) {
      animId = requestAnimationFrame(animate);
      return;
    }

    // ==============================================================
    // PHASE A: Misty Cascading Downpour Curtains (Foggy background veil)
    // ==============================================================
    if (currentInt > 0.35) {
      const curtainStrength = Math.min(1.0, (currentInt - 0.35) / 0.65);

      for (let i = 0; i < curtains.length; i++) {
        const c = curtains[i];
        c.phase += c.speed * dt * (0.8 + currentInt * 0.8);

        // Soft, foggy vertical curtain band
        const grad = ctx.createLinearGradient(c.x, 0, c.x + c.width, 0);
        const coreAlpha = c.opacity * curtainStrength * 0.10;
        grad.addColorStop(0, 'rgba(180, 215, 235, 0)');
        grad.addColorStop(0.5, `rgba(195, 230, 252, ${coreAlpha})`);
        grad.addColorStop(1, 'rgba(180, 215, 235, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(c.x, 0, c.width, logicalH);

        // Diffused vertical streaming water rib-lines
        ctx.strokeStyle = `rgba(215, 235, 255, ${c.opacity * curtainStrength * 0.18})`;
        for (let k = 0; k < c.subStreams.length; k++) {
          const sub = c.subStreams[k];
          const streamX = c.x + sub.offset;
          const yHead = ((c.phase * sub.speedMult * 38) % (logicalH + 300)) - 150;

          ctx.lineWidth = sub.width;
          ctx.beginPath();
          ctx.moveTo(streamX, yHead);
          ctx.lineTo(streamX, yHead + 140 + currentInt * 100);
          ctx.stroke();
        }
      }
    }

    // ==============================================================
    // PHASE B: Ground Boiling Vapor & Mist Plumes (Soft foggy steam)
    // ==============================================================
    if (currentInt > 0.25) {
      for (let i = 0; i < mistPuffs.length; i++) {
        const puff = mistPuffs[i];
        const mistAlpha = puff.alpha * (currentInt - 0.2) * 0.16;

        const grad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.radius * (0.8 + currentInt * 0.5));
        grad.addColorStop(0, `rgba(220, 235, 255, ${mistAlpha})`);
        grad.addColorStop(0.6, `rgba(200, 220, 245, ${mistAlpha * 0.4})`);
        grad.addColorStop(1, 'rgba(220, 235, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius * (0.8 + currentInt * 0.5), 0, Math.PI * 2);
        ctx.fill();

        puff.x += puff.vx;
        puff.y += puff.vy * (0.8 + currentInt * 1.2);

        if (puff.y < logicalH - 85 || puff.x < -puff.radius || puff.x > logicalW + puff.radius) {
          puff.x = Math.random() * logicalW;
          puff.y = logicalH - Math.random() * 25;
        }
      }
    }

    // ==============================================================
    // PHASE C: Raindrops (Motion-Blurred Sprites with Soft Gradient Tails)
    // ==============================================================
    const activeDrops = Math.max(8, Math.floor(MAX_DROPS * Math.min(1.0, currentInt * 1.15)));
    for (let i = 0; i < activeDrops; i++) {
      const drop = drops[i];
      const speedMult = 0.75 + currentInt * 0.95;
      const curSpeed = drop.speed * speedMult;
      const curLength = drop.length * (0.65 + currentInt * 0.85);

      drop.y += curSpeed;

      const sprite = sprites[drop.layer];
      const alpha = Math.min(0.95, drop.opacity * (0.32 + currentInt * 0.75));
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
              size: Math.random() * (drop.layer === 2 ? 2.0 : 1.2) + 0.7,
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
    // PHASE D: Explosive Ground Splashes (Sharp, bright droplets)
    // ==============================================================
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      const splashAlpha = (s.life / s.maxLife) * (0.45 + currentInt * 0.55);
      ctx.fillStyle = `rgba(255, 255, 255, ${splashAlpha})`;

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
    // PHASE E: Screen Streaming Rivulets (Clean refractive glass streams)
    // ==============================================================
    if (currentInt > 0.45) {
      const rivuletAlpha = Math.min(0.55, (currentInt - 0.45) * 0.85);
      for (let i = 0; i < rivulets.length; i++) {
        const r = rivulets[i];
        r.y += r.speed * (0.7 + currentInt * 0.8);
        r.wobble += dt * 3;

        const wobX = r.x + Math.sin(r.y * 0.04 + r.wobble) * 3.5;
        const rivGrad = ctx.createLinearGradient(wobX, r.y - r.length, wobX, r.y);
        rivGrad.addColorStop(0, 'rgba(210, 235, 255, 0)');
        rivGrad.addColorStop(0.7, `rgba(230, 245, 255, ${rivuletAlpha * 0.65})`);
        rivGrad.addColorStop(1, `rgba(255, 255, 255, ${rivuletAlpha * 0.98})`);

        ctx.strokeStyle = rivGrad;
        ctx.lineWidth = r.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wobX, r.y - r.length);
        ctx.lineTo(wobX, r.y);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${rivuletAlpha * 0.95})`;
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
      class="absolute inset-0 pointer-events-none transition-all duration-500 ease-out"
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

