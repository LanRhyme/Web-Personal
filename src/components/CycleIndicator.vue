<script setup lang="ts">
import { useRainCycle } from '../composables/useRainCycle';

const { pipsCount, isShaking, cycleStage, isCollapsed, intensity } = useRainCycle();
</script>

<template>
  <div 
    class="relative flex flex-col items-center justify-end gap-2 p-2 transition-all duration-300" 
    :class="{ 'animate-pulse scale-110': isShaking || intensity > 0.8, 'opacity-0': isCollapsed }"
  >
    <!-- Outer Glow -->
    <div 
      class="absolute inset-0 blur-md opacity-20 transition-colors duration-500"
      :class="isShaking ? 'bg-red-600' : 'bg-white'"
      v-show="intensity > 0.5"
    ></div>
    
    <!-- Vertical Stack of 12 Pips -->
    <div 
      v-for="i in 12" 
      :key="i"
      class="w-2.5 h-2.5 rounded-sm transition-all duration-[1000ms] ease-out border relative z-10"
      :class="[
        (13 - i) <= pipsCount 
          ? (isShaking || cycleStage === 'DEATH_RAIN' ? 'bg-[#ff3333] border-[#ff3333] shadow-[0_0_10px_#ff3333]' : 'bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.8)]')
          : 'bg-transparent border-white/20 shadow-none scale-75'
      ]"
    ></div>
    
    <!-- Bottom Icon/Text -->
    <div 
      class="mt-2 font-mono font-bold tracking-tighter transition-colors duration-500" 
      :class="isShaking || cycleStage === 'DEATH_RAIN' ? 'text-[#ff3333]' : 'text-white'"
    >
      <span class="text-[10px]">{{ cycleStage === 'DRY' ? pipsCount : (isShaking ? 'ERR' : '...') }}</span>
    </div>
  </div>
</template>

