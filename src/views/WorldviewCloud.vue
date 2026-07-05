<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvasContainer = ref<HTMLElement | null>(null);

// Easter egg state
const blastTriggered = ref(false);

// Garbled text refs
const garbledProject = ref('LOCAL_GROUP // ITERATOR_TRANSIT');
const garbledLog = ref('Sub-Regional Conveyance System');
const garbledHold = ref('- [ MOUSE ] Scan Structural Integrity');
const garbledBlast = ref('- [ R-CLICK ] Overseer Ping');
const garbledTitle = ref('HEAVY\nTRANSPORT');
const garbledSubtitle = ref('NODE: THE EXTERIOR');

let scrambleInterval: ReturnType<typeof setInterval> | null = null;
const chars = '█▓░░▒▓█▄▀■▲▼Æ§Ø°±¶µ¼½¾×÷κλμνξοπρστυφχψω§ΔΨΩαβγδεζηθικ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_@#%*';

const scramble = (str: string, intensity = 0.5) => {
  return str.split('').map(char => {
    if (char === ' ' || char === '\n' || char === ':' || char === '-' || char === '/' || char === '[' || char === ']') return char;
    return Math.random() < intensity ? chars[Math.floor(Math.random() * chars.length)] : char;
  }).join('');
};

// Three.js Core
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;
let material: THREE.ShaderMaterial;

// Mouse tracking
const mouse = new THREE.Vector2(0, 0);
const clock = new THREE.Clock();

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float iTime;
uniform vec2 iResolution;
varying vec2 vUv;

// Procedural replacement for iChannel0 noise texture
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 x){
    vec2 f = fract(x);
    vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
    
    vec2 p = floor(x);
	float a = hash(p + vec2(0.0, 0.0));
	float b = hash(p + vec2(1.0, 0.0));
	float c = hash(p + vec2(0.0, 1.0));
	float d = hash(p + vec2(1.0, 1.0));
    
	return a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y;
}

float fbm(vec2 x, int detail){
    float a = 0.0;
    float b = 1.0;
    float t = 0.0;
    for(int i = 0; i < detail; i++){
        float n = noise(x);
        a += b*n;
        t += b;
        b *= 0.7;
        x *= 2.0; 
    }
    return a/t;
}

float fbm2(vec2 x, int detail){
    float a = 0.0;
    float b = 1.0;
    float t = 0.0;
    for(int i = 0; i < detail; i++){
        float n = noise(x);
        a += b*n;
        t += b;
        b *= 0.9;
        x *= 2.0; 
    }
    return a/t;
}

float box(vec2 uv, float x1, float x2, float y1, float y2){
    return (uv.x > x1 && uv.x < x2 && uv.y > y1 && uv.y < y2)?1.0:0.0;
} 

#define dot2(v) dot(v, v)
#define layer(dh, v)  if (uv.y < h + midlevel - (dh) ) return vec4(v, 1.);

vec4 foreground(vec2 uv, float t){
    float midlevel;
    float h;
    float disp;
    float dist;
    vec2 uv2;
    
    uv.y -= 0.2;
    
    // c14
    midlevel = -0.1;
    disp = 1.7;
    dist = 1.0;
    uv2 = uv + vec2(t/dist + 40.0, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.12, vec3(0.43, 0.32, 0.31));
    layer(0.08, vec3(0.55, 0.42, 0.41));
    layer(0.04, vec3(0.66, 0.42, 0.40));
    layer(0., vec3(0.77, 0.48, 0.46));
    
    // c13
    midlevel = 0.05;
    disp = 1.7;
    dist = 2.0;
    uv2 = uv + vec2(t/dist + 38.0, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.1, vec3(0.95, 0.66, 0.48));
    layer(0.04, vec3(0.98, 0.76, 0.64));
    layer(0., vec3(0.95, 0.80, 0.77));
    
    return vec4(0.95, 0.80, 0.77, 0.);
}

