<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: 'LanRhyme.'
  }
});

const wrapperRef = ref<HTMLElement | null>(null);

// Define shard clip paths and burst directions (bx, by) to slice the text into a shattered glass look
const shardConfigs = [
  // Base shards
  { id: 1, path: 'polygon(0% 0%, 35% 0%, 20% 60%, 0% 40%)', z: 1, speed: 0.02, bx: -1, by: -1 },
  { id: 2, path: 'polygon(0% 40%, 20% 60%, 10% 100%, 0% 100%)', z: 1, speed: 0.03, bx: -1, by: 1 },
  { id: 3, path: 'polygon(35% 0%, 65% 0%, 55% 45%, 20% 60%)', z: 1, speed: 0.015, bx: 0, by: -1 },
  { id: 4, path: 'polygon(20% 60%, 55% 45%, 60% 100%, 10% 100%)', z: 1, speed: 0.025, bx: 0, by: 1 },
  { id: 5, path: 'polygon(65% 0%, 100% 0%, 100% 50%, 85% 65%, 55% 45%)', z: 1, speed: 0.02, bx: 1, by: -1 },
  { id: 6, path: 'polygon(55% 45%, 85% 65%, 100% 50%, 100% 100%, 60% 100%)', z: 1, speed: 0.035, bx: 1, by: 1 },
  // Extra overlay shards for depth
  { id: 7, path: 'polygon(25% 20%, 45% 10%, 50% 40%, 30% 50%)', z: 2, speed: 0.06, bx: -0.5, by: -1 },
  { id: 8, path: 'polygon(65% 40%, 85% 30%, 90% 70%, 70% 80%)', z: 2, speed: 0.08, bx: 1, by: 0 },
  { id: 9, path: 'polygon(45% 60%, 60% 50%, 70% 80%, 50% 90%)', z: 2, speed: 0.05, bx: 0.5, by: 1 },
];

const shards = shardConfigs.map(c => ({
  ...c,
  tx: 0, ty: 0, rx: 0, ry: 0, scale: 1,
  px: 0, py: 0, pz: 0, prx: 0, pry: 0,
  vx: 0, vy: 0, vz: 0, vrx: 0, vry: 0
}));

const shardRefs = ref<HTMLElement[]>([]);

let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let isHovering = false;
let clickForce = 0;
let targetClickForce = 0;
let rafId = 0;

let shatterLevel = ref(0);
let autoReassembleTimer = 0;

const displayText = ref(props.text);
let scrambleInterval: number | null = null;
let decodeInterval: number | null = null;
let audioCtx: AudioContext | null = null;

const startScramble = () => {
  if (scrambleInterval) clearInterval(scrambleInterval);
  if (decodeInterval) clearInterval(decodeInterval);
  const chars = '!<>-_\\/[]{}—=+*^?#01';
  scrambleInterval = window.setInterval(() => {
    displayText.value = props.text.split('').map(c => 
      c === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }, 40);
};

const stopScramble = () => {
  if (scrambleInterval) clearInterval(scrambleInterval);
  scrambleInterval = null;
  if (decodeInterval) clearInterval(decodeInterval);
  
  let iterations = 0;
  const maxIterations = 20;
  const targetText = props.text;
  const chars = '!<>-_\\/[]{}—=+*^?#01';
  
  decodeInterval = window.setInterval(() => {
    displayText.value = targetText.split('').map((char, index) => {
      if (index < iterations / (maxIterations / targetText.length)) {
        return targetText[index];
      }
      return char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
    }).join('');
      
    iterations++;
    if (iterations >= maxIterations) {
      clearInterval(decodeInterval);
      displayText.value = targetText;
    }
  }, 20);
};

const playShatterSound = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const bufferSize = audioCtx.sampleRate * 0.4;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (i % 8 < 2 ? 0 : 1);
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(8000, audioCtx.currentTime + 0.3);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
    
    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
    
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
};

const playReassembleSound = () => {
  // Removed reassemble beep sound as requested
};

