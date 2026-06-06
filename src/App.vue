<script setup lang="ts">
import NavBar from './components/NavBar.vue';
import Footer from './components/Footer.vue';
import Background3D from './components/Background3D.vue';
import Preloader from './components/Preloader.vue';
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Lenis from 'lenis';
import asciiAvatarData from './data/avatar-ascii.json';
import { useARGState } from './composables/useARGState';
import { argDialogues } from './data/arg-dialogues';

const isLoaded = ref(false);
const router = useRouter();
const route = useRoute();
const { initTheme, themeUnlocked, themeActive, toggleTheme, argStarted, petDark, startARG, hasKey, terminalUnlocked } = useARGState();
const argTriggerCount = ref(0);

const asciiAvatar = ref(asciiAvatarData?.ascii || '');
const showAsciiOverlay = ref(false);

const handlePreloaderComplete = () => {
  isLoaded.value = true;
};

const isAdmin = computed(() => route.path.startsWith('/admin'));
const isWorldview = computed(() => route.path === '/worldview');

// --- Custom Physics Cursor (Square Framing style) ---
const mouseX = ref(window.innerWidth / 2);
const mouseY = ref(window.innerHeight / 2);

const targetX = ref(window.innerWidth / 2);
const targetY = ref(window.innerHeight / 2);
const frameX = ref(window.innerWidth / 2);
const frameY = ref(window.innerHeight / 2);

const targetW = ref(24);
const targetH = ref(24);
const frameW = ref(24);
const frameH = ref(24);

const scrollProgress = ref(0);

const isHovering = ref(false);
const isClicking = ref(false);
let hoveredElement: HTMLElement | null = null;

// --- Simulated HUD Metrics ---
const cpuLoad = ref(12);
const memLoad = ref(45.2);

let hudTimer: number | null = null;
const updateHudMetrics = () => {
  if (Math.random() > 0.85) {
    cpuLoad.value = Math.floor(Math.random() * 60) + 30; // Spikes
  } else {
    cpuLoad.value = Math.floor(Math.random() * 15) + 2; // Idle
  }
  memLoad.value = Math.max(20, Math.min(85, memLoad.value + (Math.random() * 4 - 2)));
};

// --- Click Ripples ---
const clickRipples = ref<{id: number, x: number, y: number}[]>([]);
let rippleIdCounter = 0;

const addClickRipple = (x: number, y: number) => {
  const id = rippleIdCounter++;
  clickRipples.value.push({ id, x, y });
  setTimeout(() => {
    clickRipples.value = clickRipples.value.filter(r => r.id !== id);
  }, 800);
};

// --- Konami Code Easter Egg ---
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;
const isRedAlert = ref(false);

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
};

const triggerRedAlert = () => {
  if (isRedAlert.value) return;
  isRedAlert.value = true;
  document.documentElement.classList.add('red-alert');
  petTalking('WARNING! UNAUTHORIZED ACCESS DETECTED!');
  setTimeout(() => {
    isRedAlert.value = false;
    document.documentElement.classList.remove('red-alert');
    petTalking('System Restored. (Phew!)');
  }, 5000);
};

const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

let animationFrameId: number;
const renderCursor = () => {
  frameX.value = lerp(frameX.value, targetX.value, 0.25);
  frameY.value = lerp(frameY.value, targetY.value, 0.25);
  frameW.value = lerp(frameW.value, targetW.value, 0.25);
  frameH.value = lerp(frameH.value, targetH.value, 0.25);
  animationFrameId = requestAnimationFrame(renderCursor);
};

const updateHoverRect = () => {
  if (hoveredElement && isHovering.value) {
    const rect = hoveredElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Magnetic Pull (Parallax effect)
    const pullX = (mouseX.value - centerX) * 0.2;
    const pullY = (mouseY.value - centerY) * 0.2;
    
    targetX.value = centerX + pullX;
    targetY.value = centerY + pullY;
    targetW.value = rect.width + 16;
    targetH.value = rect.height + 16;
  }
};

const updateMouse = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;

  // Set CSS variables for high-end glowing spotlight backdrop in CSS
  document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);

  const target = e.target as HTMLElement;
  const clickable = target.closest('a') || target.closest('button') || target.closest('.cursor-pointer') || target.closest('.nav-link');
  
  if (clickable) {
    isHovering.value = true;
    hoveredElement = clickable as HTMLElement;
    updateHoverRect();
  } else {
    isHovering.value = false;
    hoveredElement = null;
    targetX.value = e.clientX;
    targetY.value = e.clientY;
    targetW.value = 24;
    targetH.value = 24;
  }
};

// --- 3D Fluid Geometry Background ---

