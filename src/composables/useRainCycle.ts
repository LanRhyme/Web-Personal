import { ref, computed } from 'vue';
import { triggerShatterEffect } from '../utils/shatterEffect';

type CycleStage = 'DRY' | 'PRE_RAIN' | 'HEAVY' | 'DEATH_RAIN' | 'COLLAPSE';

const STORAGE_KEY_LOCKED = 'rain_cycle_locked';
const STORAGE_KEY_STAGE = 'rain_cycle_stage';
const STORAGE_KEY_INTENSITY = 'rain_cycle_intensity';

// Read persistent lock state from localStorage
const initFromStorage = () => {
  if (typeof localStorage === 'undefined') return { locked: false, stage: 'DRY' as CycleStage, intensity: 0.02 };
  try {
    const locked = localStorage.getItem(STORAGE_KEY_LOCKED) === 'true';
    const stage = (localStorage.getItem(STORAGE_KEY_STAGE) as CycleStage) || 'DRY';
    const savedIntensity = parseFloat(localStorage.getItem(STORAGE_KEY_INTENSITY) || '0.02');
    return { locked, stage, intensity: isNaN(savedIntensity) ? 0.02 : savedIntensity };
  } catch {
    return { locked: false, stage: 'DRY' as CycleStage, intensity: 0.02 };
  }
};

const initialData = initFromStorage();

const cycleStage = ref<CycleStage>(initialData.stage);
const intensity = ref(initialData.intensity);
const dryTimeLeft = ref(120);
const dryTotalTime = 120;
const isShaking = ref(initialData.stage === 'HEAVY' || initialData.stage === 'DEATH_RAIN');
const isCollapsed = ref(false);
const isLocked = ref(initialData.locked);
let shatterCleanup: (() => void) | null = null;

let cycleInterval: ReturnType<typeof setInterval> | null = null;
let lastTickTime = 0;

let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let subOsc: OscillatorNode | null = null;
let subGain: GainNode | null = null;
let audioInitialized = false;

const initAudio = () => {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(e => console.error('Audio resume failed:', e));
    }
    return;
  }
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  audioCtx = new AudioContextClass();

  // 1. Resonant Pink Noise for Roaring Torrential Rain
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
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
  filter.Q.value = 2.5; // Resonant frequency sweep

  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseSource.start();

  // 2. Sub-Bass Seismic Oscillator (Rain World Infrasound Rumble)
  try {
    subOsc = audioCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 45; // 45Hz ground-shaking sub-bass rumble

    subGain = audioCtx.createGain();
    subGain.gain.value = 0;

    subOsc.connect(subGain);
    subGain.connect(audioCtx.destination);
    subOsc.start();
  } catch (e) {
    console.error('Sub-bass audio init failed:', e);
  }

  audioInitialized = true;
};

// Play electrical power-down pitch drop and tear crackle on extinction
const playPowerDownSound = () => {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  try {
    const now = audioCtx.currentTime;
    if (gainNode) gainNode.gain.setValueAtTime(0, now);
    if (subGain) subGain.gain.setValueAtTime(0, now);

    // 1. Visceral electrical tear crackle burst (140ms)
    const crackleLength = Math.floor(audioCtx.sampleRate * 0.14);
    const noiseBuf = audioCtx.createBuffer(1, crackleLength, audioCtx.sampleRate);
    const output = noiseBuf.getChannelData(0);
    for (let i = 0; i < crackleLength; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (crackleLength * 0.35));
    }
    const crackleSrc = audioCtx.createBufferSource();
    crackleSrc.buffer = noiseBuf;
    const crackleFilter = audioCtx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 1400;
    const crackleGain = audioCtx.createGain();
    crackleGain.gain.setValueAtTime(0.28, now);
    crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    crackleSrc.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(audioCtx.destination);
    crackleSrc.start(now);

    // 2. CRT power-down frequency drop
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.38);

    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.error('Failed to play power down sound:', e);
  }
};

// Play crystal water droplet chime on dawn reawakening
const playCrystalDropletSound = () => {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  try {
    const now = audioCtx.currentTime;

    // Primary droplet tone (A5 -> E6 harmonic glide)
    const osc1 = audioCtx.createOscillator();
    const g1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

    g1.gain.setValueAtTime(0.25, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(g1);
    g1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 1.25);

    // Ethereal sub-harmonic ripple
    const osc2 = audioCtx.createOscillator();
    const g2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, now);

    g2.gain.setValueAtTime(0.12, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc2.connect(g2);
    g2.connect(audioCtx.destination);
    osc2.start(now);
    osc2.stop(now + 0.95);
  } catch (e) {
    console.error('Failed to play crystal droplet sound:', e);
  }
};

const saveLockState = () => {
  try {
    localStorage.setItem(STORAGE_KEY_LOCKED, String(isLocked.value));
    localStorage.setItem(STORAGE_KEY_STAGE, cycleStage.value);
    localStorage.setItem(STORAGE_KEY_INTENSITY, String(intensity.value));
  } catch {
    // Ignore storage quota or access errors
  }
};

const syncShakeClasses = () => {
  const container = document.querySelector('.shake-container');
  if (!container) return;
  if (cycleStage.value === 'DEATH_RAIN') {
    if (!container.classList.contains('screen-shaking-violent')) {
      container.classList.remove('screen-shaking-light');
      container.classList.add('screen-shaking-violent');
    }
  } else if (cycleStage.value === 'HEAVY') {
    if (!container.classList.contains('screen-shaking-light')) {
      container.classList.remove('screen-shaking-violent');
      container.classList.add('screen-shaking-light');
    }
  } else if (cycleStage.value !== 'COLLAPSE') {
    container.classList.remove('screen-shaking-light');
    container.classList.remove('screen-shaking-violent');
  }
};

