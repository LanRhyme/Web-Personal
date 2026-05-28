<script setup lang="ts">
import { ref, computed } from 'vue';

const now = ref(new Date());
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

const weekDates = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
</script>

<template>
  <div class="terminal-border p-4 font-mono text-[var(--color-text)] flex flex-col text-xs sm:text-sm">
    <div class="border-b border-[var(--color-border)] pb-2 mb-2 flex justify-between">
        <span class="opacity-50">SYS.DATE</span>
        <span class="font-bold">{{ year }}.{{ month.toString().padStart(2, '0') }}.{{ currentDate.toString().padStart(2, '0') }}</span>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center mt-2">
      <div v-for="name in weekDates" :key="name" class="opacity-50 border-b border-[var(--color-border)] pb-1 mb-1">
        {{ name }}
      </div>
      <div v-for="n in firstDayWeekday" :key="'empty-' + n"></div>
      <div v-for="day in daysInMonth" :key="day"
           class="py-1"
           :class="day === currentDate ? 'bg-[var(--color-text)] text-[var(--color-bg)] font-bold' : ''">
        {{ day }}
      </div>
    </div>
  </div>
</template>

