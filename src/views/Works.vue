<template>
  <div class="page-content flex flex-col items-center w-full font-sans relative">
    <!-- HUD Corners -->
    <div class="hud-corner hud-tl hidden md:block"></div>
    <div class="hud-corner hud-tr hidden md:block"></div>
    <div class="scanlines"></div>

    <div class="max-w-[1400px] mx-auto px-4 md:px-12 py-6 md:py-8 w-full relative z-10">
      <section class="w-full" id="works-intro" v-show="currentView === 'all'">
        <div class="border-b border-[var(--color-border)] pb-3 md:pb-4 mb-6 md:mb-8 relative flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div>
            <div class="absolute -top-6 -left-4 font-art text-[60px] md:text-[80px] leading-none opacity-5 text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap overflow-hidden">GALLERY</div>
            <h2 class="text-2xl md:text-3xl font-art tracking-widest text-[var(--color-text)] uppercase glitch-hover">> ART_ARCHIVE</h2>
          </div>
          <button
            @click="open3DView"
            class="btn-terminal !px-4 !py-1 self-start sm:self-auto group relative overflow-hidden"
            title="Enter 3D Gallery"
          >
            <div class="absolute inset-0 bg-[var(--color-brand)] opacity-0 group-hover:opacity-20 animate-pulse transition-opacity pointer-events-none z-[-1]"></div>
            <span class="relative z-10">[ 3D_ARCADE ]</span>
          </button>
        </div>
      </section>

    <div class="w-full mb-6 md:mb-8 text-left" v-show="currentView === 'portfolio'">
      <button @click="switchToAllWorks" class="btn-terminal mb-4 md:mb-6">
        [ SYS.RETURN ]
      </button>
      <h3 class="text-xl md:text-2xl font-art tracking-widest text-[var(--color-brand)] border-b border-[var(--color-border)] pb-3 md:pb-4">> {{ currentPortfolioTitle.toUpperCase() }}</h3>
    </div>

    <div class="gallery-transition-container w-full max-w-[1400px]" :class="{ 'fade-out-content': isTransitioning }">
      
      <div v-if="currentView === 'all' && allPortfolios.length > 0" class="mb-12">
        <div class="flex items-center gap-4 mb-6">
          <span class="text-sm font-mono tracking-widest opacity-60">> PORTFOLIO_INDEX</span>
          <div class="flex-grow h-[1px] bg-gradient-to-r from-[var(--color-border)] to-transparent"></div>
        </div>
        <div class="gallery-grid stagger-children">
          <div
            v-for="portfolio in allPortfolios"
            :key="portfolio.id"
            class="cyber-glass !p-0 mb-6 break-inside-avoid relative overflow-hidden cursor-pointer group reveal is-visible border border-[var(--color-border)] hover:border-[var(--color-brand)] transition-colors"
            @click="switchToPortfolio(portfolio)"
          >
            <img :src="getImageUrl(portfolio.thumbnail)" :alt="portfolio.title" loading="lazy" decoding="async" class="w-full h-auto block relative z-0 transition-transform duration-700 group-hover:scale-105 filter grayscale hover:grayscale-0">
            <div class="p-5 border-t border-[var(--color-border)] bg-[var(--color-bg)] relative z-10">
              <div class="font-art font-bold text-lg mb-1 group-hover:text-[var(--color-brand)] transition-colors text-[var(--color-text)] tracking-wide">> {{ portfolio.title }}</div>
              <div class="text-[11px] text-[var(--color-text-dim)] font-sans leading-relaxed">{{ portfolio.description }}</div>
            </div>
            <!-- Decorative Barcode -->
            <div class="absolute top-4 right-4 flex gap-[2px] opacity-30 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)] mix-blend-difference z-20">
              <div class="w-[1px] h-4 bg-current"></div><div class="w-[3px] h-4 bg-current"></div><div class="w-[2px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="displayedWorks.length > 0">
        <div v-if="currentView === 'all'" class="flex items-center gap-4 mb-6">
          <span class="text-sm font-mono tracking-widest opacity-60">> ILLUSTRATION_LOGS</span>
          <div class="flex-grow h-[1px] bg-gradient-to-r from-[var(--color-border)] to-transparent"></div>
        </div>
        <div class="gallery-grid stagger-children">
          <div
            v-for="(work, index) in displayedWorks"
            :key="work.id"
            class="cyber-glass !p-0 mb-6 break-inside-avoid relative overflow-hidden cursor-pointer group reveal is-visible border border-[var(--color-border)] hover:border-[var(--color-brand)] transition-colors"
            @click="openLightbox(index)"
          >
            <img :src="getImageUrl(work.image)" :alt="work.title" loading="lazy" decoding="async" class="w-full h-auto block relative z-0 transition-transform duration-700 group-hover:scale-105 filter grayscale hover:grayscale-0">
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pt-16 text-[var(--color-text)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10 backdrop-blur-[2px]">
              <div class="font-art font-bold text-base mb-1 text-[var(--color-brand)] tracking-wider">> {{ work.title || 'UNNAMED_WORK' }}</div>
              <div class="text-[10px] opacity-70 font-mono tracking-widest">{{ work.description || 'Illustration Log' }}</div>
              
              <!-- Decorative Barcode -->
              <div class="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-[2px] opacity-30 text-[var(--color-brand)]">
                <div class="h-[1px] w-4 bg-current"></div><div class="h-[3px] w-4 bg-current"></div><div class="h-[2px] w-4 bg-current"></div><div class="h-[1px] w-4 bg-current"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="currentView === 'portfolio' && displayedWorks.length === 0" class="text-center py-12">
        <p class="text-lg text-[var(--color-secondary)]">此作品集暂无作品。</p>
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
        class="fixed inset-0 z-[10000] flex justify-center items-center bg-black/90 backdrop-blur-md transition-opacity duration-300"
        :class="{ 'opacity-100 visible': lightbox.visible, 'opacity-0 invisible': !lightbox.visible }"
        @click.self="closeLightbox"
      >
        <button class="absolute top-6 right-8 text-white/50 hover:text-white hover:scale-110 text-4xl p-2 transition-all z-20" @click="closeLightbox">
          <i class="fas fa-times"></i>
        </button>
        <button class="absolute top-1/2 left-8 -translate-y-1/2 text-white/40 hover:text-white hover:scale-110 text-4xl p-4 transition-all z-20" @click="prevImage">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="absolute top-1/2 right-8 -translate-y-1/2 text-white/40 hover:text-white hover:scale-110 text-4xl p-4 transition-all z-20" @click="nextImage">
          <i class="fas fa-chevron-right"></i>
        </button>
        
        <div class="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center">
          <img
            :src="lightbox.image"
            alt="Enlarged work"
            loading="lazy"
            decoding="async"
            class="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl transition-transform duration-500 select-none"
            :class="{ 'scale-100': lightbox.visible, 'scale-95': !lightbox.visible }"
            @click.stop
          >
          <div class="mt-6 text-center text-[var(--color-text)] reveal is-visible active">
             <h3 class="text-2xl font-art tracking-wider text-[var(--color-brand)]">> {{ lightbox.works[lightbox.index]?.title }}</h3>
             <p class="text-[12px] font-mono opacity-60 tracking-widest mt-2 uppercase">{{ lightbox.works[lightbox.index]?.description }}</p>
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 300);
};

const switchToAllWorks = () => {
  isTransitioning.value = true;
  setTimeout(() => {
    currentView.value = 'all';
    currentPortfolioId.value = null;
    isTransitioning.value = false;
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

onUnmounted(() => stopUpdateLoop());

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
</style>