// --- Brutalist AI Companion (LanPet Refactor) ---
const petState = ref<'idle' | 'happy' | 'working' | 'active'>('idle');
const petHappiness = ref(85);
const bubbleText = ref('');
const eyeRotation = computed(() => {
  // AI eye tracking mouse
  const petScreenX = window.innerWidth - 60; 
  const petScreenY = window.innerHeight - 60;
  const dx = mouseX.value - petScreenX;
  const dy = mouseY.value - petScreenY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return angle;
});

const idleDialogues = [
  '好无聊呀...( ´ ▽ ` )',
  '今天天气真不错～(o^▽^o)',
  '要不要点点我？(✧ω✧)',
  '随时待命！(๑>ᴗ<๑)',
  '发现了一名可爱的访客！(≧◡≦)',
  '发呆中... (￣▽￣*)',
  '听说按下F12会有惊喜哦...(¬‿¬)',
  '试试键盘输入：上上下下左右左右BA？(✧ω✧)',
  '嘘...长按我可以查看核心数据！(｀・ω・´)',
  '在屏幕上随便点点看？有波纹哦~(￣▽￣)'
];

const hoverDialogues = [
  '哇，你发现我啦！(*^ω^*)',
  '有什么吩咐吗主人？(☆▽☆)',
  '贴贴！(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)',
  '好痒，不要碰我啦...(*/_＼)'
];

const happyDialogues = [
  '开心开心！o(≧▽≦)o',
  '谢谢你的摸摸！(๑˃ᴗ˂)ﻭ',
  '能量充满啦！(★ω★)',
  '最喜欢你啦！♡( ◡‿◡ )'
];

const routeDialogues = [
  '准备出发啦！(￣^￣)ゞ',
  '正在进入新区域...(⌐■_■)',
  '努力加载中...！(⊃｡•́‿•̀｡)⊃'
];

const getRandomText = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

let petTalkTimer: number | null = null;
const petTalking = (text: string) => {
  bubbleText.value = text;
  if (petTalkTimer) clearTimeout(petTalkTimer);
  petTalkTimer = window.setTimeout(() => {
    if (bubbleText.value === text) {
      bubbleText.value = '';
    }
  }, 4000);
};

// ARG pet guidance
const getArgHint = (): string | null => {
  if (!argStarted.value) return null;
  
  if (route.path === '/' && !hasKey('BREATH_WHITE')) {
    return argDialogues.fragment1_hint[Math.floor(Math.random() * argDialogues.fragment1_hint.length)];
  }
  if (route.path === '/projects' && !hasKey('CHORD_PATTERN')) {
    return argDialogues.fragment2_hint[Math.floor(Math.random() * argDialogues.fragment2_hint.length)];
  }
  if (route.path === '/games' && !hasKey('SOS_ECHO')) {
    return argDialogues.fragment3_hint[Math.floor(Math.random() * argDialogues.fragment3_hint.length)];
  }
  if (hasKey('BREATH_WHITE') && hasKey('CHORD_PATTERN') && hasKey('SOS_ECHO') && !terminalUnlocked.value) {
    return argDialogues.phase2_hint[0];
  }
  return null;
};

const onFragmentFound = (e: Event) => {
  const detail = (e as CustomEvent).detail;
  if (detail?.key === 'BREATH_WHITE') {
    petTalking(argDialogues.fragment1_found[0]);
  } else if (detail?.key === 'CHORD_PATTERN') {
    petTalking(argDialogues.fragment2_found[0]);
  } else if (detail?.key === 'SOS_ECHO') {
    petTalking(argDialogues.fragment3_found[0]);
    setTimeout(() => petTalking(argDialogues.all_found[0]), 4500);
    setTimeout(() => petTalking(argDialogues.all_found[1]), 9000);
    setTimeout(() => petTalking(argDialogues.all_found[2]), 14000);
    setTimeout(() => petTalking(argDialogues.all_found[3]), 20000);
  }
};

const onFinalChoice = () => {
  petTalking(argDialogues.final_choice[0]);
  setTimeout(() => petTalking(argDialogues.final_choice[1]), 4000);
};

