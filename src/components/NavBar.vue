<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentTime = ref('');
const mouseCoords = ref({ x: 0, y: 0 });
const isMenuOpen = ref(false);

let timeInterval: number;

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(now.getMilliseconds() / 100).toString();
};

const handleMouseMove = (e: MouseEvent) => {
  mouseCoords.value = { x: e.clientX, y: e.clientY };
};

const navItems = ref([
  { path: '/', name: 'SYS.HOME' },
  { path: '/projects', name: 'DIR.PROJECTS' },
  { path: '/works', name: 'DIR.WORKS' },
  { path: '/commissions', name: 'DIR.QUESTS' },
  { path: '/articles', name: 'DIR.LOGS' },
  { path: '/games', name: 'EXE.GAMES' },
  { path: '/worldview', name: '0xERR_&$#@' }
]);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.classList.toggle('menu-open', isMenuOpen.value);
};

const closeMenu = () => {
  isMenuOpen.value = false;
  document.body.classList.remove('menu-open');
};

const scrambleText = (event: MouseEvent) => {
  const el = event.target as HTMLElement;
  const original = el.dataset.value;
  if (!original) return;
  
  // Find the text node or span inside
  const textSpan = el.querySelector('.scramble-target') as HTMLElement;
  if (!textSpan) return;

  let iterations = 0;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
  
  const interval = setInterval(() => {
    textSpan.innerText = original
      .split("")
      .map((letter, index) => {
        if (index < iterations) {
          return original[index];
        }
        return letters[Math.floor(Math.random() * 43)];
      })
      .join("");
      
    if (iterations >= original.length) {
      clearInterval(interval);
      textSpan.innerText = original;
    }
    iterations += 1 / 3;
  }, 30);
};

let garbleInterval: number;

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 100);
  window.addEventListener('mousemove', handleMouseMove);
  
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
  garbleInterval = window.setInterval(() => {
    const worldviewItem = navItems.value.find(item => item.path === '/worldview');
    if (worldviewItem) {
      let garbled = "";
      for (let i = 0; i < 10; i++) {
        garbled += letters[Math.floor(Math.random() * letters.length)];
      }
      worldviewItem.name = garbled;
    }
  }, 80);
});

onUnmounted(() => {
  clearInterval(timeInterval);
  clearInterval(garbleInterval);
  window.removeEventListener('mousemove', handleMouseMove);
  document.body.classList.remove('menu-open');
});
</script>

