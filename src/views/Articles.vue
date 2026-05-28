<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
  const sorted = [...articles.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const groups: Record<string, Article[]> = {};

  sorted.forEach(article => {
    const year = new Date(article.date).getFullYear().toString();
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
  const date = new Date(dateStr);
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
  <div class="min-h-screen w-full bg-[var(--color-bg)] transition-colors duration-500 font-sans">
    <div class="page-container py-8 md:py-12 px-4 md:px-8 lg:px-12">
      <div class="mb-10">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 border-2 border-[var(--color-text)] flex items-center justify-center bg-[var(--color-brand)] text-[var(--color-bg)]">
            <i class="fas fa-feather-alt text-lg"></i>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-[var(--color-primary)] tracking-tight font-sans">> BLOG_LOGS</h1>
        </div>
        <p class="text-[var(--color-secondary)] text-xs md:text-sm font-sans">我的文章与笔记 // DATABASE JOURNAL ARCHIVE</p>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="cursor-blink"></div>
      </div>

      <div v-else-if="error" class="text-center py-20 text-red-500 font-mono">
        {{ error }}
      </div>

      <div v-else-if="articles.length === 0" class="text-center py-20">
        <div class="w-16 h-16 border-2 border-dashed border-[var(--color-text)] flex items-center justify-center mx-auto mb-4 rounded">
          <i class="fas fa-feather text-[var(--color-secondary)] text-xl opacity-40"></i>
        </div>
        <p class="text-xs text-[var(--color-secondary)]">暂无文章 // NO_RECORDS</p>
      </div>

      <div v-else class="space-y-10">
        <div v-for="year in groupedArticles.years" :key="year" class="animate-fade-in-up">
          <h2 class="text-2xl font-black text-[var(--color-primary)] mb-6 flex items-center gap-3 font-sans border-b border-[var(--color-text)] pb-2">
            <span>> YEAR_{{ year }}</span>
            <span class="text-[9px] font-bold border border-[var(--color-text)] px-2 py-0.5 uppercase bg-[var(--color-card)]">
              {{ groupedArticles.groups[year].length }} LOGS
            </span>
          </h2>

          <div class="space-y-4">
            <div
              v-for="article in groupedArticles.groups[year]"
              :key="article.slug"
              @click="viewArticle(article.slug)"
              class="premium-card !p-5 md:!p-6 cursor-pointer hover:bg-[var(--color-brand)]/5 group"
            >
              <div class="flex flex-col md:flex-row gap-4 md:gap-6">
                <div v-if="article.cover" class="w-full md:w-32 h-32 flex-shrink-0 border-2 border-[var(--color-text)] overflow-hidden bg-[var(--color-bg)] rounded">
                  <img :src="getImageUrl(article.cover, article.slug)" class="w-full h-full object-cover pixelated" @error="($event.target as HTMLImageElement).style.display='none'" />
                </div>
                <div class="flex-grow min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <h3 class="text-base md:text-lg font-bold text-[var(--color-brand)] group-hover:text-[var(--color-text)] transition-colors truncate font-sans">
                      > {{ article.title }}
                    </h3>
                    <span class="text-[10px] text-[var(--color-text-dim)] font-mono flex-shrink-0">
                      [{{ formatDate(article.date) }}]
                    </span>
                  </div>
                  <p v-if="article.summary" class="text-xs text-[var(--color-text)] mb-3 leading-relaxed font-sans font-medium">
                    {{ article.summary }}
                  </p>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      v-for="tag in article.tags"
                      :key="tag"
                      class="text-[9px] font-bold border-2 border-[var(--color-text)] px-2 py-0.5 uppercase font-sans bg-[var(--color-bg)]"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>