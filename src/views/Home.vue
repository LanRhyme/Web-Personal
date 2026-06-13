<script setup lang="ts">
import pinnedItems from '../data/pinned-items.json';
import projectsData from '../data/projects.json';
import ClockCard from '../components/ClockCard.vue';
import CalendarCard from '../components/CalendarCard.vue';
import MeCard from '../components/MeCard.vue';
import anime from 'animejs';
import ParticleText from '../components/ParticleText.vue';
import MusicCard from '../components/MusicCard.vue';
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useARGState } from '../composables/useARGState';
import { useRainCycle } from '../composables/useRainCycle';
import { preloadOtherPages } from '../router/index';

// Load generated ASCII avatar if available
import asciiAvatarData from '../data/avatar-ascii.json';

const router = useRouter();
const { accelerateCycle } = useRainCycle();

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

// Removed old footer canvas in favor of GlobalRain.vue

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

const triggerShake = () => {
  document.body.classList.add('shake-active');
  accelerateCycle();
  setTimeout(() => document.body.classList.remove('shake-active'), 150);
};
// Hitokoto Logic
const hitokotoText = ref("在这个下雨的废墟中寻找哪怕是一丝的光芒。");
const hitokotoFrom = ref("System");
const fetchHitokoto = async () => {
  try {
    const res = await fetch('https://v1.hitokoto.cn');
    const data = await res.json();
    if (data.hitokoto) {
      hitokotoText.value = data.hitokoto;
      hitokotoFrom.value = data.from || 'Unknown';
    }
  } catch (err) {
    console.error('Hitokoto fetch error:', err);
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
  
  fetchHitokoto();
  
  updateUptime();
  uptimeInterval = window.setInterval(updateUptime, 1000);
  
  preloadOtherPages();
  
  karmaSVGs.forEach(src => {
    const img = new Image();
    img.src = src;
  });
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('keydown', handleKeyDown);
  handleScroll();

  nextTick(() => {
    setupScrollReveal();
    
    // Anime.js Entry Animations
    const tl = anime.timeline({
      easing: 'easeOutElastic(1, .8)',
      duration: 1500
    });
    tl.add({
      targets: '.anime-fade-up',
      translateY: [50, 0],
      opacity: [0, 1],
      delay: anime.stagger(150, {start: 300})
    })
    .add({
      targets: '.anime-glitch',
      opacity: [0, 1, 0.5, 1, 0.8, 1],
      duration: 800,
      easing: 'linear',
      delay: anime.stagger(100)
    }, '-=1000')
    .add({
      targets: '.cyber-glass',
      scale: [0.95, 1],
      opacity: [0, 1],
      delay: anime.stagger(100)
    }, '-=800');
    // Repel Effect
    const glassElements = document.querySelectorAll('.cyber-glass');
    const handleRepel = (e: MouseEvent) => {
      glassElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        if (distance < 250) {
          const force = (250 - distance) / 250;
          const moveX = -(distX / distance) * force * 15;
          const moveY = -(distY / distance) * force * 15;
          anime({ targets: el, translateX: moveX, translateY: moveY, duration: 100, easing: 'easeOutQuad' });
        } else {
          anime({ targets: el, translateX: 0, translateY: 0, duration: 300, easing: 'easeOutElastic(1, .5)' });
        }
      });
    };
    window.addEventListener('mousemove', handleRepel);
    (window as any)._cleanupRepel = () => window.removeEventListener('mousemove', handleRepel);
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if ((window as any)._cleanupRepel) (window as any)._cleanupRepel();
});
</script>