vec4 background(vec2 uv, float t){
    float midlevel;
    float h;
    float disp;
    float dist;
    vec2 uv2;
    
    // c12
    midlevel = 0.3;
    disp = 0.9;
    dist = 10.0;
    uv2 = uv + vec2(t/dist + 32.5, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.14, vec3(0.48, 0.19, 0.20));
    layer(0.1, vec3(0.68, 0.28, 0.19));
    layer(0.07, vec3(0.88, 0.38, 0.24));
    layer(0., vec3(0.95, 0.45, 0.30));
    
    // c11
    midlevel = 0.35;
    disp = 1.0;
    dist = 15.0;
    uv2 = uv + vec2(t/dist + 30.0, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.04, vec3(0.98, 0.76, 0.64));
    layer(0., vec3(0.95, 0.80, 0.77));
    
    // c10
    midlevel = 0.35;
    disp = 3.5;
    dist = 20.0;
    uv2 = uv + vec2(t/dist + 27.5, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.12, vec3(0.43, 0.32, 0.31));
    layer(0.08, vec3(0.55, 0.42, 0.41));
    layer(0.04, vec3(0.66, 0.42, 0.40));
    layer(0., vec3(0.77, 0.48, 0.46));
    
    // c9
    midlevel = 0.45;
    disp = 2.0;
    dist = 25.0;
    uv2 = uv + vec2(t/dist + 23.0, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.04, vec3(0.98, 0.57, 0.36));
    layer(0., vec3(1.0, 0.62, 0.44));
    
    // c8
    midlevel = 0.5;
    disp = 2.3;
    dist = 30.0;
    uv2 = uv + vec2(t/dist + 20.5, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.12, vec3(0.41, 0.27, 0.27));
    layer(0.08, vec3(0.53, 0.35, 0.32));
    layer(0.04, vec3(0.80, 0.24, 0.17));
    layer(0., vec3(0.99, 0.29, 0.20));
    
    // c7
    midlevel = 0.5;
    disp = 2.5;
    dist = 35.0;
    uv2 = uv + vec2(t/dist + 18.0, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.1, vec3(0.88, 0.38, 0.24));
    layer(0.05, vec3(0.98, 0.42, 0.28));
    layer(0., vec3(1.0, 0.48, 0.35));
    
    // c6
    midlevel = 0.6;
    disp = 2.0;
    dist = 40.0;
    uv2 = uv + vec2(t/dist + 18.0, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.1, vec3(0.95, 0.66, 0.48));
    layer(0., vec3(1.0, 0.76, 0.60));
    
    // c5
    midlevel = 0.75;
    disp = 3.5;
    dist = 45.0;
    uv2 = uv + vec2(t/dist + 15.5, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.2, vec3(1.0, 0.55, 0.33));
    layer(0.15, vec3(0.98, 0.50, 0.24));
    layer(0.1, vec3(0.90, 0.55, 0.40));
    layer(0., vec3(1.0, 0.62, 0.44));
    
    // c4
    midlevel = 0.7;
    disp = 2.7;
    dist = 50.0;
    uv2 = uv + vec2(t/dist + 12.0, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.04, vec3(0.73, 0.36, 0.30));
    layer(0., vec3(0.80, 0.40, 0.34));
    
    // c3
    midlevel = 0.8;
    disp = 2.7;
    dist = 60.0;
    uv2 = uv + vec2(t/dist + 9.5, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.1, vec3(0.93, 0.58, 0.35));
    layer(0., vec3(1.0, 0.76, 0.60));
    
    // c2
    midlevel = 0.9;
    disp = 3.0;
    dist = 70.0;
    uv2 = uv + vec2(t/dist + 7.0, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.1, vec3(0.56, 0.25, 0.22));
    layer(0.05, vec3(0.60, 0.30, 0.27));
    layer(0., vec3(0.74, 0.35, 0.30));
    
    // c1
    midlevel = 1.0;
    disp = 5.0;
    dist = 100.0;
    uv2 = uv + vec2(t/dist + 3.5, 0.0);
    h = (fbm(uv2, 8) - 0.5)*disp;
    layer(0.1, vec3(0.92, 0.85, 0.82));
    layer(0., vec3(1.0, 0.94, 0.91));
    
    return vec4(0.58, 0.7, 1.0, 1.);
}

