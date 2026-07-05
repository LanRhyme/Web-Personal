<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const containerRef = ref<HTMLElement | null>(null);
const bgImageRef = ref<HTMLElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let planeMesh: THREE.Mesh;
let animationId: number;
const clock = new THREE.Clock();
let lastTime = 0;

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let isGlitching = false;
let shockwaveStartTime = -100.0;
let shockwaveX = 0.5;
let shockwaveY = 0.5;
let warpPhase = 0.0;
let warpVelocity = 0.0;

const handleGlitch = (e: Event) => {
  const customEvent = e as CustomEvent;
  isGlitching = customEvent.detail.active;
};

const handleShockwave = (e: Event) => {
  const customEvent = e as CustomEvent;
  shockwaveStartTime = clock.getElapsedTime();
  shockwaveX = customEvent.detail.x;
  shockwaveY = customEvent.detail.y;
  warpVelocity += 3.0; // Strong impulse for the spring
};

const initThree = () => {
  if (!containerRef.value) return;

  scene = new THREE.Scene();
  
  // Flat 2D camera
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  containerRef.value.appendChild(renderer.domElement);

  // Full screen plane
  const geometry = new THREE.PlaneGeometry(2, 2);

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uGlitch: { value: 0.0 },
      uShockwaveTime: { value: -100.0 },
      uShockwavePos: { value: new THREE.Vector2(0.5, 0.5) },
      uWarpPhase: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        // Bypassing standard projection to ensure it fills the screen perfectly
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uGlitch;
      uniform float uShockwaveTime;
      uniform vec2 uShockwavePos;
      uniform float uWarpPhase;
      varying vec2 vUv;

      // Simplex 3D Noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i); 
        vec4 p = permute( permute( permute( 
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                      dot(p2,x2), dot(p3,x3) ) );
      }

      void main() {
        vec2 uv = vUv;
        // Correct aspect ratio so geography isn't stretched
        uv.x *= uResolution.x / uResolution.y;

        vec2 clickPos = uShockwavePos;
        clickPos.x *= uResolution.x / uResolution.y;

        // ZOOM IN: 0.6 scale makes the terrain features huge and localized
        vec2 st = uv * 0.6;

        // Pan slowly
        vec2 pan = vec2(uTime * 0.015, uTime * 0.01) + uMouse * 0.03;

        // Subtle organic shockwave ripple
        vec2 dir = normalize(uv - clickPos);
        float distToClick = distance(uv, clickPos);
        float shockTime = max(0.0, uShockwaveTime);
        float waveFront = shockTime * 1.5;
        float distFromFront = distToClick - waveFront;
        float rippleWindow = smoothstep(0.2, 0.0, abs(distFromFront));
        
        // Very slight UV wobble to lightly perturb the contour lines
        float uvDisplacement = sin(distFromFront * 30.0) * rippleWindow * exp(-shockTime * 2.0) * 0.015;
        pan += dir * uvDisplacement;
        
        // Subtle glitch offset instead of earthquake
        if (uGlitch > 0.5) {
            pan += vec2(sin(uTime * 60.0) * 0.05, cos(uTime * 80.0) * 0.05);
        }
        
        vec2 pos = st + pan;

        // 1. Domain Warping: Driven by click impulses (uWarpPhase)
        float warpX = snoise(vec3(pos * 0.8, uWarpPhase));
        float warpY = snoise(vec3(pos * 0.8 + 100.0, uWarpPhase * 0.8));
        vec2 warpedPos = pos + vec2(warpX, warpY) * 0.25;

        // 2. Smoother FBM (4 octaves, lower high-freq gain to remove chaos)
        float noiseVal = 0.0;
        float amplitude = 0.55;
        float frequency = 1.0;
        float timeEvo = uWarpPhase * 0.5;
        
        for (int i = 0; i < 4; i++) {
            float n = snoise(vec3(warpedPos * frequency, timeEvo)) * 0.5 + 0.5;
            noiseVal += amplitude * n;
            frequency *= 2.0;
            amplitude *= 0.4; // Less chaotic high details
            timeEvo *= 1.2;
        }

        // Ensure noiseVal is cleanly in [0, 1]
        noiseVal = clamp(noiseVal, 0.0, 1.0);

        // 3. Smoother Terrain Sculpting
        noiseVal = pow(noiseVal, 1.5);

        // 4. EXTREMELY DENSE LINES (Adding Micro-texture)
        // Scaled up to 200 so we can inject thousands of faint micro-lines between the major lines
        float linesCount = 200.0; 
        float f = noiseVal * linesCount;
        
        // Screen-space derivative for perfectly uniform lines everywhere
        float df = fwidth(f);
        
        // Distance to the nearest integer elevation
        float contour = fract(f);
        float distToLine = min(contour, 1.0 - contour);
        
        // 4-Tier Importance Hierarchy (Major, Intermediate, Minor, Micro)
        float lineIndex = floor(f);
        
        // Make Major lines more widespread (every 20 lines instead of 50)
        bool isMajor = mod(lineIndex, 20.0) < 0.5;
        bool isInter = (!isMajor) && (mod(lineIndex, 10.0) < 0.5);
        bool isMinor = (!isMajor) && (!isInter) && (mod(lineIndex, 2.0) < 0.5);
        bool isMicro = (!isMajor) && (!isInter) && (!isMinor);
        
        // Thickness hierarchy: Made Major lines significantly thinner
        float lineThickness = 0.0;
        if (isMajor) lineThickness = 0.2 * df;
        else if (isInter) lineThickness = 0.1 * df;
        else if (isMinor) lineThickness = 0.03 * df;
        else lineThickness = 0.01 * df; // Micro lines are insanely thin
        
        float edgeSoftness = 1.5 * df; 
        
        // Crisp buttery-smooth core line
        float lineAlpha = 1.0 - smoothstep(lineThickness, lineThickness + edgeSoftness, distToLine);
        
        // Glow only for Major lines (reduced intensity to make it less obvious)
        float glowWidth = isMajor ? 2.5 * df : 0.0;
        float glowAlpha = isMajor ? (1.0 - smoothstep(0.0, glowWidth, distToLine)) * 0.4 : 0.0;

        // Base color: mid-tones
        vec3 colDeep = vec3(0.25, 0.25, 0.25); 
        vec3 colHigh = vec3(0.55, 0.55, 0.55);
        
        // Color mix based on elevation
        vec3 baseColor = mix(colDeep, colHigh, noiseVal);
        vec3 finalColor = isMajor ? baseColor * 1.2 : baseColor;
        
        // Combine crisp line and glow
        float totalAlpha = lineAlpha + glowAlpha;
        
        // 4-Tier Opacity System: middle ground for major, slightly raised for minor/micro
        float opacityMult = 0.0;
        if (isMajor) opacityMult = 0.15;
        else if (isInter) opacityMult = 0.10;
        else if (isMinor) opacityMult = 0.04;
        else opacityMult = 0.015;

        if (uGlitch > 0.5) {
            finalColor = vec3(1.0, 1.0, 1.0); // Pure white when glitching
            opacityMult *= 1.3; // Gentle flash instead of blinding
        }

        // Subtle Ripple Glow
        float flash = rippleWindow * exp(-shockTime * 2.0);
        if (flash > 0.01) {
            finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), min(flash * 0.5, 1.0));
            opacityMult += flash * 0.2;
        }

        // Fade out perfectly smooth at the bottom 
        float terrainFade = smoothstep(0.0, 0.08, noiseVal);
        
        // Cinematic Vignette: subtly darken the screen edges to frame the website content
        float distToCenter = length(vUv - 0.5);
        float vignette = 1.0 - smoothstep(0.4, 0.85, distToCenter);

        gl_FragColor = vec4(finalColor, totalAlpha * opacityMult * terrainFade * vignette);
      }
    `,
    transparent: true,
    depthWrite: false,
    extensions: { derivatives: true }
  });

  planeMesh = new THREE.Mesh(geometry, shaderMaterial);
  scene.add(planeMesh);

  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
  const delta = time - lastTime;
  lastTime = time;
  
  // Frame-rate independent easing for incredibly smooth parallax on all devices
  const ease = 1.0 - Math.exp(-5.0 * delta);
  targetX += (mouseX - targetX) * ease;
  targetY += (mouseY - targetY) * ease;
  
  // Update warp physics (Critically damped spring targeting 0)
  const springStiffness = 4.0;
  const springDamping = 4.0; // 2 * sqrt(4) = 4.0
  
  const force = -springStiffness * warpPhase - springDamping * warpVelocity;
  warpVelocity += force * delta;
  warpPhase += warpVelocity * delta;

  if (bgImageRef.value) {
    // Background image parallax & breathing animation
    // Parallax moves opposite to the contour lines for a deep 3D effect
    const shiftX = targetX * -15; 
    const shiftY = targetY * 15; // Invert Y so it moves naturally
    // Slow breathing scale: ranges from 1.0 to 1.05 over time
    const scale = 1.025 + 0.025 * Math.sin(time * 0.15);
    
    bgImageRef.value.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0) scale(${scale})`;
  }

  if (planeMesh) {
    const mat = planeMesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uMouse.value.set(targetX, targetY);
    mat.uniforms.uGlitch.value = isGlitching ? 1.0 : 0.0;
    mat.uniforms.uShockwaveTime.value = time - shockwaveStartTime;
    mat.uniforms.uShockwavePos.value.set(shockwaveX, shockwaveY);
    mat.uniforms.uWarpPhase.value = warpPhase;
  }

  renderer.render(scene, camera);
};

const onWindowResize = () => {
  if (!camera || !renderer || !planeMesh) return;
  const mat = planeMesh.material as THREE.ShaderMaterial;
  mat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
};

const onMouseMove = (event: MouseEvent) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
};

onMounted(() => {
  initThree();
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('global-glitch', handleGlitch);
  window.addEventListener('shockwave', handleShockwave);
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('global-glitch', handleGlitch);
  window.removeEventListener('shockwave', handleShockwave);
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
  <div class="fixed inset-0 pointer-events-none z-[-1] bg-[var(--color-bg)] overflow-hidden">
    <!-- 底层背景图：放大并偏移边界，配合 JS 实现呼吸与视差动画 -->
    <div 
      ref="bgImageRef" 
      class="absolute inset-[-40px] bg-[url('/bg-image.png')] bg-cover bg-center opacity-15 will-change-transform"
    ></div>
    
    <!-- 等高线层：移除外部强行降透，让 GLSL 的适中参数自然发光 -->
    <div ref="containerRef" class="absolute inset-0 mix-blend-screen"></div>
  </div>
</template>