<template>
  <div class="fixed top-3 lg:top-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] lg:w-[95%] max-w-[1200px] z-[60] pointer-events-none group/nav hidden lg:block">
    <header class="w-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 backdrop-blur-xl uppercase text-[10px] lg:text-xs font-mono flex flex-col transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto hover:border-[var(--color-brand)]/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] relative overflow-hidden">
      
      <!-- Top Scanline decorative -->
      <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-brand)] to-transparent opacity-0 group-hover/nav:opacity-50 transition-opacity duration-1000"></div>

      <!-- Top Status Line -->
      <div class="flex justify-between items-center px-2.5 lg:px-6 py-1.5 lg:py-3 border-b border-[var(--color-border)] text-[0.6rem] lg:text-xs">
        <div class="flex flex-wrap items-center gap-x-3 lg:gap-x-6 gap-y-1">
          <span class="flex items-center gap-1.5 lg:gap-2 font-bold tracking-widest text-[var(--color-text)]">
            <span class="w-1.5 h-1.5 bg-[var(--color-accent)] animate-pulse inline-block shadow-[0_0_8px_var(--color-accent)]"></span>
            SYS.ONLINE
          </span>
          <span class="opacity-40 hidden lg:inline tracking-widest">| USER: LANRHYME.DEV</span>
        </div>
        
        <div class="flex items-center gap-3">
          <span class="font-mono text-[var(--color-brand)] tracking-widest">T: {{ currentTime }}</span>
        </div>
      </div>

      <!-- Desktop Navigation Links -->
      <nav class="hidden lg:flex justify-between items-center px-6 py-3 gap-4">
        <div class="flex gap-8">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link relative pb-1 transition-all duration-300 font-mono tracking-widest text-xs flex items-center gap-2 group/link"
            :class="route.path === item.path ? 'text-[var(--color-text)] font-bold active-link' : 'text-[var(--color-text-dim)] hover:text-[var(--color-brand)]'"
            @mouseenter="scrambleText"
            :data-value="item.name"
          >
            <span v-if="route.path === item.path" class="text-[var(--color-accent)] animate-pulse font-bold">></span>
            <span v-else class="text-transparent group-hover/link:text-[var(--color-text-dim)] transition-colors duration-300">></span>
            <span class="scramble-target pointer-events-none">{{ item.name }}</span>
          </router-link>
        </div>
        <a href="https://github.com/LanRhyme" target="_blank" class="nav-link relative pb-1 text-[var(--color-text-dim)] hover:text-[var(--color-brand)] font-mono tracking-widest text-xs transition-colors group/link flex items-center gap-2" @mouseenter="scrambleText" data-value="NET.GITHUB">
          <span class="text-transparent group-hover/link:text-[var(--color-text-dim)] transition-colors duration-300">></span>
          <span class="scramble-target pointer-events-none">NET.GITHUB</span>
        </a>
      </nav>
    </header>
  </div>

  <!-- Mobile Floating Action Button (FAB) -->
  <div class="fixed bottom-6 left-6 z-[60] lg:hidden">
    <button 
      @click="toggleMenu" 
      class="w-12 h-12 rounded-none border border-[var(--color-brand)] bg-[var(--color-bg)]/80 backdrop-blur-md flex items-center justify-center text-[var(--color-brand)] hover:bg-[var(--color-brand)]/20 active:bg-[var(--color-brand)]/40 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] glitch-hover group"
    >
      <!-- Crosshairs corner decorations -->
      <div class="absolute top-0 left-0 w-2 h-[1px] bg-[var(--color-brand)] opacity-50"></div>
      <div class="absolute top-0 left-0 w-[1px] h-2 bg-[var(--color-brand)] opacity-50"></div>
      <div class="absolute bottom-0 right-0 w-2 h-[1px] bg-[var(--color-brand)] opacity-50"></div>
      <div class="absolute bottom-0 right-0 w-[1px] h-2 bg-[var(--color-brand)] opacity-50"></div>
      
      <i class="fas transition-transform duration-300 group-active:scale-90" :class="isMenuOpen ? 'fa-times rotate-90 text-red-500' : 'fa-compass'"></i>
    </button>
  </div>

  <!-- Mobile Full-Screen Menu Overlay -->
  <transition name="mobile-menu-fade">
    <div v-if="isMenuOpen" class="fixed inset-0 z-[55] lg:hidden bg-[var(--color-bg)]/95 backdrop-blur-xl flex flex-col justify-center items-center overflow-hidden">
      <!-- Background Grid & Scanlines -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div class="scanlines absolute inset-0 pointer-events-none opacity-40"></div>
      
      <!-- System Info Overlay -->
      <div class="absolute top-6 left-6 text-[10px] font-mono opacity-50 tracking-[0.2em] flex flex-col gap-1 pointer-events-none">
        <span class="text-[var(--color-brand)]">> SYS.OVERRIDE</span>
        <span>UI.STATE: MOBILE_NAV</span>
        <span>T: {{ currentTime }}</span>
      </div>

      <nav class="flex flex-col items-start gap-8 w-[240px] relative z-10 font-mono text-xl tracking-[0.2em] uppercase mt-10">
        <router-link
          v-for="(item, index) in navItems"
          :key="item.path"
          :to="item.path"
          @click="closeMenu"
          class="relative group transition-all"
          :class="route.path === item.path ? 'text-[var(--color-brand)] font-bold translate-x-4' : 'text-[var(--color-text)] opacity-70 hover:opacity-100 hover:text-[var(--color-brand)] hover:translate-x-2'"
          :style="{ transitionDelay: `${index * 50}ms` }"
        >
          <span class="absolute -left-6 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-brand)] animate-pulse" v-if="route.path !== item.path">></span>
          <span class="absolute -left-6 text-[var(--color-brand)] animate-pulse" v-else>></span>
          <span class="relative z-10">{{ item.name }}</span>
          <!-- Decorative bar -->
          <span class="absolute -bottom-2 left-0 w-0 h-[2px] bg-[var(--color-brand)] group-hover:w-full transition-all duration-300" :class="{ 'w-full': route.path === item.path }"></span>
        </router-link>
        
        <div class="w-full h-[1px] bg-[var(--color-border)] my-2 opacity-50"></div>
        
        <a href="https://github.com/LanRhyme" target="_blank" @click="closeMenu" class="relative group text-sm opacity-60 hover:opacity-100 hover:text-[var(--color-text)] transition-all flex items-center gap-3">
          <i class="fab fa-github"></i>
          <span>NET.GITHUB</span>
        </a>
      </nav>
    </div>
  </transition>
</template>

<style scoped>
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: var(--color-brand);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (min-width: 768px) {
  .nav-link:hover::after, .active-link::after {
    width: 100%;
  }
}

.mobile-menu-fade-enter-active,
.mobile-menu-fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-menu-fade-enter-from,
.mobile-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.mobile-menu-fade-enter-to,
.mobile-menu-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