void main() {
    // Preserve aspect ratio mapping typical of Shadertoy (fragCoord / iResolution.y)
    vec2 fragCoord = vUv * iResolution;
    vec2 uv = fragCoord / iResolution.y;
    // Offset X to center the view
    uv.x -= (iResolution.x / iResolution.y - 1.0) * 0.5;

    float t = iTime * 4.0;
    vec4 bg = background(uv, t);
    
    vec4 fgRaw = vec4(0.);
    int n = 5;
    if (uv.y < 0.5) {
        for (int i = 0; i < n; i++) {
            fgRaw += foreground(uv, t + 4.0 * float(i) / float(n) / 60.0) / float(n);
        }
    }
    
    // ----- Grade Sky & Clouds (Cinematic Rain World) -----
    // We convert the clouds to grayscale, then colorize them with a vertical 
    // Rain World gradient (Toxic pollution at bottom -> Deep storm at top)
    
    float bgLum = dot(bg.rgb, vec3(0.299, 0.587, 0.114));
    
    vec3 toxicGlow = vec3(0.35, 0.45, 0.32); // Sickly green/yellow pollution
    vec3 stormSky = vec3(0.03, 0.04, 0.06);  // Deep abyss storm
    vec3 globalGradient = mix(toxicGlow, stormSky, smoothstep(0.0, 0.8, vUv.y));
    
    // Map luminance to the gradient, boosting contrast so clouds pop
    vec3 bgCol = globalGradient * pow(bgLum, 1.5) * 3.0;
    
    // Fade the very top to the website's pure dark background
    float topFade = smoothstep(0.55, 1.0, vUv.y);
    bgCol = mix(bgCol, vec3(0.01, 0.01, 0.015), topFade * 0.95);
    
    // Do the exact same for foreground clouds
    float fgLum = dot(fgRaw.rgb, vec3(0.299, 0.587, 0.114));
    vec3 fgCol = globalGradient * pow(fgLum, 1.5) * 3.0;
    fgCol = mix(fgCol, vec3(0.01, 0.01, 0.015), topFade * 0.95);
    
    vec3 col = bgCol;
    // train /////////////////////////////////////////////////////////////////////
    float k;
    float midlevel;
    float h;
    float disp;
    float dist;
    vec2 uv2;
    uv.y -= 0.2;
    
    // choo choo
    k = 1.0;
    uv2 = fract(uv * 9.0);
    float wagon = 1.0;
    wagon *= 1.0 - step(0.45, uv.x);
    wagon *= 1.0 - step(0.115, uv.y);
    wagon *= step(0.103, uv.y);
    wagon *= step(0.05, 1.0 - abs(uv2.x * 2.0 - 1.0));
    
    float join = 1.0; 
    join *= 1.0 - step(0.45, uv.x);
    join *= 1.0 - step(0.11, uv.y);
    join *= step(0.107, uv.y);
    
    float roof = 1.0;
    roof *= 1.0 - step(0.45, uv.x);
    roof *= 1.0 - step(0.117, uv.y);
    roof *= step(0.11, uv.y);
    roof *= step(0.15, 1.0 - abs(uv2.x * 2.0 - 1.0));
    
    float loco = box(uv, 0.45, 0.5, 0.103, 0.112);
    float chem1 = box(uv, 0.49, 0.495, 0.103, 0.12);
    float chem2 = box(uv, 0.488, 0.496, 0.12, 0.123);
    float locoRoof = box(uv, 0.443, 0.47, 0.11, 0.117);
    
    float wheel = 1.0 - step(0.00004, dot2(uv - vec2(0.457, 0.106)));
    wheel += 1.0 - step(0.00002, dot2(uv - vec2(0.487, 0.105)));
    wheel += 1.0 - step(0.00002, dot2(uv - vec2(0.497, 0.105)));
    
    if (uv.x < 0.45 && uv.y > 0.025 && uv.y < 0.2) {
        wheel += 1.0 - step(0.002, dot2(uv2 - vec2(0.2, 0.95)));
        wheel += 1.0 - step(0.002, dot2(uv2 - vec2(0.8, 0.95)));
    }
    
    // Rain World Train Colors (Atmospheric, dark, oxidized)
    vec3 rustWagon = mix(vec3(0.15, 0.10, 0.08), vec3(0.25, 0.15, 0.10), fbm2(uv2 * 15.0, 3));
    vec3 locoBody = mix(vec3(0.15, 0.15, 0.16), vec3(0.20, 0.16, 0.12), fbm(uv * 20.0, 3));
    vec3 darkMetal = vec3(0.05, 0.06, 0.08);
    
    col = mix(col, darkMetal, join);
    col = mix(col, rustWagon, wagon);
    col = mix(col, darkMetal, roof);
    
    col = mix(col, locoBody, loco);
    col = mix(col, locoBody, chem1);
    col = mix(col, darkMetal, locoRoof);
    col = mix(col, darkMetal * 0.5, clamp(chem2 + wheel, 0.0, 1.0));
    
    // loco smoke //////
    dist = 5.0;
    uv2 = uv + vec2(t / dist + 3.5, 0.0);
    uv2.x -= t / dist * 0.2;
    h = fbm2(uv2, 8) - 0.55;
    
    if(uv.x < 0.49){
        float x = -uv.x + 0.49;
        float y = abs(uv.y + h * 0.4 - 0.16 * sqrt(x) - 0.12) - 0.8 * x * exp(-x * 10.0);
        if(y < 0.0) col = vec3(1.0, 0.94, 0.91);
        if(y < -0.02) col = vec3(0.92, 0.85, 0.82);
    }
    
    // bridge ///////
    dist = 5.0;
    vec2 rawBridgeUv = uv + vec2(t / dist + 32.5, 0.0);
    uv2 = rawBridgeUv;
    uv2.x = fract(uv2.x * 3.0);
    k = 1.0;
    k *= smoothstep(0.001, 0.003, abs(uv2.y - pow(uv2.x - 0.5, 2.0) * 0.15 - 0.12));
    k *= min(step(0.05, 1.0 - abs(uv2.x * 2.0 - 1.0)) + step(0.17, uv2.y), 1.0);
    k *= min(smoothstep(0.02, 0.05, 1.0 - abs(uv2.x * 2.0 - 1.0)) + step(0.177, uv2.y), 1.0);
         
    k *= min(step(0.1, uv2.y) + smoothstep(-0.09, -0.085, -uv2.y - 0.001 / (1.0 - abs(uv2.x * 2.0 - 1.0))), 1.0);
           
    k *= min(smoothstep(0.05, 0.2, 1.0 - abs(fract(uv2.x * 16.0) * 2.0 - 1.0)) + step(0.12, uv2.y - pow(uv2.x - 0.5, 2.0) * 0.15) + step(-0.1, -uv2.y), 1.0);
    
    // Base rust color for the bridge (Dark, murky iron)
    vec3 baseBridge = vec3(0.12, 0.10, 0.10) * smoothstep(-0.08, 0.08, uv.y);
    float rustMap = fbm2(rawBridgeUv * 8.0, 4);
    baseBridge = mix(baseBridge, vec3(0.22, 0.14, 0.10), smoothstep(0.4, 0.7, rustMap));
    
    // Rain World Overgrowth (Sickly, desaturated teal/olive moss)
    float mossMap = fbm(rawBridgeUv * 25.0, 4);
    float isMoss = smoothstep(0.45, 0.6, mossMap);
    
    // Hanging vines dripping down
    float vineMask = fbm(vec2(rawBridgeUv.x * 35.0, rawBridgeUv.y * 5.0), 3);
    isMoss = max(isMoss, smoothstep(0.55, 0.65, vineMask) * (1.0 - smoothstep(0.0, 0.12, uv.y)));
    
    vec3 mossColor = mix(vec3(0.06, 0.12, 0.10), vec3(0.12, 0.22, 0.16), mossMap);
    baseBridge = mix(baseBridge, mossColor, isMoss);
    
    col = mix(baseBridge, col, k);
    
    // Blend foreground clouds
    col = mix(col, fgCol, fgRaw.a);

    // Apply intense procedural grain (Rain World grimy style)
    float grain = hash(uv + t) * 0.06;
    col -= grain;
    
    // Final master grade (slight desat and darken to tie it all together)
    col = pow(col, vec3(1.1));
    float finalLum = dot(col, vec3(0.299, 0.587, 0.114));
    
    // Environment lighting blend: tint the whole scene slightly towards the toxic glow
    vec3 envTint = mix(toxicGlow, stormSky, smoothstep(0.0, 0.6, uv.y));
    col = mix(col, col * envTint * 3.0, 0.2);
    
    col = mix(vec3(finalLum), col, 0.75); // 75% saturation
    
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const handleMouseMove = (e: MouseEvent) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
};

