<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as THREE from 'three';
import gsap from 'gsap';

const containerRef = ref<HTMLElement | null>(null);
const route = useRoute();

let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let planeMesh: THREE.Mesh;
let animationId: number;

const startTime = performance.now() * 0.001;
const getTime = () => performance.now() * 0.001 - startTime;

const isMobile = typeof window !== 'undefined'
  ? (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))
  : false;

// --- Cinematic Camera & Parameter Presets per Route ---
interface BlackHolePreset {
  camX: number;
  camY: number;
  camZ: number;
  incl: number;       // Disk tilt angle (rad)
  roll: number;       // Roll angle (rad)
  speed: number;      // Accretion swirl velocity
  exposure: number;   // Tone curve exposure
  colorR: number;     // Morandi palette R
  colorG: number;     // Morandi palette G
  colorB: number;     // Morandi palette B
}

const ROUTE_PRESETS: Record<string, BlackHolePreset> = {
  // Home: Right-side hero anchor, classic cinematic angle
  home: {
    camX: isMobile ? 0.0 : 0.45,
    camY: isMobile ? 0.65 : 1.15,
    camZ: isMobile ? 4.3 : 4.8,
    incl: isMobile ? 0.38 : 0.32,
    roll: -0.15,
    speed: 0.38,
    exposure: isMobile ? 1.05 : 0.95,
    colorR: 0.92,
    colorG: 0.62,
    colorB: 0.32
  },
  // Projects: Bold lateral shift to far right (1.15), clearing left 60% for cards
  projects: {
    camX: isMobile ? 0.0 : 1.15,
    camY: isMobile ? 0.60 : 0.82,
    camZ: isMobile ? 4.4 : 5.1,
    incl: 0.44,
    roll: 0.16,
    speed: 0.42,
    exposure: isMobile ? 1.0 : 0.9,
    colorR: 0.88,
    colorG: 0.65,
    colorB: 0.38
  },
  // Works: Swept over to the LEFT-HIGH quadrant (-0.55, 1.45) for dynamic asymmetric variety
  works: {
    camX: isMobile ? 0.0 : -0.55,
    camY: isMobile ? 0.68 : 1.45,
    camZ: isMobile ? 4.4 : 5.3,
    incl: 0.65,
    roll: -0.32,
    speed: 0.3,
    exposure: 1.0,
    colorR: 0.94,
    colorG: 0.58,
    colorB: 0.28
  },
  // Articles: High-right calm background halo, unobstructed reading column
  articles: {
    camX: 0.0,
    camY: isMobile ? 0.70 : 1.25,
    camZ: isMobile ? 4.5 : 5.7,
    incl: 0.24,
    roll: -0.05,
    speed: 0.24,
    exposure: isMobile ? 0.85 : 0.72,
    colorR: 0.8,
    colorG: 0.55,
    colorB: 0.35
  },
  // Worldview: Mystical left-forward singularity (-0.35, 0.95), dramatic presence
  worldview: {
    camX: 0.0,
    camY: isMobile ? 0.65 : 1.1,
    camZ: isMobile ? 4.2 : 4.5,
    incl: 0.38,
    roll: 0.25,
    speed: 0.52,
    exposure: 1.05,
    colorR: 0.95,
    colorG: 0.7,
    colorB: 0.42
  },
  // Terminal: Dead-center technical core
  terminal: {
    camX: 0.0,
    camY: 0.7,
    camZ: isMobile ? 4.2 : 4.6,
    incl: 0.18,
    roll: 0.0,
    speed: 0.48,
    exposure: 0.95,
    colorR: 0.9,
    colorG: 0.64,
    colorB: 0.36
  }
};

const getRouteKey = (path: string): string => {
  if (!path || path === '/') return 'home';
  if (path.startsWith('/projects')) return 'projects';
  if (path.startsWith('/works')) return 'works';
  if (path.startsWith('/articles')) return 'articles';
  if (path.startsWith('/worldview')) return 'worldview';
  if (path.startsWith('/terminal')) return 'terminal';
  return 'home';
};

const initialPreset = ROUTE_PRESETS[getRouteKey(route.path)] || ROUTE_PRESETS.home;

// GSAP Animated Parameters
const animState = {
  camX: initialPreset.camX,
  camY: initialPreset.camY,
  camZ: initialPreset.camZ,
  incl: initialPreset.incl,
  roll: initialPreset.roll,
  speed: initialPreset.speed,
  exposure: initialPreset.exposure,
  colorR: initialPreset.colorR,
  colorG: initialPreset.colorG,
  colorB: initialPreset.colorB,
  glitch: 0.0
};

