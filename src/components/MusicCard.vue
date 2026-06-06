<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const playlist = [
  { title: '虚假世界', author: '在虚无中永存', src: '/audio/虚假世界.mp3' },
  { title: '于是你再一次盛开', author: '在虚无中永存', src: '/audio/于是你再一次盛开.mp3' },
  { title: '夜之声', author: '在虚无中永存', src: '/audio/夜之声.mp3' },
  { title: 'Old Memory', author: '市川淳', src: '/audio/Old Memory.m4a' },
  { title: 'Haggstrom', author: 'C418', src: '/audio/Haggstrom.mp3' }
];

const showPlaylist = ref(false);

const playTrack = (idx: number) => {
  if (currentTrackIndex.value === idx) {
    if (!isPlaying.value) togglePlay();
    return;
  }
  currentTrackIndex.value = idx;
  triggerScrambleTransition();
  playAfterChange();
};

const currentTrackIndex = ref(0);
const currentTrack = computed(() => playlist[currentTrackIndex.value]);

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const progress = ref(0);
const duration = ref(0);
const currentTime = ref(0);

// Interaction states
const hoverVisualizerIdx = ref<number | null>(null);
const isGlitching = ref(false);
const displayTitle = ref(currentTrack.value.title);

// Visualizer data
const visualizerBars = ref<number[]>(Array(16).fill(0));
const dotRhythm = ref(0);
let animationId: number;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array | null = null;
let source: MediaElementAudioSourceNode | null = null;

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00';
  const mins = Math.floor(time / 60).toString().padStart(2, '0');
  const secs = Math.floor(time % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const asciiProgress = computed(() => {
  const totalBlocks = 15;
  const filledBlocks = Math.floor((progress.value / 100) * totalBlocks) || 0;
  const emptyBlocks = Math.max(0, totalBlocks - filledBlocks);
  return '[' + '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks) + ']';
});

const togglePlay = () => {
  if (!audioRef.value) return;
  
  if (!audioContext) {
    initAudioContext();
  }

  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play();
    if (audioContext?.state === 'suspended') {
      audioContext.resume();
    }
  }
};

const onTimeUpdate = () => {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
  progress.value = (audioRef.value.currentTime / audioRef.value.duration) * 100;
};

const onLoadedMetadata = () => {
  if (!audioRef.value) return;
  duration.value = audioRef.value.duration;
};

const onPlay = () => {
  isPlaying.value = true;
  if (!isScrambling.value) {
    displayTitle.value = currentTrack.value.title;
  }
};
const onPause = () => isPlaying.value = false;
const onEnded = () => {
  progress.value = 0;
  currentTime.value = 0;
  nextTrack();
};

const isScrambling = ref(false);
const triggerScrambleTransition = () => {
  isScrambling.value = true;
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  let iterations = 0;
  const maxIterations = 15;
  const targetTitle = currentTrack.value.title;
  
  const scrambleInterval = setInterval(() => {
    displayTitle.value = targetTitle
      .split('')
      .map((char, index) => {
        if (index < iterations / (maxIterations / targetTitle.length)) {
          return targetTitle[index];
        }
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');
      
    iterations++;
    if (iterations >= maxIterations) {
      clearInterval(scrambleInterval);
      displayTitle.value = targetTitle;
      isScrambling.value = false;
    }
  }, 20);
};

const nextTrack = () => {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % playlist.length;
  triggerScrambleTransition();
  playAfterChange();
};

const prevTrack = () => {
  currentTrackIndex.value = (currentTrackIndex.value - 1 + playlist.length) % playlist.length;
  triggerScrambleTransition();
  playAfterChange();
};

const playAfterChange = () => {
  setTimeout(() => {
    if (audioRef.value) {
      audioRef.value.play();
      isPlaying.value = true;
    }
  }, 50);
};

const seek = (e: MouseEvent) => {
  if (!audioRef.value) return;
  const bar = e.currentTarget as HTMLElement;
  const rect = bar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, clickX / rect.width));
  audioRef.value.currentTime = percent * audioRef.value.duration;
};

