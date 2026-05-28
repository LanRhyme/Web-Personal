<script setup lang="ts">
import { ref, onMounted } from 'vue';

const quote = ref('WAITING FOR DATA...');
const from = ref('');
const isAnimating = ref(false);

const fetchHitokoto = async () => {
    if (isAnimating.value) return;
    isAnimating.value = true;
    quote.value = 'FETCHING...';
    
    try {
        const response = await fetch('https://v1.hitokoto.cn');
        if (response.ok) {
            const data = await response.json();
            quote.value = data.hitokoto;
            from.value = data.from;
        } else {
            quote.value = 'SYS.ERR: NO DATA';
        }
    } catch (e) {
        quote.value = 'SYS.ERR: NET_ERR';
    }
    
    setTimeout(() => {
        isAnimating.value = false;
    }, 400);
};

onMounted(() => {
    fetchHitokoto();
});
</script>

<template>
  <div 
    class="terminal-border p-4 flex flex-col justify-center cursor-pointer hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] transition-none font-mono text-sm" 
    @click="fetchHitokoto"
    :class="{ 'pointer-events-none': isAnimating }"
  >
    <div class="border-b border-inherit pb-2 mb-2 text-xs font-bold uppercase flex justify-between">
      <span>> SYS.QUOTE</span>
      <span v-if="isAnimating" class="animate-spin">/</span>
      <span v-else>[RELOAD]</span>
    </div>
    
    <p class="font-bold leading-relaxed mb-2">
      "{{ quote }}"
    </p>
    
    <div v-if="from" class="text-right text-xs opacity-70">
      -- {{ from }}
    </div>
  </div>
</template>
