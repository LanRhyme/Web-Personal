<script setup lang="ts">
import { useRainCycle } from '../composables/useRainCycle';

const { pipsCount, isShaking, cycleStage, isCollapsed, intensity, isLocked, toggleLock } = useRainCycle();

let lastTouchTime = 0;
const handleTouchEnd = (e: TouchEvent) => {
  const now = Date.now();
  if (now - lastTouchTime < 350) {
    toggleLock();
    e.preventDefault();
  }
  lastTouchTime = now;
};
</script>

<template>
  <div 
    class="relative flex flex-row md:flex-col items-center justify-center md:justify-end gap-2 p-2 transition-all duration-300 cursor-pointer select-none rounded-lg hover:bg-white/5" 
    :class="{ 
      'animate-pulse scale-110': isShaking || intensity > 0.8, 
      'opacity-0': isCollapsed,
      'ring-1 ring-[var(--color-brand)]/40 bg-[var(--color-brand)]/5': isLocked
    }"
    @dblclick="toggleLock"
    @touchend="handleTouchEnd"
    :title="isLocked ? '天气已锁定 (双击恢复自然演进)' : '双击锁定当前天气状态'"
  >
    <!-- Outer Glow -->
    <div 
      class="absolute inset-0 blur-md opacity-25 transition-colors duration-500 rounded-lg"
      :class="isShaking ? 'bg-red-600' : (isLocked ? 'bg-[var(--color-brand)]' : 'bg-white')"
      v-show="intensity > 0.5 || isLocked"
    ></div>
    
    <!-- Pips Wrapper: Horizontal on mobile, Bottom-to-Top on desktop -->
    <div class="flex flex-row md:flex-col-reverse gap-2">
      <div 
        v-for="i in 12" 
        :key="i"
        class="w-2.5 h-2.5 rounded-sm transition-all duration-[1000ms] ease-out border relative z-10"
        :class="[
          i <= pipsCount 
            ? (isShaking || cycleStage === 'DEATH_RAIN' 
                ? 'bg-[#ff3333] border-[#ff3333] shadow-[0_0_10px_#ff3333]' 
                : (isLocked ? 'bg-[var(--color-brand)] border-[var(--color-brand)] shadow-[0_0_8px_var(--color-brand)]' : 'bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'))
            : 'bg-transparent border-white/20 shadow-none scale-75'
        ]"
      ></div>
    </div>
    
    <!-- Icon / Badge -->
    <div 
      class="mt-0 ml-2 md:mt-2 md:ml-0 font-mono font-bold tracking-tighter flex items-center gap-1 transition-colors duration-500 z-10" 
      :class="isShaking || cycleStage === 'DEATH_RAIN' ? 'text-[#ff3333]' : (isLocked ? 'text-[var(--color-brand)]' : 'text-white')"
    >
      <svg v-if="isLocked" class="w-2.5 h-2.5 flex-shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
      <span class="text-[10px] tracking-tight">
        {{ isLocked ? (cycleStage === 'DRY' ? `${pipsCount}P` : cycleStage) : (cycleStage === 'DRY' ? pipsCount : (isShaking ? 'ERR' : '...')) }}
      </span>
    </div>
  </div>
</template>