const handleMouseMove = (e: MouseEvent) => {
  if (!wrapperRef.value) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
  targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  isHovering = true;
};

const handleMouseLeave = () => {
  targetMouseX = 0;
  targetMouseY = 0;
  isHovering = false;
  targetClickForce = 0;
};

const handleMouseDown = () => {
  targetClickForce = 1;
};

const handleMouseUp = (e: MouseEvent) => {
  targetClickForce = 0;
  
  if (shatterLevel.value === 0) {
    shatterLevel.value = 1;
    triggerShatterStage(shatterLevel.value);
    
    const clickX = e.clientX / window.innerWidth;
    const clickY = 1.0 - (e.clientY / window.innerHeight);
    window.dispatchEvent(new CustomEvent('shockwave', { detail: { x: clickX, y: clickY } }));
    
    // Trigger global red-alert shake
    document.documentElement.classList.add('red-alert');
    setTimeout(() => document.documentElement.classList.remove('red-alert'), 400);

    clearTimeout(autoReassembleTimer);
    autoReassembleTimer = window.setTimeout(() => {
      shatterLevel.value = 0;
      triggerShatterStage(shatterLevel.value);
    }, 1000);
  } else {
    shatterLevel.value = 0;
    triggerShatterStage(shatterLevel.value);
    clearTimeout(autoReassembleTimer);
  }
};

const triggerShatterStage = (level: number) => {
  if (level === 1) {
    playShatterSound();
    startScramble();
  } else {
    playReassembleSound();
    stopScramble();
  }
};

const animate = () => {
  // Smoothly interpolate mouse position (easing)
  mouseX += (targetMouseX - mouseX) * 0.1;
  mouseY += (targetMouseY - mouseY) * 0.1;

  // Spring-like smooth interpolation for click force
  clickForce += (targetClickForce - clickForce) * 0.15;

  const time = Date.now() * 0.001;

  shards.forEach((shard, index) => {
    // Parallax max offset - Compress layers together when clicked
    const baseMaxOffset = shard.z === 1 ? 15 : 40; 
    const maxOffset = baseMaxOffset * (1 - clickForce * 0.8);
    
    // Slight continuous floating drift
    const driftX = Math.sin(time + shard.id) * 3 * (1 - clickForce * 0.5);
    const driftY = Math.cos(time + shard.id * 1.5) * 3 * (1 - clickForce * 0.5);
    
    // Base parallax
    const baseTx = mouseX * maxOffset * shard.speed * 20 + driftX;
    const baseTy = mouseY * maxOffset * shard.speed * 20 + driftY;
    const baseRy = mouseX * (shard.z === 1 ? 5 : 15);
    const baseRx = -mouseY * (shard.z === 1 ? 5 : 15);

    // Clean Physics without spring bounce
    if (shatterLevel.value === 1) {
       // Deterministic target positions for cracked state, no chaos
       const targetPx = shard.bx * 30;
       const targetPy = shard.by * 30;
       const targetPz = shard.z * 20;
       const targetPrx = shard.by * 15;
       const targetPry = shard.bx * 15;

       shard.px += (targetPx - shard.px) * 0.15;
       shard.py += (targetPy - shard.py) * 0.15;
       shard.pz += (targetPz - shard.pz) * 0.15;
       shard.prx += (targetPrx - shard.prx) * 0.15;
       shard.pry += (targetPry - shard.pry) * 0.15;
    } else {
       // Smooth lerp back to assembled state, absolutely no bounce
       shard.px += (0 - shard.px) * 0.15;
       shard.py += (0 - shard.py) * 0.15;
       shard.pz += (0 - shard.pz) * 0.15;
       shard.prx += (0 - shard.prx) * 0.15;
       shard.pry += (0 - shard.pry) * 0.15;
    }

    // Combine all for final render
    shard.tx = baseTx + shard.px;
    shard.ty = baseTy + shard.py;
    shard.ry = baseRy + shard.pry;
    shard.rx = baseRx + shard.prx;
    
    // Hover makes overlay pop out, Click presses everything inward
    const targetScale = (isHovering && shard.z === 2 ? 1.05 : 1) - (clickForce * 0.05);
    shard.scale += (targetScale - shard.scale) * 0.15;

    if (shardRefs.value[index]) {
      shardRefs.value[index].style.transform = `translate3d(${shard.tx}px, ${shard.ty}px, ${shard.z * 10 + shard.pz}px) rotateX(${shard.rx}deg) rotateY(${shard.ry}deg) scale(${shard.scale})`;
    }
  });

  rafId = requestAnimationFrame(animate);
};