const initAudioContext = () => {
  if (!audioRef.value || audioContext) return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    
    source = audioContext.createMediaElementSource(audioRef.value);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    updateVisualizer();
  } catch (e) {
    console.error('Web Audio API not supported', e);
  }
};

const updateVisualizer = () => {
  if (!analyser || !dataArray) return;
  
  animationId = requestAnimationFrame(updateVisualizer);
  
  if (isPlaying.value) {
    analyser.getByteFrequencyData(dataArray);
    const newBars = [];
    const step = Math.floor(dataArray.length / 16);
    for (let i = 0; i < 16; i++) {
      const val = dataArray[i * step] / 255;
      newBars.push(val);
    }
    visualizerBars.value = newBars;
    
    // Extract bass for dot rhythm
    let bassSum = 0;
    for (let i = 0; i < 4; i++) bassSum += newBars[i];
    dotRhythm.value = bassSum / 4;
  } else {
    visualizerBars.value = visualizerBars.value.map(val => Math.max(0, val - 0.05));
    dotRhythm.value = Math.max(0, dotRhythm.value - 0.05);
  }
};

const triggerGlitch = () => {
  if (isGlitching.value) return;
  isGlitching.value = true;
  window.dispatchEvent(new CustomEvent('global-glitch', { detail: { active: true } }));
  
  if (audioRef.value && isPlaying.value) {
    audioRef.value.playbackRate = 0.5; // Pitch down
  }
  
  setTimeout(() => {
    isGlitching.value = false;
    window.dispatchEvent(new CustomEvent('global-glitch', { detail: { active: false } }));
    if (audioRef.value) {
      audioRef.value.playbackRate = 1.0;
    }
  }, 1500);
};

const handleVisMouseMove = (e: MouseEvent) => {
  const container = e.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const idx = Math.floor((x / rect.width) * 16);
  hoverVisualizerIdx.value = Math.max(0, Math.min(15, idx));
};
const handleVisMouseLeave = () => {
  hoverVisualizerIdx.value = null;
};

let fakeVisInterval: number;
const runFakeVisualizer = () => {
  if (!isPlaying.value && !audioContext) {
    visualizerBars.value = visualizerBars.value.map(() => Math.random() * 0.3);
    dotRhythm.value = Math.random() * 0.3;
  }
};

onMounted(() => {
  displayTitle.value = currentTrack.value.title;
  fakeVisInterval = window.setInterval(runFakeVisualizer, 200);
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (fakeVisInterval) clearInterval(fakeVisInterval);
  if (audioContext) audioContext.close();
});

// Calculate true 3D Roulette transform
const getRouletteStyle = (idx: number) => {
  // Calculate relative distance considering wrap-around for a circular feel
  let diff = idx - currentTrackIndex.value;
  const len = playlist.length;
  
  // Normalize difference to shortest path (-2 to +2 for 5 items)
  if (diff > len / 2) diff -= len;
  if (diff < -len / 2) diff += len;

  if (Math.abs(diff) > 2) return { display: 'none' };
  
  const translateY = diff * 35; // Vertical spacing
  const translateZ = -Math.abs(diff) * 60; // Depth push back
  const rotateX = diff * -25; // Tilt angle to form a wheel
  const opacity = 1 - Math.abs(diff) * 0.4;
  
  return {
    transform: `translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg)`,
    opacity,
    zIndex: 10 - Math.abs(diff)
  };
};

let wheelTimeout: number | null = null;
const handleRouletteWheel = (e: WheelEvent) => {
  if (wheelTimeout) return; // Debounce wheel
  if (e.deltaY > 0) {
    nextTrack();
  } else {
    prevTrack();
  }
  wheelTimeout = window.setTimeout(() => { wheelTimeout = null; }, 300);
};

