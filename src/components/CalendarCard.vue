<script setup lang="ts">
import { ref, computed } from 'vue';

const now = ref(new Date());
const currentDate = computed(() => now.value.getDate());
const year = computed(() => now.value.getFullYear());
const month = computed(() => now.value.getMonth() + 1);
const dayName = computed(() => {
    const names = ['日', '一', '二', '三', '四', '五', '六'];
    return names[now.value.getDay()];
});

const daysInMonth = computed(() => {
    return new Date(year.value, month.value, 0).getDate();
});

const firstDayWeekday = computed(() => {
    // 0 is Sunday, 1 is Monday...
    // Adjust to start from Monday (0: Mon, 6: Sun)
    const day = new Date(year.value, month.value - 1, 1).getDay();
    return (day + 6) % 7;
});

const weekDates = ['一', '二', '三', '四', '五', '六', '日'];
const currentWeekdayIndex = computed(() => (now.value.getDay() + 6) % 7);
</script>

<template>
  <div class="card flex flex-col w-full h-full">
    <div class="flex justify-between items-center mb-3">
        <h3 class="text-xs font-bold text-[#6b8a7a] tracking-wider uppercase">
            {{ year }}/{{ month }}/{{ currentDate }} 周{{ dayName }}
        </h3>
        <div class="w-2 h-2 rounded-full bg-[#35bfa0] animate-pulse"></div>
    </div>
    
    <div class="grid grid-cols-7 gap-1 flex-grow">
      <!-- Weekday Headers -->
      <div v-for="(name, index) in weekDates" :key="index" 
           class="flex items-center justify-center text-[10px] font-bold"
           :class="index === currentWeekdayIndex ? 'text-[#35bfa0]' : 'text-[#6b8a7a]/50'">
        {{ name }}
      </div>

      <!-- Empty slots for previous month days -->
      <div v-for="n in firstDayWeekday" :key="'empty-' + n"></div>

      <!-- Days of current month -->
      <div v-for="day in daysInMonth" :key="day" 
           class="flex items-center justify-center text-[11px] rounded-lg transition-all duration-300 aspect-square"
           :class="day === currentDate 
             ? 'bg-brand-gradient text-white font-bold shadow-lg shadow-[#35bfa0]/20 scale-110 z-10' 
             : 'text-[#2d4a3e] hover:bg-[rgba(53,191,160,0.1)] hover:text-[#35bfa0]'">
        {{ day }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
    padding: 16px;
    user-select: none;
}
</style>
