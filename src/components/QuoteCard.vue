<script setup lang="ts">
import { ref, onMounted } from 'vue';

const quote = ref('加载中...');
const from = ref('');
const isAnimating = ref(false);

const fetchHitokoto = async () => {
    // Prevent multiple clicks during animation
    if (isAnimating.value) return;
    
    isAnimating.value = true;
    
    try {
        const response = await fetch('https://v1.hitokoto.cn');
        if (response.ok) {
            const data = await response.json();
            quote.value = data.hitokoto;
            from.value = data.from;
        } else {
            quote.value = '愿你的代码永无 Bug。';
        }
    } catch (e) {
        quote.value = '网络错误，请稍后再试。';
    }
    
    // Reset animation state after transition completes
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
    class="card !p-6 flex flex-col justify-center gap-3 group cursor-pointer relative overflow-hidden" 
    @click="fetchHitokoto"
    :class="{ 'pointer-events-none': isAnimating }"
  >
    <!-- Refresh indicator -->
    <div 
      class="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#35bfa0]/10 flex items-center justify-center transition-all duration-300"
      :class="isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'"
    >
      <i 
        class="fa fa-refresh text-[#35bfa0] text-[10px] transition-transform duration-500"
        :class="isAnimating ? 'animate-spin' : ''"
      ></i>
    </div>

    <div class="flex items-center gap-2 mb-1">
        <i class="fa fa-quote-left text-[#35bfa0] text-xs opacity-50 group-hover:opacity-100 transition-opacity"></i>
        <span class="text-[10px] font-bold text-[#6b8a7a] uppercase tracking-wider">Hitokoto</span>
    </div>
    
    <!-- Quote text with fade animation -->
    <p 
      class="text-sm leading-relaxed text-[var(--color-primary)] opacity-90 font-medium transition-all duration-300"
      :class="isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'"
    >
        {{ quote }}
    </p>
    
    <!-- Source with fade animation -->
    <div 
      v-if="from" 
      class="text-right transition-all duration-300 delay-75"
      :class="isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'"
    >
        <span class="text-[11px] text-[var(--color-secondary)] opacity-60">— {{ from }}</span>
    </div>

    <!-- Click hint -->
    <div 
      class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-[#35bfa0]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      点击切换
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions for content */
.card {
  transition: transform 0.2s ease, box-shadow 0.3s ease;
}

.card:active {
  transform: scale(0.98);
}

/* Animation keyframes for spin */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 0.5s linear infinite;
}
</style>
