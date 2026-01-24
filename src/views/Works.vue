<template>
  <div class="page-content flex flex-col items-center w-full anim-fade-in-up">
    <section class="text-center mb-12" id="works-intro" v-show="currentView === 'all'">
      <h2 class="text-4xl md:text-5xl font-extrabold mb-4">我的作品</h2>
      <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        光与影的交织，色彩与情感的碰撞，这里是我想象力的乐园
      </p>
    </section>

    <div class="text-center mb-6" v-show="currentView === 'portfolio'">
      <button @click="switchToAllWorks" class="back-button inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amethyst text-white font-semibold transition-all hover:bg-amethyst-hover hover:-translate-y-0.5 shadow-md">
        <i class="fas fa-arrow-left"></i> 返回所有作品
      </button>
      <h3 class="section-title text-3xl font-bold mt-4 mb-8">{{ currentPortfolioTitle }}</h3>
    </div>

    <div class="gallery-transition-container w-full max-w-[1400px]" :class="{ 'fade-out-content': isTransitioning }">
      
      <!-- Portfolios Section (only in 'all' view) -->
      <div v-if="currentView === 'all' && allPortfolios.length > 0" class="mb-12">
        <h3 class="section-title text-3xl font-bold text-center mb-8">作品集</h3>
        <div class="gallery-grid">
          <div 
            v-for="portfolio in allPortfolios" 
            :key="portfolio.id" 
            class="work-item portfolio-item mb-6 break-inside-avoid relative overflow-hidden rounded-2xl bg-card-border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            @click="switchToPortfolio(portfolio)"
          >
            <img :src="getImageUrl(portfolio.thumbnail)" :alt="portfolio.title" loading="lazy" class="w-full h-auto block rounded-t-2xl">
            <div class="portfolio-info bg-card-bg p-4 border-t border-card-border rounded-b-2xl">
              <div class="title font-bold text-lg mb-1">{{ portfolio.title }}</div>
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
            class="work-item individual-work-item mb-6 break-inside-avoid relative overflow-hidden rounded-2xl bg-card-border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group"
            @click="openLightbox(index)"
          >
            <img :src="getImageUrl(work.image)" :alt="work.title" loading="lazy" class="w-full h-auto block rounded-2xl">
            <div class="overlay absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-b-2xl">
              <div class="title font-bold text-lg mb-1">{{ work.title }}</div>
              <div class="description text-sm opacity-90">{{ work.description }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="currentView === 'portfolio'" class="text-center py-12">
        <p class="text-lg text-gray-500 dark:text-gray-400">此作品集暂无作品。</p>
      </div>

    </div>

    <!-- Lightbox -->
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
        class="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
        :class="{ 'scale-100': lightbox.visible, 'scale-95': !lightbox.visible }"
      >
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
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

// Lightbox Logic
const lightbox = reactive({
  visible: false,
  image: '',
  index: 0
});

const openLightbox = (index: number) => {
  lightbox.index = index;
  const work = displayedWorks.value[index];
  lightbox.image = work ? getImageUrl(work.image) : '';
  lightbox.visible = true;
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  lightbox.visible = false;
  document.body.style.overflow = '';
};

const prevImage = () => {
  const works = displayedWorks.value;
  lightbox.index = (lightbox.index > 0) ? lightbox.index - 1 : works.length - 1;
  const work = works[lightbox.index];
  lightbox.image = work ? getImageUrl(work.image) : '';
};

const nextImage = () => {
  const works = displayedWorks.value;
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
</style>