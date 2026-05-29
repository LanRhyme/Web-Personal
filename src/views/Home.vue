<script setup lang="ts">
import pinnedItems from '../data/pinned-items.json';
import projectsData from '../data/projects.json';
import ClockCard from '../components/ClockCard.vue';
import CalendarCard from '../components/CalendarCard.vue';
import MeCard from '../components/MeCard.vue';
import HitokotoCard from '../components/HitokotoCard.vue';
import ParticleText from '../components/ParticleText.vue';
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useARGState } from '../composables/useARGState';

// Load generated ASCII avatar if available
import asciiAvatarData from '../data/avatar-ascii.json';

const router = useRouter();

const sysUptime = ref('');
const hexCodes = ref<string[]>(Array.from({length: 4}, () => Math.random().toString(16).substring(2, 6).toUpperCase()));
let uptimeInterval: number;

const updateUptime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  sysUptime.value = `${hours}:${minutes}:${seconds}`;
};

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
const scrollY = ref(0);

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

const handleScroll = () => {
  scrollY.value = window.scrollY;
};

// Rain World Heavy Rain Canvas for Footer
const footerCanvasRef = ref<HTMLCanvasElement | null>(null);
let footerAnimId: number;
let cleanupFooterCanvas: (() => void) | null = null;

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;
const isRedAlert = ref(false);

const { addKey, hasKey, argStarted } = useARGState();
const mossCode = ['m', 'o', 's', 's'];
let mossIndex = 0;
const isFrostActive = ref(false);

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      triggerRedAlert();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }

  // ARG Logic: 输入 MOSS
  if (argStarted.value && !hasKey('BREATH_WHITE') && e.key.toLowerCase() === mossCode[mossIndex]) {
    mossIndex++;
    if (mossIndex === mossCode.length) {
      triggerMossAlert();
      mossIndex = 0;
    }
  } else {
    mossIndex = e.key.toLowerCase() === 'm' ? 1 : 0;
  }
};

const initFooterCanvas = () => {
  const canvas = footerCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = 200;
    }
  };
  resize();
  window.addEventListener('resize', resize);

  const drops: {x: number, y: number, speed: number, length: number, thickness: number}[] = [];
  const splashes: {x: number, y: number, vx: number, vy: number, life: number}[] = [];

  for(let i = 0; i < 120; i++) {
    drops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 12 + 10,
      length: Math.random() * 25 + 10,
      thickness: Math.random() > 0.85 ? 2 : 1
    });
  }

  const animate = () => {
    if (!canvas) return;
    // Dark background trail for motion blur (simulate heavy atmosphere)
    ctx.fillStyle = 'rgba(2, 2, 2, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rain Color (pale green/grey)
    const rainColor = 'rgba(150, 170, 150, 0.6)';

    // Update parallax slightly on scroll
    const scrollParallax = scrollY.value * 0.05;

    drops.forEach(drop => {
      ctx.fillStyle = rainColor;
      ctx.fillRect(drop.x, drop.y - (scrollParallax % canvas.height), drop.thickness, drop.length);
      drop.y += drop.speed;

      // Splashing on the "ground"
      if (drop.y > canvas.height - 20) {
        if (Math.random() > 0.6) {
          for(let k = 0; k < 3; k++) {
            splashes.push({
              x: drop.x,
              y: canvas.height - 20,
              vx: (Math.random() - 0.5) * 5,
              vy: -Math.random() * 4 - 1,
              life: 1
            });
          }
        }
        drop.y = -50;
        drop.x = Math.random() * canvas.width;
      }
    });

    // Handle Splashes
    for (let i = splashes.length - 1; i >= 0; i--) {
      let s = splashes[i];
      ctx.fillStyle = `rgba(150, 170, 150, ${s.life})`;
      ctx.fillRect(s.x, s.y - (scrollParallax % canvas.height), 2, 2);
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.3; // gravity
      s.life -= 0.06;
      if (s.life <= 0) {
        splashes.splice(i, 1);
      }
    }

    footerAnimId = requestAnimationFrame(animate);
  };
  animate();

  return () => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(footerAnimId);
  };
};

const triggerRedAlert = () => {
  if (isRedAlert.value) return;
  isRedAlert.value = true;
  document.documentElement.classList.add('red-alert');
  // petTalking('ALERT: CONSOLE COMPROMISED!');
  setTimeout(() => {
    isRedAlert.value = false;
    document.documentElement.classList.remove('red-alert');
    // petTalking('System Restored. (Phew!)');
  }, 5000);
};

