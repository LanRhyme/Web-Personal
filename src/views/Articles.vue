<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';

interface Article {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  tags: string[];
  cover?: string;
  category?: string;
  hidden?: boolean;
}

const articles = ref<Article[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const router = useRouter();

const groupedArticles = computed(() => {
  const sorted = [...articles.value].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });
  const groups: Record<string, Article[]> = {};

  sorted.forEach(article => {
    const year = article.date ? new Date(article.date).getFullYear().toString() : 'Unknown';
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(article);
  });

  return {
    groups,
    years: Object.keys(groups).sort((a, b) => b.localeCompare(a))
  };
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return '0000-00-00';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'UNKNOWN-DATE';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getImageUrl = (path: string, slug?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/blogs/')) return path;
  if (slug) return `/blogs/${slug}/${path}`;
  return path.startsWith('/') ? path : '/' + path;
};

const viewArticle = (slug: string) => {
  router.push(`/article/${slug}`);
};

onMounted(async () => {
  try {
    const res = await fetch('/blogs/index.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      articles.value = Array.isArray(data) ? data : [];
    } else {
      articles.value = [];
    }
  } catch (e) {
    error.value = '加载文章失败';
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="w-full transition-colors duration-500 font-sans">
    <div class="page-container py-8 md:py-12 px-4 md:px-8 lg:px-12 max-w-[1200px] mx-auto">
      <div class="border-b border-[var(--color-border)] pb-4 mb-8 relative">
        <div class="absolute -top-6 -left-4 font-art text-[80px] leading-none opacity-5 text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap overflow-hidden">BLOG</div>
        <h2 class="text-3xl font-art tracking-widest text-[var(--color-text)] uppercase">> BLOG_LOGS</h2>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="w-12 h-12 border-2 border-t-[var(--color-brand)] border-r-[var(--color-brand)] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div class="text-[var(--color-brand)] font-mono text-sm tracking-widest animate-pulse">LOADING_DATA...</div>
      </div>

      <div v-else-if="error" class="cyber-glass text-center py-20 text-red-400 font-mono flex flex-col items-center gap-4">
        <i class="fas fa-exclamation-triangle text-3xl"></i>
        <span>{{ error }}</span>
      </div>

      <div v-else-if="articles.length === 0" class="cyber-glass text-center py-32 flex flex-col items-center gap-4">
        <div class="w-20 h-20 border border-dashed border-[var(--color-text)] flex items-center justify-center rounded bg-[var(--color-text)]/5">
          <i class="fas fa-feather text-[var(--color-text-dim)] text-2xl opacity-60"></i>
        </div>
        <p class="text-sm font-mono text-[var(--color-text-dim)] tracking-widest">暂无文章 // NO_RECORDS</p>
      </div>

      <div v-else class="space-y-16">
        <div v-for="year in groupedArticles.years" :key="year" class="font-mono animate-[fadeIn_0.5s_ease-out_forwards]">
          <div class="flex items-center gap-4 border-b border-[var(--color-border)] pb-3 mb-6 opacity-80 text-[13px] uppercase tracking-widest text-[var(--color-brand)]">
            <span class="font-bold">> ARCHIVE_YEAR: {{ year }}</span>
            <div class="flex-grow h-[1px] bg-[var(--color-border)] opacity-50 relative">
               <div class="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-[var(--color-brand)] to-transparent opacity-30"></div>
            </div>
            <span class="border border-[var(--color-brand)] bg-[var(--color-brand)]/10 px-3 py-1 font-bold shadow-[0_0_10px_rgba(107,143,114,0.1)]">VOL: {{ groupedArticles.groups[year].length }}</span>
          </div>

          <div class="flex flex-col gap-4">
            <div
              v-for="article in groupedArticles.groups[year]"
              :key="article.slug"
              @click="viewArticle(article.slug)"
              class="cyber-glass group overflow-hidden flex flex-col md:flex-row md:items-center justify-between !p-0 cursor-pointer border border-[var(--color-border)] hover:border-[var(--color-brand)] transition-all duration-300"
            >
              <div class="flex items-center w-full">
                <!-- Status/Date indicator -->
                <div class="w-24 md:w-32 flex-shrink-0 flex flex-col items-center justify-center bg-[var(--color-bg)] self-stretch border-r border-[var(--color-border)] group-hover:bg-[var(--color-brand)]/10 transition-colors">
                  <span class="text-[10px] md:text-[11px] font-mono opacity-70 group-hover:text-[var(--color-brand)] group-hover:opacity-100 mt-2">{{ formatDate(article.date) }}</span>
                </div>
                
                <!-- Title -->
                <div class="flex-grow px-4 md:px-6 py-4 md:py-5">
                  <h3 class="text-base md:text-xl tracking-wide font-art text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors mb-2">
                    > {{ article.title }}
                  </h3>
                  <div class="flex gap-2 flex-wrap">
                    <span
                      v-for="tag in (article.tags || []).slice(0,3)"
                      :key="tag"
                      class="text-[9px] md:text-[10px] uppercase border border-[var(--color-border)] px-1.5 py-0.5 text-[var(--color-text-dim)] bg-[var(--color-bg)] group-hover:border-[var(--color-brand)]/50 group-hover:text-[var(--color-text)] transition-colors"
                    >
                      #{{ tag }}
                    </span>
                    <span v-if="(article.tags || []).length > 3" class="text-[9px] md:text-[10px] uppercase border border-[var(--color-border)] px-1.5 py-0.5 text-[var(--color-text-dim)] bg-[var(--color-bg)]">...</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="px-6 hidden md:flex items-center self-stretch border-l border-[var(--color-border)]/50 bg-[var(--color-bg)]/50 group-hover:bg-[var(--color-brand)]/5 transition-colors">
                  <span class="text-[11px] font-mono uppercase text-[var(--color-text-dim)] group-hover:text-[var(--color-brand)] transition-colors tracking-widest whitespace-nowrap">
                    [ READ.EXE ]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>