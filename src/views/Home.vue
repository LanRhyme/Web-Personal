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
  <div class="w-full font-sans text-[var(--color-text)] flex flex-col gap-16 sm:gap-24 pb-24 pt-[70px] sm:pt-[86px] md:pt-[102px]">
    
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
          
          <div class="flex flex-col md:flex-row md:items-end gap-6 md:gap-16 mt-8 opacity-100 reveal">
            <div class="text-sm sm:text-sm tracking-[0.3em] uppercase max-w-sm font-mono text-[var(--color-text-dim)]">
              <span class="text-[var(--color-brand)] font-bold">> STATUS: ONLINE</span><br><br>
              FULL-STACK DEVELOPER<br>
              DIGITAL ARTIST & CREATOR<br>
              SYSTEM_VERSION: 2.0.26
            </div>
            <div class="hidden md:block w-[1px] h-20 bg-[var(--color-border)]"></div>
            <div class="text-xs sm:text-sm max-w-md opacity-60 font-mono tracking-widest leading-loose">
              [SCROLL_DOWN TO INITIALIZE CONNECTION]<br>
              [WARNING: HIGH_END_TERMINAL_ENABLED]
            </div>
          </div>
        </div>
        
        <!-- Dual Column Panel: ASCII + Live Console -->
        <div class="flex flex-col items-end w-full xl:w-[480px] relative mt-16 xl:mt-0">
          
          <!-- Actual ASCII Art Avatar as Background Texture -->
          <div class="hidden xl:block absolute -right-16 -top-24 z-0 opacity-20 hover:opacity-40 transition-opacity duration-700 text-[6px] leading-[6px] tracking-tighter whitespace-pre font-mono pointer-events-none select-none reveal" style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);">
            <pre class="m-0 text-[var(--color-brand)]">{{ asciiAvatar }}</pre>
          </div>

          <!-- Live Interactive Console Log Box (Premium HUD) -->
          <div class="cyber-glass p-8 font-mono text-sm leading-relaxed text-[var(--color-text-dim)] w-full h-[320px] relative overflow-hidden select-none reveal z-10 shadow-2xl group">
            <!-- Scanning Laser -->
            <div class="absolute top-0 left-0 w-full h-[1px] bg-[var(--color-brand)] shadow-[0_0_15px_rgba(107,143,114,0.8)] opacity-50 animate-scan pointer-events-none"></div>
            
            <!-- HUD Brackets -->
            <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-brand)] opacity-40"></div>
            <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-brand)] opacity-40"></div>
            <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-brand)] opacity-40"></div>
            <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-brand)] opacity-40"></div>

            <div class="border-b border-[var(--color-border)] pb-4 mb-6 text-[var(--color-text)] font-bold flex justify-between items-center tracking-widest text-sm">
              <span class="flex items-center gap-3">
                <span class="w-2 h-2 bg-[var(--color-brand)] animate-pulse"></span>
                > SYS.MONITOR
              </span>
              <span class="text-[var(--color-brand)] text-[10px] border border-[var(--color-brand)] px-2 py-0.5">LIVE</span>
            </div>
            
            <div class="h-[200px] overflow-y-auto flex flex-col gap-4 pr-4">
              <div v-for="(log, i) in consoleLogs" :key="i" class="text-[var(--color-text)] opacity-80 group-hover:opacity-100 transition-opacity duration-300">> {{ log }}</div>
              <div v-if="consoleLogs.length < logQueue.length" class="text-[var(--color-brand)] animate-pulse">> SYS.STREAMING_DATA...</div>
            </div>
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
          <div class="reveal flex flex-col gap-6 w-full lg:w-5/6 ml-auto relative">
            <!-- Decorative Large Watermark -->
            <div class="absolute -top-16 -left-12 font-art text-[120px] leading-none opacity-5 text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap overflow-hidden">
              SYS.ARCHIVE
            </div>

            <div class="border-b border-[var(--color-border)] pb-4 text-base font-bold flex justify-between font-mono tracking-[0.3em]">
              <span class="text-[var(--color-text)]">> SYS.EXPLORE</span>
              <span class="opacity-50">DIR_LIST</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Route Buttons as Cyber Blocks -->
              <div 
                class="cyber-glass p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[160px]" 
                @click="$router.push('/works')"
              >
                <div>
                  <div class="text-sm opacity-60 mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors">01 / ARCHIVE</div>
                  <div class="font-art text-3xl mb-3">> Works.</div>
                  <div class="text-base opacity-80 font-sans tracking-wide">CREATIVE PORTFOLIO</div>
                </div>
                <!-- Deco Barcode -->
                <div class="absolute bottom-6 right-8 flex gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity">
                  <div class="w-[2px] h-4 bg-[var(--color-text)]"></div><div class="w-[4px] h-4 bg-[var(--color-text)]"></div><div class="w-[1px] h-4 bg-[var(--color-text)]"></div><div class="w-[3px] h-4 bg-[var(--color-text)]"></div><div class="w-[1px] h-4 bg-[var(--color-text)]"></div>
                </div>
              </div>

              <div 
                class="cyber-glass p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[160px]" 
                @click="$router.push('/projects')"
              >
                <div>
                  <div class="text-sm opacity-60 mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors">02 / DEPLOYMENTS</div>
                  <div class="font-art text-3xl mb-3">> Projects.</div>
                  <div class="text-base opacity-80 line-clamp-1 font-sans tracking-wide">LATEST: {{ latestProject?.title?.toUpperCase() || 'NULL' }}</div>
                </div>
                <div class="absolute bottom-6 right-8 flex gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity">
                  <div class="w-[1px] h-4 bg-[var(--color-text)]"></div><div class="w-[3px] h-4 bg-[var(--color-text)]"></div><div class="w-[2px] h-4 bg-[var(--color-text)]"></div><div class="w-[1px] h-4 bg-[var(--color-text)]"></div><div class="w-[4px] h-4 bg-[var(--color-text)]"></div>
                </div>
              </div>

              <div 
                class="cyber-glass p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[160px]" 
                @click="$router.push('/articles')"
              >
                <div>
                  <div class="text-sm opacity-60 mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors">03 / LOGS</div>
                  <div class="font-art text-3xl mb-3">> Articles.</div>
                  <div class="text-base opacity-80 font-sans tracking-wide">TECHNICAL & THOUGHTS</div>
                </div>
                <div class="absolute bottom-6 right-8 flex gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity">
                  <div class="w-[4px] h-4 bg-[var(--color-text)]"></div><div class="w-[1px] h-4 bg-[var(--color-text)]"></div><div class="w-[2px] h-4 bg-[var(--color-text)]"></div><div class="w-[3px] h-4 bg-[var(--color-text)]"></div><div class="w-[1px] h-4 bg-[var(--color-text)]"></div>
                </div>
              </div>

              <div 
                class="cyber-glass p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[160px]" 
                @click="$router.push('/games')"
              >
                <div>
                  <div class="text-sm opacity-60 mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors">04 / EXE</div>
                  <div class="font-art text-3xl mb-3">> Games.</div>
                  <div class="text-base opacity-80 font-sans tracking-wide">SIMULATIONS</div>
                </div>
                <div class="absolute bottom-6 right-8 flex gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity">
                  <div class="w-[3px] h-4 bg-[var(--color-text)]"></div><div class="w-[2px] h-4 bg-[var(--color-text)]"></div><div class="w-[4px] h-4 bg-[var(--color-text)]"></div><div class="w-[1px] h-4 bg-[var(--color-text)]"></div><div class="w-[1px] h-4 bg-[var(--color-text)]"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pinned Nodes -->
          <div class="reveal flex flex-col gap-6 w-full lg:w-5/6">
            <div class="border-b border-[var(--color-border)] pb-4 text-base font-bold font-mono tracking-[0.3em]">
              <span class="text-[var(--color-text)]">> RECOMMENDED_NODES</span>
            </div>
            
            <div class="flex flex-col gap-0 cyber-glass">
              <div 
                v-for="(item, index) in items" 
                :key="index" 
                class="p-6 sm:p-8 cursor-pointer hover:bg-[var(--color-text)] hover:text-black group border-b border-[var(--color-border)] last:border-b-0 transition-colors" 
                @click="openLink(item.link)"
              >
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <span class="font-art font-bold text-2xl">{{ item.title }}</span>
                  <span class="opacity-0 group-hover:opacity-100 text-sm tracking-widest hidden sm:block font-mono">[CONNECT]</span>
                </div>
                <div class="text-base opacity-70 group-hover:opacity-90 mt-3 font-sans tracking-wide">{{ item.description }}</div>
              </div>
            </div>
          </div>
          
          <!-- Recent Log Highlight -->
          <div class="reveal flex flex-col gap-6 w-full lg:w-3/4 ml-auto text-right">
            <div class="border-b border-[var(--color-border)] pb-4 text-base font-bold justify-end flex font-mono tracking-[0.3em]">
              <span class="text-[var(--color-text)]">> RECENT_LOG</span>
            </div>
            
            <div 
              class="cyber-glass p-8 sm:p-10 cursor-pointer hover:border-[var(--color-brand)] group text-left transition-colors" 
              @click="$router.push(latestArticle ? '/article/' + latestArticle.slug : '/articles')"
            >
              <div v-if="latestArticle">
                <div class="text-sm opacity-60 mb-4 font-mono tracking-widest">> TIMESTAMP: {{ latestArticle.date }}</div>
                <div class="font-art text-4xl mb-6 leading-snug group-hover:text-[var(--color-brand)] transition-colors">{{ latestArticle.title }}</div>
                <div class="text-lg opacity-80 line-clamp-3 font-sans tracking-wide leading-relaxed">{{ latestArticle.summary }}</div>
                <div class="mt-8 flex flex-wrap gap-3">
                  <span v-for="tag in latestArticle.tags" :key="tag" class="text-xs border border-[var(--color-border)] px-3 py-1 uppercase font-mono tracking-widest group-hover:border-[var(--color-brand)] transition-colors">{{ tag }}</span>
                </div>
              </div>
              <div v-else class="text-base opacity-60 font-mono">NO_LOGS_FOUND_IN_DB</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>
