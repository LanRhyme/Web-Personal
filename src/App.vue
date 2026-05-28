<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import Footer from './components/Footer.vue';
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const isLoaded = ref(false);
const router = useRouter();
const route = useRoute();

const isAdmin = computed(() => route.path.startsWith('/admin'));

// --- Custom Physics Cursor (xzadudu179 style) ---
const targetX = ref(0);
const targetY = ref(0);
const currentX = ref(0);
const currentY = ref(0);
const isHovering = ref(false);
const isClicking = ref(false);

const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

const renderCursor = () => {
  currentX.value = lerp(currentX.value, targetX.value, 0.15);
  currentY.value = lerp(currentY.value, targetY.value, 0.15);
  animationFrameId = requestAnimationFrame(renderCursor);
};

const updateMouse = (e: MouseEvent) => {
  targetX.value = e.clientX;
  targetY.value = e.clientY;

  // Set CSS variables for high-end glowing spotlight backdrop in CSS
  document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);

  const target = e.target as HTMLElement;
  const isClickable = target.closest('a') || target.closest('button') || target.closest('.cursor-pointer');
  isHovering.value = !!isClickable;
};

// --- Terminal Grid Background ---
const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;

class MatrixDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  char: string;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.speed = Math.random() * 2 + 1;
    this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*".split('');
    this.char = this.chars[Math.floor(Math.random() * this.chars.length)];
  }

  update(height: number) {
    this.y += this.speed;
    if (this.y > height) {
      this.y = -20;
      this.speed = Math.random() * 2 + 1;
    }
    if (Math.random() < 0.05) {
      this.char = this.chars[Math.floor(Math.random() * this.chars.length)];
    }
  }

  draw(ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number) {
    // Distance from mouse
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Repel effect
    let drawX = this.x;
    let drawY = this.y;
    if (dist < 100) {
      const force = (100 - dist) / 100;
      drawX += (dx / dist) * force * 15;
      drawY += (dy / dist) * force * 15;
      ctx.fillStyle = `rgba(91, 122, 97, ${0.3 + force * 0.7})`; // Highlight near mouse
    } else {
      ctx.fillStyle = 'rgba(91, 122, 97, 0.15)'; // Dim standard color
    }
    
    ctx.fillText(this.char, drawX, drawY);
  }
}

let drops: MatrixDrop[] = [];

const initCanvas = () => {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drops = [];
    const columns = Math.floor(canvas.width / 30); // column width
    for (let i = 0; i < columns; i++) {
      for(let j = 0; j < 5; j++) {
        drops.push(new MatrixDrop(i * 30, Math.random() * canvas.height));
      }
    }
  };

  const animate = () => {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px "JetBrains Mono"';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < drops.length; i++) {
      drops[i].update(canvas.height);
      drops[i].draw(ctx, targetX.value, targetY.value);
    }
  };

  // Run canvas logic in the same animation frame loop
  const loop = () => {
    animate();
    requestAnimationFrame(loop);
  };

  window.addEventListener('resize', resize);
  resize();
  loop();
};

// --- Brutalist AI Companion (LanPet Refactor) ---
const petState = ref<'idle' | 'happy' | 'working' | 'active'>('idle');
const petHappiness = ref(85);
const bubbleText = ref('');
const eyeRotation = computed(() => {
  // AI eye tracking mouse
  const petScreenX = window.innerWidth - 60; 
  const petScreenY = window.innerHeight - 60;
  const dx = targetX.value - petScreenX;
  const dy = targetY.value - petScreenY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return angle;
});

const petTalking = (text: string) => {
  bubbleText.value = text;
  setTimeout(() => {
    if (bubbleText.value === text) {
      bubbleText.value = '';
    }
  }, 4000);
};

const triggerHappyPet = () => {
  petState.value = 'happy';
  petHappiness.value = Math.min(100, petHappiness.value + 12);
  petTalking('SYSTEM OPTIMIZED [OK]');
  
  setTimeout(() => {
    if (route.path === '/projects' || route.path === '/games' || route.path === '/github') {
      petState.value = 'working';
    } else {
      petState.value = 'idle';
    }
  }, 2200);
};

