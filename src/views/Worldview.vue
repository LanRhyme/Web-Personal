<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

const canvasContainer = ref<HTMLElement | null>(null);
const holdProgress = ref(0);
const showTruth = ref(false);

// Easter egg state
const blastTriggered = ref(false);

// Garbled text refs
const garbledProject = ref('Project: Age of Shattered Light');
const garbledLog = ref('Interaction Log // High-Dimensional Observation');
const garbledHold = ref('- [ HOLD ] Logic breakdown');
const garbledBlast = ref('- [ R-CLICK ] Energy burst');
const garbledScroll = ref('- [ SCROLL ] Observe');
const garbledTitle = ref('SHATTERED\nLIGHT');
const garbledSubtitle = ref('THE 13TH TIDE');

let scrambleInterval: ReturnType<typeof setInterval> | null = null;
const chars = '█▓░░▒▓█▄▀■▲▼Æ§Ø°±¶µ¼½¾×÷κλμνξοπρστυφχψω§ΔΨΩαβγδεζηθικ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_@#%*';

const scramble = (str: string, intensity = 0.5) => {
  return str.split('').map(char => {
    if (char === ' ' || char === '\n' || char === ':' || char === '-' || char === '/' || char === '[' || char === ']') return char;
    return Math.random() < intensity ? chars[Math.floor(Math.random() * chars.length)] : char;
  }).join('');
};

// State tracking
let isHolding = false;
let holdValue = 0; // 0 to 1

// Three.js Core
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let animationId: number;

// Passes
let bloomPass: UnrealBloomPass;
let glitchPass: GlitchPass;

// Objects
let coreMaterial: THREE.ShaderMaterial;
let coreMesh: THREE.Mesh;
const moonGroup = new THREE.Group();
const moonFragments: { mesh: THREE.Mesh; basePos: THREE.Vector3; randX: number; randY: number; randZ: number }[] = [];
const shards: { mesh: THREE.Mesh; basePos: THREE.Vector3; velocity: THREE.Vector3; randX: number; randY: number }[] = [];
let particles: THREE.Points;

// Mouse & Parallax & Zoom
const mouse = new THREE.Vector2(0, 0);
const targetCameraPos = new THREE.Vector3(0, 0, 15);
let targetCameraZ = 15;
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