// Touch support for mobile swipe
let touchStartY = 0;
let touchEndY = 0;

const handleTouchStart = (e: TouchEvent) => {
  touchStartY = e.changedTouches[0].screenY;
};

const handleTouchEnd = (e: TouchEvent) => {
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
};

const handleSwipe = () => {
  const diff = touchStartY - touchEndY;
  if (Math.abs(diff) > 30) { // Threshold
    if (diff > 0) {
      nextTrack(); // Swipe up
    } else {
      prevTrack(); // Swipe down
    }
  }
};


</script>

<template>
  <div class="terminal-border p-3 md:p-4 w-full relative min-h-[180px] font-mono text-[var(--color-text)] transition-all group overflow-hidden" :class="{ 'glitch-container': isGlitching }">
    
    <!-- Audio Element -->
    <audio 
      ref="audioRef" 
      :src="currentTrack.src" 
      preload="metadata"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    ></audio>

    <!-- Background Deco -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-200" :class="{ 'bg-white/5': isGlitching }">
      <div class="absolute w-[200%] h-[200%] -top-[50%] -left-[50%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMCIvPgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] transition-all duration-200" 
           :class="isGlitching ? 'opacity-40 invert animate-bg-glitch' : (isPlaying ? 'opacity-15 animate-bg-scroll' : 'opacity-5 group-hover:opacity-15 animate-bg-scroll')"></div>
    </div>

    <!-- View Transition Wrapper -->
    <Transition name="view-fade" mode="out-in">
      
      <!-- MAIN PLAYER VIEW -->
      <div v-if="!showPlaylist" class="flex flex-col relative z-10 w-full h-full cursor-crosshair">
        <!-- Header -->
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 border border-[var(--color-brand)] transition-all duration-75" 
                 :class="{ 'bg-[var(--color-brand)] animate-ping': isPlaying }"
            ></div>
          </div>
          <button @click="showPlaylist = true" class="text-[10px] opacity-60 hover:opacity-100 hover:text-[var(--color-brand)] active:scale-[0.98] transition-colors flex items-center gap-1 cursor-pointer">
            <i class="fa-solid fa-compact-disc"></i> [ROULETTE]
          </button>
        </div>

        <!-- Main Content -->
        <div class="flex gap-4 items-center mb-4">
          <!-- Controls -->
          <div class="flex items-center gap-2">
            <button class="text-[10px] opacity-40 hover:opacity-100 hover:text-[var(--color-brand)] transition-colors" @click="prevTrack" title="Prev Track">
              <i class="fa-solid fa-backward-step"></i>
            </button>
            
            <!-- Bouncing Dot Button -->
            <div 
              class="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 border flex items-center justify-center relative cursor-pointer group active:scale-[0.98] transition-all duration-300 bg-[var(--color-bg)] overflow-hidden rounded-sm"
              :class="isPlaying ? 'border-[var(--color-brand)] shadow-[0_0_8px_var(--color-brand)]' : 'border-[var(--color-border)] hover:border-[var(--color-text)]'"
              @click="togglePlay"
            >
              <!-- The Dot -->
              <div class="w-2.5 h-2.5 rounded-full transition-all duration-75" 
                   :class="isPlaying ? (isGlitching ? 'bg-white' : 'bg-[var(--color-brand)]') : 'bg-[var(--color-text)] opacity-40'"
                   :style="{ 
                     transform: isPlaying ? `scale(${1 + Math.pow(dotRhythm, 2) * 4})` : 'scale(1)',
                     boxShadow: isPlaying ? `0 0 ${5 + Math.pow(dotRhythm, 2) * 50}px ${isGlitching ? 'white' : 'var(--color-brand)'}` : 'none'
                   }">
              </div>
              
              <!-- Icon overlay -->
              <div class="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/80 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity z-20" :class="{ 'opacity-100': !isPlaying }">
                <i class="fa-solid" :class="isPlaying ? 'fa-pause text-[var(--color-brand)]' : 'fa-play text-[var(--color-text)]'"></i>
              </div>
            </div>

            <button class="text-[10px] opacity-40 hover:opacity-100 hover:text-[var(--color-brand)] transition-colors" @click="nextTrack" title="Next Track">
              <i class="fa-solid fa-forward-step"></i>
            </button>
          </div>

          <!-- Track Info -->
          <div class="flex flex-col flex-grow overflow-hidden pl-2">
            <div class="text-xs sm:text-sm font-bold truncate text-[var(--color-brand)]" :class="{ 'glitch-text': isGlitching }">
              {{ displayTitle }}
            </div>
            <div class="text-[9px] opacity-60 truncate font-sans">{{ currentTrack.author }}</div>
          </div>
        </div>

        <!-- Interactive Visualizer -->
        <div 
          class="flex items-end h-8 gap-[2px] mb-3 w-full opacity-60 hover:opacity-100 transition-opacity cursor-ew-resize"
          @mousemove="handleVisMouseMove"
          @mouseleave="handleVisMouseLeave"
        >
          <div 
            v-for="(val, idx) in visualizerBars" 
            :key="idx"
            class="flex-1 transition-all duration-75 relative rounded-t-sm"
            :class="hoverVisualizerIdx !== null && Math.abs(hoverVisualizerIdx - idx) <= 1 ? 'bg-[var(--color-text)] shadow-[0_0_8px_var(--color-text)] z-10' : (isGlitching ? 'bg-white shadow-[0_0_6px_white]' : 'bg-[var(--color-brand)] shadow-[0_0_4px_var(--color-brand)]')"
            :style="{ 
              height: `${Math.max(4, (val * 100) + (hoverVisualizerIdx !== null ? Math.max(0, 30 - Math.abs(hoverVisualizerIdx - idx) * 15) : 0))}%`,
              opacity: hoverVisualizerIdx !== null && Math.abs(hoverVisualizerIdx - idx) <= 2 ? 1 : (isPlaying ? 0.9 : 0.6)
            }"
          ></div>
        </div>

        <!-- Interactive Progress -->
        <div class="flex flex-col gap-1 mt-auto text-[10px]">
          <div class="flex justify-between font-mono" :class="{ 'glitch-text': isGlitching }">
            <span class="text-[var(--color-brand)]">{{ formatTime(currentTime) }}</span>
            <span class="opacity-40">{{ formatTime(duration) }}</span>
          </div>
          
          <div 
            class="w-full cursor-pointer opacity-80 hover:opacity-100 transition-opacity text-[10px] sm:text-xs tracking-tighter sm:tracking-widest flex items-center text-[var(--color-text)] group/progress"
            @click="seek"
            title="Click to Seek"
          >
            <span class="group-hover/progress:text-[var(--color-brand)] transition-colors">{{ asciiProgress }}</span>
          </div>
        </div>

        <!-- Glitch Easter Egg Trigger -->
        <div 
          class="absolute bottom-[-4px] right-0 text-[6px] opacity-20 hover:opacity-100 active:scale-[0.98] transition-colors text-[var(--color-brand)] font-mono cursor-pointer"
          @click="triggerGlitch"
        >
          {{ isGlitching ? 'ERR_SYS_FAIL' : 'FREQ_432HZ' }}
        </div>
      </div>

      <!-- TRUE 3D ROULETTE VIEW -->
      <div v-else class="flex flex-col relative z-10 w-full h-full">
        <!-- Header -->
        <div class="flex justify-end items-center mb-1">
          <button @click="showPlaylist = false" class="text-[10px] opacity-80 hover:opacity-100 hover:text-[var(--color-brand)] active:scale-[0.98] transition-colors flex items-center gap-1 cursor-pointer">
            [BACK] <i class="fa-solid fa-rotate-left"></i>
          </button>
        </div>

        <!-- 3D Roulette Container -->
        <div 
          class="flex-grow flex items-center justify-center relative w-full perspective-[800px] preserve-3d" 
          style="min-height: 140px;"
          @wheel.stop.prevent="handleRouletteWheel"
          @touchstart="handleTouchStart"
          @touchmove.stop.prevent
          @touchend="handleTouchEnd"
        >
          <div 
            v-for="(track, idx) in playlist" 
            :key="idx"
            class="absolute w-full max-w-[280px] px-4 py-2 border cursor-pointer flex justify-between items-center transition-all duration-500 cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            :class="{
              'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold shadow-[0_0_20px_var(--color-brand)] scale-105': currentTrackIndex === idx,
              'border-[var(--color-border)]/50 bg-[var(--color-bg)]/80 backdrop-blur-sm text-[var(--color-text)] hover:border-[var(--color-text)]/50': currentTrackIndex !== idx
            }"
            :style="getRouletteStyle(idx)"
            @click="playTrack(idx)"
          >
            <div class="flex flex-col truncate pr-2">
              <span class="text-[11px] truncate font-sans tracking-wide mb-0.5">{{ track.title }}</span>
              <span class="text-[8px] font-mono" :class="currentTrackIndex === idx ? 'opacity-80' : 'opacity-40'">{{ track.author }}</span>
            </div>
            
            <div class="flex-shrink-0 w-4 flex justify-end">
              <div v-if="currentTrackIndex === idx && isPlaying" class="flex items-end gap-[1px] h-3 text-[var(--color-brand)]">
                <div class="w-1 bg-current animate-[bounce_0.8s_ease-in-out_infinite]"></div>
                <div class="w-1 bg-current animate-[bounce_0.8s_ease-in-out_infinite_0.2s]"></div>
                <div class="w-1 bg-current animate-[bounce_0.8s_ease-in-out_infinite_0.4s]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </Transition>
  </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 4s linear infinite;
}

