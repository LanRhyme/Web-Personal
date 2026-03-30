<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface ArticleConfig {
  title?: string;
  date?: string;
  summary?: string;
  tags?: string[];
  cover?: string;
  hidden?: boolean;
  category?: string;
}

const route = useRoute();
const router = useRouter();
const slug = computed(() => route.params.slug as string);

const article = ref<{
  config: ArticleConfig;
  markdown: string;
} | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const title = computed(() => article.value?.config.title || slug.value);
const date = computed(() => {
  if (!article.value?.config.date) return '';
  const d = new Date(article.value.config.date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
});
const tags = computed(() => article.value?.config.tags || []);

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : '/' + path;
};

const goBack = () => {
  router.back();
};

const marked = (text: string): string => {
  let html = text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="blog-img" />')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  return `<p>${html}</p>`;
};

onMounted(async () => {
  try {
    const configRes = await fetch(`/blogs/${encodeURIComponent(slug.value)}/config.json`, { cache: 'no-store' });
    const mdRes = await fetch(`/blogs/${encodeURIComponent(slug.value)}/index.md`, { cache: 'no-store' });

    if (!mdRes.ok) {
      error.value = '文章不存在';
      return;
    }

    const config: ArticleConfig = configRes.ok ? await configRes.json() : {};
    const markdown = await mdRes.text();

    article.value = { config, markdown };
  } catch (e) {
    error.value = '加载失败';
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen w-full bg-[var(--color-bg)] transition-colors duration-500 font-sans">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <i class="fas fa-spinner fa-spin text-[var(--color-brand)] text-2xl"></i>
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-screen">
      <div class="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
      </div>
      <p class="text-[var(--color-secondary)] mb-6">{{ error }}</p>
      <button @click="goBack" class="btn-brand">
        <i class="fas fa-arrow-left mr-2"></i>返回
      </button>
    </div>

    <article v-else-if="article" class="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <button @click="goBack" class="mb-8 text-sm text-[var(--color-secondary)] hover:text-[var(--color-brand)] transition-colors">
        <i class="fas fa-arrow-left mr-2"></i>返回
      </button>

      <div class="text-center mb-8">
        <h1 class="text-2xl md:text-3xl font-black text-[var(--color-primary)] mb-4">{{ title }}</h1>
        <div class="flex items-center justify-center gap-4 text-xs text-[var(--color-secondary)]">
          <span v-if="date">{{ date }}</span>
          <span v-for="tag in tags" :key="tag" class="text-[var(--color-brand)]">#{{ tag }}</span>
        </div>
      </div>

      <div v-if="article.config.cover" class="mb-8 rounded-2xl overflow-hidden">
        <img :src="getImageUrl(article.config.cover)" class="w-full" />
      </div>

      <div v-if="article.config.summary" class="text-center text-sm text-[var(--color-secondary)] italic mb-8 px-4">
        "{{ article.config.summary }}"
      </div>

      <div class="article-content" v-html="marked(article.markdown)"></div>
    </article>
  </div>
</template>

<style>
.article-content h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 2rem 0 1rem;
}

.article-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 1.75rem 0 0.875rem;
}

.article-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 1.5rem 0 0.75rem;
}

.article-content p {
  color: var(--color-secondary);
  line-height: 1.8;
  margin-bottom: 1rem;
}

.article-content strong {
  color: var(--color-primary);
  font-weight: 700;
}

.article-content em {
  font-style: italic;
}

.article-content code {
  background: var(--color-card);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875em;
}

.article-content img {
  max-width: 100%;
  border-radius: 0.75rem;
  margin: 1.5rem 0;
}

.article-content a {
  color: var(--color-brand);
  text-decoration: underline;
}

.article-content a:hover {
  opacity: 0.8;
}
</style>