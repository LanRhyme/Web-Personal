<script setup lang="ts">
import pinnedItems from '../data/pinned-items.json';
import projectsData from '../data/projects.json';
import ClockCard from '../components/ClockCard.vue';
import CalendarCard from '../components/CalendarCard.vue';
import MeCard from '../components/MeCard.vue';
import QuoteCard from '../components/QuoteCard.vue';
import { ref, onMounted, computed } from 'vue';

interface PinnedItem {
  title: string;
  description: string;
  link: string;
}

interface Article {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  tags: string[];
  cover?: string;
  hidden?: boolean;
}

const items: PinnedItem[] = pinnedItems;
const latestProject = computed(() => projectsData[0] || null);
const articles = ref<Article[]>([]);
const latestArticle = computed(() => {
  if (articles.value.length === 0) return null;
  return [...articles.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

const openLink = (link: string) => {
    if (link) {
        if (!link.startsWith('http')) link = 'https://' + link;
        window.open(link, '_blank');
    }
};

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : '/' + path;
};

const loadArticles = async () => {
  try {
    const res = await fetch('/blogs/index.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      articles.value = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('Failed to load articles:', e);
  }
};

onMounted(() => {
  loadArticles();
});
</script>

<template>
  <div class="page-container py-6 md:py-12">
    <!-- Main Content Grid: This replaces the absolute positioning to prevent overlapping -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-start">

      <!-- Mobile: MeCard First (Full Width) -->
      <div class="lg:hidden col-span-1 anim-fade-in-up" style="animation-delay: 0.05s">
        <MeCard />
      </div>

      <!-- Left Column (3/12) -->
      <div class="lg:col-span-3 flex flex-col gap-4 md:gap-6 anim-fade-in-up" style="animation-delay: 0.1s">
        <!-- Mobile: Explore Card (Compact) -->
        <div class="card p-4 md:p-6 lg:p-8 group order-1 lg:order-none">
            <h2 class="text-xl md:text-2xl lg:text-3xl font-black text-[var(--color-primary)] leading-tight mb-2 md:mb-4">
                Explore<span class="text-brand-gradient lg:hidden"> With Me</span><br class="hidden lg:block"><span class="hidden lg:inline text-brand-gradient">With Me</span>
            </h2>
            <p class="text-[10px] md:text-[11px] text-[var(--color-secondary)] leading-relaxed mb-4 md:mb-6 opacity-80">
                在这里发现我的绘画创意
            </p>
            <div class="flex flex-col gap-3">
                <router-link to="/works" class="btn-brand justify-center py-2.5 md:py-3 text-xs">全部作品</router-link>
            </div>
        </div>

        <!-- Latest Project Card -->
        <div class="card p-4 md:p-6 flex flex-col group cursor-pointer order-2 lg:order-none" @click="$router.push('/projects')">
           <img v-if="latestProject" :src="getImageUrl(latestProject.image)" class="absolute inset-0 w-full h-full object-cover opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none" />
           <p class="text-[10px] font-bold text-[var(--color-brand)] uppercase tracking-widest mb-2 md:mb-3">Latest</p>
           <h3 class="text-base md:text-lg font-bold text-[var(--color-primary)] mb-1.5 md:mb-2 leading-tight">{{ latestProject?.title }}</h3>
           <p class="text-[10px] md:text-xs text-[var(--color-secondary)] line-clamp-2">{{ latestProject?.description }}</p>
           <div class="mt-4 md:mt-6 flex justify-between items-center">
              <span class="text-[10px] text-[var(--color-brand)] font-bold">查看详情 →</span>
           </div>
        </div>

        <QuoteCard class="order-5 lg:order-none" />

        <!-- Game Card -->
        <router-link to="/games" class="card !p-3 md:!p-4 group cursor-pointer block order-6 lg:order-none hover:border-[var(--color-brand)]/30 transition-all duration-300">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <i class="fa-solid fa-gamepad text-[var(--color-brand)] text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-xs font-bold text-[var(--color-primary)] truncate">小游戏</h3>
                    <p class="text-[10px] text-[var(--color-secondary)] opacity-70 truncate">放松一下</p>
                </div>
                <i class="fa fa-chevron-right text-[10px] text-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-all"></i>
            </div>
        </router-link>
      </div>

      <!-- Center Column (Identity & Main Focus) (6/12) -->
      <div class="hidden lg:flex lg:col-span-6 flex-col gap-6 lg:gap-8 anim-fade-in-up" style="animation-delay: 0.05s">
        <MeCard />

        <div class="card p-6 md:p-8">
            <div class="flex items-center justify-between mb-6 md:mb-8">
                <h3 class="section-heading text-base md:text-lg">推荐内容</h3>
                <router-link to="/projects" class="text-[10px] font-bold text-[var(--color-secondary)] hover:text-[var(--color-brand)] uppercase tracking-widest">Index →</router-link>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div
                  v-for="(item, index) in items"
                  :key="index"
                  class="card-flat bg-white/40 dark:bg-white/5 hover:bg-[var(--color-brand)]/5 hover:border-[var(--color-brand)]/30 cursor-pointer !px-4 md:!px-6 !py-4 md:!py-5 group transition-all duration-300"
                  @click="openLink(item.link)"
                >
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-xs md:text-sm text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors line-clamp-1">{{ item.title }}</h4>
                        <i class="fa fa-arrow-right text-[10px] text-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0"></i>
                    </div>
                    <p class="text-[10px] text-[var(--color-secondary)] mt-2 leading-relaxed line-clamp-2">{{ item.description }}</p>
                </div>
            </div>
        </div>
      </div>

      <!-- Mobile: Projects Grid (Full Width) -->
      <div class="lg:hidden col-span-1 anim-fade-in-up" style="animation-delay: 0.1s">
        <div class="card p-4 md:p-6">
            <div class="flex items-center justify-between mb-4 md:mb-6">
                <h3 class="section-heading text-sm md:text-base">推荐内容</h3>
                <router-link to="/projects" class="text-[10px] font-bold text-[var(--color-secondary)] hover:text-[var(--color-brand)] uppercase tracking-widest">Index →</router-link>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="(item, index) in items"
                  :key="index"
                  class="card-flat bg-white/40 dark:bg-white/5 hover:bg-[var(--color-brand)]/5 hover:border-[var(--color-brand)]/30 cursor-pointer !p-4 group transition-all duration-300"
                  @click="openLink(item.link)"
                >
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-xs text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors line-clamp-1">{{ item.title }}</h4>
                        <i class="fa fa-arrow-right text-[10px] text-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0"></i>
                    </div>
                    <p class="text-[10px] text-[var(--color-secondary)] mt-1.5 leading-relaxed line-clamp-2">{{ item.description }}</p>
                </div>
            </div>
        </div>
      </div>

      <!-- Right Column (Widgets) (3/12) -->
      <div class="lg:col-span-3 flex flex-col gap-4 md:gap-6 anim-fade-in-up" style="animation-delay: 0.15s">
        <ClockCard />
        <CalendarCard />

        <!-- Quick Status/Social -->
        <div class="card p-4 md:p-6 flex flex-col items-center gap-3 md:gap-4">
             <div class="flex flex-col items-center text-center">
                <p class="text-[10px] font-bold text-[var(--color-brand)] uppercase tracking-widest mb-1">Status</p>
                <div class="flex items-center gap-2">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand)] opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-brand)]"></span>
                    </span>
                    <span class="text-xs font-bold text-[var(--color-primary)]">Available for Hire</span>
                </div>
             </div>
        </div>

        <!-- Latest Article Card -->
        <router-link v-if="latestArticle" :to="'/article/' + latestArticle.slug" class="card p-4 md:p-6 group cursor-pointer block hover:border-[var(--color-brand)]/30 transition-all duration-300">
            <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <i class="fa-solid fa-feather-alt text-[var(--color-brand)] text-sm"></i>
                </div>
                <p class="text-[10px] font-bold text-[var(--color-brand)] uppercase tracking-widest">最新文章</p>
            </div>
            <h4 class="text-sm font-bold text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors line-clamp-2 mb-2">{{ latestArticle.title }}</h4>
            <p v-if="latestArticle.summary" class="text-[10px] text-[var(--color-secondary)] line-clamp-2 mb-2">{{ latestArticle.summary }}</p>
            <div class="flex items-center gap-2 flex-wrap">
                <span v-for="tag in latestArticle.tags.slice(0, 3)" :key="tag" class="text-[9px] font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded-full uppercase">#{{ tag }}</span>
            </div>
        </router-link>
        <router-link v-else to="/articles" class="card p-4 md:p-6 group cursor-pointer block hover:border-[var(--color-brand)]/30 transition-all duration-300">
            <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-lg bg-[var(--color-brand)]/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <i class="fa-solid fa-feather-alt text-[var(--color-brand)] text-sm"></i>
                </div>
                <p class="text-[10px] font-bold text-[var(--color-brand)] uppercase tracking-widest">文章</p>
            </div>
            <h4 class="text-sm font-bold text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors">暂无文章</h4>
        </router-link>
      </div>

    </div>
  </div>
</template>

<style scoped>
.page-container {
    max-width: 1400px;
    margin: 0 auto;
}
</style>
