<script setup lang="ts">
import projectsData from '../data/projects.json';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useARGState } from '../composables/useARGState';
import { useScrollReveal } from '../composables/useScrollReveal';
import ParticleSymbol from '../components/ParticleSymbol.vue';
import ContentLoader from '../components/ContentLoader.vue';

interface Project {
  image: string;
  title: string;
  description: string;
  tags: string[];
  live_url: string;
  source_url: string;
}

const projects: Project[] = projectsData;

const getImageUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : '/' + path;
};

const { addKey, hasKey, argStarted } = useARGState();
const clickSequence = ref<number[]>([]);
const isShakeActive = ref(false);
const hoveredIndex = ref<number | null>(null);

const isLoaded = ref(false);
const projectImages = computed(() => {
  return projects.map(p => getImageUrl(p.image)).filter(Boolean);
});

const symbols = {
  form: 'M50 25 C30 25 20 40 20 50 C20 65 35 75 50 75 C65 75 80 65 80 50 C80 40 70 25 50 25 M35 45 L45 55 L65 35',
  breath: 'M15 50 Q35 15 50 50 T85 50 M15 55 Q35 20 50 55 T85 55 M15 45 Q35 10 50 45 T85 45',
  soul: 'M50 15 Q75 15 75 40 Q75 60 50 85 Q25 60 25 40 Q25 15 50 15 M40 35 Q50 25 60 35 Q65 50 50 65 Q35 50 40 35'
};

const projectSymbols: Record<number, { key: keyof typeof symbols, label: string, color: string }> = {
  0: { key: 'form', label: '念之弦 // FORM', color: '#e8e8f0' },
  1: { key: 'breath', label: '灵之弦 // BREATH', color: '#4379ad' },
  2: { key: 'soul', label: '渊之弦 // SOUL', color: '#9e86d0' }
};

const playSynthTone = (freq: number, duration: number, type: OscillatorType = 'sine') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn('Synth failed:', e);
  }
};

const scrollY = ref(0);
const handleScroll = () => { scrollY.value = window.scrollY; };

useScrollReveal();

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const handleProjectClick = (index: number) => {
  if (argStarted.value && !hasKey('CHORD_PATTERN')) {
    if (projectSymbols[index] !== undefined) {
      clickSequence.value.push(index);
      playSynthTone(200 + index * 100, 0.15);
      
      if (clickSequence.value.length === 3) {
        if (clickSequence.value[0] === 0 &&
            clickSequence.value[1] === 1 &&
            clickSequence.value[2] === 2) {
          
          isShakeActive.value = true;
          addKey('CHORD_PATTERN');
          window.dispatchEvent(new CustomEvent('arg-fragment-found', { detail: { key: 'CHORD_PATTERN' } }));
          playSynthTone(523.25, 0.4); // C5 major resonance success beep
          setTimeout(() => {
            isShakeActive.value = false;
          }, 3000);
        } else {
          clickSequence.value = [];
          playSynthTone(120, 0.4, 'sawtooth'); // Error buzz
        }
      }
    } else {
      clickSequence.value = [];
      playSynthTone(120, 0.4, 'sawtooth');
    }
  }
};
</script>

