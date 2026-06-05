<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const cardRef = ref<HTMLElement | null>(null);
const hitokotoText = ref('');
const hitokotoFrom = ref('');
const displayedText = ref('');
const isTyping = ref(false);
const isLoading = ref(true);

// 3D Tilt State
const mouseX = ref(0);
const mouseY = ref(0);
const isHovered = ref(false);

const cardStyle = computed(() => {
  if (!isHovered.value || !cardRef.value) return '';
  
  const rect = cardRef.value.getBoundingClientRect();
  const x = mouseX.value - rect.left; // x position within the element.
  const y = mouseY.value - rect.top;  // y position within the element.
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
  const rotateY = ((x - centerX) / centerX) * 10;
  
  return `transform: perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02);`;
});

const glareStyle = computed(() => {
  if (!isHovered.value || !cardRef.value) return 'opacity: 0;';
  
  const rect = cardRef.value.getBoundingClientRect();
  const x = mouseX.value - rect.left;
  const y = mouseY.value - rect.top;
  
  const percentX = (x / rect.width) * 100;
  const percentY = (y / rect.height) * 100;
  
  return `
    background: radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.15) 0%, transparent 50%);
    opacity: 1;
  `;
});

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

const handleMouseEnter = () => {
  isHovered.value = true;
};

const handleMouseLeave = () => {
  isHovered.value = false;
};

const typeWriter = async (text: string) => {
  isTyping.value = true;
  displayedText.value = '';
  for (let i = 0; i < text.length; i++) {
    displayedText.value += text.charAt(i);
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
  }
  isTyping.value = false;
};

const fetchHitokoto = async () => {
  if (isTyping.value) return;
  isLoading.value = true;
  displayedText.value = '';
  hitokotoFrom.value = '';
  try {
    const response = await fetch('https://v1.hitokoto.cn?c=a&c=b&c=c&c=d&c=i&c=k');
    const data = await response.json();
    hitokotoText.value = data.hitokoto;
    hitokotoFrom.value = data.from;
    await typeWriter(data.hitokoto);
  } catch (error) {
    hitokotoText.value = 'SYS.ERROR: UNABLE TO FETCH DATA';
    hitokotoFrom.value = 'SYSTEM';
    await typeWriter(hitokotoText.value);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchHitokoto();
});
</script>

<template>
  <div 
    ref="cardRef"
    class="w-full h-[320px] relative cursor-pointer select-none group perspective-wrapper"
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="fetchHitokoto"
  >
    <!-- Static Frosted Glass Layer (No 3D Transform to preserve backdrop-filter) -->
    <div class="absolute inset-0 cyber-glass transition-transform duration-100" :style="isHovered ? 'transform: scale(1.02);' : ''"></div>

    <!-- 3D Tilting Content Layer -->
    <div 
      class="hitokoto-container absolute inset-0 w-full h-full"
      :style="cardStyle"
    >
      <!-- Glare Effect -->
      <div class="absolute inset-0 pointer-events-none transition-opacity duration-300 z-20" :style="glareStyle"></div>
      
      <!-- Scanning Laser & HUD elements -->
      <div class="absolute top-0 left-0 w-full h-[1px] bg-[var(--color-brand)] shadow-[0_0_15px_rgba(107,143,114,0.8)] opacity-0 group-hover:opacity-50 animate-scan pointer-events-none z-10 transition-opacity duration-500"></div>
      <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-brand)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:w-6 group-hover:h-6"></div>
      <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-brand)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:w-6 group-hover:h-6"></div>
      <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-brand)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:w-6 group-hover:h-6"></div>
      <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-brand)] opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:w-6 group-hover:h-6"></div>

      <div class="p-8 h-full flex flex-col justify-between relative z-10">
        <div class="border-b border-[var(--color-border)] pb-4 text-[var(--color-text)] font-bold flex justify-between items-center tracking-widest text-sm group-hover:border-[var(--color-brand)] transition-colors duration-300">
          <span class="flex items-center gap-3">
            <i class="fa-solid fa-quote-left text-[var(--color-brand)]"></i>
            > SYS.HITOKOTO
          </span>
          <span class="text-[var(--color-brand)] text-[10px] border border-[var(--color-brand)] px-2 py-0.5 flex items-center gap-2 group-hover:bg-[var(--color-brand)] group-hover:text-black transition-colors duration-300">
            <i class="fa-solid fa-rotate" :class="{ 'animate-spin': isLoading || isTyping }"></i> REF
          </span>
        </div>
        
        <div class="flex-1 flex flex-col justify-center gap-6 relative">
          <!-- Floating Particles Effect in background -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--color-brand)] opacity-0 group-hover:opacity-[0.03] blur-3xl rounded-full transition-opacity duration-1000"></div>
          
          <div class="text-xl sm:text-2xl font-art leading-relaxed text-[var(--color-text)] tracking-wide group-hover:text-shadow-glow transition-all duration-300">
            {{ displayedText }}<span class="inline-block w-2 h-5 bg-[var(--color-brand)] ml-1 align-middle" :class="{ 'animate-pulse': !isTyping }"></span>
          </div>
          
          <div class="text-right text-sm font-mono text-[var(--color-text-dim)] tracking-widest opacity-0 translate-y-2 transition-all duration-500" :class="{ 'opacity-100 translate-y-0': !isTyping && hitokotoFrom }">
            —— 「 {{ hitokotoFrom }} 」
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hitokoto-container {
  transition: transform 0.4s ease-out, box-shadow 0.4s ease;
}

.text-shadow-glow {
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

@keyframes scan {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}

.animate-scan {
  animation: scan 4s linear infinite;
}
</style>