const triggerHappyPet = () => {
  if (showAsciiOverlay.value) return;
  
  // ARG trigger logic
  if (!argStarted.value) {
    argTriggerCount.value++;
    if (argTriggerCount.value === 1) {
      petTalking(argDialogues.trigger[0]);
      setTimeout(() => petTalking(argDialogues.trigger[1]), 3000);
      setTimeout(() => petTalking(argDialogues.trigger[2]), 6000);
      return;
    } else if (argTriggerCount.value >= 2) {
      startARG();
      petTalking('信号接收已启动！(★ω★)');
      argTriggerCount.value = 0;
      return;
    }
  }
  
  // ARG in progress - show hint
  if (argStarted.value) {
    const hint = getArgHint();
    if (hint) {
      petTalking(hint);
      return;
    }
  }
  
  // Pet dark idle dialogues (purge reward)
  if (petDark.value && Math.random() > 0.5) {
    petTalking(argDialogues.pet_dark_idle[Math.floor(Math.random() * argDialogues.pet_dark_idle.length)]);
    return;
  }
  
  // Normal happy logic
  petState.value = 'happy';
  petHappiness.value = Math.min(100, petHappiness.value + 12);
  petTalking(getRandomText(happyDialogues));
  
  setTimeout(() => {
    if (route.path === '/projects' || route.path === '/games' || route.path === '/github') {
      petState.value = 'working';
    } else {
      petState.value = 'idle';
    }
  }, 2200);
};

let longPressTimer: number | null = null;
let longPressMsgTimer: number | null = null;
const startLongPress = () => {
  if (longPressTimer) clearTimeout(longPressTimer);
  if (longPressMsgTimer) clearTimeout(longPressMsgTimer);
  longPressMsgTimer = window.setTimeout(() => {
    petTalking('正在注入核心数据...[HOLD]');
  }, 600);
  longPressTimer = window.setTimeout(() => {
    showAsciiOverlay.value = true;
    petTalking('SYSTEM_OVERRIDE_INIT!');
  }, 1500);
};

const endLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  if (longPressMsgTimer) {
    clearTimeout(longPressMsgTimer);
    longPressMsgTimer = null;
  }
};

watch(() => route.path, (newPath) => {
  // ARG hint priority
  if (argStarted.value) {
    const hint = getArgHint();
    if (hint) {
      petTalking(hint);
      return;
    }
  }
  
  // Normal route dialogues
  if (newPath === '/projects' || newPath === '/games' || newPath === '/github') {
    petState.value = 'working';
    petTalking(getRandomText(routeDialogues));
  } else if (newPath === '/works' || newPath === '/commissions') {
    petState.value = 'active';
    petTalking(getRandomText(routeDialogues));
  } else {
    petState.value = 'idle';
    petTalking('我回来啦！(＾▽＾)');
  }
});

let idleTimer: number | null = null;

