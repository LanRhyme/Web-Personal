<script setup lang="ts">
import { ref, onMounted } from 'vue';

const emit = defineEmits(['complete']);
const isClosing = ref(false);
const isDone = ref(false);

const word = "LanRhyme.";
const letters = word.split('');

onMounted(() => {
  setTimeout(() => {
    emit('complete');
    isClosing.value = true;
    setTimeout(() => {
      isDone.value = true;
    }, 1500);
  }, 2200); 
});
</script>

<template>
  <div 
    v-if="!isDone"
    class="fixed inset-0 z-[99999] bg-[#020202] flex flex-col justify-center items-center overflow-hidden transition-all duration-[1500ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
    :class="{ 'opacity-0 scale-[1.02] pointer-events-none blur-[10px]': isClosing }"
  >
    <div 
      class="relative z-10 transition-all duration-[1500ms] ease-[cubic-bezier(0.77,0,0.175,1)] flex flex-col items-center"
      :class="{ 'translate-y-[-40px] opacity-0': isClosing }"
    >
      <h1 
        class="text-6xl md:text-8xl text-white select-none flex font-art italic tracking-[0.1em]"
      >
        <span 
          v-for="(char, index) in letters" 
          :key="index"
          class="char-wrap"
        >
          <span 
            class="char-inner"
            :style="{ animationDelay: `${0.1 + index * 0.05}s` }"
          >
            {{ char === ' ' ? '&nbsp;' : char }}
          </span>
        </span>
      </h1>
      
      <div 
        class="text-[9px] font-mono text-[var(--color-text-dim)] uppercase tracking-[0.6em] mt-8 opacity-0 animate-fade-in"
      >
        CREATIVE DEVELOPER
      </div>
    </div>
  </div>
</template>

<style scoped>
.char-wrap {
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
  padding-bottom: 12px;
  margin-bottom: -12px;
  padding-right: 4px;
}

.char-inner {
  display: inline-block;
  transform: translateY(110%);
  animation: slideUpMask 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards;
}

@keyframes slideUpMask {
  to {
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 1s ease forwards;
  animation-delay: 1.2s; 
}

@keyframes fadeIn {
  to { opacity: 0.6; }
}
</style>
