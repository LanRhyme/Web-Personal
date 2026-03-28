<template>
  <div class="page-content flex flex-col items-center w-full anim-fade-in-up">
    <section class="text-center mb-12" id="works-intro" v-show="currentView === 'all'">
      <h2 class="text-4xl md:text-5xl font-extrabold mb-4 relative inline-block">
        我的作品
        <button 
          @click="open3DView" 
          class="absolute -right-16 top-1 text-[10px] font-bold tracking-wider bg-amethyst/10 border border-amethyst/30 text-amethyst hover:bg-amethyst hover:text-white px-3 py-1 rounded-full transform rotate-12 hover:rotate-0 hover:scale-110 transition-all shadow-sm hover:shadow-[0_0_15px_var(--amethyst-color)] cursor-pointer backdrop-blur-sm"
          title="Enter 3D Gallery"
        >
          3D VIEW
        </button>
      </h2>
      <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        光与影的交织，色彩与情感的碰撞，这里是我想象力的乐园
      </p>
    </section>

    <div class="text-center mb-6" v-show="currentView === 'portfolio'">
      <button @click="switchToAllWorks" class="back-button bg-[rgb(var(--jelly-green-rgb))] text-black shadow-[0_0_15px_rgba(var(--jelly-green-rgb),0.4)] hover:shadow-[0_0_25px_rgba(var(--jelly-green-rgb),0.8)] inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all hover:-translate-y-1">
        <i class="fas fa-arrow-left"></i> 返回所有作品
      </button>
      <h3 class="section-title text-3xl font-bold mt-6 mb-8 drop-shadow-[0_0_15px_rgba(var(--jelly-green-rgb),0.3)]">{{ currentPortfolioTitle }}</h3>
    </div>

    <div class="gallery-transition-container w-full max-w-[1400px]" :class="{ 'fade-out-content': isTransitioning }">
      
      <!-- Portfolios Section (only in 'all' view) -->
      <div v-if="currentView === 'all' && allPortfolios.length > 0" class="mb-12">
        <h3 class="section-title text-3xl font-bold text-center mb-8">作品集</h3>
        <div class="gallery-grid">
          <div 
            v-for="portfolio in allPortfolios" 
            :key="portfolio.id" 
            class="jelly-glass work-item portfolio-item mb-6 break-inside-avoid relative overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 drop-shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:drop-shadow-[0_20px_40px_rgba(var(--jelly-green-rgb),0.15)] group"
            @click="switchToPortfolio(portfolio)"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-[rgba(var(--jelly-green-rgb),0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
            <img :src="getImageUrl(portfolio.thumbnail)" :alt="portfolio.title" loading="lazy" class="w-full h-auto block relative z-0 transition-transform duration-700 group-hover:scale-105">
            <div class="portfolio-info p-5 border-t border-white/5 bg-black/10 backdrop-blur-md relative z-10">
              <div class="title font-bold text-lg mb-1 group-hover:text-[rgb(var(--jelly-green-rgb))] transition-colors">{{ portfolio.title }}</div>
              <div class="description text-sm text-gray-600 dark:text-gray-400">{{ portfolio.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Individual Works Section (or Portfolio Works) -->
      <div v-if="displayedWorks.length > 0">
        <h3 v-if="currentView === 'all'" class="section-title text-3xl font-bold text-center mb-8">作品</h3>
        <div class="gallery-grid">
          <div 
            v-for="(work, index) in displayedWorks" 
            :key="work.id" 
            class="work-item individual-work-item mb-6 break-inside-avoid relative overflow-hidden jelly-glass cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:drop-shadow-[0_20px_40px_rgba(var(--jelly-green-rgb),0.2)] group"
            @click="openLightbox(index)"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-[rgba(var(--jelly-green-rgb),0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
            <img :src="getImageUrl(work.image)" :alt="work.title" loading="lazy" class="w-full h-auto block relative z-0 transition-transform duration-700 group-hover:scale-105">
            <div class="overlay absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 pt-12 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 relative z-10">
              <div class="title font-bold text-lg mb-1 text-[rgb(var(--jelly-green-rgb))] drop-shadow-[0_0_8px_rgba(var(--jelly-green-rgb),0.8)]">{{ work.title }}</div>
              <div class="description text-sm opacity-90 font-medium">{{ work.description }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="currentView === 'portfolio'" class="text-center py-12">
        <p class="text-lg text-gray-500 dark:text-gray-400">此作品集暂无作品。</p>
      </div>

    </div>

    <!-- 3D Gallery View -->
    <Teleport to="body">
      <div 
        v-if="is3DViewOpen"
        class="fixed inset-0 z-[10001] bg-[#050505] perspective-container overflow-hidden select-none"
        @mousedown="handle3DMouseDown"
        @mousemove="handle3DMouseMove"
        @mouseup="handle3DMouseUp"
        @mouseleave="handle3DMouseUp"
        @touchstart="handle3DMouseDown"
        @touchmove="handle3DMouseMove"
        @touchend="handle3DMouseUp"
      >
        <!-- Background Effects -->
        <div class="absolute inset-0 bg-gradient-radial from-[#1a0b2e] via-[#050505] to-black pointer-events-none opacity-80"></div>
        <div class="stars-bg absolute inset-0 pointer-events-none"></div>

        <!-- Controls -->
        <button 
          @click="close3DView" 
          class="absolute top-6 right-8 z-50 text-white/50 hover:text-white hover:scale-110 text-5xl transition-all cursor-pointer"
        >
          &times;
        </button>
        
        <div class="absolute top-8 left-8 z-50 pointer-events-none">
          <p class="text-sm uppercase tracking-[0.2em] font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">3D Gallery</p>
          <p class="text-[10px] mt-1 opacity-70 text-white">Drag to rotate • Click to view</p>
        </div>

        <!-- Layout Switcher -->
         <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 overflow-x-auto max-w-[90vw]">
            <button 
             v-for="layout in ['helix', 'sphere', 'grid', 'cylinder', 'tunnel', 'scatter']" 
             :key="layout"
             @click.stop="set3DLayout(layout as LayoutType)"
             class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap"
             :class="currentLayout === layout ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-white/60 hover:text-white hover:bg-white/10'"
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
                <div class="relative h-[250px] md:h-[350px] w-auto rounded-xl overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:scale-105 group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] bg-gray-900/50 backface-hidden flex justify-center items-center backdrop-blur-sm">
                  <img :src="getImageUrl(work.image)" class="h-full w-auto max-w-[500px] object-contain" />
                  <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 pointer-events-none"></div>
                  <div class="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                    <h3 class="text-white font-bold truncate text-sm">{{ work.title }}</h3>
                  </div>
                </div>
                <!-- Reflection (Only for cylinder/helix maybe? Keep for now, looks cool) -->
                <div v-if="['cylinder', 'helix', 'grid'].includes(currentLayout)" class="absolute top-full left-0 w-full h-full transform scale-y-[-1] opacity-30 mask-gradient pointer-events-none mt-2 transition-opacity duration-500">
                   <img :src="getImageUrl(work.image)" class="w-full h-full object-cover rounded-xl blur-[1px]" />
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
        class="fixed inset-0 z-[10000] flex justify-center items-center bg-black/85 backdrop-blur-sm transition-opacity duration-300"
        :class="{ 'opacity-100 visible': lightbox.visible, 'opacity-0 invisible': !lightbox.visible }"
        @click.self="closeLightbox"
      >
        <button class="lightbox-btn absolute top-5 right-5 text-white/70 hover:text-white hover:scale-110 text-4xl p-4 transition-all" @click="closeLightbox">
          <i class="fas fa-times"></i>
        </button>
        <button class="lightbox-btn absolute top-1/2 left-5 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 text-4xl p-4 transition-all" @click="prevImage">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="lightbox-btn absolute top-1/2 right-5 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 text-4xl p-4 transition-all" @click="nextImage">
          <i class="fas fa-chevron-right"></i>
        </button>
        
        <img 
          :src="lightbox.image" 
          alt="Enlarged work" 
          class="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 select-none"
          :class="{ 'scale-100': lightbox.visible, 'scale-95': !lightbox.visible }"
          @click.stop
        >
      </div>
    </Teleport>

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

// Create a map for quick lookup
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
  }, 300); // Match transition duration
};

const switchToAllWorks = () => {
  isTransitioning.value = true;
  setTimeout(() => {
    currentView.value = 'all';
    currentPortfolioId.value = null;
    isTransitioning.value = false;
  }, 300);
};

// 3D Gallery Logic
const is3DViewOpen = ref(false);
const rotationY = ref(0);
const rotationX = ref(0);
const sceneTranslateZ = ref(-1000); // Base distance
const sceneTranslateX = ref(0);
const sceneTranslateY = ref(0);

const isDragging = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);
const autoRotateId = ref<number | null>(null);

// Focus Mode State
const focusedIndex = ref<number | null>(null);
const targetRotationY = ref(0);
const targetRotationX = ref(0);
const targetRotationZ = ref(0); // Added for Tunnel
const targetTranslateZ = ref(-1000);
const targetTranslateX = ref(0);
const targetTranslateY = ref(0);

// Helper for deterministic random
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type LayoutType = 'cylinder' | 'helix' | 'sphere' | 'grid' | 'tunnel' | 'scatter';
const currentLayout = ref<LayoutType>('helix'); // Default to Helix

// Layout Calculation
const getLayoutTransform = (index: number, total: number) => {
  const t = currentLayout.value;
  
  if (t === 'cylinder') {
    const angleStep = 360 / Math.max(1, total);
    const radius = Math.max(800, (total * 400) / (2 * Math.PI));
    return `translate(-50%, -50%) rotateY(${index * angleStep}deg) translateZ(${radius}px)`;
  }
  
  if (t === 'helix') {
    const angleStep = 30; // 30 degrees per item
    const radius = 900;
    const verticalStep = 30; // 30px height per item
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
    
    // Add a slight curve
    const x = startX + col * spacingX;
    const curve = Math.abs(col - cols/2) * 200; // Curve backward
    
    return `translate(-50%, -50%) translateX(${x}px) translateY(${startY + row * spacingY}px) translateZ(${-curve}px)`;
  }

  if (t === 'tunnel') {
    const spacingZ = 400;
    const angleStep = 30;
    const z = -index * spacingZ + 1000; // Start closer, go deeper
    const rotation = index * angleStep;
    return `translate(-50%, -50%) translateZ(${z}px) rotateZ(${rotation}deg) translateX(500px) rotateY(-90deg)`;
  }

  if (t === 'scatter') {
    // Deterministic random positions within a cube
    const range = 2000;
    const x = (pseudoRandom(index) - 0.5) * range;
    const y = (pseudoRandom(index + 100) - 0.5) * range;
    const z = (pseudoRandom(index + 200) - 0.5) * range;
    
    // Random rotation too
    const rotX = (pseudoRandom(index + 300) - 0.5) * 60;
    const rotY = (pseudoRandom(index + 400) - 0.5) * 60;
    
    // Changed order to rotateY then rotateX to match inverse logic in focus
    return `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
  }
  
  return '';
};

const open3DView = () => {
  is3DViewOpen.value = true;
  document.body.style.overflow = 'hidden';
  // Reset targets
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
  // Reset view
  rotationY.value = 0;
  rotationX.value = 0;
  focusedIndex.value = null;
};

const set3DLayout = (layout: LayoutType) => {
  currentLayout.value = layout;
  focusedIndex.value = null;
  // Reset rotation for better initial view on switch
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
      // In Focus Mode
      rotationY.value = lerp(rotationY.value, targetRotationY.value, smoothFactor);
      rotationX.value = lerp(rotationX.value, targetRotationX.value, smoothFactor);
      sceneRotationZ.value = lerp(sceneRotationZ.value, targetRotationZ.value, smoothFactor);
      sceneTranslateZ.value = lerp(sceneTranslateZ.value, targetTranslateZ.value, smoothFactor);
      sceneTranslateX.value = lerp(sceneTranslateX.value, targetTranslateX.value, smoothFactor);
      sceneTranslateY.value = lerp(sceneTranslateY.value, targetTranslateY.value, smoothFactor);
    } else {
      // Free Mode
      sceneTranslateZ.value = lerp(sceneTranslateZ.value, -1000, smoothFactor);
      sceneTranslateX.value = lerp(sceneTranslateX.value, 0, smoothFactor);
      sceneTranslateY.value = lerp(sceneTranslateY.value, 0, smoothFactor);
      sceneRotationZ.value = lerp(sceneRotationZ.value, 0, smoothFactor); // Reset Z rotation
      
      // Auto rotate
      if (!isDragging.value && currentLayout.value !== 'grid' && currentLayout.value !== 'tunnel') {
        rotationY.value -= 0.1;
      }
      if (!isDragging.value && currentLayout.value === 'tunnel') {
         rotationY.value -= 0.1; // Rotate tunnel
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
  if (!isClickValid.value) return; // Ignore if it was a drag
  
  if (focusedIndex.value === index) {
     resetFocus();
     return;
  }
  
  focusedIndex.value = index;
  const total = allIndividualWorks.value.length;
  
  // Reset Z rotation default
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
     
     // Correct math for Tunnel focus
     targetRotationZ.value = -rotation;
     targetRotationY.value = 90;
     targetRotationX.value = 0;
     
     // After Rz(-rot) and Ry(90), item is at (z, 0, -500)
     // We want it at (0, 0, -200)
     targetTranslateX.value = -z;
     targetTranslateY.value = 0;
     targetTranslateZ.value = 300; // -200 - (-500) = 300
  }
  else if (currentLayout.value === 'scatter') {
    const range = 2000;
    const x = (pseudoRandom(index) - 0.5) * range;
    const y = (pseudoRandom(index + 100) - 0.5) * range;
    const z = (pseudoRandom(index + 200) - 0.5) * range;
    
    // Reverse translation
    targetTranslateX.value = -x;
    targetTranslateY.value = -y;
    targetTranslateZ.value = -200 - z;
    
    // Reverse rotation
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
     clientX = e.clientX;
     clientY = e.clientY;
  } else {
     return;
  }
  
  lastMouseX.value = clientX;
  lastMouseY.value = clientY;
  clickStartX.value = clientX;
  clickStartY.value = clientY;
};

const handle3DMouseMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  
  let clientX = 0;
  let clientY = 0;

  if ('touches' in e) {
      if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          return;
      }
  } else {
      clientX = e.clientX;
      clientY = e.clientY;
  }
  
  // Check drag distance to determine if it's a click or drag
  const moveX = clientX - clickStartX.value;
  const moveY = clientY - clickStartY.value;
  if (Math.sqrt(moveX*moveX + moveY*moveY) > 5) {
      isClickValid.value = false;
      
      // If significant drag happens, break focus
      if (focusedIndex.value !== null) {
          focusedIndex.value = null;
      }
  }
  
  const deltaX = clientX - lastMouseX.value;
  const deltaY = clientY - lastMouseY.value;
  
  rotationY.value += deltaX * 0.3; 
  rotationX.value -= deltaY * 0.3; 
  
  rotationX.value = Math.max(-60, Math.min(60, rotationX.value));
  
  lastMouseX.value = clientX;
  lastMouseY.value = clientY;
};

const handle3DMouseUp = () => {
  isDragging.value = false;
};

const resetFocus = () => {
    // Only reset focus if it was a valid click (not a drag end)
    if (isClickValid.value) {
        focusedIndex.value = null;
    }
};

onUnmounted(() => {
  stopUpdateLoop();
});

// Lightbox Logic
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

// Keyboard navigation for lightbox
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
.bg-amethyst {
  background-color: var(--amethyst-color);
}
.hover\:bg-amethyst-hover:hover {
  background-color: var(--amethyst-color-hover);
}

/* Masonry Grid Layout */
.gallery-grid {
  column-count: 5;
  column-gap: 1.5rem;
}

@media (max-width: 1400px) {
  .gallery-grid {
    column-count: 4;
  }
}

@media (max-width: 1024px) {
  .gallery-grid {
    column-count: 3;
  }
}

@media (max-width: 768px) {
  .gallery-grid {
    column-count: 2;
  }
}

@media (max-width: 640px) {
  .gallery-grid {
    column-count: 2;
  }
}

@media (max-width: 500px) {
  .gallery-grid {
    column-count: 2; /* Keep 2 columns for very small screens if possible, or 1 if content is too wide */
  }
}

.gallery-transition-container {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s ease-in-out, visibility 0s 0s;
}

.gallery-transition-container.fade-out-content {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease-in-out, visibility 0s 0.3s;
}

.anim-fade-in-up {
  animation: fadeInUp 0.7s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 3D Gallery Styles */
.perspective-container {
  perspective: 2000px;
  perspective-origin: 50% 50%;
}

.scene-3d {
  transform-style: preserve-3d;
  /* transition: transform 0.1s linear; Remove transition for direct mapping */
}

.cylinder-container {
  position: relative;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
}

.preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.mask-gradient {
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
}

.stars-bg {
  background-image: 
    radial-gradient(1px 1px at 10% 10%, white 1px, transparent 0),
    radial-gradient(1px 1px at 20% 20%, white 1px, transparent 0),
    radial-gradient(2px 2px at 30% 30%, white 1px, transparent 0),
    radial-gradient(1px 1px at 40% 40%, white 1px, transparent 0),
    radial-gradient(1px 1px at 50% 50%, white 1px, transparent 0),
    radial-gradient(2px 2px at 60% 60%, white 1px, transparent 0),
    radial-gradient(1px 1px at 70% 70%, white 1px, transparent 0),
    radial-gradient(1px 1px at 80% 80%, white 1px, transparent 0),
    radial-gradient(1px 1px at 90% 90%, white 1px, transparent 0);
  background-size: 550px 550px;
  opacity: 0.3;
}
</style>