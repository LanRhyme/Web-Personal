<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRainCycle } from '../composables/useRainCycle';

const rainCanvasRef = ref<HTMLCanvasElement | null>(null);
let animId: number;

const { intensity } = useRainCycle();

onMounted(() => {
  const canvas = rainCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const drops: {x: number, y: number, speed: number, length: number, thickness: number}[] = [];
  const splashes: {x: number, y: number, vx: number, vy: number, life: number}[] = [];

  // Heavy storm max drops
  const MAX_DROPS = 1200;
  for(let i = 0; i < MAX_DROPS; i++) {
    drops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 30 + 25, // Much faster
      length: Math.random() * 80 + 40, // Much longer
      thickness: Math.random() > 0.8 ? 1 : 0.5 // Thinner
    });
  }

  const animate = () => {
    if (!canvas) return;
    
    // Performance optimization: skip heavy drawing if dry
    if (intensity.value <= 0) {
      // Clear canvas if it's completely dry
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animId = requestAnimationFrame(animate);
      return;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 + intensity.value * 0.2})`; // Clear faster when raining harder
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    const rainColor = `rgba(255, 255, 255, ${Math.max(0.1, 0.2 + intensity.value * 0.4)})`; // White rain
    const scrollParallax = window.scrollY * 0.1;

    // Active drops count depends on intensity (minimum 2 drops during dry cycle)
    const activeDropsCount = Math.max(2, Math.floor(MAX_DROPS * intensity.value));

    for (let i = 0; i < activeDropsCount; i++) {
      const drop = drops[i];
      ctx.fillStyle = rainColor;
      // speed scales with intensity slightly
      const currentSpeed = drop.speed * (0.5 + intensity.value * 0.8);
      ctx.fillRect(drop.x, drop.y - (scrollParallax % canvas.height), drop.thickness, drop.length * (0.5 + Math.max(0.1, intensity.value) * 0.5));
      drop.y += currentSpeed;

      // Splashing - more aggressive at higher intensity
      const splashChance = intensity.value > 0.8 ? 0.95 : 0.99;
      if (drop.y > canvas.height - 10 || Math.random() > splashChance) {
        if (Math.random() < intensity.value * 0.6) { // More splashes when heavier
          const splashCount = intensity.value > 0.8 ? 4 : 2;
          for(let k = 0; k < splashCount; k++) {
            splashes.push({
              x: drop.x,
              y: drop.y > canvas.height - 10 ? canvas.height : drop.y,
              vx: (Math.random() - 0.5) * 6 * intensity.value,
              vy: -Math.random() * 5 * intensity.value - 2,
              life: 1
            });
          }
        }
        drop.y = -50;
        drop.x = Math.random() * canvas.width;
      }
    }

    for (let i = splashes.length - 1; i >= 0; i--) {
      let s = splashes[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${s.life * intensity.value})`;
      ctx.fillRect(s.x, s.y - (scrollParallax % canvas.height), Math.random() * 3, Math.random() * 3);
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.4; // gravity
      s.life -= 0.05;
      if (s.life <= 0) splashes.splice(i, 1);
    }

    // Occasional lightning flash at max intensity
    if (intensity.value > 0.95 && Math.random() > 0.98) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    class="fixed inset-0 z-[9999] pointer-events-none mix-blend-screen overflow-hidden"
    :style="{ opacity: Math.max(0.15, 0.6 + intensity * 0.4) }"
  >
    <!-- Mist overlay gets thicker as intensity increases -->
    <div 
      class="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.02)] pointer-events-none"
      :style="{ backgroundColor: `rgba(255,255,255, ${intensity * 0.05})` }"
    ></div>
    <canvas ref="rainCanvasRef" class="w-full h-full object-cover pointer-events-none" :class="{ 'opacity-50': intensity < 0.2 }"></canvas>
  </div>
</template>
