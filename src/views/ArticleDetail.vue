<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useARGState } from '../composables/useARGState';
import ContentLoader from '../components/ContentLoader.vue';
import Prism from 'prismjs';

const isLoaded = ref(false);

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

const { argStarted, hasKey } = useARGState();

const isArgArticle = computed(() => {
  if (!argStarted.value) return false;
  if (hasKey('BREATH_WHITE') && hasKey('CHORD_PATTERN') && hasKey('SOS_ECHO')) {
    const title = article.value?.config.title?.toLowerCase() || '';
    const content = article.value?.markdown?.toLowerCase() || '';
    return title.includes('优化') || title.includes('performance') || content.includes('优化');
  }
  return false;
});

const getImageUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/blogs/')) return path;
  return `/blogs/${slug.value}/${path}`;
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

  const codeBlocks: string[] = [];
  html = html.replace(/```(.*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang ? lang.trim() : 'plaintext';
    const escapedCode = escapeHtml(code.trimEnd());
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="language-${language}"><button class="copy-btn" data-code="${escapedCode}"><i class="fas fa-copy"></i></button><code class="language-${language}">${escapedCode}</code></pre>`);
    return placeholder;
  });

  const inlineCodes: string[] = [];
  html = html.replace(/`([^`\n]+)`/g, (match, code) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    const fullUrl = src.startsWith('http') ? src : `/blogs/${slug.value}/${src}`;
    return `<img alt="${alt}" src="${fullUrl}" loading="lazy" decoding="async" class="blog-img" />`;
  });

  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  const lines = html.split('\n');
  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (const line of lines) {
    if (line.startsWith('__CODE_BLOCK_') || line.startsWith('<h') || line.startsWith('<img')) {
      if (currentParagraph.trim()) {
        paragraphs.push(`<p>${currentParagraph}</p>`);
        currentParagraph = '';
      }
      paragraphs.push(line);
    } else if (line.trim() === '') {
      if (currentParagraph.trim()) {
        paragraphs.push(`<p>${currentParagraph}</p>`);
        currentParagraph = '';
      }
    } else {
      currentParagraph += line + '<br>';
    }
  }

  if (currentParagraph.trim()) {
    paragraphs.push(`<p>${currentParagraph}</p>`);
  }

  html = paragraphs.join('\n');

  html = html.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => {
    return inlineCodes[parseInt(index)];
  });

  html = html.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return codeBlocks[parseInt(index)];
  });

  html = html.replace(/<br><\/p>/g, '</p>');

  return html;
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

    document.querySelectorAll('.blog-content pre code[class*="language-"]').forEach((block) => {
      Prism.highlightElement(block as HTMLElement);
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
  <div class="min-h-screen w-full bg-transparent transition-colors duration-500 font-sans">
    
    <ContentLoader v-if="!isLoaded" :ready="!loading" @complete="isLoaded = true" />

    <div v-show="isLoaded" class="transition-opacity duration-700 w-full min-h-screen" :class="{ 'opacity-0': !isLoaded, 'opacity-100': isLoaded }">
      <div v-if="error" class="flex flex-col items-center justify-center min-h-screen">
        <div class="w-16 h-16 border border-red-500 text-red-500 flex items-center justify-center mb-4 cyber-glass">
          <i class="fas fa-exclamation-triangle text-xl"></i>
        </div>
        <p class="text-xs text-[var(--color-secondary)] mb-6 font-mono tracking-widest">> ERROR: {{ error }}</p>
        <button @click="goBack" class="btn-terminal">
          [ BACK.SYS ]
        </button>
      </div>

      <article v-else-if="article" class="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <button @click="goBack" class="btn-terminal mb-8">
          [ SYS.RETURN ]
        </button>

      <div class="cyber-glass p-6 md:p-8 mb-8 relative">
        <div class="absolute -top-3 -left-3 font-art text-[60px] leading-none opacity-5 text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap overflow-hidden">HEADER</div>
        <div class="text-center">
          <h1 class="text-2xl md:text-3xl font-art text-[var(--color-brand)] mb-4 tracking-wider">> {{ title }}</h1>
          <div class="flex items-center justify-center gap-4 text-[10px] text-[var(--color-text-dim)] font-mono opacity-80">
            <span v-if="date">[TIME: {{ date }}]</span>
            <span v-for="tag in tags" :key="tag" class="border border-[var(--color-border)] px-1.5 py-0.5 uppercase bg-[var(--color-bg)] text-[var(--color-brand)]">#{{ tag }}</span>
          </div>
        </div>
      </div>

      <div v-if="article.config.cover" class="mb-8 border border-[var(--color-border)] overflow-hidden">
        <img :src="getImageUrl(article.config.cover)" loading="lazy" decoding="async" class="w-full filter grayscale hover:grayscale-0 transition-all duration-500" @error="($event.target as HTMLImageElement).style.display='none'" />
      </div>

      <div v-if="article.config.summary" class="cyber-glass !p-6 text-center text-[12px] md:text-[14px] text-[var(--color-text-dim)] font-mono tracking-wide mb-8 border-l-2 border-l-[var(--color-brand)]">
        // {{ article.config.summary }}
      </div>

      <div class="blog-content text-[var(--color-text)] text-[18px] md:text-[20px] leading-loose" style="font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', sans-serif;" v-html="marked(article.markdown)"></div>

      <!-- ARG Hidden Text -->
      <div 
        v-if="isArgArticle" 
        class="mt-8 select-all cursor-default"
        style="color: transparent; user-select: all;"
      >
        [回声木数据节点·备份] 此处保存了烬的研究数据碎片。解码路径：L3ZvaWQtZWNoby10ZXJtaW5hbA==
      </div>
    </article>
    </div>
  </div>
</template>

<style>
.blog-content h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 2rem 0 1rem;
}

.blog-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 1.75rem 0 0.875rem;
}

.blog-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 1.5rem 0 0.75rem;
}

.blog-content p {
  color: var(--color-secondary);
  line-height: 2;
  margin-bottom: 1rem;
}

.blog-content strong {
  color: var(--color-brand);
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
  color: var(--color-text);
}

.blog-content pre[class*="language-"] {
  margin: 1.5rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
  position: relative;
  background: var(--color-code-bg) !important;
}

.blog-content pre[class*="language-"] code {
  display: block;
  overflow-x: auto;
  background: transparent !important;
  color: var(--color-code-text) !important;
  text-shadow: none !important;
}

/* Prism Token Colors - Minimalist Terminal Theme (Green/White) */
.blog-content pre[class*="language-"] .token.comment,
.blog-content pre[class*="language-"] .token.prolog,
.blog-content pre[class*="language-"] .token.doctype,
.blog-content pre[class*="language-"] .token.cdata {
  color: var(--color-text-dim);
  opacity: 0.6;
  font-style: italic;
}

.blog-content pre[class*="language-"] .token.punctuation {
  color: var(--color-text-dim);
}

.blog-content pre[class*="language-"] .token.namespace {
  opacity: .7;
}

.blog-content pre[class*="language-"] .token.property,
.blog-content pre[class*="language-"] .token.tag,
.blog-content pre[class*="language-"] .token.boolean,
.blog-content pre[class*="language-"] .token.number,
.blog-content pre[class*="language-"] .token.constant,
.blog-content pre[class*="language-"] .token.symbol,
.blog-content pre[class*="language-"] .token.deleted {
  color: var(--color-brand);
}

.blog-content pre[class*="language-"] .token.selector,
.blog-content pre[class*="language-"] .token.attr-name,
.blog-content pre[class*="language-"] .token.string,
.blog-content pre[class*="language-"] .token.char,
.blog-content pre[class*="language-"] .token.builtin,
.blog-content pre[class*="language-"] .token.inserted {
  color: var(--color-text);
}

.blog-content pre[class*="language-"] .token.operator,
.blog-content pre[class*="language-"] .token.entity,
.blog-content pre[class*="language-"] .token.url,
.blog-content pre[class*="language-"] .token.language-css .token.string,
.blog-content pre[class*="language-"] .token.style .token.string {
  color: var(--color-brand);
}

.blog-content pre[class*="language-"] .token.atrule,
.blog-content pre[class*="language-"] .token.attr-value,
.blog-content pre[class*="language-"] .token.keyword {
  color: var(--color-brand);
  font-weight: bold;
}

.blog-content pre[class*="language-"] .token.function,
.blog-content pre[class*="language-"] .token.class-name {
  color: var(--color-text);
  font-weight: bold;
}

.blog-content pre[class*="language-"] .token.regex,
.blog-content pre[class*="language-"] .token.important,
.blog-content pre[class*="language-"] .token.variable {
  color: var(--color-brand);
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
  background: rgba(128, 128, 128, 0.2);
  border: none;
  border-radius: 0.375rem;
  color: var(--color-code-text);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.blog-content pre .copy-btn:hover {
  background: rgba(128, 128, 128, 0.4);
}
</style>