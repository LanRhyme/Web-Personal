<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useARGState } from '../composables/useARGState';

const { addKey } = useARGState();
let originalTitle = '';

onMounted(() => {
  originalTitle = document.title;
  document.title = "Chord of Form";
  addKey('FORM_SHATTERED');
});

onUnmounted(() => {
  document.title = originalTitle;
});
</script>

<template>
  <div class="fixed inset-0 z-[99999] bg-black text-white flex items-center justify-center p-8 font-mono text-center leading-loose">
    <div class="cyber-glass p-12 max-w-xl">
      <p class="opacity-80 mb-8 tracking-widest">即使肉体结晶，念依然记得疼痛。</p>
      <p class="text-[var(--color-brand)] font-bold text-xl tracking-[0.5em] animate-pulse">FORM_SHATTERED</p>
    </div>
  </div>
</template>
