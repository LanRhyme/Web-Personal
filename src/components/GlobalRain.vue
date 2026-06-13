<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const rainCanvasRef = ref<HTMLCanvasElement | null>(null);
let animId: number;

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

  // Heavy storm
  for(let i = 0; i < 400; i++) {
    drops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 20 + 15,
      length: Math.random() * 40 + 20,
      thickness: Math.random() > 0.8 ? 2 : 1
    });
  }

  const animate = () => {
    if (!canvas) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    const rainColor = 'rgba(130, 150, 130, 0.4)'; // Desaturated grey-green rain
    const scrollParallax = window.scrollY * 0.1;

    drops.forEach(drop => {
      ctx.fillStyle = rainColor;
      ctx.fillRect(drop.x, drop.y - (scrollParallax % canvas.height), drop.thickness, drop.length);
      drop.y += drop.speed;

      // Heavy Splashing
      if (drop.y > canvas.height - 10 || Math.random() > 0.99) {
        if (Math.random() > 0.4) {
          for(let k = 0; k < 3; k++) {
            splashes.push({
              x: drop.x,
              y: drop.y > canvas.height - 10 ? canvas.height : drop.y,
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 5 - 2,
              life: 1
            });
          }
        }
        drop.y = -50;
        drop.x = Math.random() * canvas.width;
      }
    });

    for (let i = splashes.length - 1; i >= 0; i--) {
      let s = splashes[i];
      ctx.fillStyle = `rgba(130, 150, 130, ${s.life})`;
      ctx.fillRect(s.x, s.y - (scrollParallax % canvas.height), Math.random() * 3, Math.random() * 3);
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.4;
      s.life -= 0.05;
      if (s.life <= 0) splashes.splice(i, 1);
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
  <div class="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen overflow-hidden">
    <!-- Mist overlay -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(107,143,114,0.05)] to-[rgba(107,143,114,0.15)] pointer-events-none"></div>
    <canvas ref="rainCanvasRef" class="w-full h-full object-cover pointer-events-none"></canvas>
  </div>
</template>
