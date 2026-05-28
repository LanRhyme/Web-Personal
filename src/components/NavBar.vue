<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentTime = ref('');
const mouseCoords = ref({ x: 0, y: 0 });

let timeInterval: number;

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(now.getMilliseconds() / 100).toString();
};

const handleMouseMove = (e: MouseEvent) => {
  mouseCoords.value = { x: e.clientX, y: e.clientY };
};

const navItems = [
  { path: '/', name: 'SYS.HOME' },
  { path: '/projects', name: 'DIR.PROJECTS' },
  { path: '/works', name: 'DIR.WORKS' },
  { path: '/commissions', name: 'DIR.QUESTS' },
  { path: '/articles', name: 'DIR.LOGS' },
  { path: '/games', name: 'EXE.GAMES' }
];

onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 100);
  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  clearInterval(timeInterval);
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<template>
  <div class="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1200px] z-50 pointer-events-none">
    <header class="w-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 backdrop-blur-xl uppercase text-xs font-mono flex flex-col transition-all rounded shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
      <!-- Top Status Line -->
      <div class="flex justify-between items-center px-6 py-3 border-b border-[var(--color-border)] text-[0.65rem] sm:text-xs">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span class="flex items-center gap-2 font-bold tracking-widest text-[var(--color-text)]">
            <span class="w-1.5 h-1.5 bg-[var(--color-brand)] animate-pulse inline-block"></span>
            SYS.ONLINE
          </span>
          <span class="opacity-40 hidden md:inline tracking-widest">| USER: LANRHYME.DEV</span>
        </div>
        
        <div class="flex items-center gap-6">
          <span class="hidden sm:inline font-mono text-[var(--color-brand)] tracking-widest">T: {{ currentTime }}</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex flex-wrap justify-between items-center px-6 py-3 gap-4">
        <div class="flex flex-wrap gap-6 md:gap-8">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link relative pb-1 transition-all font-mono tracking-widest text-xs"
            :class="route.path === item.path ? 'text-[var(--color-text)] font-bold active-link' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'"
          >
            {{ item.name }}
          </router-link>
        </div>
        <a href="https://github.com/LanRhyme" target="_blank" class="nav-link relative pb-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)] font-mono tracking-widest text-xs transition-colors hidden sm:block">
          NET.GITHUB
        </a>
      </nav>
    </header>
  </div>
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
.nav-link:hover::after, .active-link::after {
  width: 100%;
}
</style>
