<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import anime from 'animejs';

const router = useRouter();
const countdown = ref(20);
let timer: number;

const containerRef = ref<HTMLElement | null>(null);
const diagRef = ref<HTMLElement | null>(null);
const asciiRef = ref<HTMLElement | null>(null);
const tearBandRef = ref<HTMLElement | null>(null);

const lineRefs = ref<HTMLElement[]>([]);
const particleRefs = ref<HTMLElement[]>([]);
const orbitRefs = ref<HTMLElement[]>([]);
const trailRefs = ref<HTMLElement[]>([]);
const waveRef = ref<SVGPathElement | null>(null);
const ringRefs = ref<SVGCircleElement[]>([]);

const setLineRef = (el: any, i: number) => { if (el) lineRefs.value[i] = el as HTMLElement; };
const setParticleRef = (el: any, i: number) => { if (el) particleRefs.value[i] = el as HTMLElement; };
const setOrbitRef = (el: any, i: number) => { if (el) orbitRefs.value[i] = el as HTMLElement; };
const setTrailRef = (el: any, i: number) => { if (el) trailRefs.value[i] = el as HTMLElement; };
const setRingRef = (el: any, i: number) => { if (el) ringRefs.value[i] = el as SVGCircleElement; };

const goHome = () => router.push('/');

const asciiLines = [
  '██╗  ██╗ ██████╗ ██╗  ██╗',
  '██║  ██║██╔═══██╗██║  ██║',
  '███████║██║   ██║███████║',
  '╚════██║██║   ██║╚════██║',
  '     ██║╚██████╔╝     ██║',
  '     ╚═╝ ╚═════╝      ╚═╝',
];
const blockChars = '░▒▓█▀▄▌▐│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬';

