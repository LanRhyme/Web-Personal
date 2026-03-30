<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
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

const getImageUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/blogs/')) return path;
  return `/blogs/${path}`;
};

const goBack = () => {
  router.back();
};

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const marked = (text: string): string => {
  let html = text;

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'plaintext';
    const escapedCode = escapeHtml(code.trimEnd());
    return `<pre class="language-${language}"><button class="copy-btn" data-code="${escapedCode}"><i class="fas fa-copy"></i></button><code class="language-${language}">${escapedCode}</code></pre>`;
  });

  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    const fullUrl = src.startsWith('http') ? src : `/blogs/${slug.value}/${src}`;
    return `<img alt="${alt}" src="${fullUrl}" class="blog-img" />`;
  });

  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  const lines = html.split('\n');
  const paragraphs: string[] = [];
  let inCodeBlock = false;
  let currentParagraph = '';

  for (const line of lines) {
    if (line.startsWith('<pre') || line.startsWith('<h') || line.startsWith('<img') || inCodeBlock) {
      if (currentParagraph.trim()) {
        paragraphs.push(`<p>${currentParagraph}</p>`);
        currentParagraph = '';
      }
      if (line.startsWith('<pre')) inCodeBlock = true;
      if (line.includes('</pre>')) inCodeBlock = false;
      paragraphs.push(line);
    } else if (line.trim() === '') {
      if (currentParagraph.trim()) {
        paragraphs.push(`<p>${currentParagraph}</p>`);
        currentParagraph = '';
      }
    } else {
      currentParagraph += line;
    }
  }

  if (currentParagraph.trim()) {
    paragraphs.push(`<p>${currentParagraph}</p>`);
  }

  return paragraphs.join('\n');
};

const renderMarkdown = () => {
  if (!article.value) return '';
  return marked(article.value.markdown);
};

const handleCopyCode = async (event: Event) => {
  const btn = (event.target as HTMLElement).closest('.copy-btn') as HTMLButtonElement;
  if (!btn) return;

  const code = btn.getAttribute('data-code');
  if (!code) return;

  try {
    const decoded = code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    await navigator.clipboard.writeText(decoded);
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-copy"></i>';
    }, 2000);
  } catch (e) {
    console.error('Failed to copy:', e);
  }
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

    await nextTick();

    const waitForPrism = () => {
      return new Promise<void>((resolve) => {
        const check = () => {
          if (typeof (window as any).Prism !== 'undefined' && (window as any).Prism.highlightElement) {
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
    };

    await waitForPrism();

    document.querySelectorAll('.blog-content pre code[class*="language-"]').forEach((block) => {
      (window as any).Prism.highlightElement(block as HTMLElement);
    });
    document.querySelectorAll('.blog-content').forEach(el => {
      el.addEventListener('click', handleCopyCode);
    });
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

      <div class="blog-content" v-html="marked(article.markdown)"></div>
    </article>
  </div>
</template>

<style>
.blog-content h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 2rem 0 1rem;
}

.blog-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 1.75rem 0 0.875rem;
}

.blog-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 1.5rem 0 0.75rem;
}

.blog-content p {
  color: var(--color-secondary);
  line-height: 1.8;
  margin-bottom: 1rem;
}

.blog-content strong {
  color: var(--color-primary);
  font-weight: 700;
}

.blog-content em {
  font-style: italic;
}

.blog-content code:not([class*="language-"]) {
  background: var(--color-card);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875em;
}

.blog-content pre[class*="language-"] {
  margin: 1.5rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
  position: relative;
}

.blog-content pre[class*="language-"] code {
  display: block;
  overflow-x: auto;
}

.blog-content img {
  max-width: 100%;
  border-radius: 0.75rem;
  margin: 1.5rem 0;
}

.blog-content a {
  color: var(--color-brand);
  text-decoration: underline;
}

.blog-content a:hover {
  opacity: 0.8;
}

.blog-content pre {
  position: relative;
  margin: 1.5rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.blog-content pre .copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.375rem 0.625rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.375rem;
  color: #fff;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.blog-content pre .copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>