const triggerMossAlert = () => {
  if (isFrostActive.value) return;
  isFrostActive.value = true;
  document.documentElement.classList.add('frost-alert');
  addKey('BREATH_WHITE');
  window.dispatchEvent(new CustomEvent('arg-fragment-found', { detail: { key: 'BREATH_WHITE' } }));
  setTimeout(() => {
    isFrostActive.value = false;
    document.documentElement.classList.remove('frost-alert');
  }, 5000);
};

// Scroll Reveal Logic (Optimized for repeated interactions)
const setupScrollReveal = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        // Remove class when element goes below the viewport to allow re-triggering animation when scrolling down again
        const rect = entry.target.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.8) {
          entry.target.classList.remove('is-visible');
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));
};

onMounted(async () => {
  await loadArticles();
  
  updateUptime();
  uptimeInterval = window.setInterval(updateUptime, 1000);
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('keydown', handleKeyDown);
  handleScroll();

  nextTick(() => {
    setupScrollReveal();
    cleanupFooterCanvas = initFooterCanvas();
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('keydown', handleKeyDown);
  if (uptimeInterval) clearInterval(uptimeInterval);
  if (cleanupFooterCanvas) cleanupFooterCanvas();
});
</script>

<template>
  <div class="w-full font-sans text-[var(--color-text)] flex flex-col gap-16 sm:gap-24 pb-24 pt-[40px] sm:pt-[56px] md:pt-[72px]">
    
    <!-- Hero Section (Parallax & Typographic) -->
    <section class="min-h-[80vh] flex flex-col justify-center px-4 md:px-12 relative overflow-hidden">
      <div class="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col xl:flex-row justify-between items-center gap-12">
        
        <!-- Huge Glitched Typography & Artistic Mixed Headline -->
        <div 
          class="flex-shrink-0 w-full xl:w-7/12 relative z-10 flex flex-col gap-8 transition-transform duration-75"
          :style="{ transform: `translateY(${scrollY * 0.15}px)`, opacity: Math.max(0, 1 - scrollY / 700) }"
        >
          <div class="animate-float-slow">
            <h1 class="w-full max-w-[850px] -mt-2">
              <ParticleText 
                text="LanRhyme." 
              />
            </h1>
            <p class="font-mono text-lg md:text-xl mt-6 text-[var(--color-text-dim)] leading-relaxed tracking-wide">
              Designing <span class="text-[var(--color-text)] border-b border-[var(--color-brand)]">digital interfaces</span> &amp;<br>
              building <span class="text-[var(--color-text)] border-b border-[var(--color-brand)]">interactive systems</span>.
            </p>
          </div>
          
          <div class="flex flex-col md:flex-row md:items-end gap-6 md:gap-16 mt-8 opacity-100 reveal">
            <div class="text-sm sm:text-sm tracking-[0.3em] uppercase max-w-sm font-mono text-[var(--color-text-dim)]">
              <span class="text-[var(--color-brand)] font-bold animate-pulse">> STATUS: ONLINE</span><br><br>
              FULL-STACK DEVELOPER<br>
              DIGITAL ARTIST & CREATOR<br>
              SYSTEM_VERSION: 4.1.12<br>
              SYS_UPTIME: <span class="text-[var(--color-text)]">{{ sysUptime }}</span>
            </div>
            <div class="hidden md:block w-[1px] h-20 bg-[var(--color-border)]"></div>
            <div class="text-xs sm:text-sm max-w-md opacity-60 font-mono tracking-widest leading-loose">
              [SCROLL_DOWN TO INITIALIZE CONNECTION]<br>
              [WARNING: HIGH_END_TERMINAL_ENABLED]
            </div>
          </div>
        </div>
        
        <!-- Dual Column Panel: ASCII + Live Console -->
        <div 
          class="flex flex-col items-end w-full xl:w-[480px] relative mt-16 xl:mt-0 transition-transform duration-75"
          :style="{ transform: `translateY(${scrollY * 0.08}px)` }"
        >
          
          <!-- Actual ASCII Art Avatar as Background Texture -->
          <div 
            class="hidden xl:block absolute -right-16 -top-24 z-0 opacity-20 hover:opacity-40 transition-opacity duration-700 text-[6px] leading-[6px] tracking-tighter whitespace-pre font-mono pointer-events-none select-none reveal" 
            style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%);"
            :style="{ transform: `translateY(${scrollY * 0.25}px)` }"
          >
            <pre class="m-0 text-[var(--color-brand)]">{{ asciiAvatar }}</pre>
          </div>

          <!-- Interactive Hitokoto Card -->
          <div class="w-full relative z-10 reveal animate-float-rotate">
            <HitokotoCard />
          </div>
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <div 
        class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 transition-opacity duration-500"
        :class="scrollY > 50 ? 'opacity-0 pointer-events-none' : 'opacity-50'"
      >
        <div class="text-[10px] font-mono tracking-[0.3em] text-[var(--color-brand)] animate-pulse">SCROLL</div>
        <div class="w-[1px] h-12 bg-gradient-to-b from-[var(--color-brand)] to-transparent"></div>
      </div>
      
      <!-- Frost Alert UI -->
      <transition name="page">
        <div v-if="isFrostActive" class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none mix-blend-screen">
          <div class="text-[var(--color-brand)] font-bold text-2xl md:text-4xl tracking-[0.3em] animate-pulse drop-shadow-[0_0_20px_var(--color-brand)] text-center">
            <div>BREATH_WHITE</div>
            <div class="text-sm md:text-base opacity-70 mt-2">余火历162年·苔鸣谷·白息浓度异常上升……</div>
          </div>
        </div>
      </transition>
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
        <div class="md:col-span-8 lg:col-span-9 flex flex-col gap-12 md:gap-24 pt-0 md:pt-8">
          
          <!-- Modules -->
          <div class="flex flex-col gap-4 md:gap-6 w-full lg:w-5/6 ml-auto relative">
            <!-- Decorative Large Watermark -->
            <div 
              class="absolute -top-16 -left-12 font-art text-[80px] md:text-[120px] leading-none opacity-5 text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap overflow-hidden transition-transform duration-75"
              :style="{ transform: `translateX(${scrollY * 0.05}px)` }"
            >
              SYS.ARCHIVE
            </div>

            <div class="reveal border-b border-[var(--color-border)] pb-3 md:pb-4 text-sm md:text-base font-bold flex justify-between font-mono tracking-[0.2em] md:tracking-[0.3em]">
              <span class="text-[var(--color-text)]"><span class="animate-pulse text-[var(--color-brand)]">></span> SYS.EXPLORE</span>
              <span class="opacity-50">DIR_LIST</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <!-- Route Buttons as Cyber Blocks -->
              <div 
                class="reveal-scale cyber-glass p-5 md:p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[120px] md:min-h-[160px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] active:border-[var(--color-brand)]" 
                style="transition-delay: 0.1s;"
                @click="$router.push('/works')"
              >
                <div>
                  <div class="text-xs md:text-sm opacity-60 mb-2 md:mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors glitch-hover">01 / ARCHIVE</div>
                  <div class="font-art text-2xl md:text-3xl mb-2 md:mb-3">> Works.</div>
                  <div class="text-sm md:text-base opacity-80 font-sans tracking-wide">CREATIVE PORTFOLIO</div>
                </div>
                <!-- Deco Barcode -->
                <div class="absolute bottom-4 right-6 md:bottom-6 md:right-8 flex items-end gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)]">
                  <span class="text-[8px] mr-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">0x{{ hexCodes[0] }}</span>
                  <div class="w-[2px] h-4 bg-current"></div><div class="w-[4px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div><div class="w-[3px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div>
                </div>
              </div>

              <div 
                class="reveal-scale cyber-glass p-5 md:p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[120px] md:min-h-[160px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] active:border-[var(--color-brand)]" 
                style="transition-delay: 0.2s;"
                @click="$router.push('/projects')"
              >
                <div>
                  <div class="text-xs md:text-sm opacity-60 mb-2 md:mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors glitch-hover">02 / DEPLOYMENTS</div>
                  <div class="font-art text-2xl md:text-3xl mb-2 md:mb-3">> Projects.</div>
                  <div class="text-sm md:text-base opacity-80 line-clamp-1 font-sans tracking-wide">LATEST: {{ latestProject?.title?.toUpperCase() || 'NULL' }}</div>
                </div>
                <div class="absolute bottom-4 right-6 md:bottom-6 md:right-8 flex items-end gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)]">
                  <span class="text-[8px] mr-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">0x{{ hexCodes[1] }}</span>
                  <div class="w-[1px] h-4 bg-current"></div><div class="w-[3px] h-4 bg-current"></div><div class="w-[2px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div><div class="w-[4px] h-4 bg-current"></div>
                </div>
              </div>

              <div 
                class="reveal-scale cyber-glass p-5 md:p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[120px] md:min-h-[160px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] active:border-[var(--color-brand)]" 
                style="transition-delay: 0.3s;"
                @click="$router.push('/articles')"
              >
                <div>
                  <div class="text-xs md:text-sm opacity-60 mb-2 md:mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors glitch-hover">03 / LOGS</div>
                  <div class="font-art text-2xl md:text-3xl mb-2 md:mb-3">> Articles.</div>
                  <div class="text-sm md:text-base opacity-80 font-sans tracking-wide">TECHNICAL & THOUGHTS</div>
                </div>
                <div class="absolute bottom-4 right-6 md:bottom-6 md:right-8 flex items-end gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)]">
                  <span class="text-[8px] mr-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">0x{{ hexCodes[2] }}</span>
                  <div class="w-[4px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div><div class="w-[2px] h-4 bg-current"></div><div class="w-[3px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div>
                </div>
              </div>

              <div 
                class="reveal-scale cyber-glass p-5 md:p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[120px] md:min-h-[160px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] active:border-[var(--color-brand)]" 
                style="transition-delay: 0.4s;"
                @click="$router.push('/games')"
              >
                <div>
                  <div class="text-xs md:text-sm opacity-60 mb-2 md:mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors glitch-hover">04 / EXE</div>
                  <div class="font-art text-2xl md:text-3xl mb-2 md:mb-3">> Games.</div>
                  <div class="text-sm md:text-base opacity-80 font-sans tracking-wide">SIMULATIONS</div>
                </div>
                <div class="absolute bottom-4 right-6 md:bottom-6 md:right-8 flex items-end gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)]">
                  <span class="text-[8px] mr-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">0x{{ hexCodes[3] }}</span>
                  <div class="w-[3px] h-4 bg-current"></div><div class="w-[2px] h-4 bg-current"></div><div class="w-[4px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pinned Nodes -->
          <div class="flex flex-col gap-4 md:gap-6 w-full lg:w-5/6">
            <div class="reveal border-b border-[var(--color-border)] pb-3 md:pb-4 text-sm md:text-base font-bold font-mono tracking-[0.2em] md:tracking-[0.3em]">
              <span class="text-[var(--color-text)]"><span class="animate-pulse text-[var(--color-brand)]">></span> RECOMMENDED_NODES</span>
            </div>
            
            <div class="flex flex-col gap-0 cyber-glass overflow-hidden reveal">
              <div 
                v-for="(item, index) in items" 
                :key="index" 
                class="p-4 sm:p-6 md:p-8 cursor-pointer relative group border-b border-[var(--color-border)] last:border-b-0 transition-all duration-500 hover:pl-8 sm:hover:pl-10 md:hover:pl-12 hover:bg-[rgba(107,143,114,0.05)] active:bg-[rgba(107,143,114,0.05)]" 
                @click="openLink(item.link)"
              >
                <!-- Hover Side Indicator -->
                <div class="absolute left-0 top-0 w-1 h-full bg-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 md:gap-3 relative z-10">
                  <span class="font-art font-bold text-xl md:text-2xl group-hover:text-[var(--color-brand)] transition-colors duration-300 flex items-center relative">
                    <i class="fa-solid fa-link text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -left-6"></i>
                    <span class="transition-all duration-300 group-hover:translate-x-1">{{ item.title }}</span>
                  </span>
                  <span class="opacity-0 group-hover:opacity-100 text-sm tracking-widest hidden sm:flex items-center gap-2 font-mono text-[var(--color-brand)] transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                    [CONNECT<span class="animate-pulse">_</span>] <i class="fa-solid fa-arrow-right"></i>
                  </span>
                </div>
                <div class="text-sm md:text-base opacity-70 group-hover:opacity-100 mt-2 md:mt-3 font-sans tracking-wide relative z-10 transition-opacity duration-300">{{ item.description }}</div>
              </div>
            </div>
          </div>
          
          <!-- Recent Log Highlight -->
          <div class="flex flex-col gap-4 md:gap-6 w-full lg:w-2/3 ml-auto text-right">
            <div class="reveal border-b border-[var(--color-border)] pb-3 md:pb-4 text-sm md:text-base font-bold justify-end flex font-mono tracking-[0.2em] md:tracking-[0.3em]">
              <span class="text-[var(--color-text)]"><span class="animate-pulse text-[var(--color-brand)]">></span> RECENT_LOG</span>
            </div>
            
            <div 
              class="reveal cyber-glass p-4 sm:p-6 md:p-8 cursor-pointer hover:border-[var(--color-brand)] active:border-[var(--color-brand)] group text-left transition-colors" 
              @click="$router.push(latestArticle ? '/article/' + latestArticle.slug : '/articles')"
            >
              <div v-if="latestArticle">
                <div class="flex justify-between items-center mb-2 md:mb-3">
                  <div class="text-xs opacity-60 font-mono tracking-widest">> TIMESTAMP: {{ latestArticle.date }}</div>
                  <div class="text-[10px] opacity-40 font-mono tracking-widest group-hover:opacity-80 group-hover:text-[var(--color-brand)] transition-all">HASH: 0x{{ hexCodes[0] }}</div>
                </div>
                <div class="font-art text-xl md:text-3xl mb-3 md:mb-4 leading-snug group-hover:text-[var(--color-brand)] transition-colors glitch-hover">{{ latestArticle.title }}</div>
                <div class="text-xs md:text-sm opacity-80 line-clamp-3 font-sans tracking-wide leading-relaxed">{{ latestArticle.summary }}</div>
                <div class="mt-4 flex flex-wrap gap-2">
                  <span v-for="tag in latestArticle.tags" :key="tag" class="text-[10px] border border-[var(--color-border)] px-2 py-0.5 uppercase font-mono tracking-widest group-hover:border-[var(--color-brand)] transition-colors">{{ tag }}</span>
                </div>
              </div>
              <div v-else class="text-sm md:text-base opacity-60 font-mono">NO_LOGS_FOUND_IN_DB</div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- End of File Decoration: Rain World Theme -->
    <section class="w-full relative overflow-hidden mt-10 md:mt-16 flex flex-col items-center justify-end text-center pb-12">
      
      <!-- Rain Canvas Container -->
      <div class="absolute inset-0 z-0 pointer-events-none opacity-60">
        <canvas ref="footerCanvasRef" class="w-full h-full object-cover"></canvas>
      </div>
      
      <!-- Fades -->
      <div class="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)] via-transparent to-[var(--color-bg)] z-10 pointer-events-none"></div>

      <!-- Content -->
      <div class="relative z-20 flex flex-col items-center gap-4 mt-12 drop-shadow-[0_0_10px_rgba(107,143,114,0.3)] reveal">
        
        <!-- Slugcat Pixel SVG -->
        <div class="slugcat-icon relative group cursor-pointer" title="The Survivor">
          <svg width="60" height="40" viewBox="0 0 15 10" class="drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">
            <!-- ears -->
            <rect x="2" y="1" width="3" height="4" fill="white" rx="1"/>
            <rect x="10" y="1" width="3" height="4" fill="white" rx="1"/>
            <!-- head -->
            <rect x="3" y="3" width="9" height="6" fill="white" rx="1.5"/>
            <rect x="2" y="4" width="11" height="4" fill="white"/>
            <!-- eyes -->
            <rect x="4.5" y="5" width="1.5" height="1.5" fill="black" rx="0.5"/>
            <rect x="9" y="5" width="1.5" height="1.5" fill="black" rx="0.5"/>
          </svg>
          <!-- Karma 10 (X) symbol floating above -->
          <div class="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 font-sans text-xl text-[var(--color-brand)] font-bold">
            X
          </div>
        </div>

        <div class="flex items-center gap-4 mt-2">
          <div class="text-sm md:text-base font-mono tracking-[0.5em] text-[var(--color-brand)] glitch-hover cursor-pointer font-bold">
            CYCLE_END
          </div>
        </div>
        <div class="text-xs opacity-50 font-mono tracking-widest max-w-sm text-[var(--color-text)] relative group-hover:opacity-100 transition-opacity">
          Awaiting the next downpour...
          <span class="absolute -right-6 top-0 animate-pulse text-[var(--color-brand)] opacity-80">_</span>
        </div>
      </div>
    </section>
  </div>
</template>
