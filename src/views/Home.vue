<script setup lang="ts">
import pinnedItems from '../data/pinned-items.json';
import projectsData from '../data/projects.json';
import ClockCard from '../components/ClockCard.vue';
import CalendarCard from '../components/CalendarCard.vue';
import MeCard from '../components/MeCard.vue';
import HitokotoCard from '../components/HitokotoCard.vue';
import ParticleText from '../components/ParticleText.vue';
import MusicCard from '../components/MusicCard.vue';
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useARGState } from '../composables/useARGState';
import { preloadOtherPages } from '../router/index';

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
    // Fade out previous frame for motion blur trails without painting a solid background
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

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

const isSlugcatEasterEgg = ref(false);
const karmaStage = ref(0);
const karmaSVGs = [
  "https://static.wikitide.net/rainworldwiki/2/27/Karma_1_icon_(small).png",
  "https://static.wikitide.net/rainworldwiki/f/fb/Karma_2_icon_(small).png",
  "https://static.wikitide.net/rainworldwiki/2/28/Karma_3_icon_(small).png",
  "https://static.wikitide.net/rainworldwiki/6/65/Karma_4_icon_(small).png",
  "https://static.wikitide.net/rainworldwiki/9/9e/Karma_5_icon_(small).png",
  "/img/karma/6.png",
  "/img/karma/7.png",
  "/img/karma/8.png",
  "/img/karma/9.png",
  "https://static.wikitide.net/rainworldwiki/f/f2/Karma_10_icon_(small).png"
];
const currentKarmaSVG = ref(karmaSVGs[9]);
let karmaInterval: number | null = null;
let audioCtx: any = null;

const playKarmaSequence = () => {
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Intense Bass Sweep
    const osc = audioCtx.createOscillator();
    const mainGain = audioCtx.createGain();
    osc.type = 'sawtooth';
    
    osc.frequency.setValueAtTime(30, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 2.8);
    
    mainGain.gain.setValueAtTime(0, audioCtx.currentTime);
    mainGain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.5);
    
    // Fast pulsing LFO
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4, audioCtx.currentTime); 
    lfo.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 2.8); 
    
    lfoGain.gain.value = 0.6;
    lfo.connect(lfoGain);
    lfoGain.connect(mainGain.gain);
    
    osc.connect(mainGain);
    mainGain.connect(audioCtx.destination);
    
    osc.start();
    lfo.start();
    
    // Explosion Flash
    setTimeout(() => {
      if (!audioCtx) return;
      osc.stop();
      lfo.stop();
      
      const bufferSize = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 2);
      
      const boomGain = audioCtx.createGain();
      boomGain.gain.setValueAtTime(1.5, audioCtx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2);
      
      noise.connect(filter);
      filter.connect(boomGain);
      boomGain.connect(audioCtx.destination);
      
      noise.start();
    }, 2800);
  } catch (e) {
    console.error('Audio failed', e);
  }
};

const terminalLines = ref<string[]>([]);

const triggerSlugcatEasterEgg = () => {
  if (karmaStage.value !== 0) return; // Prevent multiple clicks from breaking the animation timeline
  isSlugcatEasterEgg.value = true;
  karmaStage.value = 1;
  currentKarmaSVG.value = karmaSVGs[0];
  
  playKarmaSequence();
  
  // Uniform 2-second cycle for 1-9 to guarantee visibility, then hold Max Karma for 0.8s
  let currentIndex = 0;
  if (karmaInterval) clearInterval(karmaInterval);
  karmaInterval = null; 
  
  const tickDelays = new Array(9).fill(222); // 9 * 222ms = 1998ms (~2.0s)
  
  const tickSymbol = () => {
    if (currentIndex >= tickDelays.length) return;
    
    window.setTimeout(() => {
      currentIndex++;
      if (currentIndex < karmaSVGs.length) {
        currentKarmaSVG.value = karmaSVGs[currentIndex];
      }
      tickSymbol();
    }, tickDelays[currentIndex]);
  };
  
  tickSymbol();
  
  setTimeout(() => {
    if (karmaInterval) clearInterval(karmaInterval);
    currentKarmaSVG.value = karmaSVGs[9]; // Max Karma (10)
    karmaStage.value = 2; // White Flash explosion
    
    setTimeout(() => {
      karmaStage.value = 3; // Iterator Terminal Hack
      
      terminalLines.value = [];
      const lines = [
        "[SYS.FATAL] ARCHIVE INTEGRITY COMPROMISED",
        "ERR_0x000000FF: CYCLICAL ANOMALY DETECTED",
        "...",
        "> CONNECTION OVERRIDE BY LOCAL_GROUP_ITERATOR",
        "> IDENTIFICATION: FIVE_PEBBLES",
        " ",
        "PEBBLES: \"A little beast in my architecture?\"",
        "PEBBLES: \"I have nothing for you. Go away.\"",
        " ",
        "[ FORCING CONNECTION RESET ]"
      ];
      
      lines.forEach((line, index) => {
        setTimeout(() => {
          terminalLines.value.push(line);
          if (index === lines.length - 1) {
            setTimeout(() => {
              closeSlugcatEasterEgg();
            }, 2500);
          }
        }, index * 400 + (index > 5 ? 800 : 0));
      });
      
    }, 150);
  }, 2800);
};