onMounted(() => {
  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  if (scrambleInterval) clearInterval(scrambleInterval);
  if (decodeInterval) clearInterval(decodeInterval);
  if (audioCtx) audioCtx.close().catch(() => {});
});
</script>

<template>
  <div 
    class="glass-wrapper relative inline-block w-fit cursor-crosshair select-none transition-all duration-300"
    ref="wrapperRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  >
    <!-- White Frost Spread Effect -->
    <div 
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none transition-all ease-out mix-blend-screen" 
      :class="shatterLevel === 1 ? 'w-[120%] h-[150%] opacity-100 duration-[400ms]' : 'w-[50%] h-[50%] opacity-0 duration-1000'" 
      style="background: radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 70%); filter: blur(20px);"
    ></div>

    <span class="sr-only">{{ text }}</span>

    <!-- Base Dim Text -->
    <div class="text-base text-transparent bg-clip-text bg-gradient-to-r from-white/10 to-[rgba(255,255,255,0.05)] relative z-0">
      {{ displayText }}
    </div>

    <!-- Shattered Glass Fragments -->
    <div class="shards-container absolute inset-0 z-10 w-full h-full perspective-[1000px]">
      <div 
        v-for="(shard, index) in shards" 
        :key="shard.id"
        :ref="el => { if (el) shardRefs[index] = el as HTMLElement }"
        class="shard absolute inset-0 w-full h-full transition-shadow duration-300"
        :class="{ 'is-overlay': shard.z > 1 }"
        :style="{
          clipPath: shard.path,
          zIndex: shard.z
        }"
      >
        <!-- The text content etched inside the shard -->
        <div class="shard-inner absolute inset-0 w-full h-full flex items-center">
          <span class="w-full text-center sm:text-left block pr-[0.15em]">{{ displayText }}</span>
        </div>
        
        <!-- Shard edge highlight -->
        <div class="shard-edge absolute inset-0" :style="{ clipPath: shard.path }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-wrapper {
  /* Provide padding to allow shards to spread without clipping */
  padding: 20px 40px;
  margin: -20px -40px;
  perspective: 1000px;
}

.glass-wrapper:active {
  cursor: grabbing;
}

.text-base, .shard-inner {
  font-family: "Playfair Display", serif;
  font-size: clamp(48px, 8.5vw, 150px);
  font-style: italic;
  font-weight: bold;
  line-height: 1.1;
  letter-spacing: -2px;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: none;
}

/* Base text styling */
.text-base {
  display: block;
  width: 100%;
  padding-right: 0.15em;
}

/* Individual Glass Shards */
.shard {
  transform-style: preserve-3d;
  will-change: transform;
}

.shard.is-overlay {
  backdrop-filter: blur(16px) brightness(1.15);
  -webkit-backdrop-filter: blur(16px) brightness(1.15);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 10px 30px -10px rgba(91, 212, 162, 0.2);
}

.shard-inner {
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.2);
}

/* Inner highlight for glass thickness (only on overlay shards) */
.shard.is-overlay .shard-edge {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08),
              inset 0 0 20px rgba(255, 255, 255, 0.02);
  pointer-events: none;
}

/* Hover effects */
.glass-wrapper:hover .shard.is-overlay {
  background: rgba(255, 255, 255, 0.05);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