// Shaders
const vertexShader = `
uniform float time;
uniform float intensity;
varying vec2 vUv;
varying float vDisplacement;
varying vec3 vNormal;

// Simple 3D noise
float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(in vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

void main() {
    vUv = uv;
    vNormal = normal;
    vec3 pos = position;
    
    float n = noise(pos * 3.0 + time * 0.8);
    vDisplacement = n;
    
    // Core vibrates violently when intensity is high
    pos += normal * n * (0.2 + intensity * 1.5);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform float intensity;
varying vec2 vUv;
varying float vDisplacement;
varying vec3 vNormal;

void main() {
    // Base ethereal white/blue
    vec3 color = vec3(0.9, 0.95, 1.0);
    
    // Fresnel edge darkening for volume
    float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    
    // Core burns bright, edges slightly darker
    color *= mix(1.0, 0.5, fresnel);
    
    // Bloom multiplier driven by interaction
    float bloomMult = 1.0 + (intensity * 8.0);
    color *= bloomMult;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

const handleMouseMove = (e: MouseEvent) => {
  // Normalized mouse coords (-1 to +1)
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  
  // Parallax target
  targetCameraPos.x = mouse.x * 2.0;
  targetCameraPos.y = mouse.y * 2.0;
};

const handleMouseDown = () => {
  isHolding = true;
};

  const handleMouseUp = () => {
    isHolding = false;
  };
  
  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault();
    if (!scene) return;
    
    // Blast wave: force all shards outwards
    shards.forEach(shard => {
      const dir = shard.mesh.position.clone().normalize();
      shard.velocity.add(dir.multiplyScalar(1.5 + Math.random()));
    });
    
    // Light flash
    scene.userData.mainLight.intensity = 15;
    setTimeout(() => {
      if (scene && scene.userData.mainLight) {
        scene.userData.mainLight.intensity = 2;
      }
    }, 150);
  
    blastTriggered.value = true;
    setTimeout(() => blastTriggered.value = false, 2000);
  };
  
  const handleWheel = (e: WheelEvent) => {
    // Zoom in and out
    targetCameraZ += e.deltaY * 0.01;
    if (targetCameraZ < 5) targetCameraZ = 5; // Max zoom in
    if (targetCameraZ > 25) targetCameraZ = 25; // Max zoom out
  };
  
  const initThree = () => {
  if (!canvasContainer.value) return;

  // Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030305, 0.04); // Obsidian fog
  scene.background = new THREE.Color(0x030305);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 15;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  canvasContainer.value.appendChild(renderer.domElement);

  // Post-processing
  const renderScene = new RenderPass(scene, camera);
  
  bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.2;
  bloomPass.strength = 1.5; // Base glow
  bloomPass.radius = 0.5;

  glitchPass = new GlitchPass();
  glitchPass.goWild = false;
  glitchPass.enabled = false; // Only enable on full hold

  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
  composer.addPass(glitchPass);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2);
  mainLight.position.set(5, 10, 7);
  scene.add(mainLight);
  
  const rimLight = new THREE.PointLight(0x4444ff, 3, 20);
  rimLight.position.set(0, 0, -5);
  scene.add(rimLight);
  
  // Store lights in scene userdata for easter eggs
  scene.userData = { mainLight, rimLight, ambientLight };

  // --- Centerpiece: The Shattered Moon ---
  scene.add(moonGroup);

  // 1. Inner Core (The Anomaly / 白蚀)
  coreMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: 0 },
      intensity: { value: 0 } 
    },
    transparent: true,
  });

  const coreGeo = new THREE.IcosahedronGeometry(2.0, 32); 
  coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
  moonGroup.add(coreMesh);

  // 2. Moon Fragments (Rock pieces breaking apart)
  const moonFragGeo = new THREE.IcosahedronGeometry(1.5, 0); // Jagged asteroid look
  const moonFragMat = new THREE.MeshStandardMaterial({
    color: 0x0f0f15, // Dark space rock
    roughness: 0.8,
    metalness: 0.5,
    flatShading: true
  });

  // Create a vast debris field around the core
  for (let i = 0; i < 80; i++) {
    const frag = new THREE.Mesh(moonFragGeo, moonFragMat);
    
    // Position them in a scattered orbit (radius 4.0 to 14.0)
    const radius = 4.0 + Math.random() * 10.0;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    frag.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta) * (0.3 + Math.random() * 0.7), // Squash Y for a ring-like debris field
      radius * Math.cos(phi)
    );
    
    frag.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    // Scale aggressively to make them look like sharp, broken shards
    frag.scale.set(
      0.2 + Math.random() * 1.5,
      0.2 + Math.random() * 1.5,
      0.1 + Math.random() * 0.5
    );
    
    moonGroup.add(frag);
    moonFragments.push({
      mesh: frag,
      basePos: frag.position.clone(),
      randX: (Math.random() - 0.5) * 0.003,
      randY: (Math.random() - 0.5) * 0.003,
      randZ: (Math.random() - 0.5) * 0.003
    });
  }

  // Floating Glass Shards (Crystallization)
  const shardGeo = new THREE.TetrahedronGeometry(0.5, 1);
  const shardMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.95, // Glass-like
    thickness: 1.5,
    ior: 1.5,
    envMapIntensity: 1.0,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 60; i++) {
    const mesh = new THREE.Mesh(shardGeo, shardMat);
    // Random position in a spherical shell around the core
    const radius = 5 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    mesh.position.set(x, y, z);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    // Scale randomness
    const scale = 0.2 + Math.random() * 1.5;
    mesh.scale.set(scale, scale * (1 + Math.random()), scale);
    
    scene.add(mesh);
    shards.push({
      mesh,
      basePos: mesh.position.clone(),
      velocity: new THREE.Vector3(),
      randX: (Math.random() - 0.5) * 0.01,
      randY: (Math.random() - 0.5) * 0.01
    });
  }

  // White Breath Particles (Dust)
  const particleCount = 3000;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    particlePos[i] = (Math.random() - 0.5) * 40;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  
  const particleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.03,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
  });
  
  particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('contextmenu', handleRightClick);
  window.addEventListener('wheel', handleWheel);
  window.addEventListener('touchstart', handleMouseDown, { passive: true });
  window.addEventListener('touchend', handleMouseUp);

  animate();
};

const onWindowResize = () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  const delta = clock.getDelta();

  // Interaction Logic (Hold to reveal)
  if (isHolding) {
    holdValue += 0.01;
    if (holdValue > 1) holdValue = 1;
  } else {
    holdValue -= 0.02;
    if (holdValue < 0) holdValue = 0;
  }
  holdProgress.value = holdValue * 100;

  // Trigger Truth state
  if (holdValue > 0.95 && !showTruth.value) {
    showTruth.value = true;
    glitchPass.enabled = true;
    // Auto-disable truth after a few seconds
    setTimeout(() => {
      showTruth.value = false;
      glitchPass.enabled = false;
    }, 6000);
  }

  // Update Core Shader
  if (coreMaterial) {
    coreMaterial.uniforms.time.value = time;
    // Smoothed intensity based on hold
    const currentIntensity = coreMaterial.uniforms.intensity.value;
    coreMaterial.uniforms.intensity.value += (holdValue - currentIntensity) * 0.1;
    
    // Increase bloom based on hold
    bloomPass.strength = 1.5 + holdValue * 3.0;
  }
  
  // Rotate overall moon group slowly
  if (moonGroup) {
    moonGroup.rotation.y = time * 0.05;
    moonGroup.rotation.x = time * 0.02;
  }

  // Update Moon Fragments (push them out when holding)
  moonFragments.forEach(frag => {
    frag.mesh.rotation.x += frag.randX;
    frag.mesh.rotation.y += frag.randY;
    frag.mesh.rotation.z += frag.randZ;
    
    // Expand the moon crust outwards as logic breaks down (holdValue)
    const targetPos = frag.basePos.clone().multiplyScalar(1.0 + holdValue * 0.5);
    frag.mesh.position.lerp(targetPos, 0.1);
  });

  // Update Shards & Repulsion
  shards.forEach((shard, i) => {
    // Base rotation
    shard.mesh.rotation.x += shard.randX;
    shard.mesh.rotation.y += shard.randY;
    
    // Repulsion logic (simulating the Chord of Form / 念)
    // Map mouse to 3D world space loosely
    const mouse3D = new THREE.Vector3(mouse.x * 10, mouse.y * 10, 0);
    const dist = shard.mesh.position.distanceTo(mouse3D);
    
    if (dist < 4) {
      // Repel
      const dir = shard.mesh.position.clone().sub(mouse3D).normalize();
      shard.velocity.add(dir.multiplyScalar(0.02));
    }
    
    // Spring back to base position
    const spring = shard.basePos.clone().sub(shard.mesh.position).multiplyScalar(0.01);
    shard.velocity.add(spring);
    
    // Apply velocity & dampening
    shard.mesh.position.add(shard.velocity);
    shard.velocity.multiplyScalar(0.9);
  });

  // Rotate particles
  if (particles) {
    particles.rotation.y = time * 0.02;
  }

  // Smooth Camera Parallax (Lerp) and Zoom
  camera.position.x += (targetCameraPos.x - camera.position.x) * 0.05;
  camera.position.y += (targetCameraPos.y - camera.position.y) * 0.05;
  camera.position.z += (targetCameraZ - camera.position.z) * 0.05;
  camera.lookAt(0, 0, 0);

  // Render via Composer
  composer.render();
};

onMounted(() => {
  initThree();
  
  scrambleInterval = setInterval(() => {
    const intensityFactor = 0.4;
    garbledProject.value = scramble('Project: Age of Shattered Light', intensityFactor * 0.9);
    garbledLog.value = scramble('Interaction Log // High-Dimensional Observation', intensityFactor * 1.1);
    garbledHold.value = scramble('- [ HOLD ] Logic breakdown', intensityFactor * 0.8);
    garbledBlast.value = scramble('- [ R-CLICK ] Energy burst', intensityFactor * 0.8);
    garbledScroll.value = scramble('- [ SCROLL ] Observe', intensityFactor * 0.8);
    garbledTitle.value = scramble('SHATTERED\nLIGHT', intensityFactor);
    garbledSubtitle.value = scramble('THE 13TH TIDE', intensityFactor * 1.1);
  }, 120);
});

onUnmounted(() => {
  if (scrambleInterval) clearInterval(scrambleInterval);
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mousedown', handleMouseDown);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('contextmenu', handleRightClick);
  window.removeEventListener('wheel', handleWheel);
  window.removeEventListener('touchstart', handleMouseDown);
  window.removeEventListener('touchend', handleMouseUp);
  
  if (renderer && canvasContainer.value) {
    canvasContainer.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
  
  // Clean memory
  scene?.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
      object.geometry.dispose();
      if (object.material instanceof Array) {
        object.material.forEach(mat => mat.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
  
  composer?.dispose();
});
</script>

<template>
  <div class="worldview-container relative w-full h-screen overflow-hidden bg-[#030305] text-white selection:bg-white selection:text-black">
    <!-- Three.js Canvas -->
    <div ref="canvasContainer" class="absolute inset-0 z-0 cursor-crosshair"></div>

    <!-- HUD Overlay -->
    <div class="absolute inset-0 pointer-events-none z-10 p-6 md:p-12 lg:p-16 mix-blend-difference flex flex-col justify-end items-start gap-8">
      
      <!-- Return Button (Top Left) -->
      <router-link to="/worldview" class="absolute top-6 left-6 md:top-12 md:left-12 font-mono text-xs tracking-widest text-white/50 hover:text-[var(--color-brand)] transition-colors duration-300 pointer-events-auto flex items-center gap-2 z-50">
        <span>&lt; RETURN TO NEXUS</span>
      </router-link>
      
      <!-- Logs -->
      <div class="font-mono text-[9px] md:text-[10px] tracking-[0.2em] uppercase opacity-60 leading-relaxed border-l border-white/20 pl-4">
        <p class="text-white/80 font-bold mb-3">{{ garbledProject }}</p>
        <p class="text-white/50 mb-1">{{ garbledLog }}</p>
        <p class="text-white/40" :class="{'text-[var(--color-brand)]': isHolding}">{{ garbledHold }}</p>
        <p class="text-white/40" :class="{'text-red-400': blastTriggered}">{{ garbledBlast }}</p>
        <p class="text-white/40">{{ garbledScroll }}</p>
      </div>

      <!-- Title -->
      <div class="text-left mt-2">
        <h1 class="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mix-blend-overlay opacity-80 whitespace-pre-line" style="font-family: 'Inter', sans-serif; line-height: 0.9;">
          {{ garbledTitle }}
        </h1>
        <p class="font-mono text-[9px] md:text-[10px] tracking-[0.5em] mt-2 opacity-50">{{ garbledSubtitle }}</p>
      </div>

    </div>

    <!-- Hold Progress Bar -->
    <div class="absolute bottom-0 left-0 h-1 bg-white transition-all duration-75 ease-out z-20 pointer-events-none" :style="{ width: `${holdProgress}%`, opacity: holdProgress > 0 ? 0.8 : 0 }"></div>

    <!-- The Truth Overlay (Triggers on full hold) -->
    <transition name="truth-fade">
      <div v-if="showTruth" class="absolute inset-0 z-50 flex items-center justify-center pointer-events-none mix-blend-difference">
        <div class="text-center w-full px-4">
          <h2 class="text-4xl md:text-7xl font-bold uppercase tracking-widest text-white mb-6 animate-pulse">
            13TH TIDE IS NOT THE END
          </h2>
          <p class="font-mono text-sm md:text-xl tracking-[0.8em] text-white/70">
            IT IS COMPLETE OBSERVATION
          </p>
        </div>
      </div>
    </transition>
    
    <!-- Grain/Noise Overlay for Cinematic Feel -->
    <div class="absolute inset-0 z-30 pointer-events-none opacity-20" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
  </div>
</template>

<style scoped>
/* Ultra-smooth transitions for Truth text */
.truth-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.truth-fade-leave-active {
  transition: all 2s ease-in-out;
}
.truth-fade-enter-from,
.truth-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
  letter-spacing: 0.1em;
}

/* Minimalist scrollbar hide */
::-webkit-scrollbar {
  display: none;
}
</style>
