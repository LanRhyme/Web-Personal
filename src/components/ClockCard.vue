<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const timeStr = ref('');
let timer: number;

const updateTime = () => {
    const now = new Date();
    timeStr.value = now.toLocaleTimeString('en-US', { hour12: false }) + ' ' + now.getMilliseconds().toString().padStart(3, '0');
};

onMounted(() => {
    timer = setInterval(updateTime, 47);
});

onUnmounted(() => {
    clearInterval(timer);
});
</script>

<template>
  <div class="terminal-border p-4 font-mono text-[var(--color-brand)] flex flex-col items-center justify-center">
    <div class="text-[0.65rem] opacity-50 mb-1 w-full text-left">SYS.CLOCK_MODULE</div>
    <div class="text-xl sm:text-2xl font-bold tracking-widest">{{ timeStr }}</div>
  </div>
</template>