<template>
  <div class="w-full font-sans relative pb-24" :class="{ 'red-alert': isShakeActive }">
    <!-- HUD Corners -->
    <div class="hud-corner hud-tl hidden md:block"></div>
    <div class="hud-corner hud-tr hidden md:block"></div>
    <div class="scanlines"></div>

    <!-- Right Side HUD Text -->
    <div class="hidden xl:block fixed right-6 top-1/2 -translate-y-1/2 hud-text-vertical tracking-[0.3em]">
      SYS.DEPLOYMENT_NODES // 0x{{ Math.random().toString(16).substring(2, 6).toUpperCase() }}
    </div>

    <ContentLoader v-if="!isLoaded" :images="projectImages" @complete="isLoaded = true" />

    <div v-show="isLoaded" class="max-w-[1400px] mx-auto px-4 md:px-12 py-12 md:py-20 relative z-10 transition-opacity duration-700" :class="{ 'opacity-0': !isLoaded, 'opacity-100': isLoaded }">
      
      <!-- Enhanced Hero Section -->
      <div class="relative mb-16 md:mb-24 flex flex-col md:flex-row md:justify-between md:items-end gap-6 pt-12 md:pt-0">
        <!-- Parallax Background Watermark -->
        <div 
          class="absolute -top-10 md:-top-20 -left-4 md:-left-8 font-art text-[80px] md:text-[140px] leading-none opacity-[0.03] text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap transition-transform duration-75"
          :style="{ transform: `translateX(${scrollY * 0.1}px)` }"
        >
          DEPLOY
        </div>
        
        <div class="reveal-left" style="transition-delay: 0.1s;">
          <h2 class="text-3xl md:text-5xl font-art tracking-widest text-[var(--color-text)] uppercase glitch-hover flex items-center gap-4">
            <span class="animate-pulse text-[var(--color-brand)]">></span> DEPLOYMENTS
          </h2>
          <div class="mt-4 font-mono text-xs md:text-sm text-[var(--color-text-dim)] tracking-[0.2em] uppercase">
            [ ARCHIVE_OF_RUNNING_SYSTEMS ]
          </div>
        </div>
        
        <div class="reveal-right hidden md:block font-mono text-xs text-[var(--color-brand)] opacity-80 tracking-[0.2em] text-right" style="transition-delay: 0.2s;">
           <div>ACTIVE_NODES : {{ projects.length }}</div>
           <div class="opacity-60 mt-1">LAST_SYNC : {{ new Date().toISOString().split('T')[0] }}</div>
           <div class="flex items-center justify-end gap-2 mt-2 opacity-50">
             <div class="w-[2px] h-3 bg-current"></div><div class="w-[4px] h-3 bg-current"></div><div class="w-[1px] h-3 bg-current"></div>
           </div>
        </div>
      </div>

      <!-- Projects Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 stagger-children">
        <div
          v-for="(project, index) in projects"
          :key="index"
          @click="handleProjectClick(index)"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
          class="cyber-glass group relative overflow-hidden flex flex-col h-full !p-0 reveal-scale transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] cursor-pointer"
          :style="{ transitionDelay: `${0.1 * (index % 4)}s` }"
        >
          <!-- Particle Symbol Overlay (ARG active & chord card) -->
          <div 
            v-if="argStarted && !hasKey('CHORD_PATTERN') && projectSymbols[index]"
            class="absolute top-4 left-4 w-16 h-16 pointer-events-none z-30 flex flex-col items-center"
          >
            <div class="w-12 h-12 relative">
              <ParticleSymbol 
                :path="symbols[projectSymbols[index].key]" 
                :color="projectSymbols[index].color" 
                :hovered="hoveredIndex === index" 
                :active="argStarted" 
              />
            </div>
            <div class="text-center font-mono text-[8px] text-[var(--color-text-dim)] tracking-tighter opacity-80 mt-1 whitespace-nowrap">
              {{ projectSymbols[index].label }}
            </div>
          </div>

          <!-- Disk Shutter & Top Case -->
          <div class="aspect-video w-full overflow-hidden relative bg-[var(--color-bg)] flex items-center justify-center border-b border-[var(--color-border)]">
            
            <img
              v-if="project.image"
              :src="getImageUrl(project.image)"
              :alt="project.title"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0"
            >
            
            <!-- Overlay Actions -->
            <div class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2 z-20">
              <a
                v-if="project.live_url"
                :href="project.live_url"
                target="_blank"
                class="btn-terminal !px-3 !py-1.5 !text-[10px] !bg-black/80 !backdrop-blur-md hover:!bg-[var(--color-brand)] hover:!text-black transition-colors"
                title="预览"
                @click.stop
              >
                [ RUN.EXE ]
              </a>
              <a
                v-if="project.source_url"
                :href="project.source_url"
                target="_blank"
                class="btn-terminal !px-3 !py-1.5 !text-[10px] !bg-black/80 !backdrop-blur-md hover:!bg-white hover:!text-black transition-colors"
                title="源码"
                @click.stop
              >
                [ SOURCE ]
              </a>
            </div>
          </div>

          <!-- Floppy Sticker Label -->
          <div class="p-6 md:p-8 flex flex-col flex-grow relative bg-gradient-to-b from-transparent to-black/20">
            <!-- Sticker Grid background effect -->
            <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] opacity-10 pointer-events-none mix-blend-screen"></div>

            <h3 class="text-xl md:text-2xl font-art tracking-wide text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors mb-3 flex items-center gap-3 glitch-hover z-10">
              <span class="animate-pulse text-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity absolute -left-4">></span>
              {{ project.title.toUpperCase() }}
              <span class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 font-mono text-[10px] text-[var(--color-text-dim)]">_SYS</span>
            </h3>
            <p class="text-[13px] md:text-[14px] text-[var(--color-text-dim)] mb-8 flex-grow leading-relaxed font-sans relative z-10 group-hover:text-[var(--color-text)] transition-colors">{{ project.description }}</p>

            <div class="flex flex-wrap gap-2 mt-auto relative z-10">
              <span
                v-for="(tag, tIndex) in project.tags"
                :key="tIndex"
                class="text-[10px] border border-[var(--color-border)] px-2.5 py-1 uppercase font-mono tracking-widest bg-black/40 group-hover:border-[var(--color-brand)]/50 group-hover:text-[var(--color-brand)] group-hover:bg-[var(--color-brand)]/10 transition-all duration-300 backdrop-blur-sm"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- Bottom Right Decorative Barcode/Hex -->
            <div class="absolute bottom-6 right-6 font-mono text-[8px] opacity-20 group-hover:opacity-60 transition-opacity flex flex-col items-end gap-1">
              <div class="text-[var(--color-brand)] tracking-widest">SYS_{{ Math.random().toString(16).substring(2, 6).toUpperCase() }}</div>
              <div class="flex items-end gap-[2px] text-[var(--color-text)]">
                <div class="w-[1px] h-3 bg-current"></div><div class="w-[3px] h-3 bg-current"></div><div class="w-[2px] h-3 bg-current"></div><div class="w-[1px] h-3 bg-current"></div><div class="w-[2px] h-3 bg-current"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- ARG Toast UI -->
      <transition name="page">
        <div v-if="isShakeActive" class="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] cyber-glass !p-6 border-l-4 border-l-[var(--color-brand)] bg-black/90">
          <div class="text-[var(--color-brand)] font-bold text-xl tracking-[0.3em] font-mono animate-pulse mb-1">CHORD_PATTERN</div>
          <div class="text-xs opacity-60 font-mono tracking-widest">弦律异常·碎月引力波与裂缝脉冲完全同步——烬的研究笔记</div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}
</style>