<template>
  <div class="w-full font-sans text-[var(--color-text)] flex flex-col gap-16 sm:gap-24 pb-24 pt-[40px] sm:pt-[56px] md:pt-[72px]">
    
    <!-- Hero Section (Parallax & Typographic) -->
    <section class="h-[85vh] w-full relative overflow-hidden flex flex-col justify-center items-center -mt-[40px] sm:-mt-[56px] md:-mt-[72px]">
      
      <!-- TITLE ONLY: Absolutely Centered (Vertically & Horizontally) -->
      <div 
        class="absolute top-[45%] left-1/2 z-20 flex flex-col items-center w-full pointer-events-none hidden md:flex"
        :style="{ transform: `translate(calc(-50% + 55px), calc(-50% + ${scrollY * 0.3}px)) scale(${1 + scrollY * 0.0005})`, opacity: Math.max(0, 1 - scrollY / 400), filter: `blur(${scrollY * 0.015}px)` }"
      >
        <div class="anime-fade-up">
          <h1 class="w-full max-w-[850px] m-0 p-0 pointer-events-auto cursor-pointer no-cursor-snap transition-transform hover:scale-[1.02] active:scale-[0.98]" @click="triggerShake">
            <ParticleText text="LanRhyme." />
          </h1>
        </div>
      </div>

      <!-- Mobile Title (Hidden on md) -->
      <div class="w-full md:hidden flex flex-col items-center text-center absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div class="w-full max-w-[320px] mb-2 -ml-2 anime-fade-up cursor-pointer no-cursor-snap active:scale-[0.98] transition-transform" @click="triggerShake">
          <ParticleText text="LanRhyme." />
        </div>
      </div>

      <!-- HUD Layout: Other components arranged at the bottom corners -->
      <div 
        class="absolute bottom-8 md:bottom-12 w-full max-w-[1400px] px-4 md:px-12 flex flex-col md:flex-row justify-between items-end z-10"
        :style="{ transform: `translateY(${scrollY * 0.15}px)`, opacity: Math.max(0, 1 - scrollY / 600) }"
      >
        <!-- Left: Subtitle & Iterator Status -->
        <div class="flex flex-col gap-6 w-full md:w-1/2">
          <div class="anime-fade-up">
            <p class="font-mono text-base md:text-lg text-[var(--color-text-dim)] leading-relaxed tracking-wide text-left hidden md:block">
              Designing <span class="text-[var(--color-text)] border-b border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors">digital ruins</span> &amp;<br>
              building <span class="text-[var(--color-text)] border-b border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors">holographic systems</span>.
            </p>
          </div>
          
          <div class="flex flex-col gap-2 anime-glitch hidden md:flex">
            <div class="text-xs sm:text-sm tracking-[0.3em] uppercase font-mono text-[var(--color-text-dim)] text-left">
              <span class="text-[var(--color-brand)] font-bold animate-pulse">> ITERATOR: ONLINE</span><br>
              SYSTEM_CYCLE: 4.3.10<br>
              UPTIME_SINCE_LAST_RAIN: <span class="text-[var(--color-text)]">{{ sysUptime }}</span>
            </div>
            <div class="text-[10px] md:text-xs opacity-40 font-mono tracking-widest mt-2 text-left hidden md:block">
              [WARNING: HIGH_END_TERMINAL_ENABLED]<br>
              AWAITING_FURTHER_INSTRUCTIONS...
            </div>
          </div>
        </div>

        <!-- Right: Holographic Log -->
        <div class="hidden md:flex flex-col items-end w-full max-w-[400px] relative">
          <div 
            class="w-full relative z-10 anime-fade-up cyber-glass p-6 text-left opacity-80 backdrop-blur-md cursor-pointer hover:bg-[rgba(16,185,129,0.02)] transition-all duration-500 ease-out"
            @click="fetchHitokoto"
          >
            <div class="text-[10px] font-mono tracking-widest text-[var(--color-text-dim)] mb-2 flex justify-between">
              <span>// RECOVERED_DATA_FRAGMENT</span>
              <span class="text-[var(--color-brand)] animate-pulse">■</span>
            </div>
            <transition name="glitch-fade" mode="out-in">
              <div :key="hitokotoText" class="w-full">
                <div class="font-art text-lg md:text-xl text-[var(--color-text)] leading-relaxed italic opacity-90 glitch-hover hitokoto-text">
                  "{{ hitokotoText }}"
                </div>
                <div class="text-right mt-3 text-xs font-mono tracking-widest text-[var(--color-text-dim)]">
                  - {{ hitokotoFrom }}
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <div 
        class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 transition-opacity duration-500"
        :class="scrollY > 50 ? 'opacity-0 pointer-events-none' : 'opacity-30'"
      >
        <div class="text-[10px] font-mono tracking-[0.3em] text-[var(--color-brand)] animate-pulse">DESCEND</div>
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

    <!-- Staggered Main Content (Floating Debris Layout) -->
    <section class="w-full max-w-[1400px] mx-auto px-4 md:px-12 relative mt-[15vh] md:mt-[25vh]">
      
      <!-- Corrupted Topology Lines Background (Iterator Neuromatrix) -->
      <div 
        class="absolute inset-0 pointer-events-none z-0 opacity-20 transition-transform duration-75"
        :style="{ transform: `translateY(${scrollY * 0.15}px)` }"
      >
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--color-brand)" stop-opacity="0" />
              <stop offset="50%" stop-color="var(--color-brand)" stop-opacity="1" />
              <stop offset="100%" stop-color="var(--color-brand)" stop-opacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M 100,100 L 250,150 L 300,400 L 500,450 L 700,200 L 900,250" fill="none" stroke="url(#neonGradient)" stroke-width="1.5" stroke-dasharray="10 5 2 5" filter="url(#glow)" class="animate-pulse" />
          <path d="M 800,100 L 700,300 L 800,600 L 1000,700" fill="none" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="5 5" />
          <path d="M 50,500 L 200,600 L 350,550 L 400,800" fill="none" stroke="url(#neonGradient)" stroke-width="2" stroke-dasharray="20 10" filter="url(#glow)" opacity="0.5" />
          
          <!-- Nodes -->
          <circle cx="250" cy="150" r="3" fill="var(--color-brand)" filter="url(#glow)"/>
          <circle cx="500" cy="450" r="4" fill="var(--color-brand)" filter="url(#glow)"/>
          <circle cx="700" cy="200" r="2" fill="var(--color-brand)"/>
          <circle cx="200" cy="600" r="3" fill="var(--color-brand)"/>
        </svg>
      </div>

      <!-- Debris Layout Container -->
      <div class="flex flex-col md:flex-row flex-wrap justify-center items-start gap-8 md:gap-16 relative">
        
        <!-- Identity & Modules (Scattered on Desktop) -->
        <div 
          class="w-full md:w-[30%] flex flex-col gap-8 md:mt-24 z-20 transition-transform duration-75"
          :style="{ transform: `translateY(${Math.max(0, scrollY - 300) * 0.08}px)` }"
        >
          <div class="reveal-left"><div class="cyber-glass p-1 transform md:-rotate-1 hover:rotate-0 transition-all duration-500"><MeCard /></div></div>
          <div class="reveal-left" style="transition-delay: 100ms;"><div class="cyber-glass p-1 transform md:rotate-2 hover:rotate-0 transition-all duration-500 md:ml-[-10%]"><ClockCard /></div></div>
          <div class="reveal-left" style="transition-delay: 200ms;"><div class="cyber-glass p-1 transition-all duration-500"><MusicCard class="h-full flex-grow" /></div></div>
          <div class="reveal-left" style="transition-delay: 300ms;"><div class="cyber-glass p-1 transform md:-rotate-2 hover:rotate-0 transition-all duration-500 md:ml-[10%]"><CalendarCard class="h-full flex-grow" /></div></div>
        </div>

        <!-- Navigation & Content (Floating right side) -->
        <div class="w-full md:w-[60%] flex flex-col gap-16 pt-4 md:pt-8">
          
          <!-- Route Buttons as Holographic Terminals -->
          <div class="flex flex-col gap-6 relative">
            <div class="absolute -top-12 -left-8 font-art text-[60px] md:text-[100px] leading-none opacity-[0.03] text-[var(--color-text)] pointer-events-none z-[-1] tracking-tighter whitespace-nowrap transition-transform duration-75" :style="{ transform: `translateX(${scrollY * 0.05}px)` }">
              ARCHIVE_NODE
            </div>

            <div class="border-b border-[var(--color-border)] pb-2 text-sm font-bold flex justify-between font-mono tracking-[0.3em] opacity-80">
              <span><span class="animate-pulse text-[var(--color-brand)]">></span> SYS.EXPLORE</span>
              <span class="opacity-30">DIR_LIST</span>
            </div>
            
            <div class="flex flex-col gap-6">
              <div class="reveal-right">
                <div class="cyber-glass p-6 md:p-10 cursor-pointer group flex flex-col md:flex-row justify-between items-start md:items-end transition-all duration-500 hover:ml-4 hover:shadow-[0_10px_30px_-10px_rgba(74,124,89,0.3)]" @click="$router.push('/works')">
                  <div>
                    <div class="text-[10px] opacity-40 font-mono tracking-widest mb-2 group-hover:text-[var(--color-brand)] transition-colors">01 / ARCHIVE</div>
                    <div class="font-art text-2xl md:text-4xl mb-1">> Works.</div>
                    <div class="text-xs opacity-60 font-sans tracking-widest">CREATIVE PORTFOLIO</div>
                  </div>
                  <div class="text-[8px] font-mono opacity-20 group-hover:opacity-100 group-hover:text-[var(--color-brand)] transition-all mt-4 md:mt-0">
                    HASH: 0x{{ hexCodes[0] }} <span class="animate-pulse">_</span>
                  </div>
                </div>
              </div>

              <div class="reveal-right" style="transition-delay: 100ms;">
                <div class="cyber-glass p-6 md:p-10 cursor-pointer group flex flex-col md:flex-row justify-between items-start md:items-end transition-all duration-500 hover:ml-4 hover:shadow-[0_10px_30px_-10px_rgba(74,124,89,0.3)] md:ml-[5%]" @click="$router.push('/projects')">
                  <div>
                    <div class="text-[10px] opacity-40 font-mono tracking-widest mb-2 group-hover:text-[var(--color-brand)] transition-colors">02 / DEPLOYMENTS</div>
                    <div class="font-art text-2xl md:text-4xl mb-1">> Projects.</div>
                    <div class="text-xs opacity-60 font-sans tracking-widest">LATEST: {{ latestProject?.title?.toUpperCase() || 'NULL' }}</div>
                  </div>
                  <div class="text-[8px] font-mono opacity-20 group-hover:opacity-100 group-hover:text-[var(--color-brand)] transition-all mt-4 md:mt-0">
                    HASH: 0x{{ hexCodes[1] }} <span class="animate-pulse">_</span>
                  </div>
                </div>
              </div>

              <div class="reveal-right" style="transition-delay: 200ms;">
                <div class="cyber-glass p-6 md:p-10 cursor-pointer group flex flex-col md:flex-row justify-between items-start md:items-end transition-all duration-500 hover:ml-4 hover:shadow-[0_10px_30px_-10px_rgba(74,124,89,0.3)] md:ml-[10%]" @click="$router.push('/articles')">
                  <div>
                    <div class="text-[10px] opacity-40 font-mono tracking-widest mb-2 group-hover:text-[var(--color-brand)] transition-colors">03 / LOGS</div>
                    <div class="font-art text-2xl md:text-4xl mb-1">> Articles.</div>
                    <div class="text-xs opacity-60 font-sans tracking-widest">TECHNICAL & THOUGHTS</div>
                  </div>
                  <div class="text-[8px] font-mono opacity-20 group-hover:opacity-100 group-hover:text-[var(--color-brand)] transition-all mt-4 md:mt-0">
                    HASH: 0x{{ hexCodes[2] }} <span class="animate-pulse">_</span>
                  </div>
                </div>
              </div>
              
              <div class="reveal-right" style="transition-delay: 300ms;">
                <div class="cyber-glass p-6 md:p-10 cursor-pointer group flex flex-col md:flex-row justify-between items-start md:items-end transition-all duration-500 hover:ml-4 hover:shadow-[0_10px_30px_-10px_rgba(74,124,89,0.3)] md:ml-[15%]" @click="$router.push('/games')">
                  <div>
                    <div class="text-[10px] opacity-40 font-mono tracking-widest mb-2 group-hover:text-[var(--color-brand)] transition-colors">04 / EXE</div>
                    <div class="font-art text-2xl md:text-4xl mb-1">> Games.</div>
                    <div class="text-xs opacity-60 font-sans tracking-widest">SIMULATIONS</div>
                  </div>
                  <div class="text-[8px] font-mono opacity-20 group-hover:opacity-100 group-hover:text-[var(--color-brand)] transition-all mt-4 md:mt-0">
                    HASH: 0x{{ hexCodes[3] }} <span class="animate-pulse">_</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pinned Nodes / Ancient Communications -->
          <div class="flex flex-col gap-6 mt-12">
            <div class="border-b border-[var(--color-border)] pb-2 text-sm font-bold font-mono tracking-[0.3em] opacity-80">
              <span><span class="animate-pulse text-[var(--color-brand)]">></span> COMM_CHANNELS</span>
            </div>
            
            <div class="flex flex-col gap-2">
              <div 
                v-for="(item, index) in items" 
                :key="index" 
                class="reveal-right" 
                :style="`transition-delay: ${index * 100}ms;`"
              >
                <div class="cyber-glass p-5 cursor-pointer relative group transition-all duration-500 hover:pl-8 active:scale-[0.98]" @click="openLink(item.link)">
                  <div class="absolute left-0 top-0 w-1 h-full bg-[var(--color-brand)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="flex justify-between items-center">
                    <span class="font-art font-bold text-lg md:text-xl group-hover:text-[var(--color-brand)] transition-colors duration-300">{{ item.title }}</span>
                    <span class="opacity-0 group-hover:opacity-100 text-xs tracking-widest font-mono text-[var(--color-brand)] transition-all duration-500 translate-x-4 group-hover:translate-x-0 hidden sm:block">
                      [CONNECT]
                    </span>
                  </div>
                  <div class="text-xs md:text-sm opacity-50 mt-1 font-sans tracking-wide">{{ item.description }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Recent Log Highlight -->
          <div class="flex flex-col gap-6 mt-12">
            <div class="border-b border-[var(--color-border)] pb-2 text-sm font-bold font-mono tracking-[0.3em] opacity-80 text-right">
              <span>RECENT_LOG <span class="animate-pulse text-[var(--color-brand)]"><</span></span>
            </div>
            
            <div class="reveal">
              <div 
                class="cyber-glass p-8 md:p-12 cursor-pointer group text-left transition-all duration-500 hover:-translate-y-2" 
                @click="$router.push(latestArticle ? '/article/' + latestArticle.slug : '/articles')"
              >
                <div v-if="latestArticle">
                  <div class="flex justify-between items-center mb-4">
                    <div class="text-[10px] opacity-40 font-mono tracking-widest">> TS: {{ latestArticle.date }}</div>
                    <div class="text-[10px] opacity-20 font-mono tracking-widest group-hover:opacity-80 group-hover:text-[var(--color-brand)] transition-all">0x{{ hexCodes[0] }}</div>
                  </div>
                  <div class="font-art text-2xl md:text-4xl mb-4 leading-snug group-hover:text-[var(--color-brand)] transition-colors">{{ latestArticle.title }}</div>
                  <div class="text-sm opacity-60 font-sans tracking-wide leading-relaxed">{{ latestArticle.summary }}</div>
                  <div class="mt-6 flex flex-wrap gap-2">
                    <span v-for="tag in latestArticle.tags" :key="tag" class="text-[9px] border border-[var(--color-border)] px-2 py-1 uppercase font-mono tracking-widest group-hover:border-[var(--color-brand)] transition-colors opacity-60 group-hover:opacity-100">{{ tag }}</span>
                  </div>
                </div>
                <div v-else class="text-sm opacity-40 font-mono text-center py-8">NO_LOGS_FOUND_IN_DB</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- End of File Decoration: Rain World Theme -->
    <section class="w-full relative mt-16 md:mt-24 pt-16 flex flex-col items-center justify-end text-center pb-12">

      <!-- Content -->
      <div class="relative z-20 flex flex-col items-center gap-4 mt-8 md:mt-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] reveal">
        
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
