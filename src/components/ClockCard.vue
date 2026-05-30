<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const now = ref(new Date());
let timer: number;
const isHovering = ref(false);

const updateTime = () => {
    now.value = new Date();
};

const displayTime = computed(() => {
    if (isHovering.value) {
        // Show UNIX timestamp when hovered
        return now.value.getTime().toString();
    }
    // Normal format: HH:MM:SS:ms
    return now.value.toLocaleTimeString('en-US', { hour12: false }) + ':' + now.value.getMilliseconds().toString().padStart(3, '0');
});

const progress = computed(() => {
    // Progress of the current minute
    const ms = now.value.getSeconds() * 1000 + now.value.getMilliseconds();
    return (ms / 60000) * 100;
});

onMounted(() => {
    timer = setInterval(updateTime, 47);
});

onUnmounted(() => {
    clearInterval(timer);
});
</script>

<template>
  <div 
    class="terminal-border p-3 md:p-4 font-mono flex flex-col justify-center relative overflow-hidden group cursor-crosshair transition-colors duration-300"
    :class="isHovering ? 'bg-[var(--color-brand)] text-[var(--color-bg)]' : 'text-[var(--color-brand)]'"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <!-- Background scanline effect on hover -->
    <div class="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] transition-opacity duration-300"></div>

    <div class="flex justify-between items-center w-full mb-1 relative z-10">
        <div class="text-[0.65rem] tracking-widest font-bold" :class="isHovering ? 'opacity-90' : 'opacity-50'">SYS.CLOCK_MODULE</div>
        <div class="text-[0.65rem] tracking-widest font-bold" :class="isHovering ? 'opacity-90' : 'opacity-50'">
            {{ isHovering ? 'UNIX_EPOCH' : 'LOCAL_TIME' }}
        </div>
    </div>
    
    <div class="text-xl sm:text-2xl font-bold tracking-widest relative z-10 h-8 flex items-center whitespace-nowrap">
        <span class="opacity-50 mr-2">{{ isHovering ? '*' : '>' }}</span> 
        {{ displayTime }}
        <span v-if="isHovering" class="animate-pulse ml-1 text-lg">_</span>
    </div>

    <!-- Minute Progress Bar -->
    <div class="w-full h-[2px] mt-3 relative z-10 overflow-hidden" :class="isHovering ? 'bg-black/30' : 'bg-[var(--color-brand)]/20'">
        <div class="h-full bg-current transition-all duration-75" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>