// Physics Inertia: Calm Multi-Tier Delayed Gravitational Glide
const cameraInertia = { x: 0, y: 0 };
const diskInertia = { x: 0, y: 0 };

// Deep Scroll Dynamics: Orbital Path (Curved Trajectory & Position Shifts)
const scrollDynamics = {
  shiftX: 0,
  shiftY: 0,
  shiftZ: 0,
  pitch: 0,
  roll: 0,
  velocity: 0,
  progress: 0
};

const celestialDrift = { x: 0, y: 0, rot: 0 };

let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
let lastScrollTime = performance.now();

// Smooth GSAP QuickTo Setters
let quickCamX: ((value: number) => void) | null = null;
let quickCamY: ((value: number) => void) | null = null;
let quickDiskX: ((value: number) => void) | null = null;
let quickDiskY: ((value: number) => void) | null = null;

// Route Warp Acceleration & Dramatic Camera Morphing
const transitionToRoute = (target: BlackHolePreset, duration = 2.2) => {
  gsap.fromTo(
    animState,
    { speed: target.speed * 2.2 },
    { speed: target.speed, duration: 2.2, ease: 'power2.out' }
  );

  gsap.to(animState, {
    camX: target.camX,
    camY: target.camY,
    camZ: target.camZ,
    incl: target.incl,
    roll: target.roll,
    exposure: target.exposure,
    colorR: target.colorR,
    colorG: target.colorG,
    colorB: target.colorB,
    duration,
    ease: 'power3.inOut',
    overwrite: 'auto'
  });
};

watch(
  () => route.path,
  (newPath) => {
    const target = ROUTE_PRESETS[getRouteKey(newPath)] || ROUTE_PRESETS.home;
    transitionToRoute(target);
  }
);

// Mouse Movement: Calm, silky delayed glide
const onMouseMove = (e: MouseEvent) => {
  const nx = (e.clientX / window.innerWidth) * 2 - 1;
  const ny = -(e.clientY / window.innerHeight) * 2 + 1;

  if (quickCamX) quickCamX(nx);
  if (quickCamY) quickCamY(ny);
  if (quickDiskX) quickDiskX(nx);
  if (quickDiskY) quickDiskY(ny);
};

const onTouchMove = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    // Gentle micro-tilt on mobile touch to avoid jarring camera whips during scrolling
    const nx = ((e.touches[0].clientX / window.innerWidth) * 2 - 1) * 0.3;
    const ny = (-(e.touches[0].clientY / window.innerHeight) * 2 + 1) * 0.3;
    if (quickCamX) quickCamX(nx);
    if (quickCamY) quickCamY(ny);
    if (quickDiskX) quickDiskX(nx);
    if (quickDiskY) quickDiskY(ny);
  }
};

// Deep GSAP Scroll Dynamics: Multi-Axis Orbital Flight & Sweeping Trajectory
const onScroll = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const curY = window.scrollY;
  const progress = maxScroll > 0 ? Math.min(1.0, Math.max(0.0, curY / maxScroll)) : 0;

  const now = performance.now();
  const dt = Math.max((now - lastScrollTime) * 0.001, 0.008);
  const v = (curY - lastScrollY) / dt;

  lastScrollY = curY;
  lastScrollTime = now;

  scrollDynamics.progress = progress;

  // Orbital curved trajectory: Sweeps horizontally & ascends/descends in space
  // Scaled moderately on mobile portrait screens to keep the black hole elegantly in frame
  const orbitMult = isMobile ? 0.35 : 1.0;
  const orbitX = (Math.sin(progress * Math.PI) * 0.58 + progress * 0.28) * orbitMult;
  const orbitY = (Math.sin(progress * Math.PI * 0.85) * 0.72) * orbitMult;
  const orbitZ = (progress * 0.48) * orbitMult;

  gsap.to(scrollDynamics, {
    shiftX: orbitX,                 // Sweeping lateral travel across the screen
    shiftY: orbitY,                 // Vertical swooping flight
    shiftZ: orbitZ,                 // Depth translation
    pitch: progress * 0.56,         // Unfolding disk tilt
    roll: -progress * 0.28,         // Banking roll angle
    duration: 1.4,
    ease: 'power2.out',
    overwrite: 'auto'
  });

  // Scroll Velocity Surge:
  const normVelocity = Math.min(Math.abs(v) / 1600.0, 1.6);
  if (normVelocity > 0.05) {
    gsap.to(scrollDynamics, {
      velocity: normVelocity,
      duration: 0.25,
      ease: 'power1.out',
      overwrite: 'auto',
      onComplete: () => {
        gsap.to(scrollDynamics, {
          velocity: 0,
          duration: 1.8,
          ease: 'power2.out'
        });
      }
    });
  }
};

