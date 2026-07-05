<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Garbled text refs
const garbledProject = ref('WORLDVIEW');
const garbledTitle = ref('ARCHIVE NEXUS');
const garbledSubtitle = ref('SELECT DESTINATION');

// Option 1 refs
const garbledSectorCore = ref('SECTOR 0x00');
const garbledTitleCore = ref('> Core.');
const garbledSubCore = ref('3D Observation');

// Option 2 refs
const garbledSectorCloud = ref('SECTOR 0x2D');
const garbledTitleCloud = ref('> Cloud.');
const garbledSubCloud = ref('2D Simulation');

let scrambleInterval: ReturnType<typeof setInterval> | null = null;
const chars = '█▓░░▒▓█▄▀■▲▼Æ§Ø°±¶µ¼½¾×÷κλμνξοπρστυφχψω§ΔΨΩαβγδεζηθικ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_@#%*';

const scramble = (str: string, intensity = 0.5) => {
  return str.split('').map(char => {
    if (char === ' ' || char === '\n' || char === ':' || char === '-' || char === '/' || char === '[' || char === ']') return char;
    return Math.random() < intensity ? chars[Math.floor(Math.random() * chars.length)] : char;
  }).join('');
};

onMounted(() => {
  scrambleInterval = setInterval(() => {
    const intensityFactor = 0.15;
    garbledProject.value = scramble('WORLDVIEW', intensityFactor);
    garbledTitle.value = scramble('ARCHIVE NEXUS', intensityFactor);
    garbledSubtitle.value = scramble('SELECT DESTINATION', intensityFactor * 0.5);
    
    // Scramble option texts (higher intensity for a cooler effect)
    garbledSectorCore.value = scramble('SECTOR 0x00', intensityFactor * 1.5);
    garbledTitleCore.value = scramble('> Core.', intensityFactor * 0.8);
    garbledSubCore.value = scramble('3D Observation', intensityFactor * 0.5);
    
    garbledSectorCloud.value = scramble('SECTOR 0x2D', intensityFactor * 1.5);
    garbledTitleCloud.value = scramble('> Cloud.', intensityFactor * 0.8);
    garbledSubCloud.value = scramble('2D Simulation', intensityFactor * 0.5);
  }, 120);
});

onUnmounted(() => {
  if (scrambleInterval) clearInterval(scrambleInterval);
});
</script>

<template>
  <div class="w-full min-h-[70vh] text-[var(--color-text)] flex flex-col items-center justify-center relative bg-transparent">
    
    <!-- Central Content Layout -->
    <div class="relative z-10 w-full max-w-[1200px] px-6 md:px-12 flex flex-col items-center text-center">
      
      <!-- Clean Minimal Header -->
      <div class="mb-16 flex flex-col items-center">
        <div class="font-mono text-xs tracking-[0.5em] text-[var(--color-brand)] mb-6 flex items-center gap-3">
          <span class="animate-pulse">■</span> {{ garbledProject }} <span class="animate-pulse">■</span>
        </div>
        
        <!-- Replaced font-black with font-art to match the elegant site theme -->
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-art tracking-tighter opacity-90 text-[var(--color-text)] mb-6">
          {{ garbledTitle }}
        </h1>
        
        <p class="font-mono text-[10px] md:text-xs tracking-[0.4em] opacity-40 text-[var(--color-text)] uppercase">
          {{ garbledSubtitle }}
        </p>
      </div>

      <!-- Options container using cyber-glass -->
      <div class="flex flex-col md:flex-row gap-6 md:gap-10 w-full justify-center max-w-3xl">
        
        <!-- Option 1: Core -->
        <router-link to="/worldview/core" class="flex-1 cyber-glass p-8 md:p-12 cursor-pointer group flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(0,255,255,0.15)] bg-white/5 border border-white/10 rounded-sm">
          <div class="text-[10px] opacity-40 font-mono tracking-widest mb-4 group-hover:text-[var(--color-brand)] transition-colors">{{ garbledSectorCore }}</div>
          <div class="font-art text-2xl md:text-4xl mb-3 group-hover:text-[var(--color-brand)] transition-colors">{{ garbledTitleCore }}</div>
          <div class="text-[10px] opacity-60 font-sans tracking-widest uppercase">{{ garbledSubCore }}</div>
        </router-link>

        <!-- Option 2: Train -->
        <router-link to="/worldview/cloud" class="flex-1 cyber-glass p-8 md:p-12 cursor-pointer group flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(0,255,255,0.15)] bg-white/5 border border-white/10 rounded-sm">
          <div class="text-[10px] opacity-40 font-mono tracking-widest mb-4 group-hover:text-[var(--color-brand)] transition-colors">{{ garbledSectorCloud }}</div>
          <div class="font-art text-2xl md:text-4xl mb-3 group-hover:text-[var(--color-brand)] transition-colors">{{ garbledTitleCloud }}</div>
          <div class="text-[10px] opacity-60 font-sans tracking-widest uppercase">{{ garbledSubCloud }}</div>
        </router-link>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Removed all noise and SVG filters to keep it crystal clean */
</style>
