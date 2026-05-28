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
  { path: '/games', name: 'EXE.GAMES' },
  { path: '/github', name: 'NET.GITHUB' }
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
  <header class="w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md sticky top-0 z-50 uppercase text-xs font-mono flex flex-col transition-all">
    <!-- Top Status Line -->
    <div class="flex justify-between items-center px-4 py-2 border-b border-[var(--color-border)] text-[0.65rem] sm:text-xs">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span class="flex items-center gap-2 font-bold tracking-widest text-[var(--color-text)]">
          <span class="w-1.5 h-1.5 bg-[var(--color-brand)] animate-pulse inline-block"></span>
          SYS.ONLINE
        </span>
        <span class="opacity-40 hidden md:inline tracking-widest">| USER: LANRHYME.DEV</span>
        <span class="opacity-40 text-[var(--color-brand)] tracking-widest">| COORD: ({{ mouseCoords.x }}, {{ mouseCoords.y }})</span>
      </div>
      
      <div class="flex items-center gap-6">
        <span class="hidden sm:inline font-mono text-[var(--color-text-dim)] tracking-widest">T: {{ currentTime }}</span>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="flex flex-wrap items-center px-4 py-2 gap-4">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="pb-1 border-b border-transparent hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-all font-mono tracking-widest text-xs"
        :class="route.path === item.path ? 'text-[var(--color-brand)] border-[var(--color-brand)] font-bold' : 'text-[var(--color-text-dim)]'"
      >
        <span class="opacity-50 mr-1">></span>{{ item.name }}
      </router-link>
    </nav>
  </header>
</template>
