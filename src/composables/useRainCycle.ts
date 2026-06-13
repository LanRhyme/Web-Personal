import { ref, computed } from 'vue';

type CycleStage = 'DRY' | 'PRE_RAIN' | 'HEAVY' | 'DEATH_RAIN' | 'COLLAPSE';

const cycleStage = ref<CycleStage>('DRY');
const intensity = ref(0.02); // Minimum 0.02
const dryTimeLeft = ref(60);
const dryTotalTime = 60;
const isShaking = ref(false);
const isCollapsed = ref(false);

let cycleInterval: ReturnType<typeof setInterval> | null = null;
let lastTickTime = 0;

// Web Audio API Rain Synthesizer
let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let filter: BiquadFilterNode | null = null;

const initAudio = () => {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  
  audioCtx = new AudioContextClass();
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Pink noise approximation
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0;
  for (let i = 0; i < bufferSize; i++) {
    let white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    data[i] = (b0 + b1 + b2 + b3 + b4 + white * 0.5362) * 0.11;
  }
  
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;
  
  filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;
  
  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseSource.start();
};

const startCycle = () => {
  if (cycleInterval) return;
  
  window.addEventListener('click', initAudio, { once: true });
  window.addEventListener('keydown', initAudio, { once: true });
  
  cycleStage.value = 'DRY';
  intensity.value = 0.02;
  dryTimeLeft.value = dryTotalTime;
  isShaking.value = false;
  isCollapsed.value = false;
  lastTickTime = Date.now();
  
  cycleInterval = setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTickTime) / 1000;
    lastTickTime = now;
    
    if (cycleStage.value === 'DRY') {
      dryTimeLeft.value -= dt;
      if (dryTimeLeft.value <= 0) {
        dryTimeLeft.value = 0;
        cycleStage.value = 'PRE_RAIN';
      }
    } else if (cycleStage.value === 'PRE_RAIN') {
      // Pre-rain lasts 15 seconds, intensity 0.02 -> 0.4
      intensity.value += dt / 15 * 0.38;
      if (intensity.value >= 0.4) {
        intensity.value = 0.4;
        cycleStage.value = 'HEAVY';
        document.body.classList.add('screen-shaking-light');
      }
    } else if (cycleStage.value === 'HEAVY') {
      // Heavy rain lasts 10 seconds, intensity 0.4 -> 1
      intensity.value += dt / 10 * 0.6;
      if (intensity.value >= 1) {
        intensity.value = 1;
        cycleStage.value = 'DEATH_RAIN';
        isShaking.value = true;
        document.body.classList.remove('screen-shaking-light');
        document.body.classList.add('screen-shaking-violent');
      }
    } else if (cycleStage.value === 'DEATH_RAIN') {
      // Death rain lasts 10 seconds, keeping intensity at 1
      intensity.value += dt; // use intensity to track time > 1
      if (intensity.value >= 11) { // 1 + 10s
        cycleStage.value = 'COLLAPSE';
        isCollapsed.value = true;
        document.body.classList.add('page-collapse');
        // Do NOT remove screen-shaking-violent here, so it shakes while collapsing
      }
    } else if (cycleStage.value === 'COLLAPSE') {
      // Complete system failure for 4 seconds
      intensity.value += dt;
      if (intensity.value >= 15) { // 11 + 4s
        // Snap reset
        intensity.value = 0.02;
        cycleStage.value = 'DRY';
        dryTimeLeft.value = dryTotalTime;
        isCollapsed.value = false;
        isShaking.value = false;
        document.body.classList.remove('page-collapse');
        document.body.classList.remove('screen-shaking-violent');
      }
    }
    
    // Update Audio
    if (audioCtx && gainNode && filter) {
       const targetGain = cycleStage.value === 'COLLAPSE' ? 0 : (intensity.value * 0.08);
       gainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.5);
       filter.frequency.setTargetAtTime(800 + (intensity.value > 1 ? 1 : intensity.value) * 1500, audioCtx.currentTime, 0.5);
    }
  }, 50);
};

export function useRainCycle() {
  if (!cycleInterval) {
    startCycle();
  }
  
  return {
    cycleStage,
    intensity: computed(() => {
      if (cycleStage.value === 'COLLAPSE') return 0;
      return Math.min(1, Math.max(0.02, cycleStage.value === 'DEATH_RAIN' || cycleStage.value === 'COLLAPSE' ? 1 : intensity.value));
    }),
    dryTimeLeft,
    dryTotalTime,
    isShaking,
    isCollapsed,
    pipsCount: computed(() => {
      return Math.ceil((dryTimeLeft.value / dryTotalTime) * 12);
    })
  };
}