let pulseValue = 0;

const handleRightClick = (e: MouseEvent) => {
  e.preventDefault();
  pulseValue = 1.0;
  blastTriggered.value = true;
  setTimeout(() => blastTriggered.value = false, 500);
};

const initThree = () => {
  if (!canvasContainer.value) return;

  scene = new THREE.Scene();
  
  // Use Orthographic camera for full screen shader quad
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
  canvasContainer.value.appendChild(renderer.domElement);

  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    }
  });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(plane);

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('contextmenu', handleRightClick);

  animate();
};

const onWindowResize = () => {
  if (!renderer || !material) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  if (material) {
    material.uniforms.iTime.value = time;
  }

  renderer.render(scene, camera);
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
  initThree();
  scrambleInterval = setInterval(() => {
    const intensityFactor = 0.4;
    garbledProject.value = scramble('LOCAL_GROUP // ITERATOR_TRANSIT', intensityFactor * 0.9);
    garbledLog.value = scramble('Sub-Regional Conveyance System', intensityFactor * 1.1);
    garbledHold.value = scramble('- [ MOUSE ] Scan Structural Integrity', intensityFactor * 0.8);
    garbledBlast.value = scramble('- [ R-CLICK ] Overseer Ping', intensityFactor * 0.8);
    garbledTitle.value = scramble('HEAVY\nTRANSPORT', intensityFactor);
    garbledSubtitle.value = scramble('NODE: THE EXTERIOR', intensityFactor * 1.1);
  }, 120);
});