@keyframes bg-scroll {
  0% { transform: translate(0, 0); }
  100% { transform: translate(20px, 20px); }
}
.animate-bg-scroll {
  animation: bg-scroll 3s linear infinite;
}

@keyframes bg-glitch-scroll {
  0% { transform: translate(0, 0) scale(1); }
  20% { transform: translate(15px, -15px) scale(1.05); }
  40% { transform: translate(-25px, 20px) scale(0.95); }
  60% { transform: translate(30px, 5px) scale(1.1); }
  80% { transform: translate(-10px, -30px) scale(1); }
  100% { transform: translate(5px, 0) scale(1.02); }
}
.animate-bg-glitch {
  animation: bg-glitch-scroll 0.15s infinite;
}

/* 3D Classes */
.perspective-\\[800px\\] {
  perspective: 800px;
}
.preserve-3d {
  transform-style: preserve-3d;
}

/* View Fade Transition */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.view-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.view-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* Glitch Animations */
.glitch-container {
  animation: container-glitch 0.2s cubic-bezier(.25, .46, .45, .94) both infinite;
}

.glitch-text {
  animation: text-glitch 0.2s cubic-bezier(.25, .46, .45, .94) both infinite;
  text-shadow: 2px 0 #ffffff, -2px 0 rgba(255, 255, 255, 0.6);
  color: #ffffff;
}

@keyframes container-glitch {
  0% { transform: translate(0) }
  20% { transform: translate(-2px, 1px) }
  40% { transform: translate(-1px, -1px) }
  60% { transform: translate(2px, 1px) }
  80% { transform: translate(1px, -1px) }
  100% { transform: translate(0) }
}

@keyframes text-glitch {
  0% { transform: translate(0) }
  20% { transform: translate(-1px, 1px) }
  40% { transform: translate(-1px, -1px) }
  60% { transform: translate(1px, 1px) }
  80% { transform: translate(1px, -1px) }
  100% { transform: translate(0) }
}
</style>
