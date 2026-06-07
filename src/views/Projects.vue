<script setup lang="ts">
import projectsData from '../data/projects.json';
import { ref, onMounted, onUnmounted } from 'vue';
import { useARGState } from '../composables/useARGState';

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

const scrollY = ref(0);
const handleScroll = () => { scrollY.value = window.scrollY; };

const setupScrollReveal = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        const rect = entry.target.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.8) {
          entry.target.classList.remove('is-visible');
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  setTimeout(setupScrollReveal, 100);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const handleProjectClick = (index: number) => {
  clickSequence.value.push(index);
  if (clickSequence.value.length > 3) {
    clickSequence.value.shift();
  }
  
  if (argStarted.value && !hasKey('CHORD_PATTERN') &&
      clickSequence.value.length === 3 &&
      clickSequence.value[0] === 0 &&
      clickSequence.value[1] === 1 &&
      clickSequence.value[2] === 2) {
    
    isShakeActive.value = true;
    addKey('CHORD_PATTERN');
    window.dispatchEvent(new CustomEvent('arg-fragment-found', { detail: { key: 'CHORD_PATTERN' } }));
    setTimeout(() => {
      isShakeActive.value = false;
    }, 3000);
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

    <div class="max-w-[1400px] mx-auto px-4 md:px-12 py-12 md:py-20 relative z-10">
      
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
          class="cyber-glass group relative overflow-hidden flex flex-col h-full !p-0 reveal-scale transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] cursor-pointer"
          :style="{ transitionDelay: `${0.1 * (index % 4)}s` }"
        >
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
