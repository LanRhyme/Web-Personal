<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = withDefaults(defineProps<{
  src: string;
  alt?: string;
  className?: string;
  imgClass?: string;
  aspectRatio?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'auto' | 'sync';
  showLoadingText?: boolean;
}>(), {
  alt: '',
  className: '',
  imgClass: '',
  aspectRatio: '',
  loading: 'lazy',
  decoding: 'async',
  showLoadingText: true
});

const isLoaded = ref(false);
const hasError = ref(false);

const checkCached = () => {
  if (!props.src) {
    hasError.value = true;
    return;
  }
  const img = new Image();
  img.src = props.src;
  if (img.complete && img.naturalWidth > 0) {
    isLoaded.value = true;
    hasError.value = false;
  }
};

const onLoad = () => {
  isLoaded.value = true;
  hasError.value = false;
};

const onError = () => {
  isLoaded.value = false;
  hasError.value = true;
};

watch(() => props.src, () => {
  isLoaded.value = false;
  hasError.value = false;
  checkCached();
});

onMounted(() => {
  checkCached();
});
</script>

<template>
  <div 
    class="cyber-image-wrapper relative overflow-hidden bg-[var(--color-bg)] flex items-center justify-center select-none"
    :class="[props.className, props.aspectRatio ? props.aspectRatio : '']"
  >
    <!-- Loading Skeleton Placeholder -->
    <div 
      v-if="!isLoaded && !hasError" 
      class="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-card)] text-[var(--color-brand)] font-mono z-10 transition-opacity duration-300"
    >
      <!-- Scanline shimmer effect -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-brand)]/10 to-transparent animate-scan pointer-events-none"></div>
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] opacity-20 pointer-events-none"></div>
      
      <!-- Spinner / Indicator -->
      <div class="relative flex flex-col items-center gap-2 p-2">
        <div class="w-6 h-6 border border-dashed border-[var(--color-brand)] rounded-none animate-spin-slow opacity-60"></div>
        <span v-if="props.showLoadingText" class="text-[9px] tracking-widest opacity-60 animate-pulse uppercase">
          [ LOADING_IMG... ]
        </span>
      </div>
    </div>

    <!-- Error Fallback Placeholder -->
    <div 
      v-if="hasError" 
      class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 border border-[var(--color-border)] p-4 text-[var(--color-text-dim)] font-mono text-center z-10"
    >
      <i class="fa-solid fa-triangle-exclamation text-xs mb-1 text-red-400 opacity-80"></i>
      <span class="text-[8px] tracking-wider uppercase opacity-70">
        [ IMG_UNAVAILABLE ]
      </span>
    </div>

    <!-- Actual Image -->
    <img 
      v-if="props.src"
      :src="props.src" 
      :alt="props.alt" 
      :loading="props.loading" 
      :decoding="props.decoding"
      @load="onLoad" 
      @error="onError"
      class="w-full h-full object-cover will-change-transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
      :class="[
        props.imgClass,
        isLoaded ? 'opacity-100' : 'opacity-0'
      ]"
    />
  </div>
</template>

<style scoped>
@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

.animate-scan {
  animation: scan 2s linear infinite;
}

.animate-spin-slow {
  animation: spin 6s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
