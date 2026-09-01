<template>
  <div class="page-content flex flex-col items-center w-full font-sans relative pb-24">
    <!-- HUD Corners -->
    <div class="hud-corner hud-tl hidden md:block"></div>
    <div class="hud-corner hud-tr hidden md:block"></div>

    <ContentLoader v-if="!isLoaded" :images="worksImages" @complete="isLoaded = true" />

    <div v-show="isLoaded" class="max-w-[1400px] mx-auto px-4 md:px-12 py-12 md:py-20 w-full relative z-10 transition-opacity duration-700" :class="{ 'opacity-0': !isLoaded, 'opacity-100': isLoaded }">
      
      <!-- Enhanced Hero Section -->
      <section class="w-full relative mb-16 md:mb-24 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 pt-12 md:pt-0" id="works-intro" v-show="currentView === 'all'">
        <!-- Parallax Background Watermark -->
        <div 
          class="absolute -top-10 md:-top-20 -left-4 md:-left-8 font-art text-[80px] md:text-[140px] leading-none opacity-[0.03] text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap transition-transform duration-75"
          :style="{ transform: `translateX(${scrollY * 0.1}px)` }"
        >
          GALLERY
        </div>
        
        <div class="reveal-left" style="transition-delay: 0.1s;">
          <h2 class="text-3xl md:text-5xl font-art tracking-widest text-[var(--color-text)] uppercase glitch-hover flex items-center gap-4">
            <span class="animate-pulse text-[var(--color-brand)]">></span> ART_ARCHIVE
          </h2>
          <div class="mt-4 font-mono text-xs md:text-sm text-[var(--color-text-dim)] tracking-[0.2em] uppercase">
            [ VISUAL_DATA_REPOSITORY ]
          </div>
        </div>

        <button
          @click="open3DView"
          class="reveal-right btn-terminal !px-6 !py-3 self-start sm:self-auto group relative overflow-hidden"
          title="Enter 3D Gallery"
          style="transition-delay: 0.2s;"
        >
          <div class="absolute inset-0 bg-[var(--color-brand)] opacity-0 group-hover:opacity-20 animate-pulse transition-opacity pointer-events-none z-[-1]"></div>
          <span class="relative z-10 flex items-center gap-2">
            <i class="fa-solid fa-cube text-[10px]"></i>
            [ ENTER_3D_ARCADE ]
          </span>
        </button>
      </section>

    <div class="w-full mb-6 md:mb-8 text-left" v-show="currentView === 'portfolio'">
      <button @click="switchToAllWorks" class="btn-terminal mb-4 md:mb-6">
        [ SYS.RETURN ]
      </button>
      <h3 class="text-xl md:text-2xl font-art tracking-widest text-[var(--color-brand)] border-b border-[var(--color-border)] pb-3 md:pb-4">> {{ currentPortfolioTitle.toUpperCase() }}</h3>
    </div>

    <div class="gallery-transition-container w-full max-w-[1400px]" :class="{ 'fade-out-content': isTransitioning }">
      
      <!-- Portfolio Sections -->
      <div v-if="currentView === 'all' && allPortfolios.length > 0" class="mb-14">
        <div class="flex items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-3">
          <div class="flex items-center gap-3">
            <span class="w-1.5 h-1.5 bg-[var(--color-accent)] animate-pulse inline-block shadow-[0_0_8px_var(--color-accent)]"></span>
            <span class="text-xs md:text-sm font-mono tracking-[0.25em] text-[var(--color-brand)] font-bold">> PORTFOLIO_INDEX</span>
          </div>
          <span class="text-[10px] font-mono border border-[var(--color-border)] px-2 py-0.5 text-[var(--color-text-dim)] uppercase">
            VOL: {{ allPortfolios.length }}
          </span>
        </div>
        
        <div class="gallery-grid stagger-children">
          <div
            v-for="(portfolio, index) in allPortfolios"
            :key="portfolio.id"
            class="cyber-glass !p-0 mb-6 break-inside-avoid relative overflow-hidden cursor-pointer group reveal-scale is-visible transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(255,255,255,0.12)] border border-[var(--color-border)] hover:border-[var(--color-brand)] bg-[var(--color-card)] rounded-none"
            @click="switchToPortfolio(portfolio)"
            :style="{ transitionDelay: `${0.08 * (index % 4)}s` }"
          >
            <!-- Corner Cyber Crosshairs on Hover -->
            <div class="absolute top-2 left-2 w-2 h-2 border-t border-l border-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>
            <div class="absolute top-2 right-2 w-2 h-2 border-t border-r border-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>
            <div class="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>
            <div class="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>

            <!-- Shimmer Light Sweep -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-10"></div>

            <CyberImage 
              :src="getImageUrl(portfolio.thumbnail)" 
              :alt="portfolio.title" 
              className="w-full h-auto min-h-[160px] relative z-0"
              imgClass="scale-100 group-hover:scale-[1.08] filter grayscale group-hover:grayscale-0 group-hover:brightness-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            />
            
            <div class="p-5 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 relative z-10 group-hover:bg-black/90 backdrop-blur-md transition-colors duration-300">
              <div class="font-art font-bold text-lg mb-1 group-hover:text-[var(--color-brand)] transition-colors text-[var(--color-text)] tracking-wide flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-[var(--color-brand)] text-xs opacity-0 group-hover:opacity-100 transition-opacity animate-pulse">></span>
                  <span>{{ portfolio.title }}</span>
                </div>
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-[var(--color-text-dim)] group-hover:text-[var(--color-brand)] opacity-0 group-hover:opacity-80 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></i>
              </div>
              <div class="text-[11px] text-[var(--color-text-dim)] font-sans leading-relaxed group-hover:text-[var(--color-text)] transition-colors">{{ portfolio.description }}</div>
            </div>
            
            <!-- Decorative Barcode -->
            <div class="absolute top-4 right-4 flex gap-[2px] opacity-20 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)] mix-blend-difference z-20">
              <div class="w-[1px] h-4 bg-current"></div><div class="w-[3px] h-4 bg-current"></div><div class="w-[2px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Individual Illustration Logs -->
      <div v-if="displayedWorks.length > 0">
        <div v-if="currentView === 'all'" class="flex items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-3">
          <div class="flex items-center gap-3">
            <span class="w-1.5 h-1.5 bg-[var(--color-brand)] animate-pulse inline-block shadow-[0_0_8px_var(--color-brand)]"></span>
            <span class="text-xs md:text-sm font-mono tracking-[0.25em] text-[var(--color-brand)] font-bold">> ILLUSTRATION_LOGS</span>
          </div>
          <span class="text-[10px] font-mono border border-[var(--color-border)] px-2 py-0.5 text-[var(--color-text-dim)] uppercase">
            ITEMS: {{ displayedWorks.length }}
          </span>
        </div>
        
        <div class="gallery-grid stagger-children">
          <div
            v-for="(work, index) in displayedWorks"
            :key="work.id"
            class="cyber-glass !p-0 mb-6 break-inside-avoid relative overflow-hidden cursor-pointer group reveal-scale is-visible transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(255,255,255,0.12)] border border-[var(--color-border)] hover:border-[var(--color-brand)] bg-[var(--color-card)] rounded-none"
            @click="openLightbox(index)"
            :style="{ transitionDelay: `${0.06 * (index % 6)}s` }"
          >
            <!-- Corner Cyber Crosshairs on Hover -->
            <div class="absolute top-2 left-2 w-2 h-2 border-t border-l border-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>
            <div class="absolute top-2 right-2 w-2 h-2 border-t border-r border-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>
            <div class="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>
            <div class="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>

            <!-- Shimmer Light Sweep -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-10"></div>

            <CyberImage 
              :src="getImageUrl(work.image)" 
              :alt="work.title" 
              className="w-full h-auto min-h-[160px] relative z-0"
              imgClass="scale-100 group-hover:scale-[1.08] filter grayscale group-hover:grayscale-0 group-hover:brightness-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            />
            
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-5 pt-16 text-[var(--color-text)] opacity-0 transition-all duration-300 group-hover:opacity-100 z-10 backdrop-blur-[2px] transform translate-y-2 group-hover:translate-y-0">
              <!-- Decode Glitch Effect Container -->
              <div class="relative overflow-hidden">
                <div class="font-art font-bold text-base mb-1 text-[var(--color-brand)] tracking-wider flex items-center gap-2 group-hover:animate-[glitch-decode_0.5s_ease-out]">
                  <span class="animate-pulse">></span> {{ work.title || 'UNNAMED_WORK' }}
                </div>
                <div class="text-[10px] opacity-70 font-mono tracking-widest uppercase group-hover:animate-[glitch-decode_0.6s_ease-out] flex justify-between items-center">
                  <span>{{ work.description || 'Illustration Log' }}</span>
                  <span class="text-[8px] text-[var(--color-brand)] opacity-60">[ ZOOM ]</span>
                </div>
              </div>
              
              <!-- Decorative Barcode -->
              <div class="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-[2px] opacity-30 text-[var(--color-brand)] pointer-events-none">
                <div class="h-[1px] w-4 bg-current"></div><div class="h-[3px] w-4 bg-current"></div><div class="h-[2px] w-4 bg-current"></div><div class="h-[1px] w-4 bg-current"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="currentView === 'portfolio' && displayedWorks.length === 0" class="text-center py-16 cyber-glass">
        <p class="text-sm font-mono text-[var(--color-text-dim)] tracking-widest">> NO_WORKS_FOUND_IN_THIS_PORTFOLIO</p>
      </div>

    </div>

    <!-- 3D Gallery View -->
    <Teleport to="body">
      <div
        v-if="is3DViewOpen"
        class="fixed inset-0 z-[10001] bg-[#050505] perspective-container overflow-hidden select-none transition-all duration-500"
        @mousedown="handle3DMouseDown"
        @mousemove="handle3DMouseMove"
        @mouseup="handle3DMouseUp"
        @mouseleave="handle3DMouseUp"
        @touchstart="handle3DMouseDown"
        @touchmove="handle3DMouseMove"
        @touchend="handle3DMouseUp"
      >
        <!-- Background Effects -->
        <div class="absolute inset-0 bg-gradient-radial from-[#132a13] via-[#050505] to-black pointer-events-none opacity-80"></div>
        <div class="stars-bg absolute inset-0 pointer-events-none"></div>

        <!-- Controls -->
        <button
          @click="close3DView"
          class="absolute top-6 right-8 z-50 text-white/50 hover:text-[var(--color-brand)] hover:scale-110 text-5xl transition-all cursor-pointer"
        >
          &times;
        </button>
        
        <div class="absolute top-8 left-8 z-50 pointer-events-none">
          <p class="text-sm uppercase tracking-[0.2em] font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-secondary)]">3D 作品展示</p>
          <p class="text-[10px] mt-1 opacity-70 text-white">拖动旋转 • 点击查看详情</p>
        </div>

        <!-- Layout Switcher -->
         <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-3 p-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 overflow-x-auto max-w-[90vw] scrollbar-none">
            <button
             v-for="layout in ['helix', 'sphere', 'grid', 'cylinder', 'tunnel', 'scatter']"
             :key="layout"
             @click.stop="set3DLayout(layout as LayoutType)"
             class="px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap"
             :class="currentLayout === layout ? 'bg-[var(--color-brand)] text-white shadow-[0_0_15px_rgba(var(--brand-rgb),0.5)]' : 'text-white/60 hover:text-white hover:bg-white/10'"
            >
              {{ layout }}
            </button>
         </div>

        <!-- 3D Scene -->
        <div
          class="scene-3d w-full h-full flex items-center justify-center"
          :style="{ transform: `translateZ(${sceneTranslateZ}px) translateX(${sceneTranslateX}px) translateY(${sceneTranslateY}px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${sceneRotationZ}deg)` }"
          @click.self="resetFocus"
        >
          <div class="cylinder-container preserve-3d">
             <div
              v-for="(work, index) in allIndividualWorks"
              :key="work.id"
              class="cylinder-item absolute top-1/2 left-1/2 cursor-pointer group transition-all duration-1000 ease-in-out"
              :class="{ 'pointer-events-none opacity-30': focusedIndex !== null && focusedIndex !== index }"
              :style="{ 
                transform: getLayoutTransform(index, allIndividualWorks.length)
              }"
              @click.stop="focusItem(index)"
             >
                <div class="relative h-[250px] md:h-[350px] w-auto rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 group-hover:scale-105 group-hover:border-[var(--color-brand)]/50 group-hover:shadow-[0_0_30px_rgba(var(--brand-rgb),0.3)] bg-gray-900/40 backface-hidden flex justify-center items-center backdrop-blur-sm">
                  <img :src="getImageUrl(work.image)" loading="lazy" decoding="async" class="h-full w-auto max-w-[500px] object-contain" />
                  <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none"></div>
                  <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                    <h3 class="text-white font-bold truncate text-sm">{{ work.title }}</h3>
                  </div>
                </div>
                <!-- Reflection -->
                <div v-if="['cylinder', 'helix', 'grid'].includes(currentLayout)" class="absolute top-full left-0 w-full h-full transform scale-y-[-1] opacity-20 mask-gradient pointer-events-none mt-2 transition-opacity duration-500">
                   <img :src="getImageUrl(work.image)" loading="lazy" decoding="async" class="w-full h-full object-cover rounded-2xl blur-[2px]" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        id="lightbox"
        class="fixed inset-0 z-[10000] flex justify-center items-center bg-black/95 backdrop-blur-xl transition-all duration-300"
        :class="{ 'opacity-100 visible': lightbox.visible, 'opacity-0 invisible pointer-events-none': !lightbox.visible }"
        @click.self="closeLightbox"
      >
        <!-- Top Status Bar & Close -->
        <div class="absolute top-6 inset-x-6 md:inset-x-12 flex justify-between items-center z-30 pointer-events-none">
          <div class="font-mono text-xs text-[var(--color-brand)] tracking-[0.25em] flex items-center gap-3">
            <span class="w-2 h-2 bg-[var(--color-brand)] animate-pulse"></span>
            <span>IMAGE_VIEWER // [ {{ lightbox.index + 1 }} / {{ lightbox.works.length }} ]</span>
          </div>
          
          <button 
            class="pointer-events-auto btn-terminal !px-3 !py-1.5 !text-xs !bg-black/80 hover:!border-red-500 hover:!text-red-400 transition-colors"
            @click="closeLightbox"
            title="Close (Esc)"
          >
            [ ESC // CLOSE ]
          </button>
        </div>

        <!-- Navigation Buttons -->
        <button 
          class="absolute top-1/2 left-4 md:left-8 -translate-y-1/2 btn-terminal !p-3.5 !bg-black/60 hover:!bg-[var(--color-brand)] hover:!text-black transition-all z-30 group"
          @click="prevImage"
          title="Previous (Left Arrow)"
        >
          <i class="fa-solid fa-chevron-left text-sm group-hover:-translate-x-0.5 transition-transform"></i>
        </button>
        
        <button 
          class="absolute top-1/2 right-4 md:right-8 -translate-y-1/2 btn-terminal !p-3.5 !bg-black/60 hover:!bg-[var(--color-brand)] hover:!text-black transition-all z-30 group"
          @click="nextImage"
          title="Next (Right Arrow)"
        >
          <i class="fa-solid fa-chevron-right text-sm group-hover:translate-x-0.5 transition-transform"></i>
        </button>
        
        <!-- Center Image Stage -->
        <div class="relative max-w-[92vw] max-h-[90vh] flex flex-col items-center pt-8">
          <div class="relative border border-[var(--color-border)] p-1 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[75vh] flex items-center justify-center overflow-hidden">
            <!-- Corner Crosshairs -->
            <div class="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[var(--color-brand)] pointer-events-none"></div>
            <div class="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[var(--color-brand)] pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[var(--color-brand)] pointer-events-none"></div>
            <div class="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[var(--color-brand)] pointer-events-none"></div>

            <img
              :src="lightbox.image"
              alt="Enlarged work"
              loading="lazy"
              decoding="async"
              class="max-w-full max-h-[72vh] object-contain transition-all duration-300 select-none"
              :class="{ 'scale-100 opacity-100': lightbox.visible, 'scale-95 opacity-0': !lightbox.visible }"
              @click.stop
            />
          </div>

          <!-- Bottom Caption -->
          <div class="mt-4 text-center text-[var(--color-text)] select-none">
            <h3 class="text-xl md:text-2xl font-art tracking-wider text-[var(--color-brand)]">
              > {{ lightbox.works[lightbox.index]?.title || 'UNTITLED_WORK' }}
            </h3>
            <p class="text-[11px] font-mono opacity-60 tracking-[0.2em] mt-1.5 uppercase">
              {{ lightbox.works[lightbox.index]?.description || 'Creative Illustration' }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import worksData from '../data/works.json';
import sectionsData from '../data/works_section.json';
import { useScrollReveal } from '../composables/useScrollReveal';
import ContentLoader from '../components/ContentLoader.vue';
import CyberImage from '../components/CyberImage.vue';

const scrollY = ref(0);
const handleScroll = () => { scrollY.value = window.scrollY; };

useScrollReveal();

interface Work {
  id: string;
  image: string;
  title: string;
  description: string;
}

interface Portfolio {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  work_ids: string[];
}

const allIndividualWorks = ref<Work[]>(worksData);
const allPortfolios = ref<Portfolio[]>(sectionsData);

const worksMap = new Map<string, Work>();
allIndividualWorks.value.forEach(work => worksMap.set(work.id, work));

const currentView = ref<'all' | 'portfolio'>('all');
const currentPortfolioId = ref<string | null>(null);
const isTransitioning = ref(false);
const isLoaded = ref(false);

const worksImages = computed(() => {
  if (currentView.value === 'all') {
    return allPortfolios.value.map(p => getImageUrl(p.thumbnail)).filter(Boolean).slice(0, 4);
  } else {
    return displayedWorks.value.map(w => getImageUrl(w.image)).filter(Boolean).slice(0, 4);
  }
});

const currentPortfolioTitle = computed(() => {
  if (currentPortfolioId.value) {
    const portfolio = allPortfolios.value.find(p => p.id === currentPortfolioId.value);
    return portfolio ? portfolio.title : '作品集';
  }
  return '';
});

const displayedWorks = computed(() => {
  if (currentView.value === 'all') {
    return allIndividualWorks.value;
  } else if (currentPortfolioId.value) {
    const portfolio = allPortfolios.value.find(p => p.id === currentPortfolioId.value);
    if (portfolio && portfolio.work_ids) {
      return portfolio.work_ids.map(id => worksMap.get(id)).filter((w): w is Work => !!w);
    }
  }
  return [];
});

const getImageUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : '/' + path;
};

const switchToPortfolio = (portfolio: Portfolio) => {
  isTransitioning.value = true;
  setTimeout(() => {
    currentView.value = 'portfolio';
    currentPortfolioId.value = portfolio.id;
    isTransitioning.value = false;
    isLoaded.value = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 300);
};

const switchToAllWorks = () => {
  isTransitioning.value = true;
  setTimeout(() => {
    currentView.value = 'all';
    currentPortfolioId.value = null;
    isTransitioning.value = false;
    isLoaded.value = false;
  }, 300);
};

const is3DViewOpen = ref(false);
const rotationY = ref(0);
const rotationX = ref(0);
const sceneTranslateZ = ref(-1000);
const sceneTranslateX = ref(0);
const sceneTranslateY = ref(0);

const isDragging = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);
const autoRotateId = ref<number | null>(null);

const focusedIndex = ref<number | null>(null);
const targetRotationY = ref(0);
const targetRotationX = ref(0);
const targetRotationZ = ref(0);
const targetTranslateZ = ref(-1000);
const targetTranslateX = ref(0);
const targetTranslateY = ref(0);

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type LayoutType = 'cylinder' | 'helix' | 'sphere' | 'grid' | 'tunnel' | 'scatter';
const currentLayout = ref<LayoutType>('helix');

const getLayoutTransform = (index: number, total: number) => {
  const t = currentLayout.value;
  
  if (t === 'cylinder') {
    const angleStep = 360 / Math.max(1, total);
    const radius = Math.max(800, (total * 400) / (2 * Math.PI));
    return `translate(-50%, -50%) rotateY(${index * angleStep}deg) translateZ(${radius}px)`;
  }
  
  if (t === 'helix') {
    const angleStep = 30;
    const radius = 900;
    const verticalStep = 30;
    const yOffset = (index - total / 2) * verticalStep;
    return `translate(-50%, -50%) rotateY(${index * angleStep}deg) translateY(${yOffset}px) translateZ(${radius}px)`;
  }
  
  if (t === 'sphere') {
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    const radius = 900;
    return `translate(-50%, -50%) rotateY(${theta * (180/Math.PI)}deg) rotateX(${(phi * (180/Math.PI)) - 90}deg) translateZ(${radius}px)`;
  }

  if (t === 'grid') {
    const cols = 5;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const spacingX = 450;
    const spacingY = 350;
    const startX = -((cols - 1) * spacingX) / 2;
    const startY = -((Math.ceil(total / cols) - 1) * spacingY) / 2;
    const x = startX + col * spacingX;
    const curve = Math.abs(col - cols/2) * 200;
    return `translate(-50%, -50%) translateX(${x}px) translateY(${startY + row * spacingY}px) translateZ(${-curve}px)`;
  }

  if (t === 'tunnel') {
    const spacingZ = 400;
    const angleStep = 30;
    const z = -index * spacingZ + 1000;
    const rotation = index * angleStep;
    return `translate(-50%, -50%) translateZ(${z}px) rotateZ(${rotation}deg) translateX(500px) rotateY(-90deg)`;
  }

  if (t === 'scatter') {
    const range = 2000;
    const x = (pseudoRandom(index) - 0.5) * range;
    const y = (pseudoRandom(index + 100) - 0.5) * range;
    const z = (pseudoRandom(index + 200) - 0.5) * range;
    const rotX = (pseudoRandom(index + 300) - 0.5) * 60;
    const rotY = (pseudoRandom(index + 400) - 0.5) * 60;
    return `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
  }
  return '';
};

const open3DView = () => {
  is3DViewOpen.value = true;
  document.body.style.overflow = 'hidden';
  targetRotationY.value = 0;
  targetRotationX.value = 0;
  targetTranslateZ.value = -1000;
  targetTranslateX.value = 0;
  targetTranslateY.value = 0;
  sceneTranslateZ.value = -1000;
  startUpdateLoop();
};

const close3DView = () => {
  is3DViewOpen.value = false;
  document.body.style.overflow = '';
  stopUpdateLoop();
  rotationY.value = 0;
  rotationX.value = 0;
  focusedIndex.value = null;
};

const set3DLayout = (layout: LayoutType) => {
  currentLayout.value = layout;
  focusedIndex.value = null;
  targetRotationY.value = 0;
  targetRotationX.value = 0;
  targetTranslateZ.value = -1000;
  targetTranslateX.value = 0;
  targetTranslateY.value = 0;
};

const sceneRotationZ = ref(0);

const startUpdateLoop = () => {
  if (autoRotateId.value) return;
  const animate = () => {
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
    const smoothFactor = 0.1;

    if (focusedIndex.value !== null) {
      rotationY.value = lerp(rotationY.value, targetRotationY.value, smoothFactor);
      rotationX.value = lerp(rotationX.value, targetRotationX.value, smoothFactor);
      sceneRotationZ.value = lerp(sceneRotationZ.value, targetRotationZ.value, smoothFactor);
      sceneTranslateZ.value = lerp(sceneTranslateZ.value, targetTranslateZ.value, smoothFactor);
      sceneTranslateX.value = lerp(sceneTranslateX.value, targetTranslateX.value, smoothFactor);
      sceneTranslateY.value = lerp(sceneTranslateY.value, targetTranslateY.value, smoothFactor);
    } else {
      sceneTranslateZ.value = lerp(sceneTranslateZ.value, -1000, smoothFactor);
      sceneTranslateX.value = lerp(sceneTranslateX.value, 0, smoothFactor);
      sceneTranslateY.value = lerp(sceneTranslateY.value, 0, smoothFactor);
      sceneRotationZ.value = lerp(sceneRotationZ.value, 0, smoothFactor);
      if (!isDragging.value && currentLayout.value !== 'grid' && currentLayout.value !== 'tunnel') {
        rotationY.value -= 0.1;
      }
      if (!isDragging.value && currentLayout.value === 'tunnel') {
         rotationY.value -= 0.1;
      }
      targetRotationY.value = rotationY.value;
      targetRotationX.value = rotationX.value;
      targetRotationZ.value = sceneRotationZ.value;
    }
    autoRotateId.value = requestAnimationFrame(animate);
  };
  animate();
};

const focusItem = (index: number) => {
  if (!isClickValid.value) return;
  if (focusedIndex.value === index) {
     resetFocus();
     return;
  }
  focusedIndex.value = index;
  const total = allIndividualWorks.value.length;
  targetRotationZ.value = 0;

  if (currentLayout.value === 'cylinder') {
    const angleStep = 360 / Math.max(1, total);
    targetRotationY.value = -(index * angleStep);
    targetRotationX.value = 0;
    targetTranslateY.value = 0;
    targetTranslateX.value = 0;
    targetTranslateZ.value = -200;
  }
  else if (currentLayout.value === 'helix') {
    const angleStep = 30;
    const verticalStep = 30;
    const yOffset = (index - total / 2) * verticalStep;
    targetRotationY.value = -(index * angleStep);
    targetRotationX.value = 0;
    targetTranslateY.value = -yOffset;
    targetTranslateX.value = 0;
    targetTranslateZ.value = -200;
  }
  else if (currentLayout.value === 'grid') {
    const cols = 5;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const spacingX = 450;
    const spacingY = 350;
    const startX = -((cols - 1) * spacingX) / 2;
    const startY = -((Math.ceil(total / cols) - 1) * spacingY) / 2;
    const x = startX + col * spacingX;
    targetTranslateX.value = -x;
    targetTranslateY.value = -(startY + row * spacingY);
    targetTranslateZ.value = -200;
    targetRotationY.value = 0;
    targetRotationX.value = 0;
  }
  else if (currentLayout.value === 'sphere') {
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    targetRotationY.value = -(theta * (180/Math.PI));
    targetRotationX.value = -((phi * (180/Math.PI)) - 90);
    targetTranslateZ.value = -200;
    targetTranslateX.value = 0;
    targetTranslateY.value = 0;
  }
  else if (currentLayout.value === 'tunnel') {
     const spacingZ = 400;
     const angleStep = 30;
     const z = -index * spacingZ + 1000;
     const rotation = index * angleStep;
     targetRotationZ.value = -rotation;
     targetRotationY.value = 90;
     targetRotationX.value = 0;
     targetTranslateX.value = -z;
     targetTranslateY.value = 0;
     targetTranslateZ.value = 300;
  }
  else if (currentLayout.value === 'scatter') {
    const range = 2000;
    const x = (pseudoRandom(index) - 0.5) * range;
    const y = (pseudoRandom(index + 100) - 0.5) * range;
    const z = (pseudoRandom(index + 200) - 0.5) * range;
    targetTranslateX.value = -x;
    targetTranslateY.value = -y;
    targetTranslateZ.value = -200 - z;
    const rotX = (pseudoRandom(index + 300) - 0.5) * 60;
    const rotY = (pseudoRandom(index + 400) - 0.5) * 60;
    targetRotationX.value = -rotX;
    targetRotationY.value = -rotY;
  }
};

const stopUpdateLoop = () => {
  if (autoRotateId.value) {
    cancelAnimationFrame(autoRotateId.value);
    autoRotateId.value = null;
  }
};

const clickStartX = ref(0);
const clickStartY = ref(0);
const isClickValid = ref(true);

const handle3DMouseDown = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true;
  isClickValid.value = true;
  let clientX, clientY;
  if ('touches' in e && e.touches.length > 0) {
     clientX = e.touches[0].clientX;
     clientY = e.touches[0].clientY;
  } else if ('clientX' in e) {
     clientX = (e as MouseEvent).clientX;
     clientY = (e as MouseEvent).clientY;
  } else return;
  lastMouseX.value = clientX;
  lastMouseY.value = clientY;
  clickStartX.value = clientX;
  clickStartY.value = clientY;
};

const handle3DMouseMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  let clientX = 0, clientY = 0;
  if ('touches' in e) {
      if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else return;
  } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
  }
  const moveX = clientX - clickStartX.value;
  const moveY = clientY - clickStartY.value;
  if (Math.sqrt(moveX*moveX + moveY*moveY) > 5) {
      isClickValid.value = false;
      if (focusedIndex.value !== null) focusedIndex.value = null;
  }
  const deltaX = clientX - lastMouseX.value;
  const deltaY = clientY - lastMouseY.value;
  rotationY.value += deltaX * 0.3;
  rotationX.value -= deltaY * 0.3;
  rotationX.value = Math.max(-60, Math.min(60, rotationX.value));
  lastMouseX.value = clientX;
  lastMouseY.value = clientY;
};

const handle3DMouseUp = () => { isDragging.value = false; };
const resetFocus = () => { if (isClickValid.value) focusedIndex.value = null; };

onUnmounted(() => {
  stopUpdateLoop();
  window.removeEventListener('scroll', handleScroll);
});

const lightbox = reactive({
  visible: false,
  image: '',
  index: 0,
  works: [] as Work[]
});

const openLightbox = (index: number, worksSource: Work[] = displayedWorks.value) => {
  lightbox.index = index;
  lightbox.works = worksSource;
  const work = lightbox.works[index];
  lightbox.image = work ? getImageUrl(work.image) : '';
  lightbox.visible = true;
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  lightbox.visible = false;
  document.body.style.overflow = '';
};

const prevImage = () => {
  const works = lightbox.works;
  lightbox.index = (lightbox.index > 0) ? lightbox.index - 1 : works.length - 1;
  const work = works[lightbox.index];
  lightbox.image = work ? getImageUrl(work.image) : '';
};

const nextImage = () => {
  const works = lightbox.works;
  lightbox.index = (lightbox.index < works.length - 1) ? lightbox.index + 1 : 0;
  const work = works[lightbox.index];
  lightbox.image = work ? getImageUrl(work.image) : '';
};

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (!lightbox.visible) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

</script>

<style scoped>
.gallery-grid {
  column-count: 4;
  column-gap: 1.5rem;
}
@media (max-width: 1400px) { .gallery-grid { column-count: 3; } }
@media (max-width: 1024px) { .gallery-grid { column-count: 3; } }
@media (max-width: 768px) { .gallery-grid { column-count: 2; } }
@media (max-width: 500px) { .gallery-grid { column-count: 2; } }

.gallery-transition-container {
  opacity: 1; visibility: visible;
  transition: opacity 0.3s ease-in-out, visibility 0s 0s;
}
.gallery-transition-container.fade-out-content {
  opacity: 0; visibility: hidden;
  transition: opacity 0.3s ease-in-out, visibility 0s 0.3s;
}

.stars-bg {
  background-image: 
    radial-gradient(1px 1px at 10% 10%, white 1px, transparent 0),
    radial-gradient(1px 1px at 20% 20%, white 1px, transparent 0),
    radial-gradient(2px 2px at 30% 30%, white 1px, transparent 0),
    radial-gradient(1px 1px at 40% 40%, white 1px, transparent 0),
    radial-gradient(1px 1px at 50% 50%, white 1px, transparent 0),
    radial-gradient(2px 2px at 60% 60%, white 1px, transparent 0);
  background-size: 550px 550px;
  opacity: 0.15;
}

/* 3D Gallery Core */
.perspective-container {
  perspective: 2000px;
  perspective-origin: 50% 50%;
}

.preserve-3d {
  transform-style: preserve-3d;
}

.scene-3d {
  transform-style: preserve-3d;
  transition: transform 0.05s linear;
}

.cylinder-container {
  position: relative;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
}

.cylinder-item {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.mask-gradient {
  mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 80%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 80%);
}

.bg-gradient-radial {
  background: radial-gradient(circle at 50% 50%, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
}

@keyframes glitch-decode {
  0% { opacity: 0; filter: blur(4px) hue-rotate(90deg); transform: translateX(-5px); }
  30% { opacity: 0.8; filter: blur(0px) hue-rotate(0deg); transform: translateX(2px); }
  60% { opacity: 0.6; transform: translateX(-1px); }
  100% { opacity: 1; transform: translateX(0); }
}
</style>