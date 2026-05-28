<script setup lang="ts">
import pinnedItems from '../data/pinned-items.json';
import projectsData from '../data/projects.json';
import ClockCard from '../components/ClockCard.vue';
import CalendarCard from '../components/CalendarCard.vue';
import MeCard from '../components/MeCard.vue';
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';

// Load generated ASCII avatar if available
import asciiAvatarData from '../data/avatar-ascii.json';

const router = useRouter();

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
}

const items: PinnedItem[] = pinnedItems;
const latestProject = computed(() => projectsData[0] || null);
const articles = ref<Article[]>([]);
const latestArticle = computed(() => {
  if (articles.value.length === 0) return null;
  return [...articles.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
});

const asciiAvatar = ref(asciiAvatarData?.ascii || '');

const openLink = (link: string) => {
    if (link) {
        if (!link.startsWith('http')) link = 'https://' + link;
        window.open(link, '_blank');
    }
};

const loadArticles = async () => {
  try {
    const res = await fetch('/blogs/index.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      articles.value = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('ERR_FETCH_ARTICLES');
  }
};

// Scroll Reveal Logic
const setupScrollReveal = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left').forEach(el => observer.observe(el));
};

onMounted(async () => {
  await loadArticles();
  
  nextTick(() => {
    setupScrollReveal();
  });
  
  // Real-time animated console logger
  runConsoleLogger();
});

// Console Logger implementation
const consoleLogs = ref<string[]>([]);
const logQueue = [
  'INITIALIZING LANRHYME CORE SYSTEM...',
  'ESTABLISHING SECURE CONNECTION [PORT 443]... DONE',
  'SYNCING GITHUB PROFILE DATA... SUCCESS',
  'LOADED ARTICLES: ' + (articles.value.length || 0) + ' NODES MOUNTED',
  'LOADED PROJECT DATABASE... VALID',
  'RENDER ENGINE: PARTICLES & GLOWS RUNNING',
  'SYSTEM V2.0.26 STATUS: ONLINE',
  'USER CONNECTION: ESTABLISHED'
];

const runConsoleLogger = () => {
  let idx = 0;
  const interval = setInterval(() => {
    if (idx < logQueue.length) {
      consoleLogs.value.push(logQueue[idx]);
      idx++;
    } else {
      clearInterval(interval);
    }
  }, 900);
};
</script>

<template>
  <div class="w-full font-sans text-[var(--color-text)] flex flex-col gap-16 sm:gap-24 pb-24">
    
    <!-- Hero Section (Parallax & Typographic) -->
    <section class="min-h-[80vh] flex flex-col justify-center px-4 md:px-12 relative overflow-hidden">
      <div class="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col xl:flex-row justify-between items-center gap-12">
        
        <!-- Huge Glitched Typography & Artistic Mixed Headline -->
        <div class="flex-shrink-0 w-full xl:w-7/12 relative z-10 flex flex-col gap-8">
          <div>
            <h1 
              class="text-[14vw] xl:text-[9vw] leading-[0.9] font-art italic glitch-hover" 
              data-text="LanRhyme."
            >
              LanRhyme.
            </h1>
            <p class="font-mono text-lg md:text-xl mt-6 text-[var(--color-text-dim)] leading-relaxed tracking-wide">
              Designing <span class="text-[var(--color-text)] border-b border-[var(--color-brand)]">digital interfaces</span> &amp;<br>
              building <span class="text-[var(--color-text)] border-b border-[var(--color-brand)]">interactive systems</span>.
            </p>
          </div>
          
          <div class="flex flex-col md:flex-row md:items-end gap-6 md:gap-16 mt-8 opacity-90 reveal">
            <div class="text-xs sm:text-xs tracking-[0.3em] uppercase max-w-sm font-mono text-[var(--color-text-dim)]">
              <span class="text-[var(--color-brand)]">> STATUS: ONLINE</span><br><br>
              FULL-STACK DEVELOPER<br>
              DIGITAL ARTIST & CREATOR<br>
              SYSTEM_VERSION: 2.0.26
            </div>
            <div class="hidden md:block w-[1px] h-20 bg-[var(--color-border)]"></div>
            <div class="text-[10px] sm:text-xs max-w-md opacity-40 font-mono tracking-widest leading-loose">
              [SCROLL_DOWN TO INITIALIZE CONNECTION]<br>
              [WARNING: HIGH_END_TERMINAL_ENABLED]
            </div>
          </div>
        </div>
        
        <!-- Dual Column Panel: ASCII + Live Console -->
        <div class="flex flex-col md:flex-row xl:flex-col gap-8 items-center xl:items-end w-full xl:w-auto">
          <!-- Live Interactive Console Log Box -->
          <div class="cyber-glass p-6 font-mono text-xs leading-relaxed text-[var(--color-text-dim)] w-full md:w-[380px] h-[220px] relative overflow-hidden select-none reveal">
            <div class="border-b border-[var(--color-border)] pb-2 mb-3 text-[var(--color-text)] font-bold flex justify-between tracking-widest">
              <span>> SYSTEM_LOGS</span>
              <span class="animate-pulse text-[var(--color-brand)]">LIVE</span>
            </div>
            <div class="h-[140px] overflow-y-auto flex flex-col gap-2 pr-2">
              <div v-for="(log, i) in consoleLogs" :key="i" class="text-[var(--color-text)] opacity-80">> {{ log }}</div>
              <div v-if="consoleLogs.length < logQueue.length" class="text-[var(--color-brand)] animate-pulse">> SYS.STREAMING_DATA...</div>
            </div>
          </div>
          
          <!-- Actual ASCII Art Avatar -->
          <div class="hidden xl:block opacity-40 hover:opacity-100 transition-opacity duration-500 text-[6px] leading-[6px] tracking-tighter whitespace-pre font-mono pointer-events-none select-none reveal">
            <pre class="m-0 text-[var(--color-text)]">{{ asciiAvatar }}</pre>
          </div>
        </div>
      </div>
    </section>

    <!-- Staggered Main Content (Offset Layout) -->
    <section class="w-full max-w-[1400px] mx-auto px-4 md:px-12">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-20 items-start relative">
        
        <!-- Left Column: Identity & Modules (Sticky) -->
        <div class="md:col-span-4 lg:col-span-3 flex flex-col gap-8 md:sticky md:top-32 z-20">
          <div class="reveal-left" style="transition-delay: 0.1s;"><MeCard /></div>
          <div class="reveal-left" style="transition-delay: 0.2s;"><ClockCard /></div>
          <div class="reveal-left" style="transition-delay: 0.3s;"><CalendarCard /></div>
        </div>

        <!-- Right Column: Navigation & Content (Flows down) -->
        <div class="md:col-span-8 lg:col-span-9 flex flex-col gap-16 md:gap-24 pt-8">
          
          <!-- Modules -->
          <div class="reveal flex flex-col gap-6 w-full lg:w-5/6 ml-auto">
            <div class="border-b border-[var(--color-border)] pb-4 text-sm font-bold flex justify-between font-mono tracking-[0.3em]">
              <span class="text-[var(--color-text)]">> SYS.EXPLORE</span>
              <span class="opacity-30">DIR_LIST</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Route Buttons as Cyber Blocks -->
              <div 
                class="cyber-glass p-8 cursor-pointer group relative overflow-hidden" 
                @click="$router.push('/works')"
              >
                <div class="text-xs opacity-40 mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors">01 / ARCHIVE</div>
                <div class="font-art text-2xl mb-2">> Works.</div>
                <div class="text-sm opacity-60 font-sans tracking-wide">CREATIVE PORTFOLIO</div>
              </div>

              <div 
                class="cyber-glass p-8 cursor-pointer group relative overflow-hidden" 
                @click="$router.push('/projects')"
              >
                <div class="text-xs opacity-40 mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors">02 / DEPLOYMENTS</div>
                <div class="font-art text-2xl mb-2">> Projects.</div>
                <div class="text-sm opacity-60 line-clamp-1 font-sans tracking-wide">LATEST: {{ latestProject?.title?.toUpperCase() || 'NULL' }}</div>
              </div>

              <div 
                class="cyber-glass p-8 cursor-pointer group relative overflow-hidden" 
                @click="$router.push('/articles')"
              >
                <div class="text-xs opacity-40 mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors">03 / LOGS</div>
                <div class="font-art text-2xl mb-2">> Articles.</div>
                <div class="text-sm opacity-60 font-sans tracking-wide">TECHNICAL & THOUGHTS</div>
              </div>

              <div 
                class="cyber-glass p-8 cursor-pointer group relative overflow-hidden" 
                @click="$router.push('/games')"
              >
                <div class="text-xs opacity-40 mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors">04 / EXE</div>
                <div class="font-art text-2xl mb-2">> Games.</div>
                <div class="text-sm opacity-60 font-sans tracking-wide">SIMULATIONS</div>
              </div>
            </div>
          </div>

          <!-- Pinned Nodes -->
          <div class="reveal flex flex-col gap-6 w-full lg:w-5/6">
            <div class="border-b border-[var(--color-border)] pb-4 text-sm font-bold font-mono tracking-[0.3em]">
              <span class="text-[var(--color-text)]">> RECOMMENDED_NODES</span>
            </div>
            
            <div class="flex flex-col gap-0 border border-[var(--color-border)] bg-black/20">
              <div 
                v-for="(item, index) in items" 
                :key="index" 
                class="p-6 cursor-pointer hover:bg-[var(--color-text)] hover:text-black group border-b border-[var(--color-border)] last:border-b-0 transition-colors" 
                @click="openLink(item.link)"
              >
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span class="font-art font-bold text-xl">{{ item.title }}</span>
                  <span class="opacity-0 group-hover:opacity-100 text-xs tracking-widest hidden sm:block font-mono">[CONNECT]</span>
                </div>
                <div class="text-sm opacity-50 group-hover:opacity-90 mt-2 font-sans tracking-wide">{{ item.description }}</div>
              </div>
            </div>
          </div>
          
          <!-- Recent Log Highlight -->
          <div class="reveal flex flex-col gap-6 w-full lg:w-3/4 ml-auto text-right">
            <div class="border-b border-[var(--color-border)] pb-4 text-sm font-bold justify-end flex font-mono tracking-[0.3em]">
              <span class="text-[var(--color-text)]">> RECENT_LOG</span>
            </div>
            
            <div 
              class="cyber-glass p-8 cursor-pointer hover:border-[var(--color-text)] group text-left transition-colors" 
              @click="$router.push(latestArticle ? '/article/' + latestArticle.slug : '/articles')"
            >
              <div v-if="latestArticle">
                <div class="text-xs opacity-40 mb-4 font-mono tracking-widest">> TIMESTAMP: {{ latestArticle.date }}</div>
                <div class="font-art text-3xl mb-4 leading-snug group-hover:text-[var(--color-brand)] transition-colors">{{ latestArticle.title }}</div>
                <div class="text-base opacity-60 line-clamp-3 font-sans tracking-wide leading-relaxed">{{ latestArticle.summary }}</div>
                <div class="mt-6 flex flex-wrap gap-3">
                  <span v-for="tag in latestArticle.tags" :key="tag" class="text-[10px] border border-[var(--color-border)] px-3 py-1 uppercase font-mono tracking-widest group-hover:border-[var(--color-text)] transition-colors">{{ tag }}</span>
                </div>
              </div>
              <div v-else class="text-sm opacity-50 font-mono">NO_LOGS_FOUND_IN_DB</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>