const toggleLock = () => {
  isLocked.value = !isLocked.value;
  if (isLocked.value) {
    if (cycleStage.value === 'HEAVY' || cycleStage.value === 'DEATH_RAIN') {
      isShaking.value = true;
    }
    syncShakeClasses();
  }
  saveLockState();
};

const accelerateCycle = () => {
  if (cycleStage.value === 'DRY') {
    dryTimeLeft.value -= 5;
    if (dryTimeLeft.value <= 0) {
      dryTimeLeft.value = 0;
      cycleStage.value = 'PRE_RAIN';
    }
  }
};

const startCycle = () => {
  if (cycleInterval) return;

  window.addEventListener('click', initAudio);
  window.addEventListener('keydown', initAudio);
  window.addEventListener('touchstart', initAudio);

  if (!isLocked.value) {
    cycleStage.value = 'DRY';
    intensity.value = 0.02;
    dryTimeLeft.value = dryTotalTime;
    isShaking.value = false;
    isCollapsed.value = false;
  }

  lastTickTime = Date.now();

  cycleInterval = setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTickTime) / 1000;
    lastTickTime = now;

    if (!isLocked.value) {
      if (cycleStage.value === 'DRY') {
        dryTimeLeft.value -= dt;
        if (dryTimeLeft.value <= 0) {
          dryTimeLeft.value = 0;
          cycleStage.value = 'PRE_RAIN';
        }
      } else if (cycleStage.value === 'PRE_RAIN') {
        // Pre-rain lasts 15 seconds, intensity 0.02 -> 0.4
        intensity.value += (dt / 15) * 0.38;
        if (intensity.value >= 0.4) {
          intensity.value = 0.4;
          cycleStage.value = 'HEAVY';
          document.querySelector('.shake-container')?.classList.add('screen-shaking-light');
        }
      } else if (cycleStage.value === 'HEAVY') {
        // Heavy rain lasts 10 seconds, intensity 0.4 -> 1
        intensity.value += (dt / 10) * 0.6;
        if (intensity.value >= 1) {
          intensity.value = 1;
          cycleStage.value = 'DEATH_RAIN';
          isShaking.value = true;
          document.querySelector('.shake-container')?.classList.remove('screen-shaking-light');
          document.querySelector('.shake-container')?.classList.add('screen-shaking-violent');
        }
      } else if (cycleStage.value === 'DEATH_RAIN') {
        // Death rain lasts 10 seconds, keeping intensity at 1
        intensity.value += dt;
        if (intensity.value >= 11) {
          cycleStage.value = 'COLLAPSE';
          isCollapsed.value = true;
          document.querySelector('.shake-container')?.classList.remove('screen-shaking-violent');
          document.querySelector('.shake-container')?.classList.remove('screen-shaking-light');

          playPowerDownSound();

          triggerShatterEffect().then(cleanup => {
            shatterCleanup = cleanup;
          });
        }
      } else if (cycleStage.value === 'COLLAPSE') {
        intensity.value += dt;

        // 1.8s of silent blackout respite (intensity: 11 -> 12.8)
        if (intensity.value >= 12.8) {
          playCrystalDropletSound();

          if (shatterCleanup) {
            shatterCleanup();
            shatterCleanup = null;
          }

          intensity.value = 0.02;
          cycleStage.value = 'DRY';
          dryTimeLeft.value = dryTotalTime;
          isCollapsed.value = false;
          isShaking.value = false;
          saveLockState();
        }
      }
    } else {
      // When locked, maintain state and ensure shake classes persist
      if (cycleStage.value === 'HEAVY' || cycleStage.value === 'DEATH_RAIN') {
        isShaking.value = true;
      } else {
        isShaking.value = false;
      }
      syncShakeClasses();
    }

    // Update Web Audio Nodes (Pink Noise & Sub-Bass Rumble)
    if (audioCtx) {
      const isAudible = cycleStage.value !== 'COLLAPSE';
      const normInt = Math.min(1.0, Math.max(0.0, intensity.value > 1 ? 1 : intensity.value));

      if (gainNode && filter) {
        const targetGain = isAudible ? normInt * 0.45 : 0;
        const targetFreq = 700 + normInt * 2600;
        gainNode.gain.value += (targetGain - gainNode.gain.value) * 0.1;
        filter.frequency.value += (targetFreq - filter.frequency.value) * 0.1;
      }

      if (subGain) {
        // Sub-bass ramps up powerfully in HEAVY and DEATH_RAIN
        const isTorrential = cycleStage.value === 'HEAVY' || cycleStage.value === 'DEATH_RAIN';
        const targetSubGain = isAudible && isTorrential ? normInt * 0.32 : (normInt * 0.04);
        subGain.gain.value += (targetSubGain - subGain.gain.value) * 0.1;
      }
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
      return Math.min(1, Math.max(0.02, cycleStage.value === 'DEATH_RAIN' ? 1 : intensity.value));
    }),
    dryTimeLeft,
    dryTotalTime,
    isShaking,
    isCollapsed,
    isLocked,
    toggleLock,
    accelerateCycle,
    pipsCount: computed(() => {
      return Math.ceil((dryTimeLeft.value / dryTotalTime) * 12);
    })
  };
}