onUnmounted(() => {
  document.body.style.overflow = '';
  if (scrambleInterval) clearInterval(scrambleInterval);
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('contextmenu', handleRightClick);
  
  if (renderer && canvasContainer.value) {
    canvasContainer.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
});
</script>

<template>
  <div class="worldview-container relative w-full h-screen overflow-hidden bg-[#010102] text-white selection:bg-cyan-500 selection:text-black">
    <!-- Three.js Canvas -->
    <div ref="canvasContainer" class="absolute inset-0 z-0 cursor-crosshair"></div>

    <!-- HUD Overlay -->
    <div class="absolute inset-0 pointer-events-none z-10 p-6 md:p-12 lg:p-16 mix-blend-screen flex flex-col justify-end items-start gap-8">
      
      <!-- Back Button -->
      <router-link to="/worldview" class="absolute top-6 left-6 md:top-12 md:left-12 font-mono text-xs tracking-widest text-white/50 hover:text-cyan-400 transition-colors duration-300 pointer-events-auto flex items-center gap-2">
        <span>&lt; RETURN TO NEXUS</span>
      </router-link>

      <!-- Logs -->
      <div class="font-mono text-[9px] md:text-[10px] tracking-[0.2em] uppercase opacity-60 leading-relaxed border-l border-cyan-500/30 pl-4">
        <p class="text-cyan-200 font-bold mb-3">{{ garbledProject }}</p>
        <p class="text-white/50 mb-1">{{ garbledLog }}</p>
        <p class="text-white/40">{{ garbledHold }}</p>
        <p class="text-white/40" :class="{'text-cyan-400 font-bold': blastTriggered}">{{ garbledBlast }}</p>
      </div>

      <!-- Title -->
      <div class="text-left mt-2 relative z-50">
        <h1 class="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter opacity-80 whitespace-pre-line mix-blend-overlay" style="font-family: 'Inter', sans-serif; line-height: 0.9;">
          {{ garbledTitle }}
        </h1>
        <p class="font-mono text-[9px] md:text-[10px] tracking-[0.5em] mt-2 opacity-50">{{ garbledSubtitle }}</p>
      </div>

    </div>

    <!-- Grain/Noise Overlay -->
    <div class="absolute inset-0 z-30 pointer-events-none opacity-[0.15]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
  </div>
</template>

<style scoped>
/* Minimalist scrollbar hide */
::-webkit-scrollbar {
  display: none;
}
</style>
