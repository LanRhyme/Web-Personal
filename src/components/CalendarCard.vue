<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const now = ref(new Date());
let timer: number;
const isHovering = ref(false);

const currentDate = computed(() => now.value.getDate());
const year = computed(() => now.value.getFullYear());
const month = computed(() => now.value.getMonth() + 1);

const daysInMonth = computed(() => {
    return new Date(year.value, month.value, 0).getDate();
});

const firstDayWeekday = computed(() => {
    const day = new Date(year.value, month.value - 1, 1).getDay();
    return (day + 6) % 7;
});

// Calculate exactly how many empty slots are needed at the end to make it a full grid
// Max grid could be 6 rows of 7 = 42
const totalCells = computed(() => {
    const minCells = firstDayWeekday.value + daysInMonth.value;
    return Math.ceil(minCells / 7) * 7;
});

// Year progress calculation
const yearProgress = computed(() => {
    const start = new Date(year.value, 0, 1).getTime();
    const end = new Date(year.value + 1, 0, 1).getTime();
    const percent = ((now.value.getTime() - start) / (end - start)) * 100;
    return percent.toFixed(3);
});

const weekDates = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

// Glitch matrix hex background for empty slots
const getRandomHex = () => Math.floor(Math.random() * 16).toString(16).toUpperCase();
const noiseGrid = ref(Array.from({ length: 42 }, () => getRandomHex()));

const updateNoise = () => {
    if (isHovering.value) {
        noiseGrid.value = noiseGrid.value.map(() => getRandomHex());
    }
};

onMounted(() => {
    timer = window.setInterval(() => {
        now.value = new Date();
        updateNoise();
    }, 100); 
});

onUnmounted(() => {
    clearInterval(timer);
});
</script>

<template>
  <div 
    class="terminal-border p-4 font-mono text-[var(--color-text)] flex flex-col text-xs sm:text-sm group relative overflow-hidden transition-all duration-300 hover:border-[var(--color-brand)] hover:shadow-[0_0_15px_rgba(107,143,114,0.1)] cursor-crosshair"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <div class="border-b border-[var(--color-border)] pb-2 mb-2 flex justify-between relative z-10 transition-colors duration-300">
        <span class="opacity-50 group-hover:text-[var(--color-brand)] group-hover:opacity-100 transition-all">SYS.DATE</span>
        <span class="font-bold tracking-widest">{{ year }}.{{ month.toString().padStart(2, '0') }}.{{ currentDate.toString().padStart(2, '0') }}</span>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center mt-1 relative z-10">
      <div v-for="name in weekDates" :key="name" class="opacity-50 border-b border-[var(--color-border)] pb-1 mb-1 text-[10px]">
        {{ name }}
      </div>
      
      <!-- Empty slots before month start -->
      <div v-for="n in firstDayWeekday" :key="'empty-start-' + n" class="py-1 opacity-20 text-[10px] flex items-center justify-center relative">
        <span v-if="isHovering" class="text-[var(--color-brand)] font-bold absolute">{{ noiseGrid[n] }}</span>
      </div>
      
      <!-- Actual days -->
      <div v-for="day in daysInMonth" :key="day"
           class="py-1 relative transition-colors duration-200"
           :class="day === currentDate ? 'bg-[var(--color-text)] text-[var(--color-bg)] font-bold' : 'hover:bg-[var(--color-brand)] hover:text-[var(--color-bg)] cursor-pointer'">
        {{ day }}
        <!-- Current day blinker -->
        <span v-if="day === currentDate" class="absolute -right-[2px] bottom-0 animate-pulse text-[8px] opacity-70">_</span>
      </div>

      <!-- Empty slots after month end -->
      <div v-for="n in (totalCells - (firstDayWeekday + daysInMonth))" :key="'empty-end-' + n" class="py-1 opacity-20 text-[10px] flex items-center justify-center relative">
        <span v-if="isHovering" class="text-[var(--color-brand)] font-bold absolute">{{ noiseGrid[firstDayWeekday + daysInMonth + n] }}</span>
      </div>
    </div>

    <!-- Year Progress Footer -->
    <div class="mt-4 pt-2 border-t border-[var(--color-border)] flex justify-between items-center text-[10px] transition-all duration-300" :class="isHovering ? 'opacity-100' : 'opacity-40'">
        <span>YEAR_PROGRESS</span>
        <span :class="isHovering ? 'text-[var(--color-brand)] font-bold' : ''">{{ yearProgress }}%</span>
    </div>
  </div>
</template>