onMounted(() => {
  timer = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) { clearInterval(timer); goHome(); }
  }, 1000);

  // ── ASCII entrance: massive scatter → converge ──
  if (asciiRef.value) {
    const lines = asciiRef.value.querySelectorAll('.ascii-line');
    anime({
      targets: lines,
      opacity: [0, 1],
      translateX: () => [(Math.random() - 0.5) * 200, 0],
      translateY: () => [(Math.random() - 0.5) * 80, 0],
      scale: [() => 0.6 + Math.random() * 0.8, 1],
      rotateZ: () => [(Math.random() - 0.5) * 15, 0],
      delay: anime.stagger(60),
      duration: 800,
      easing: 'easeOutExpo'
    });
  }

  // ── TEAR: violent multi-line horizontal displacement ──
  const doTear = () => {
    if (!asciiRef.value) return;
    const lines = asciiRef.value.querySelectorAll('.ascii-line') as NodeListOf<HTMLElement>;
    const count = 2 + Math.floor(Math.random() * 3);
    const picked = new Set<number>();
    while (picked.size < count) picked.add(Math.floor(Math.random() * lines.length));

    picked.forEach(idx => {
      const line = lines[idx];
      if (!line) return;
      const offset = (Math.random() - 0.5) * 120;
      anime({
        targets: line,
        translateX: [offset, -offset * 0.8, offset * 0.4, -offset * 0.2, 0],
        opacity: [1, 0.3, 0.8, 0.2, 1],
        duration: 300,
        easing: 'steps(4)'
      });
    });
  };
  setInterval(doTear, 800 + Math.random() * 800);
  setTimeout(doTear, 1000);

  // ── FULL BLOCK TEAR: entire ascii block shakes ──
  const doBlockTear = () => {
    if (!asciiRef.value) return;
    const dx = (Math.random() - 0.5) * 30;
    const dy = (Math.random() - 0.5) * 15;
    anime({
      targets: asciiRef.value,
      translateX: [dx, -dx * 0.5, dx * 0.3, 0],
      translateY: [dy, -dy * 0.5, 0],
      duration: 200,
      easing: 'steps(3)'
    });
  };
  setInterval(doBlockTear, 3000 + Math.random() * 2000);
  setTimeout(doBlockTear, 2000);

  // ── HORIZONTAL TEAR BAND: a bright stripe rips across ──
  const doTearBand = () => {
    if (!tearBandRef.value) return;
    const y = Math.random() * 80;
    const h = 2 + Math.random() * 6;
    tearBandRef.value.style.top = y + '%';
    tearBandRef.value.style.height = h + '%';
    tearBandRef.value.style.opacity = '1';
    const dx = (Math.random() - 0.5) * 80;
    anime({
      targets: tearBandRef.value,
      translateX: [dx, -dx * 0.6, dx * 0.3, 0],
      opacity: [0.8, 0.4, 0.6, 0],
      duration: 250,
      easing: 'steps(3)'
    });
  };
  setInterval(doTearBand, 1500 + Math.random() * 1500);
  setTimeout(doTearBand, 1200);

  // ── SCAN: bright white flash sweeps top→bottom ──
  const doScan = () => {
    if (!asciiRef.value) return;
    const lines = asciiRef.value.querySelectorAll('.ascii-line') as NodeListOf<HTMLElement>;
    lines.forEach((line, i) => {
      setTimeout(() => {
        line.style.textShadow = '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.3)';
        line.style.color = '#fff';
        setTimeout(() => {
          line.style.textShadow = '0 0 20px rgba(255,255,255,0.1)';
          line.style.color = '';
        }, 150);
      }, i * 60);
    });
  };
  setInterval(doScan, 3500);
  setTimeout(doScan, 1500);

  // ── CHAR SCRAMBLE: rapid multi-line corruption ──
  const doScramble = () => {
    if (!asciiRef.value) return;
    const lines = asciiRef.value.querySelectorAll('.ascii-line') as NodeListOf<HTMLElement>;
    const count = 1 + Math.floor(Math.random() * 3);
    for (let c = 0; c < count; c++) {
      const lineIdx = Math.floor(Math.random() * lines.length);
      const line = lines[lineIdx];
      if (!line) continue;
      const original = asciiLines[lineIdx];
      const arr = original.split('');
      const scrambleCount = 3 + Math.floor(Math.random() * 8);
      for (let s = 0; s < scrambleCount; s++) {
        const pos = Math.floor(Math.random() * arr.length);
        if (arr[pos] !== ' ') arr[pos] = blockChars[Math.floor(Math.random() * blockChars.length)];
      }
      line.textContent = arr.join('');
      setTimeout(() => { line.textContent = original; }, 80 + Math.random() * 80);
    }
  };
  setInterval(doScramble, 1200);

  // ── RED FLASH: occasional red tint ──
  const doRedFlash = () => {
    if (!containerRef.value) return;
    containerRef.value.style.boxShadow = 'inset 0 0 150px rgba(255,0,0,0.08)';
    setTimeout(() => { if (containerRef.value) containerRef.value.style.boxShadow = ''; }, 150);
  };
  setInterval(doRedFlash, 6000 + Math.random() * 4000);
  setTimeout(doRedFlash, 3000);

  // ── Diagnostic lines ──
  if (diagRef.value) {
    const lines = diagRef.value.querySelectorAll('.diag-line');
    anime({
      targets: lines,
      opacity: [0, 1],
      translateX: [-40, 0],
      delay: anime.stagger(80, { start: 500 }),
      duration: 400,
      easing: 'easeOutCubic'
    });
  }

  // ── Horizontal sweep lines (more, faster) ──
  lineRefs.value.forEach((line, i) => {
    anime({
      targets: line,
      translateX: ['-100%', '300%'],
      duration: 1800 + i * 500,
      delay: i * 200,
      loop: true,
      easing: 'linear'
    });
  });

  // ── Vertical scan (faster) ──
  const vScan = containerRef.value?.querySelector('.v-scan');
  if (vScan) {
    anime({ targets: vScan, translateY: ['-10%', '110%'], duration: 2500, loop: true, easing: 'linear' });
  }

  // ── Flowing particles (more, faster) ──
  particleRefs.value.forEach((p, i) => {
    const startX = (Math.random() - 0.5) * 800;
    anime({
      targets: p,
      translateY: [window.innerHeight + 50, -50],
      translateX: [startX, startX + (Math.random() - 0.5) * 150],
      opacity: [{ value: 0.8, duration: 800 }, { value: 0, duration: 800 }],
      duration: 3500 + i * 500,
      delay: i * 300,
      loop: true,
      easing: 'linear'
    });
  });

  // ── Orbiting dots (faster, tighter) ──
  orbitRefs.value.forEach((dot, i) => {
    const r = 160 + i * 30;
    const speed = 4000 + i * 1200;
    const startAngle = (i / orbitRefs.value.length) * Math.PI * 2;
    const steps = 60;
    const keyframes = [];
    for (let s = 0; s <= steps; s++) {
      const angle = startAngle + (s / steps) * Math.PI * 2;
      keyframes.push({
        translateX: Math.cos(angle) * r,
        translateY: Math.sin(angle) * r * 0.35,
        opacity: 0.4 + Math.sin(angle) * 0.4
      });
    }
    anime({ targets: dot, keyframes, duration: speed, loop: true, easing: 'linear' });
  });

  // ── Glowing trails (more, brighter) ──
  trailRefs.value.forEach((trail, i) => {
    trail.style.top = (10 + i * 15) + '%';
    anime({
      targets: trail,
      translateX: ['-100%', '250%'],
      duration: 2000 + i * 1000,
      delay: i * 300,
      loop: true,
      easing: 'linear'
    });
  });

  // ── SVG wave (faster) ──
  if (waveRef.value) {
    let phase = 0;
    const animateWave = () => {
      phase += 0.06;
      let d = 'M 0 50';
      for (let x = 0; x <= 100; x += 2) {
        const y = 50 + Math.sin(x * 0.08 + phase) * 20 + Math.sin(x * 0.04 + phase * 0.7) * 12;
        d += ` L ${x} ${y}`;
      }
      waveRef.value?.setAttribute('d', d);
      requestAnimationFrame(animateWave);
    };
    animateWave();
  }

  // ── SVG ring dash flow (faster) ──
  ringRefs.value.forEach((ring, i) => {
    const circumference = 2 * Math.PI * parseFloat(ring.getAttribute('r') || '100');
    ring.style.strokeDasharray = `${circumference * 0.15} ${circumference * 0.05}`;
    anime({
      targets: ring,
      strokeDashoffset: [0, -circumference],
      duration: 8000 + i * 2500,
      loop: true,
      easing: 'linear'
    });
  });

  // ── Button entrance ──
  const btn = containerRef.value?.querySelector('.btn-home');
  if (btn) {
    anime({ targets: btn, opacity: [0, 1], translateY: [20, 0], delay: 800, duration: 600, easing: 'easeOutCubic' });
  }
});