// Micro-interaction: Gravitational lens micro-tension on UI hover
const onMouseOver = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null;
  if (target && target.closest('a, button, [role="button"], .cyber-glass, input, textarea')) {
    gsap.to(animState, {
      exposure: (ROUTE_PRESETS[getRouteKey(route.path)]?.exposure || 0.95) * 1.08,
      duration: 0.45,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  } else {
    gsap.to(animState, {
      exposure: ROUTE_PRESETS[getRouteKey(route.path)]?.exposure || 0.95,
      duration: 0.75,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }
};

const handleGlitch = (e: Event) => {
  const customEvent = e as CustomEvent;
  const active = customEvent.detail?.active ?? false;
  gsap.to(animState, {
    glitch: active ? 1.0 : 0.0,
    duration: 0.1,
    ease: 'none'
  });
};

const initThree = () => {
  if (!containerRef.value) return;

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.25);
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(dpr);
  containerRef.value.appendChild(renderer.domElement);

  const geometry = new THREE.PlaneGeometry(2, 2);

  const nSteps = isMobile ? 45 : 40;
  const dtStep = isMobile ? '0.140' : '0.135';

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uCamDrift: { value: new THREE.Vector2(0, 0) },
      uDiskLag: { value: new THREE.Vector2(0, 0) },
      uDrift: { value: new THREE.Vector3(0, 0, 0) },
      uCamPos: { value: new THREE.Vector3(animState.camX, animState.camY, animState.camZ) },
      uScrollShift: { value: new THREE.Vector3(0, 0, 0) },
      uScrollRot: { value: new THREE.Vector2(0, 0) },
      uScrollVelocity: { value: 0.0 },
      uScrollProgress: { value: 0.0 },
      uIncl: { value: animState.incl },
      uRoll: { value: animState.roll },
      uSpeed: { value: animState.speed },
      uExposure: { value: animState.exposure },
      uBaseColor: { value: new THREE.Vector3(animState.colorR, animState.colorG, animState.colorB) },
      uGlitch: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uCamDrift;
      uniform vec2 uDiskLag;
      uniform vec3 uDrift;
      uniform vec3 uCamPos;
      uniform vec3 uScrollShift;
      uniform vec2 uScrollRot;
      uniform float uScrollVelocity;
      uniform float uScrollProgress;
      uniform float uIncl;
      uniform float uRoll;
      uniform float uSpeed;
      uniform float uExposure;
      uniform vec3 uBaseColor;
      uniform float uGlitch;

      varying vec2 vUv;

      #define STEPS ${nSteps}
      #define DT ${dtStep}

      // --- High-Performance Procedural Noise ---
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        v += 0.520 * noise(p); p *= 2.04;
        v += 0.260 * noise(p); p *= 2.02;
        v += 0.130 * noise(p); p *= 2.03;
        v += 0.065 * noise(p);
        return v;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

        if (uGlitch > 0.5) {
          uv.x += sin(uTime * 45.0 + uv.y * 30.0) * 0.012;
        }

        // Camera setup with Tier-1 delayed mouse glide, celestial drift & GSAP scroll trajectory
        vec2 camOffset = uCamDrift * 0.22;
        vec3 ro = vec3(
          uCamPos.x + camOffset.x + uDrift.x + uScrollShift.x,
          uCamPos.y + camOffset.y * 0.55 + uDrift.y + uScrollShift.y,
          uCamPos.z + uScrollShift.z
        );

        // Director Camera Look-At: smoothly tracks the orbital position
        vec3 target = vec3(uScrollShift.x * 0.35, uScrollShift.y * 0.25, 0.0);

        vec3 fwd = normalize(target - ro);
        vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
        vec3 up = cross(right, fwd);
        vec3 rd = normalize(uv.x * right + uv.y * up + 1.75 * fwd);

        // Rotation matrix: Base orientation + Tier-2 delayed disk tilt + GSAP scroll orbital trajectory
        float effIncl = uIncl + uDiskLag.y * 0.18 + uScrollRot.x;
        float effRoll = uRoll + uDiskLag.x * 0.22 + uDrift.z + uScrollRot.y;

        float ci = cos(effIncl), si = sin(effIncl);
        mat3 rotX = mat3(
          1.0, 0.0, 0.0,
          0.0, ci, -si,
          0.0, si, ci
        );
        float cr = cos(effRoll), sr = sin(effRoll);
        mat3 rotZ = mat3(
          cr, -sr, 0.0,
          sr, cr, 0.0,
          0.0, 0.0, 1.0
        );
        mat3 rotLocal = rotZ * rotX;

        vec3 rayPos = rotLocal * ro;
        vec3 rayDir = rotLocal * rd;

        // Controlled geometric bounds
        float ssRadius = 0.54;       // Event horizon radius
        float discInner = 0.92;      // Inner accretion disk
        float discOuter = 2.65;      // Outer boundary of dust cloud

        vec3 color = vec3(0.0);
        float alpha = 0.0;
        bool captured = false;

        // Effective disk speed boosted by scroll velocity kinetic surge
        float effSpeed = uSpeed * (1.0 + uScrollVelocity * 1.5);

        // Raymarch through curved spacetime
        for (int i = 0; i < STEPS; i++) {
          float r = length(rayPos);

          // Event horizon swallowing
          if (r < ssRadius) {
            captured = true;
            break;
          }

          // Smooth gravitational bending toward singularity
          float invR3 = 1.0 / (r * r * r + 0.08);
          vec3 bend = (-rayPos) * invR3 * 0.15;
          rayDir = normalize(rayDir + bend);
          rayPos += rayDir * DT;

          // Volumetric Accretion Dust Cloud
          float h = abs(rayPos.y);
          float distXZ = length(rayPos.xz);

          if (h < 0.32 && distXZ >= discInner && distXZ <= discOuter) {
            float radial = smoothstep(discInner, discInner + 0.22, distXZ) *
                           (1.0 - smoothstep(discOuter - 0.5, discOuter, distXZ));
            float vertical = exp(-h * 12.0);

            // Keplerian differential swirl with scroll kinetic surge
            float phi = atan(rayPos.z, rayPos.x);
            float omega = 1.45 / pow(distXZ, 1.25);
            float angle = phi - uTime * omega * effSpeed;

            // Spiral dust filaments
            vec2 pUV = vec2(distXZ * 2.8, angle * 1.8);
            float n1 = fbm(pUV);
            float n2 = fbm(pUV * 2.2 + vec2(n1 * 1.1, -uTime * 0.14));
            float streaks = n1 * 0.65 + n2 * 0.35;

            float density = radial * vertical * (streaks * 0.75 + 0.25);
            density = clamp(density, 0.0, 1.0);

            // Relativistic Doppler beaming
            float doppler = clamp(1.0 - (rayPos.x / max(distXZ, 0.1)) * 0.45, 0.45, 1.75);

            // Morandi temperature grading: warm platinum-ivory to deep amber-copper
            vec3 colInner = vec3(1.0, 0.94, 0.88);
            vec3 colMid = uBaseColor;
            vec3 colOuter = vec3(0.55, 0.36, 0.22);
            vec3 tempCol = mix(colOuter, mix(colMid, colInner, pow(radial, 1.3)), radial);

            vec3 sampleCol = tempCol * doppler;

            // Controlled front-to-back accumulation
            color += (1.0 - alpha) * sampleCol * density * 0.32;
            alpha += (1.0 - alpha) * density * 0.28;
          }

          // Delicate photon ring glow around the shadow
          float photonDist = abs(r - ssRadius * 1.25);
          float photonGlow = exp(-photonDist * 16.0) * 0.25;
          color += (1.0 - alpha) * vec3(1.0, 0.95, 0.9) * photonGlow;
          alpha += (1.0 - alpha) * photonGlow * 0.2;

          if (alpha > 0.96) break;
        }

        // Swallowed by event horizon: pure pitch-black abyss
        if (captured) {
          color = vec3(0.0);
          alpha = 0.96;
        }

        // Deep space background stars
        if (!captured) {
          vec3 sDir = rayDir;
          vec2 sUV = vec2(atan(sDir.z, sDir.x), sDir.y);
          float h = hash(floor(sUV * 80.0));
          if (h > 0.985) {
            float twinkle = sin(uTime * 1.8 + h * 90.0) * 0.35 + 0.65;
            vec3 starCol = mix(vec3(0.9, 0.85, 0.75), vec3(0.75, 0.88, 1.0), hash(floor(sUV * 80.0) + 1.0));
            color += (1.0 - alpha) * starCol * twinkle * 0.35;
          }
        }

        // Filmic ACES Tone Mapping with scroll-adjusted exposure
        float effExposure = uExposure * mix(1.0, 0.84, uScrollProgress);
        color *= effExposure;
        color = color * (2.51 * color + 0.03) / (color * (2.43 * color + 0.59) + 0.14);

        // Edge vignette: aspect-ratio normalized for pristine mobile & desktop contrast
        vec2 vigCoord = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.xy;
        float vig = 1.0 - smoothstep(0.35, 0.72, length(vigCoord));
        color *= vig;
        alpha = clamp(alpha * vig, 0.0, 0.82);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false
  });

  planeMesh = new THREE.Mesh(geometry, shaderMaterial);
  scene.add(planeMesh);

  // Two-Tier Delayed Gravitational QuickTo Setters:
  quickCamX = gsap.quickTo(cameraInertia, 'x', { duration: 1.6, ease: 'power3.out' });
  quickCamY = gsap.quickTo(cameraInertia, 'y', { duration: 1.6, ease: 'power3.out' });

  quickDiskX = gsap.quickTo(diskInertia, 'x', { duration: 2.6, ease: 'power4.out' });
  quickDiskY = gsap.quickTo(diskInertia, 'y', { duration: 2.6, ease: 'power4.out' });

  // Continuous Ambient Celestial Breathing (Smooth Lissajous float)
  gsap.to(celestialDrift, {
    x: 0.06,
    y: 0.04,
    rot: 0.035,
    duration: 9.0,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });

  // Entrance ignite timeline
  gsap.fromTo(
    animState,
    { exposure: 0.0, speed: 0.05 },
    {
      exposure: initialPreset.exposure,
      speed: initialPreset.speed,
      duration: 2.2,
      ease: 'power3.out'
    }
  );

  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  const time = getTime();

  if (planeMesh) {
    const mat = planeMesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uCamDrift.value.set(cameraInertia.x, cameraInertia.y);
    mat.uniforms.uDiskLag.value.set(diskInertia.x, diskInertia.y);
    mat.uniforms.uDrift.value.set(celestialDrift.x, celestialDrift.y, celestialDrift.rot);
    mat.uniforms.uCamPos.value.set(animState.camX, animState.camY, animState.camZ);
    mat.uniforms.uScrollShift.value.set(scrollDynamics.shiftX, scrollDynamics.shiftY, scrollDynamics.shiftZ);
    mat.uniforms.uScrollRot.value.set(scrollDynamics.pitch, scrollDynamics.roll);
    mat.uniforms.uScrollVelocity.value = scrollDynamics.velocity;
    mat.uniforms.uScrollProgress.value = scrollDynamics.progress;
    mat.uniforms.uIncl.value = animState.incl;
    mat.uniforms.uRoll.value = animState.roll;
    mat.uniforms.uSpeed.value = animState.speed;
    mat.uniforms.uExposure.value = animState.exposure;
    mat.uniforms.uBaseColor.value.set(animState.colorR, animState.colorG, animState.colorB);
    mat.uniforms.uGlitch.value = animState.glitch;
  }

  renderer.render(scene, camera);
};

const onWindowResize = () => {
  if (!renderer || !planeMesh) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const mat = planeMesh.material as THREE.ShaderMaterial;
  mat.uniforms.uResolution.value.set(w, h);
  renderer.setSize(w, h);
};

onMounted(() => {
  initThree();
  window.addEventListener('resize', onWindowResize, { passive: true });
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mouseover', onMouseOver, { passive: true });
  window.addEventListener('global-glitch', handleGlitch);
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('mouseover', onMouseOver);
  window.removeEventListener('global-glitch', handleGlitch);

  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
  if (planeMesh) {
    planeMesh.geometry.dispose();
    (planeMesh.material as THREE.Material).dispose();
  }
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-[-1] bg-[#050608] overflow-hidden">
    <!-- Cinematic Gargantua Black Hole with 3D Orbital Flight Path -->
    <div ref="containerRef" class="absolute inset-0"></div>
  </div>
</template>
