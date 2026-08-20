<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRainCycle } from '../composables/useRainCycle';

const rainCanvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const mistRef = ref<HTMLElement | null>(null);
let animId: number;

const { intensity } = useRainCycle();

onMounted(() => {
  const canvas = rainCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dpr = 1;
  let logicalW = window.innerWidth;
  let logicalH = window.innerHeight;

  const resize = () => {
    dpr = window.devicePixelRatio || 1;
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

  const drops: {x: number, y: number, speed: number, length: number, thickness: number}[] = [];
  const splashes: {x: number, y: number, vx: number, vy: number, life: number}[] = [];

  const isMobile = window.innerWidth < 640 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const MAX_DROPS = isMobile ? 120 : 450;
  for(let i = 0; i < MAX_DROPS; i++) {
    drops.push({
      x: Math.random() * logicalW,
      y: Math.random() * logicalH,
      speed: Math.random() * 25 + 20,
      length: Math.random() * 70 + 35,
      thickness: Math.random() > 0.85 ? 1 : 0.6
    });
  }

  const animate = () => {
    if (!canvas) return;
    
    // Performance optimization: skip heavy drawing if dry
    if (intensity.value <= 0) {
      // Clear canvas if it's completely dry
      ctx.clearRect(0, 0, logicalW, logicalH);
      animId = requestAnimationFrame(animate);
      return;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 + intensity.value * 0.2})`; // Clear faster when raining harder
    ctx.fillRect(0, 0, logicalW, logicalH);
    ctx.globalCompositeOperation = 'source-over';

    const rainColor = `rgba(255, 255, 255, ${Math.max(0.1, 0.2 + intensity.value * 0.4)})`; // White rain

    // Active drops count depends on intensity (minimum 2 drops during dry cycle)
    const activeDropsCount = Math.max(2, Math.floor(MAX_DROPS * intensity.value));

    for (let i = 0; i < activeDropsCount; i++) {
      const drop = drops[i];
      ctx.fillStyle = rainColor;
      // speed scales with intensity slightly
      const currentSpeed = drop.speed * (0.5 + intensity.value * 0.8);
      ctx.fillRect(drop.x, drop.y, drop.thickness, drop.length * (0.5 + Math.max(0.1, intensity.value) * 0.5));
      drop.y += currentSpeed;

      // Splashing - capped to avoid memory churn
      const baseSplashChance = isMobile ? 0.99 : 0.96;
      const splashChance = intensity.value > 0.8 ? baseSplashChance : 0.995;
      if (drop.y > logicalH - 10 || Math.random() > splashChance) {
        const maxSplashChance = isMobile ? 0.15 : 0.4;
        if (splashes.length < 50 && Math.random() < intensity.value * maxSplashChance) {
          const splashCount = intensity.value > 0.8 ? 3 : 1;
          for(let k = 0; k < splashCount; k++) {
            splashes.push({
              x: drop.x,
              y: drop.y > logicalH - 10 ? logicalH : drop.y,
              vx: (Math.random() - 0.5) * 5 * intensity.value,
              vy: -Math.random() * 4 * intensity.value - 1.5,
              life: 1
            });
          }
        }
        drop.y = -50;
        drop.x = Math.random() * logicalW;
      }
    }

    for (let i = splashes.length - 1; i >= 0; i--) {
      let s = splashes[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${s.life * intensity.value})`;
      ctx.fillRect(s.x, s.y, Math.random() * 2.5 + 0.5, Math.random() * 2.5 + 0.5);
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.4; // gravity
      s.life -= 0.06;
      if (s.life <= 0) splashes.splice(i, 1);
    }

    // Occasional lightning flash at max intensity
    if (intensity.value > 0.95 && Math.random() > 0.98) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
      ctx.fillRect(0, 0, logicalW, logicalH);
    }

    // Update DOM styles without triggering Vue reactivity patch
    if (containerRef.value) {
      containerRef.value.style.opacity = String(Math.max(0.15, 0.6 + intensity.value * 0.4));
    }
    if (mistRef.value) {
      mistRef.value.style.backgroundColor = `rgba(255,255,255, ${intensity.value * 0.05})`;
    }
    if (intensity.value < 0.2) {
      if (!canvas.classList.contains('opacity-50')) canvas.classList.add('opacity-50');
    } else {
      if (canvas.classList.contains('opacity-50')) canvas.classList.remove('opacity-50');
    }

    animId = requestAnimationFrame(animate);
  };
  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animId);
});
</script>

<template>
  <div 
    ref="containerRef"
    class="fixed inset-0 z-[99998] pointer-events-none overflow-hidden"
  >
    <!-- Mist overlay gets thicker as intensity increases -->
    <div 
      ref="mistRef"
      class="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.02)] pointer-events-none"
    ></div>
    <canvas ref="rainCanvasRef" class="pointer-events-none"></canvas>
  </div>
</template>
