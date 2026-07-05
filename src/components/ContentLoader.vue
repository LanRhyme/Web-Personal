<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import anime from 'animejs';

const props = withDefaults(defineProps<{
  images?: string[],
  ready?: boolean
}>(), {
  images: () => [],
  ready: true
});

const emit = defineEmits(['complete']);

const outerGroup = ref<SVGGElement | null>(null);
const innerGroup = ref<SVGGElement | null>(null);
const outerPath = ref<SVGPathElement | null>(null);
const middlePath = ref<SVGPathElement | null>(null);
const innerPath = ref<SVGPathElement | null>(null);

const progress = ref(0);
const progressText = computed(() => {
  return `${Math.floor(progress.value).toString().padStart(3, '0')}%`;
});

// Shapes
const outerShapes = {
  A: "M 100,20 C 145,20 180,55 180,100 C 180,145 145,180 100,180 C 55,180 20,145 20,100 C 20,55 55,20 100,20 Z",
  B: "M 100,45 C 160,10 195,65 190,110 C 185,155 120,195 100,165 C 80,135 10,135 15,90 C 20,45 40,80 100,45 Z",
  C: "M 100,10 C 120,50 190,40 170,95 C 150,150 185,190 95,190 C 5,190 35,120 30,105 C 25,90 80,10 100,10 Z"
};

const middleShapes = {
  A: "M 100,45 C 130,45 155,70 155,100 C 155,130 130,155 100,155 C 70,155 45,130 45,100 C 45,70 70,45 100,45 Z",
  B: "M 100,60 C 145,35 170,80 160,115 C 150,150 115,165 95,145 C 75,125 30,120 35,85 C 40,50 55,85 100,60 Z",
  C: "M 100,35 C 115,65 165,55 150,95 C 135,135 160,165 105,160 C 50,155 55,115 50,105 C 45,95 85,35 100,35 Z"
};

const innerShapes = {
  A: "M 100,70 C 116.5,70 130,83.5 130,100 C 130,116.5 116.5,130 100,130 C 83.5,130 70,116.5 70,100 C 70,83.5 83.5,70 100,70 Z",
  B: "M 100,80 C 125,65 140,90 135,110 C 130,130 110,138 98,125 C 86,112 55,110 58,90 C 61,70 75,95 100,80 Z",
  C: "M 100,65 C 110,80 138,75 130,97 C 122,119 135,138 103,135 C 71,132 75,110 72,103 C 69,96 90,65 100,65 Z"
};

let checkInterval: number | null = null;
const isFadingOut = ref(false);

onMounted(() => {
  const morphDuration = 1200;
  
  const setupMorph = (pathRef: SVGPathElement | null, shapes: { A: string, B: string, C: string }, delay = 0) => {
    if (!pathRef) return;
    anime({
      targets: pathRef,
      d: [
        { value: shapes.B, duration: morphDuration, easing: 'easeInOutQuad' },
        { value: shapes.C, duration: morphDuration, easing: 'easeInOutQuad' },
        { value: shapes.A, duration: morphDuration, easing: 'easeInOutQuad' }
      ],
      loop: true,
      direction: 'alternate',
      delay: delay
    });
  };

  setupMorph(outerPath.value, outerShapes, 0);
  setupMorph(middlePath.value, middleShapes, 100);
  setupMorph(innerPath.value, innerShapes, 200);

  if (outerGroup.value) {
    anime({ targets: outerGroup.value, rotate: 360, duration: 15000, easing: 'linear', loop: true });
  }
  if (innerGroup.value) {
    anime({ targets: innerGroup.value, rotate: -360, duration: 10000, easing: 'linear', loop: true });
  }

  let loadedCount = 0;
  let targetCount = props.images.length;
  let isAllLoaded = targetCount === 0;

  if (targetCount > 0) {
    props.images.forEach(src => {
      const img = new Image();
      img.onload = () => { loadedCount++; if (loadedCount >= targetCount) isAllLoaded = true; };
      img.onerror = () => { loadedCount++; if (loadedCount >= targetCount) isAllLoaded = true; };
      img.src = src;
    });
  }

  const finishLoading = () => {
    anime({
      targets: progress,
      value: [progress.value, 100],
      round: 1,
      duration: 300,
      easing: 'easeOutQuad',
      complete: () => {
        isFadingOut.value = true;
        setTimeout(() => {
          emit('complete');
        }, 500); // 500ms fade out before showing real content
      }
    });
  };

  anime({
    targets: progress,
    value: [0, 99],
    round: 1,
    duration: 1500,
    easing: 'easeOutQuint',
    complete: () => {
      if (isAllLoaded && props.ready) {
        finishLoading();
      } else {
        checkInterval = window.setInterval(() => {
          if (isAllLoaded && props.ready) {
            if (checkInterval) clearInterval(checkInterval);
            finishLoading();
          }
        }, 100);
      }
    }
  });
});

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval);
});
</script>

<template>
  <div 
    class="flex flex-col justify-center items-center w-full min-h-[75vh] transition-opacity duration-500"
    :class="{ 'opacity-0': isFadingOut }"
  >
    <div class="relative z-10 flex flex-col items-center select-none">
      <svg width="240" height="240" viewBox="0 0 200 200" class="preloader-svg">
        <defs>
          <filter id="loader-glow-content" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        <g ref="outerGroup" style="transform-origin: 100px 100px;">
          <path ref="outerPath" :d="outerShapes.A" fill="none" stroke="var(--color-brand)" stroke-opacity="0.18" stroke-width="1" stroke-dasharray="3 3" />
        </g>
        
        <path ref="middlePath" :d="middleShapes.A" fill="none" stroke="var(--color-brand)" stroke-opacity="0.45" stroke-width="1.2" />
        
        <g ref="innerGroup" style="transform-origin: 100px 100px;">
          <path ref="innerPath" :d="innerShapes.A" fill="none" stroke="var(--color-brand)" stroke-opacity="0.75" stroke-width="1.5" filter="url(#loader-glow-content)" />
        </g>
      </svg>
      
      <div class="loader-counter mt-6 font-mono text-[11px] text-[var(--color-brand)] opacity-70 tracking-[0.3em]">
        [ {{ progressText }} ]
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader-counter {
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}
.preloader-svg {
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.15));
}
</style>