const closeSlugcatEasterEgg = () => {
  isSlugcatEasterEgg.value = false;
  karmaStage.value = 0;
  terminalLines.value = [];
  if (karmaInterval) clearInterval(karmaInterval);
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
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
  
  preloadOtherPages();
  
  // Preload Karma Easter Egg SVGs/PNGs to prevent stuttering
  karmaSVGs.forEach(src => {
    const img = new Image();
    img.src = src;
  });
  
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
          class="flex-shrink-0 w-full xl:w-7/12 relative z-10 flex flex-col gap-8 transition-transform duration-75 hidden md:flex"
          :style="{ transform: `translateY(${scrollY * 0.15}px)`, opacity: Math.max(0, 1 - scrollY / 700) }"
        >
          <div class="animate-float-slow">
            <h1 class="w-full max-w-[850px] -mt-2" style="transform: translateX(45px);">
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
              SYSTEM_VERSION: 4.3.10<br>
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
          class="hidden md:flex flex-col items-end w-full xl:w-[480px] relative mt-16 xl:mt-0 transition-transform duration-75"
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
          <div class="w-full relative z-10 reveal hidden md:block">
            <HitokotoCard />
          </div>
        </div>
        
        <!-- Mobile Simple Banner Block -->
        <div class="w-full md:hidden flex flex-col items-center text-center -mt-16 sm:-mt-24">
          <div class="w-full max-w-[320px] mb-2 -ml-2">
            <ParticleText text="LanRhyme." />
          </div>
          <div class="font-mono text-[10px] opacity-60 tracking-widest uppercase">
            SYS_UPTIME: {{ sysUptime }} <span class="text-[var(--color-brand)] animate-pulse inline-block ml-1">_</span>
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

    <!-- Staggered Main Content (Offset Layout) / Mobile Bento Grid -->
    <section class="w-full max-w-[1400px] mx-auto px-4 md:px-12">
      <!-- On mobile: dense 2-column grid. On desktop: 12-column grid. -->
      <div class="grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-20 items-start relative">
        
        <!-- Left Column: Identity & Modules (Sticky on desktop, Bento parts on mobile) -->
        <div class="col-span-2 md:col-span-4 lg:col-span-3 grid grid-cols-2 gap-3 md:flex md:flex-col md:gap-8 md:sticky md:top-32 z-20">
          <div class="reveal-left col-span-2 md:col-span-1" style="transition-delay: 0.1s;"><MeCard /></div>
          
          <div class="col-span-1 md:col-span-1 flex flex-col gap-3 md:gap-8">
            <div class="reveal-left" style="transition-delay: 0.2s;"><ClockCard /></div>
            <div class="reveal-left flex-grow flex flex-col" style="transition-delay: 0.4s;"><MusicCard class="h-full flex-grow" /></div>
          </div>

          <div class="reveal-left col-span-1 md:col-span-1 flex flex-col" style="transition-delay: 0.3s;"><CalendarCard class="h-full flex-grow" /></div>
        </div>

        <!-- Right Column: Navigation & Content (Flows down) -->
        <div class="col-span-2 md:col-span-8 lg:col-span-9 flex flex-col gap-8 md:gap-24 pt-4 md:pt-8">
          
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
            
            <div class="grid grid-cols-2 gap-3 md:gap-6">
              <!-- Route Buttons as Cyber Blocks -->
              <div 
                class="col-span-2 reveal-scale cyber-glass p-4 md:p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[100px] md:min-h-[160px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] active:border-[var(--color-brand)]" 
                style="transition-delay: 0.1s;"
                @click="$router.push('/works')"
              >
                <div>
                  <div class="text-[10px] md:text-sm opacity-60 mb-1 md:mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors glitch-hover">01 / ARCHIVE</div>
                  <div class="font-art text-xl md:text-3xl mb-1 md:mb-3">> Works.</div>
                  <div class="text-[10px] md:text-base opacity-80 font-sans tracking-wide">CREATIVE PORTFOLIO</div>
                </div>
                <!-- Deco Barcode -->
                <div class="absolute bottom-4 right-6 md:bottom-6 md:right-8 flex items-end gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)]">
                  <span class="text-[8px] mr-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">0x{{ hexCodes[0] }}</span>
                  <div class="w-[2px] h-4 bg-current"></div><div class="w-[4px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div><div class="w-[3px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div>
                </div>
              </div>

              <div 
                class="col-span-1 reveal-scale cyber-glass p-4 md:p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[100px] md:min-h-[160px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] active:border-[var(--color-brand)]" 
                style="transition-delay: 0.2s;"
                @click="$router.push('/projects')"
              >
                <div>
                  <div class="text-[10px] md:text-sm opacity-60 mb-1 md:mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors glitch-hover">02 / DEPLOYMENTS</div>
                  <div class="font-art text-lg md:text-3xl mb-1 md:mb-3">> Projects.</div>
                  <div class="text-[10px] md:text-base opacity-80 line-clamp-1 font-sans tracking-wide truncate">LATEST: {{ latestProject?.title?.toUpperCase() || 'NULL' }}</div>
                </div>
                <div class="absolute bottom-4 right-6 md:bottom-6 md:right-8 flex items-end gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)]">
                  <span class="text-[8px] mr-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">0x{{ hexCodes[1] }}</span>
                  <div class="w-[1px] h-4 bg-current"></div><div class="w-[3px] h-4 bg-current"></div><div class="w-[2px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div><div class="w-[4px] h-4 bg-current"></div>
                </div>
              </div>

              <div 
                class="col-span-1 reveal-scale cyber-glass p-4 md:p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[100px] md:min-h-[160px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] active:border-[var(--color-brand)]" 
                style="transition-delay: 0.3s;"
                @click="$router.push('/articles')"
              >
                <div>
                  <div class="text-[10px] md:text-sm opacity-60 mb-1 md:mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors glitch-hover">03 / LOGS</div>
                  <div class="font-art text-lg md:text-3xl mb-1 md:mb-3">> Articles.</div>
                  <div class="text-[10px] md:text-base opacity-80 font-sans tracking-wide truncate">TECHNICAL & THOUGHTS</div>
                </div>
                <div class="absolute bottom-4 right-6 md:bottom-6 md:right-8 flex items-end gap-[3px] opacity-20 group-hover:opacity-80 transition-opacity group-hover:text-[var(--color-brand)]">
                  <span class="text-[8px] mr-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono">0x{{ hexCodes[2] }}</span>
                  <div class="w-[4px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div><div class="w-[2px] h-4 bg-current"></div><div class="w-[3px] h-4 bg-current"></div><div class="w-[1px] h-4 bg-current"></div>
                </div>
              </div>

              <div 
                class="col-span-2 reveal-scale cyber-glass p-4 md:p-8 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[100px] md:min-h-[160px] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_var(--color-brand)] hover:border-[var(--color-brand)] active:border-[var(--color-brand)]" 
                style="transition-delay: 0.4s;"
                @click="$router.push('/games')"
              >
                <div>
                  <div class="text-[10px] md:text-sm opacity-60 mb-1 md:mb-4 font-mono tracking-widest group-hover:text-[var(--color-brand)] transition-colors glitch-hover">04 / EXE</div>
                  <div class="font-art text-xl md:text-3xl mb-1 md:mb-3">> Games.</div>
                  <div class="text-[10px] md:text-base opacity-80 font-sans tracking-wide">SIMULATIONS</div>
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
    <section class="w-full relative mt-16 md:mt-24 pt-16 flex flex-col items-center justify-end text-center pb-12">
      
      <!-- Rain Canvas Container with Smooth Fade Mask -->
      <div 
        class="absolute inset-0 z-0 pointer-events-none opacity-50"
        style="mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%);"
      >
        <canvas ref="footerCanvasRef" class="w-full h-full object-cover"></canvas>
      </div>

      <!-- Content -->
      <div class="relative z-20 flex flex-col items-center gap-4 mt-8 md:mt-12 drop-shadow-[0_0_10px_rgba(107,143,114,0.3)] reveal">
        
        <!-- Slugcat Pixel SVG -->
        <div class="slugcat-icon relative group cursor-pointer" title="The Survivor" @click="triggerSlugcatEasterEgg">
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

    <!-- Rain World Sensory Overload Easter Egg UI -->
    <transition name="ascension-fade">
      <div v-if="isSlugcatEasterEgg" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
        
        <!-- White Flash Overlay -->
        <div v-if="karmaStage === 2" class="absolute inset-0 z-50 bg-white" style="animation: whiteFlash 0.5s ease-out forwards;"></div>

        <!-- Stage 1: Heavy Shake Container -->
        <div v-if="karmaStage === 1" class="relative z-10 w-full h-full flex flex-col items-center justify-center animate-heavy-shake">

          <div class="relative z-10 flex flex-col items-center justify-center w-full h-full" @click.stop>
            
            <!-- 3D Karma Rings -->
            <div class="relative flex items-center justify-center mb-16 md:mb-24" style="perspective: 1200px;">
              <div class="absolute w-[200px] h-[200px] md:w-[350px] md:h-[350px] rounded-full mix-blend-screen transition-all duration-100 border-[3px] border-[rgba(255,0,0,0.6)] animate-[spin_0.3s_linear_infinite] scale-110"></div>
              <div class="absolute w-[280px] h-[280px] md:w-[480px] md:h-[480px] rounded-full mix-blend-screen transition-all duration-100 border-[2px] border-[rgba(255,0,0,0.4)] animate-[spin_0.5s_linear_infinite_reverse] scale-110"></div>
              <div class="absolute w-[360px] h-[360px] md:w-[600px] md:h-[600px] rounded-full mix-blend-screen transition-all duration-100 border-[1px] border-[rgba(255,0,0,0.2)] animate-[spin_0.8s_linear_infinite] scale-110"></div>
              
              <!-- Central Glyph (Pixel Art PNG) -->
              <div class="relative z-10 w-24 h-24 md:w-36 md:h-36 select-none transition-all duration-75 flex items-center justify-center" :class="karmaStage === 1 ? 'scale-125' : 'karma-glyph-anim scale-100'">
                <img :src="currentKarmaSVG" class="w-full h-full object-contain pointer-events-none transition-all duration-75" style="image-rendering: pixelated;" :class="karmaStage === 1 ? 'drop-shadow-[0_0_30px_rgba(255,0,0,1)]' : 'drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]'" alt="Karma Symbol" />
              </div>
            </div>
          </div>
        </div>

        <!-- Stage 3: Iterator Hack Terminal -->
        <div v-if="karmaStage === 3" class="relative z-40 w-full h-full flex flex-col justify-center items-center bg-black">
          <!-- Terminal CRT scanlines -->
          <div class="absolute inset-0 pointer-events-none opacity-20" style="background: repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px);"></div>
          
          <div class="w-full max-w-3xl px-8 text-left font-mono text-[var(--color-brand)] text-sm md:text-xl leading-relaxed tracking-widest drop-shadow-[0_0_8px_var(--color-brand)] glitch-text">
            <div v-for="(line, index) in terminalLines" :key="index" class="min-h-[1.5em] mb-2" :class="line.includes('FATAL') || line.includes('ERR') ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : (line.includes('PEBBLES:') ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]' : '')">
              {{ line }}<span v-if="index === terminalLines.length - 1" class="animate-pulse inline-block ml-2 w-2 h-4 bg-current align-middle"></span>
            </div>
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<style scoped>
@keyframes heavyShake {
  0% { transform: translate(0, 0) rotate(0deg); filter: hue-rotate(0deg); }
  25% { transform: translate(-10px, 10px) rotate(-1deg); filter: hue-rotate(90deg) invert(0.2); }
  50% { transform: translate(10px, -10px) rotate(1deg); filter: hue-rotate(-90deg) invert(0); }
  75% { transform: translate(-10px, -10px) rotate(-0.5deg); filter: hue-rotate(45deg); }
  100% { transform: translate(10px, 10px) rotate(0.5deg); filter: hue-rotate(0deg); }
}

.animate-heavy-shake {
  animation: heavyShake 0.1s infinite;
}

@keyframes whiteFlash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

.ascension-fade-enter-active,
.ascension-fade-leave-active {
  transition: opacity 1.5s ease-in-out;
}
.ascension-fade-enter-from,
.ascension-fade-leave-to {
  opacity: 0;
}

.glitch-text {
  animation: glitch 0.2s linear infinite;
}
@keyframes glitch {
  0%, 100% { transform: translate(0); text-shadow: 0 0 8px currentColor; }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(-1px, -1px); }
  60% { transform: translate(2px, 1px); }
  80% { transform: translate(1px, -1px); }
}
</style>