watch(() => route.path, (newPath) => {
  if (newPath === '/projects' || newPath === '/games' || newPath === '/github') {
    petState.value = 'working';
    petTalking('INIT. SEQUENCE [DEV_MODE]');
  } else if (newPath === '/works' || newPath === '/commissions') {
    petState.value = 'active';
    petTalking('LOADING ASSETS...');
  } else {
    petState.value = 'idle';
    petTalking('TERMINAL READY.');
  }
});

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true;
  }, 100);

  document.addEventListener('contextmenu', (e: MouseEvent) => {
    if (!import.meta.env.DEV) {
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', updateMouse);
  document.addEventListener('mousedown', () => isClicking.value = true);
  document.addEventListener('mouseup', () => isClicking.value = false);
  
  targetX.value = window.innerWidth / 2;
  targetY.value = window.innerHeight / 2;
  currentX.value = targetX.value;
  currentY.value = targetY.value;
  renderCursor();
  
  initCanvas();
  
  setTimeout(() => {
    petTalking('SYS.AI INITIALIZED.');
  }, 1500);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', updateMouse);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div class="app-root relative" :class="{ 'is-loaded': isLoaded }">
    <!-- Custom Fluid Cursor -->
    <div v-if="!isAdmin" class="custom-cursor hidden md:block" :class="{ 'hovering': isHovering, 'clicking': isClicking }" :style="{ transform: `translate(${currentX}px, ${currentY}px)` }">
      <div class="cursor-dot"></div>
      <div class="cursor-ring"></div>
    </div>

    <!-- Minimalist AI Companion -->
    <div 
      v-if="!isAdmin" 
      class="fixed bottom-8 right-8 z-40 pointer-events-auto flex flex-col items-end select-none font-mono"
    >
      <transition name="page">
        <div 
          v-if="bubbleText" 
          class="cyber-glass !px-3 !py-1 mb-3 text-xs bg-black/60 border border-[var(--color-brand)] text-[var(--color-brand)] font-bold text-right tracking-widest relative uppercase"
        >
          > {{ bubbleText }} <span class="animate-pulse">_</span>
        </div>
      </transition>

      <!-- AI Core Widget -->
      <div 
        class="cyber-glass p-2 flex flex-col items-center justify-center bg-black/60 border border-[var(--color-border)] hover:border-[var(--color-brand)] transition-all cursor-pointer group w-14 h-14"
        @click="triggerHappyPet"
        @mouseenter="petTalking('AWAITING COMMAND')"
      >
        <div class="relative w-8 h-8 rounded-full border border-[var(--color-text-dim)] group-hover:border-[var(--color-brand)] flex items-center justify-center transition-all duration-300">
          <!-- The Eye -->
          <div 
            class="w-3 h-3 bg-[var(--color-text-dim)] group-hover:bg-[var(--color-brand)] transition-colors duration-300"
            :style="{ transform: `rotate(${eyeRotation}deg) translateX(4px)` }"
            style="clip-path: polygon(0 50%, 50% 0, 100% 50%, 50% 100%);"
          ></div>
          <div class="absolute inset-0 rounded-full shadow-[0_0_10px_rgba(91,122,97,0)] group-hover:shadow-[0_0_15px_rgba(91,122,97,0.5)] transition-all duration-500"></div>
        </div>
      </div>
    </div>

    <!-- Scanlines & Noise Background Overlay -->
    <div class="scanlines"></div>
    <div class="noise-overlay"></div>
    
    <!-- Matrix ASCII Canvas -->
    <canvas ref="canvasRef" class="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-50"></canvas>

    <!-- Hardcore Brutalist HUD -->
    <div v-if="!isAdmin" class="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
      <!-- Sharp Corners -->
      <div class="hud-corner hud-tl"></div>
      <div class="hud-corner hud-tr"></div>
      <div class="hud-corner hud-bl"></div>
      <div class="hud-corner hud-br"></div>
      
      <div class="absolute top-1/4 right-[2%] hud-text-vertical hidden lg:block text-xs">
        <span class="opacity-50 tracking-[0.5em]">SYSTEM.UI</span> // <span class="text-brand">ONLINE</span>
      </div>
      
      <div class="absolute bottom-12 left-12 font-mono text-[10px] text-[var(--color-text-dim)] hidden md:block uppercase tracking-widest leading-relaxed">
        <div class="flex items-center gap-2 mb-1"><span class="w-1.5 h-1.5 bg-[var(--color-brand)] animate-pulse inline-block"></span> ROOT ACCESS: OK</div>
        <div>SECURE PROTOCOL / 0x8F8A2</div>
        <div>MEM: 4096MB <span class="text-[var(--color-brand)]">ALLOCATED</span></div>
      </div>
    </div>

    <!-- Main Content Wrapper -->
    <div class="relative z-10 min-h-screen flex flex-col w-full font-mono text-[var(--color-text)]">
      <NavBar v-if="!isAdmin" />

      <!-- Main Router View -->
      <div class="flex-grow w-full mx-auto pt-16 md:pt-28 pb-12">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <keep-alive :max="5">
              <component :is="Component" :key="route.name || route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>

      <Footer v-if="!isAdmin" />
    </div>
  </div>
</template>

<style>
.app-root {
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.app-root.is-loaded {
  opacity: 1;
}

/* New Fluid Physics Cursor */
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 10000;
}

.cursor-dot {
  position: absolute;
  top: -3px;
  left: -3px;
  width: 6px;
  height: 6px;
  background-color: var(--color-brand);
  border-radius: 50%;
  transition: transform 0.1s;
}

.cursor-ring {
  position: absolute;
  top: -15px;
  left: -15px;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(224, 224, 224, 0.2);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: center center;
}

.custom-cursor.hovering .cursor-ring {
  width: 40px;
  height: 40px;
  top: -20px;
  left: -20px;
  border-color: var(--color-brand);
  background: rgba(91, 122, 97, 0.1);
  transform: scale(1.1);
}

.custom-cursor.clicking .cursor-ring {
  transform: scale(0.8);
  border-color: var(--color-text);
}
</style>
