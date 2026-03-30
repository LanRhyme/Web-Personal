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
          <div class="w-10 h-10 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center">
            <i class="fas fa-feather-alt text-[var(--color-brand)] text-lg"></i>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-[var(--color-primary)] tracking-tight">Articles</h1>
        </div>
        <p class="text-[var(--color-secondary)] text-sm md:text-base">我的文章与笔记</p>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <i class="fas fa-spinner fa-spin text-[var(--color-brand)] text-2xl"></i>
      </div>

      <div v-else-if="error" class="text-center py-20 text-red-500">
        {{ error }}
      </div>

      <div v-else-if="articles.length === 0" class="text-center py-20">
        <div class="w-20 h-20 rounded-full bg-[var(--color-card)] flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-feather text-[var(--color-secondary)] text-2xl opacity-40"></i>
        </div>
        <p class="text-[var(--color-secondary)]">暂无文章</p>
      </div>

      <div v-else class="space-y-10">
        <div v-for="year in groupedArticles.years" :key="year" class="animate-fade-in-up">
          <h2 class="text-2xl font-black text-[var(--color-primary)] mb-6 flex items-center gap-3">
            <span>{{ year }}</span>
            <span class="text-xs font-normal text-[var(--color-secondary)] bg-[var(--color-card)] px-3 py-1 rounded-full">
              {{ groupedArticles.groups[year].length }} 篇
            </span>
          </h2>

          <div class="space-y-4">
            <div
              v-for="article in groupedArticles.groups[year]"
              :key="article.slug"
              @click="viewArticle(article.slug)"
              class="card-flat bg-white/40 dark:bg-white/5 hover:bg-[var(--color-brand)]/5 hover:border-[var(--color-brand)]/30 cursor-pointer !p-5 md:!p-6 transition-all duration-300 group"
            >
              <div class="flex flex-col md:flex-row gap-4 md:gap-6">
                <div v-if="article.cover" class="w-full md:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-bg)]">
                  <img :src="getImageUrl(article.cover, article.slug)" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'" />
                </div>
                <div class="flex-grow min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <h3 class="text-base md:text-lg font-bold text-[var(--color-primary)] group-hover:text-[var(--color-brand)] transition-colors truncate">
                      {{ article.title }}
                    </h3>
                    <span class="text-[10px] text-[var(--color-secondary)] font-mono flex-shrink-0">
                      {{ formatDate(article.date) }}
                    </span>
                  </div>
                  <p v-if="article.summary" class="text-xs md:text-sm text-[var(--color-secondary)] line-clamp-2 mb-3">
                    {{ article.summary }}
                  </p>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      v-for="tag in article.tags"
                      :key="tag"
                      class="text-[9px] font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-1 rounded-full uppercase tracking-wider"
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