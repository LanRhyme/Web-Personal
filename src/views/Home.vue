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

const items: PinnedItem[] = pinnedItems;
const latestProject = computed(() => projectsData[0] || null);

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
</script>

<template>
  <div class="page-container py-12">
    <!-- Main Content Grid: This replaces the absolute positioning to prevent overlapping -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      
      <!-- Left Column (3/12) -->
      <div class="lg:col-span-3 flex flex-col gap-6 anim-fade-in-up" style="animation-delay: 0.1s">
        <div class="card p-6 flex flex-col group cursor-pointer" @click="$router.push('/projects')">
           <img v-if="latestProject" :src="getImageUrl(latestProject.image)" class="absolute inset-0 w-full h-full object-cover opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none" />
           <p class="text-[10px] font-bold text-[#35bfa0] uppercase tracking-widest mb-3">Latest</p>
           <h3 class="text-lg font-bold text-[var(--color-primary)] mb-2 leading-tight">{{ latestProject?.title }}</h3>
           <p class="text-xs text-[var(--color-secondary)] line-clamp-2">{{ latestProject?.description }}</p>
           <div class="mt-6 flex justify-between items-center">
              <span class="text-[10px] text-[#35bfa0] font-bold">查看详情 →</span>
           </div>
        </div>
        
        <div class="card p-8 group">
            <h2 class="text-3xl font-black text-[var(--color-primary)] leading-tight mb-4">
                Explore<br><span class="text-brand-gradient">With Me</span>
            </h2>
            <p class="text-[11px] text-[var(--color-secondary)] leading-relaxed mb-6 opacity-80">
                在这里发现我的绘画创意
            </p>
            <div class="flex flex-col gap-3">
                <router-link to="/works" class="btn-brand justify-center py-3 text-xs">全部作品</router-link>
            </div>
        </div>

        <!-- Game Card -->
        <router-link to="/games" class="card p-4 group cursor-pointer flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#35bfa0] to-[#1fc9a8] flex items-center justify-center shrink-0">
                <i class="fa-solid fa-gamepad text-white text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-[var(--color-primary)]">坐标挑战</h3>
                <p class="text-[10px] text-[var(--color-secondary)] truncate">测试你的坐标几何技能</p>
            </div>
            <i class="fa fa-chevron-right text-[10px] text-[#35bfa0] opacity-0 group-hover:opacity-100 transition-opacity"></i>
        </router-link>

        <QuoteCard />
      </div>

      <!-- Center Column (Identity & Main Focus) (6/12) -->
      <div class="lg:col-span-6 flex flex-col gap-6 lg:gap-8 anim-fade-in-up" style="animation-delay: 0.05s">
        <MeCard />
        
        <div class="card p-8">
            <div class="flex items-center justify-between mb-8">
                <h3 class="section-heading">作品集精选</h3>
                <router-link to="/projects" class="text-[10px] font-bold text-[var(--color-secondary)] hover:text-[#35bfa0] uppercase tracking-widest">Index →</router-link>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="(item, index) in items" 
                  :key="index" 
                  class="card-flat bg-white/40 dark:bg-white/5 hover:bg-[#35bfa0]/5 hover:border-[#35bfa0]/30 cursor-pointer !px-6 !py-5 group transition-all duration-300"
                  @click="openLink(item.link)"
                >
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-sm text-[var(--color-primary)] group-hover:text-[#35bfa0] transition-colors line-clamp-1">{{ item.title }}</h4>
                        <i class="fa fa-arrow-right text-[10px] text-[#35bfa0] opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0"></i>
                    </div>
                    <p class="text-[10px] text-[var(--color-secondary)] mt-2 leading-relaxed line-clamp-2">{{ item.description }}</p>
                </div>
            </div>
        </div>
      </div>

      <!-- Right Column (Widgets) (3/12) -->
      <div class="lg:col-span-3 flex flex-col gap-6 anim-fade-in-up" style="animation-delay: 0.15s">
        <ClockCard />
        <CalendarCard />
        
        <!-- Quick Status/Social -->
        <div class="card p-6 flex flex-col items-center gap-4">
             <div class="flex flex-col items-center text-center">
                <p class="text-[10px] font-bold text-[#35bfa0] uppercase tracking-widest mb-1">Status</p>
                <div class="flex items-center gap-2">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35bfa0] opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-[#35bfa0]"></span>
                    </span>
                    <span class="text-xs font-bold text-[var(--color-primary)]">Available for Hire</span>
                </div>
             </div>
        </div>
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