onMounted(() => {
  initTheme();
  document.addEventListener('contextmenu', (e: MouseEvent) => {
    if (!import.meta.env.DEV) {
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', updateMouse);
  document.addEventListener('mousedown', (e: MouseEvent) => {
    isClicking.value = true;
    addClickRipple(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', () => isClicking.value = false);
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('keydown', handleKeyDown);

  // --- Page Title Easter Egg ---
  const originalTitle = document.title || 'LanRhyme.OS';
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.title = "[ SYS.SLEEP ] 💤";
    } else {
      document.title = "WAKING_UP... ⚡";
      setTimeout(() => {
        document.title = originalTitle;
      }, 1500);
    }
  });

  hudTimer = window.setInterval(updateHudMetrics, 1200);

  const lenis = new Lenis({
    autoRaf: true,
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  });
  
  watch(() => route.path, (newPath) => {
    if (newPath === '/worldview') {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, { immediate: true });
  
  lenis.on('scroll', (e: any) => {
    scrollProgress.value = e.progress;
    updateHoverRect();
  });
  
  mouseX.value = window.innerWidth / 2;
  mouseY.value = window.innerHeight / 2;
  targetX.value = window.innerWidth / 2;
  targetY.value = window.innerHeight / 2;
  frameX.value = targetX.value;
  frameY.value = targetY.value;
  renderCursor();
  
  setTimeout(() => {
    petTalking('你好呀主人！ヾ(•ω•`)o');
  }, 1500);

  idleTimer = window.setInterval(() => {
    if (petState.value === 'idle' && !bubbleText.value && Math.random() > 0.4) {
      petTalking(getRandomText(idleDialogues));
    }
  }, 8000);

  window.addEventListener('arg-fragment-found', onFragmentFound);
  window.addEventListener('arg-final-choice', onFinalChoice);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', updateMouse);
  document.removeEventListener('keydown', handleKeyDown);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (idleTimer) clearInterval(idleTimer);
  if (petTalkTimer) clearTimeout(petTalkTimer);
  if (hudTimer) clearInterval(hudTimer);
  window.removeEventListener('arg-fragment-found', onFragmentFound);
  window.removeEventListener('arg-final-choice', onFinalChoice);
});
</script>

<template>
  <Preloader v-if="!isAdmin" @complete="handlePreloaderComplete" />
  <div class="app-root relative" :class="{ 'is-loaded': isLoaded || isAdmin }">
    <!-- Custom Fluid Cursor (Square Framing style) -->
    <div v-if="!isAdmin" class="custom-cursor-wrapper hidden md:block">
      <div class="cursor-dot" :class="{ 'hovering': isHovering, 'clicking': isClicking }" :style="{ transform: `translate(${mouseX}px, ${mouseY}px)` }"></div>
      <div class="cursor-frame" :class="{ 'hovering': isHovering, 'clicking': isClicking }" :style="{ transform: `translate(calc(${frameX}px - 50%), calc(${frameY}px - 50%))`, width: `${frameW}px`, height: `${frameH}px` }"></div>
    </div>

    <!-- Minimalist AI Companion -->
    <div 
      v-if="!isAdmin" 
      class="fixed bottom-8 right-8 z-40 pointer-events-auto flex flex-col items-end select-none font-mono"
    >
      <transition name="page">
        <div 
          v-if="bubbleText" 
          class="cyber-glass !px-3 !py-1 mb-3 text-xs bg-black/60 border border-[var(--color-brand)] text-[var(--color-brand)] font-bold text-right tracking-widest relative uppercase"
        >
          > {{ bubbleText }} <span class="animate-pulse">_</span>
        </div>
      </transition>

      <!-- AI Core Widget -->
      <div 
        class="cyber-glass p-2 flex flex-col items-center justify-center bg-black/60 border border-[var(--color-border)] hover:border-[var(--color-brand)] transition-all duration-500 cursor-pointer group w-16 h-16 rounded-full animate-float-slow hover:shadow-[0_0_30px_rgba(107,143,114,0.3)]"
        :class="{ 'scale-90': petState === 'happy', 'pet-dark': petDark }"
        @click="triggerHappyPet"
        @mousedown="startLongPress"
        @touchstart="startLongPress"
        @mouseup="endLongPress"
        @mouseleave="endLongPress"
        @touchend="endLongPress"
        @mouseenter="petTalking(getRandomText(hoverDialogues))"
      >
        <!-- Rotating Outer Ring -->
        <div class="absolute inset-0 border border-dashed border-[var(--color-text-dim)] group-hover:border-[var(--color-brand)] rounded-full animate-spin-slow opacity-20 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <div class="relative w-10 h-10 rounded-full border border-[var(--color-text-dim)] group-hover:border-[var(--color-brand)] flex items-center justify-center transition-all duration-300 overflow-hidden bg-black/40">
          <!-- The Eye -->
          <div 
            class="w-4 h-4 transition-all duration-300 shadow-[0_0_10px_currentColor]"
            :class="petDark ? 'bg-red-800 group-hover:bg-red-600' : 'bg-[var(--color-text-dim)] group-hover:bg-[var(--color-brand)]'"
            :style="{ 
              transform: `rotate(${eyeRotation}deg) translateX(4px)`,
              clipPath: petState === 'happy' ? 'polygon(0 40%, 100% 40%, 100% 60%, 0 60%)' : 'polygon(0 50%, 50% 0, 100% 50%, 50% 100%)'
            }"
          ></div>
          <div class="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(91,122,97,0)] group-hover:shadow-[inset_0_0_20px_rgba(91,122,97,0.4)] transition-all duration-500"></div>
        </div>
      </div>
    </div>

    <!-- ASCII Avatar Easter Egg Overlay -->
    <transition name="page">
      <div 
        v-if="showAsciiOverlay" 
        class="fixed inset-0 z-[9999] bg-[var(--color-bg)] bg-opacity-95 backdrop-blur-md flex flex-col items-center justify-center text-[var(--color-brand)] overflow-hidden"
        @click="showAsciiOverlay = false"
      >
        <!-- Background noise/scanlines just for overlay -->
        <div class="absolute inset-0 scanlines opacity-50 pointer-events-none"></div>
        <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span class="font-art text-[40vw] tracking-tighter leading-none animate-pulse">OVERRIDE</span>
        </div>
        
        <pre class="relative z-10 m-0 text-[8px] sm:text-[10px] md:text-xs font-mono leading-[1.1] animate-fade-in-up glitch-hover shadow-[0_0_30px_rgba(107,143,114,0.2)]">
{{ asciiAvatar }}
        </pre>
        <div class="absolute bottom-10 font-mono text-xs opacity-50 tracking-[0.3em] animate-pulse">
          > SYSTEM_OVERRIDE_ACTIVE [CLICK TO RESTORE] <
        </div>
      </div>
    </transition>

    <!-- Scanlines Background Overlay -->
    <div class="scanlines"></div>
    
    <!-- Click Ripples -->
    <div 
      v-for="ripple in clickRipples" 
      :key="ripple.id" 
      class="fixed pointer-events-none z-[99999] text-[var(--color-brand)] font-mono text-[10px] flex items-center justify-center animate-ripple"
      :style="{ left: ripple.x + 'px', top: ripple.y + 'px', width: '20px', height: '20px', marginLeft: '-10px', marginTop: '-10px' }"
    >
      [+]
    </div>

    <!-- 3D Fluid Geometry Background -->
    <Background3D />

    <!-- Hardcore Brutalist HUD & Decorations -->
    <div v-if="!isAdmin && !isWorldview" class="fixed top-0 left-0 w-full h-full pointer-events-none z-20">
      
      <!-- Blueprint Grid Lines -->
      <div class="absolute top-0 left-[8%] w-[1px] h-full bg-[var(--color-border)] opacity-30"></div>
      <div class="absolute top-0 right-[8%] w-[1px] h-full bg-[var(--color-border)] opacity-30"></div>
      <div class="absolute top-[15%] left-0 w-full h-[1px] bg-[var(--color-border)] opacity-30"></div>
      
      <!-- Corner Crosshairs (+) -->
      <div class="absolute top-[15%] left-[8%] -translate-x-1/2 -translate-y-1/2 text-[var(--color-brand)] opacity-50 text-[10px] font-mono leading-none">+</div>
      <div class="absolute top-[15%] right-[8%] translate-x-1/2 -translate-y-1/2 text-[var(--color-brand)] opacity-50 text-[10px] font-mono leading-none">+</div>
      
      <!-- Scroll Progress Tracker -->
      <div class="absolute top-[30%] right-[3%] w-[1px] h-[40%] bg-[var(--color-border)] opacity-40">
        <div class="w-[3px] bg-[var(--color-brand)] -ml-[1px] transition-all duration-75 shadow-[0_0_8px_rgba(107,143,114,0.8)]" :style="{ height: `${scrollProgress * 100}%` }"></div>
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[var(--color-brand)] tracking-widest">{{ Math.round(scrollProgress * 100) }}%</div>
      </div>

      <!-- Top Left Data -->
      <div class="fixed top-[45px] left-[45px] hidden md:flex flex-col gap-1 tracking-widest text-[8px] sm:text-[10px] pointer-events-none z-50">
        <span class="text-[var(--color-brand)] font-bold">SYS.ON</span>
        <span class="opacity-50">CPU: {{ cpuLoad.toString().padStart(2, '0') }}%</span>
        <span class="opacity-50">MEM: {{ memLoad.toFixed(1) }}%</span>
      </div>
      <div class="hud-corner hud-tl"></div>
      <div class="hud-corner hud-tr"></div>
      <div class="hud-corner hud-bl"></div>
      <div class="hud-corner hud-br"></div>
      
      <div class="absolute top-1/4 right-[2%] hud-text-vertical hidden lg:block text-xs">
        <span class="opacity-50 tracking-[0.5em]">SYSTEM.UI</span> // <span class="text-brand">ONLINE</span>
      </div>
    </div>

    <!-- Main Content Wrapper -->
    <div class="relative z-10 min-h-screen flex flex-col w-full font-mono text-[var(--color-text)]">
      <NavBar v-if="!isAdmin" />
      
      <!-- Theme Toggle (ARG Reward) -->
      <button 
        v-if="themeUnlocked && !isAdmin" 
        @click="toggleTheme" 
        class="fixed top-6 right-6 z-50 text-2xl drop-shadow-[0_0_8px_currentColor] transition-all duration-500 hover:scale-110"
        :class="themeActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-dim)]'"
        title="Toggle Eclipse Theme"
      >
        <i class="fa-solid fa-moon"></i>
      </button>

      <!-- Main Router View -->
      <div :class="isWorldview ? 'fixed inset-0 z-0 bg-black w-full h-screen overflow-hidden' : 'flex-grow w-full mx-auto pt-20 md:pt-28 pb-12'">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <keep-alive :max="5">
              <component :is="Component" :key="route.name || route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </div>

      <Footer v-if="!isAdmin && !isWorldview" />
    </div>
  </div>
</template>

<style>
.app-root {
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.app-root.is-loaded {
  opacity: 1;
}

.pet-dark {
  border-color: #991b1b !important;
}
.pet-dark:hover {
  border-color: #dc2626 !important;
  box-shadow: 0 0 30px rgba(153, 27, 27, 0.3) !important;
}

/* Removed old cursor CSS, using style.css now */
</style>