onUnmounted(() => {
  clearInterval(timer);
  anime.remove('*');
});
</script>

<template>
  <div ref="containerRef" class="relative min-h-screen flex items-center justify-center overflow-hidden font-mono select-none bg-[#050505] transition-[box-shadow] duration-150">

    <!-- Grid (brighter) -->
    <div class="absolute inset-0 opacity-[0.05]" style="background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 40px 40px;"></div>

    <!-- Scanlines (brighter) -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.04]" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px);"></div>

    <!-- Horizontal sweep lines (more, brighter) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div v-for="i in 6" :key="'hline-'+i" :ref="(el) => setLineRef(el, i-1)"
        class="absolute h-[1px] left-0"
        :class="i <= 2 ? 'w-[50%] bg-white/15' : i <= 4 ? 'w-[30%] bg-white/10' : 'w-[20%] bg-white/[0.06]'"
        :style="{ top: (8 + i * 14) + '%' }">
      </div>
    </div>

    <!-- Vertical scan (brighter) -->
    <div class="v-scan absolute left-1/2 top-0 w-[2px] h-[20%] bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none"></div>

    <!-- Flowing particles (more, brighter) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      <div v-for="i in 20" :key="'p-'+i" :ref="(el) => setParticleRef(el, i-1)"
        class="absolute rounded-full"
        :class="i % 4 === 0 ? 'w-1.5 h-1.5 bg-white/60' : i % 2 === 0 ? 'w-1 h-1 bg-white/40' : 'w-0.5 h-0.5 bg-white/30'"
        style="left: 50%; top: 50%;">
      </div>
    </div>

    <!-- Glowing trails (more, brighter) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div v-for="i in 5" :key="'trail-'+i" :ref="(el) => setTrailRef(el, i-1)"
        class="absolute left-0 h-[1px]"
        :class="i <= 2 ? 'w-[35%] bg-gradient-to-r from-transparent via-white/20 to-transparent' : i <= 4 ? 'w-[20%] bg-gradient-to-r from-transparent via-white/15 to-transparent' : 'w-[12%] bg-gradient-to-r from-transparent via-white/10 to-transparent'">
      </div>
    </div>

    <!-- SVG rings (brighter) -->
    <div class="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.12]">
      <svg viewBox="0 0 600 600" class="w-[500px] h-[500px] md:w-[650px] md:h-[650px]">
        <circle v-for="i in 4" :key="'ring-'+i" :ref="(el) => setRingRef(el, i-1)"
          cx="300" cy="300" :r="280 - i * 50"
          fill="none" stroke="white" :stroke-width="0.5 + i * 0.15" />
      </svg>
    </div>

    <!-- Orbiting dots (brighter) -->
    <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div v-for="i in 8" :key="'orbit-'+i" :ref="(el) => setOrbitRef(el, i-1)"
        class="absolute w-1.5 h-1.5 rounded-full bg-white/70"
        style="left: 50%; top: 50%;">
      </div>
    </div>

    <!-- SVG wave (brighter) -->
    <div class="absolute bottom-0 left-0 w-full h-[140px] pointer-events-none opacity-[0.1]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
        <path ref="waveRef" d="" fill="none" stroke="white" stroke-width="0.4" />
      </svg>
    </div>

    <!-- Horizontal tear band -->
    <div ref="tearBandRef" class="absolute left-0 w-full pointer-events-none opacity-0 z-20"
      style="background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 80%, transparent 100%); mix-blend-mode: screen;">
    </div>

    <!-- Main content -->
    <div class="relative z-10 flex flex-col items-center px-4 max-w-3xl w-full">

      <!-- Status bar -->
      <div class="w-full flex justify-between items-center text-[9px] tracking-[0.3em] text-white/30 mb-10 uppercase">
        <span class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 bg-red-500 animate-pulse shadow-[0_0_6px_rgba(255,0,0,0.5)]"></span>
          SYS.ERROR
        </span>
        <span>ERR::0x194</span>
      </div>

      <!-- ASCII 404 -->
      <div ref="asciiRef" class="mb-6 text-center relative">
        <pre v-for="(line, i) in asciiLines" :key="'ascii-'+i"
          class="ascii-line text-white text-[10px] sm:text-sm md:text-lg lg:text-xl leading-tight tracking-wide"
          style="text-shadow: 0 0 25px rgba(255,255,255,0.15);">{{ line }}</pre>
      </div>

      <!-- Subtitle -->
      <div class="text-[10px] tracking-[0.5em] text-white/30 uppercase mb-6">PAGE NOT FOUND</div>

      <!-- Separator -->
      <div class="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>

      <!-- Diagnostics -->
      <div ref="diagRef" class="w-full space-y-1.5 text-[10px] sm:text-xs mb-8">
        <div class="diag-line opacity-0 flex gap-3">
          <span class="text-white/30 w-16 flex-shrink-0 text-right">STATUS</span>
          <span class="text-white/15">│</span>
          <span class="text-red-400/80">ROUTE_RESOLVE_FAILED</span>
        </div>
        <div class="diag-line opacity-0 flex gap-3">
          <span class="text-white/30 w-16 flex-shrink-0 text-right">PATH</span>
          <span class="text-white/15">│</span>
          <span class="text-white/50">{{ router.currentRoute.value.fullPath }}</span>
        </div>
        <div class="diag-line opacity-0 flex gap-3">
          <span class="text-white/30 w-16 flex-shrink-0 text-right">MSG</span>
          <span class="text-white/15">│</span>
          <span class="text-white/35">The requested sector does not exist or has been lost to the void.</span>
        </div>
        <div class="diag-line opacity-0 flex gap-3">
          <span class="text-white/30 w-16 flex-shrink-0 text-right">ADVICE</span>
          <span class="text-white/15">│</span>
          <span class="text-white/35">Return to main operational grid to avoid memory corruption.</span>
        </div>
      </div>

      <!-- Separator -->
      <div class="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"></div>

      <!-- Actions -->
      <div class="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="text-[10px] text-white/20 tracking-[0.3em] uppercase">
          AUTO_RECOVERY <span class="text-white/60 font-bold">{{ countdown }}s</span>
        </div>
        <button 
          @click="goHome" 
          class="btn-home px-8 py-2.5 border border-white/25 text-white/70 text-[10px] font-bold tracking-[0.3em] uppercase relative overflow-hidden transition-all duration-500 hover:border-white/60 hover:text-white hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] cursor-pointer active:scale-95 opacity-0 bg-transparent"
        >
          &lt; RETURN &gt;
        </button>
      </div>

      <!-- Footer -->
      <div class="w-full flex justify-between items-center text-[8px] tracking-[0.3em] text-white/15 mt-12 uppercase">
        <span>LANRHYME.OS</span>
        <span>V.4.04</span>
      </div>
    </div>
  </div>
</template>
