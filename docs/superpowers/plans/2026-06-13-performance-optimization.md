# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink the initial JS bundle size from 657KB to under 200KB, optimize WebGL rendering/shader complexity, adapt rain density to mobile screens, and eliminate CSS build-time warnings.

**Architecture:** Utilize Vue 3's `defineAsyncComponent` to dynamically split out Three.js, simplify the WebGL fragment shader's FBM calculations on mobile via a custom uniform, tune down rain particle count on small screens, and integrate asset compression into the npm build pipeline.

**Tech Stack:** Vue 3, Vite, Three.js, PostCSS.

---

### Task 1: Code Splitting of Background3D in App.vue

**Files:**
- Modify: `src/App.vue`
- Verify: Run `npm run build` to check bundle sizes.

- [ ] **Step 1: Modify App.vue to use defineAsyncComponent**
  Replace the static import of `Background3D` with an asynchronous import to split Three.js into its own chunk.

  Modify [App.vue](file:///d:/IdeaProjects/Web-Personal/src/App.vue#L4):
  ```diff
  -import Background3D from './components/Background3D.vue';
  +import { defineAsyncComponent } from 'vue';
  +const Background3D = defineAsyncComponent(() => import('./components/Background3D.vue'));
  ```

- [ ] **Step 2: Run build to verify bundle splitting**
  Run: `npm run build` in PowerShell.
  Expected: Output shows a separate chunk for `three` (or a vendor chunk) and the main `index-*.js` chunk shrinks from ~657KB to ~150-200KB.

- [ ] **Step 3: Commit changes**
  ```bash
  git add src/App.vue
  git commit -m "perf: code-split Background3D component to reduce initial bundle size"
  ```

---

### Task 2: Fix CSS Compilation Warnings in MusicCard.vue

**Files:**
- Modify: `src/components/MusicCard.vue`
- Verify: Run `npm run build` to verify the esbuild warnings are gone.

- [ ] **Step 1: Clean up backslash-escaped classes in MusicCard.vue**
  Tailwind v4 handles arbitrary properties differently. Manually escaped classes like `.perspective-\\[800px\\]` in the scoped style block trigger warnings during esbuild minification. Replace it with a clean semantic class name.

  Modify [MusicCard.vue](file:///d:/IdeaProjects/Web-Personal/src/components/MusicCard.vue#L452):
  ```diff
  -          class="flex-grow flex items-center justify-center relative w-full perspective-[800px] preserve-3d" 
  +          class="flex-grow flex items-center justify-center relative w-full music-card-perspective preserve-3d" 
  ```

  And update the `<style scoped>` section:
  ```diff
  -/* 3D Classes */
  -.perspective-\\[800px\\] {
  -  perspective: 800px;
  -}
  +.music-card-perspective {
  +  perspective: 800px;
  +}
  ```

- [ ] **Step 2: Run build to verify warnings are cleared**
  Run: `npm run build` in PowerShell.
  Expected: Built successfully without any CSS syntax errors or warnings about `800px\\\\`.

- [ ] **Step 3: Commit changes**
  ```bash
  git add src/components/MusicCard.vue
  git commit -m "fix: resolve CSS syntax warnings in MusicCard style section"
  ```

---

### Task 3: WebGL Renderer & Resolution Optimizations in Background3D.vue

**Files:**
- Modify: `src/components/Background3D.vue`
- Verify: Run `npm run build` to ensure clean compilation.

- [ ] **Step 1: Disable antialiasing and limit pixel ratio in Background3D.vue**
  MSAA is redundant for a screen-aligned full-screen quad rendering a procedural shader (lines are anti-aliased in GLSL using `fwidth`). High pixel ratios are extremely expensive on mobile.

  Modify [Background3D.vue](file:///d:/IdeaProjects/Web-Personal/src/components/Background3D.vue#L47-L50):
  ```diff
  -  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  -  renderer.setSize(window.innerWidth, window.innerHeight);
  -  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  +  const isMobileDevice = window.innerWidth < 640 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
  +  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  +  renderer.setSize(window.innerWidth, window.innerHeight);
  +  renderer.setPixelRatio(isMobileDevice ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
  ```

- [ ] **Step 2: Add uLowPower uniform in WebGL state**
  Add the `uLowPower` uniform definition and feed it the device detection status.

  Modify [Background3D.vue](file:///d:/IdeaProjects/Web-Personal/src/components/Background3D.vue#L55-L64):
  ```diff
      const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uGlitch: { value: 0.0 },
          uShockwaveTime: { value: -100.0 },
          uShockwavePos: { value: new THREE.Vector2(0.5, 0.5) },
  -       uWarpPhase: { value: 0.0 }
  +       uWarpPhase: { value: 0.0 },
  +       uLowPower: { value: isMobileDevice }
        },
  ```

- [ ] **Step 3: Run build to verify syntax correctness**
  Run: `npm run build`
  Expected: PASS

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/components/Background3D.vue
  git commit -m "perf: disable MSAA and cap pixel ratio on high-DPI/mobile viewports for Background3D"
  ```

---

### Task 4: WebGL Shader Complexity Reduction (FBM Octaves) in Background3D.vue

**Files:**
- Modify: `src/components/Background3D.vue`
- Verify: Inspect visual look in browser dev environment.

- [ ] **Step 1: Declare the uLowPower uniform and dynamic loop in GLSL**
  Modify the shader's fragment script to read `uLowPower` and dynamically adjust the FBM noise frequency iterations.

  Modify [Background3D.vue](file:///d:/IdeaProjects/Web-Personal/src/components/Background3D.vue#L73-L81):
  ```diff
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uGlitch;
        uniform float uShockwaveTime;
        uniform vec2 uShockwavePos;
        uniform float uWarpPhase;
+       uniform bool uLowPower;
        varying vec2 vUv;
  ```

  And change the FBM loop from lines 180 to 186:
  ```diff
  -        for (int i = 0; i < 4; i++) {
  -            float n = snoise(vec3(warpedPos * frequency, timeEvo)) * 0.5 + 0.5;
  -            noiseVal += amplitude * n;
  -            frequency *= 2.0;
  -            amplitude *= 0.4; // Less chaotic high details
  -            timeEvo *= 1.2;
  -        }
+        int octaves = uLowPower ? 2 : 4;
+        for (int i = 0; i < 4; i++) {
+            if (i >= octaves) break;
+            float n = snoise(vec3(warpedPos * frequency, timeEvo)) * 0.5 + 0.5;
+            noiseVal += amplitude * n;
+            frequency *= 2.0;
+            amplitude *= 0.4;
+            timeEvo *= 1.2;
+        }
  ```

- [ ] **Step 2: Run build to verify shader syntax compiles**
  Run: `npm run build`
  Expected: PASS with no GLSL shader compile warnings/errors.

- [ ] **Step 3: Commit changes**
  ```bash
  git add src/components/Background3D.vue
  git commit -m "perf: reduce shader FBM loop octaves on low-power devices"
  ```

---

### Task 5: Rain Particle and Splash Adaptations in GlobalRain.vue

**Files:**
- Modify: `src/components/GlobalRain.vue`
- Verify: Check rendering in mobile preview.

- [ ] **Step 1: Adapt MAX_DROPS and Splash allocations dynamically in GlobalRain.vue**
  Detect if the screen is mobile sized. If so, limit the maximum rain droplets to `300` instead of `1200` to prevent CPU and canvas rendering lag.

  Modify [GlobalRain.vue](file:///d:/IdeaProjects/Web-Personal/src/components/GlobalRain.vue#L36-L46):
  ```diff
  -  // Heavy storm max drops
  -  const MAX_DROPS = 1200;
  -  for(let i = 0; i < MAX_DROPS; i++) {
  -    drops.push({
  -      x: Math.random() * logicalW,
  -      y: Math.random() * logicalH,
  -      speed: Math.random() * 30 + 25, // Much faster
  -      length: Math.random() * 80 + 40, // Much longer
  -      thickness: Math.random() > 0.8 ? 1 : 0.5 // Thinner
  -    });
  -  }
+  const isMobile = window.innerWidth < 640 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
+  const MAX_DROPS = isMobile ? 300 : 1200;
+  for(let i = 0; i < MAX_DROPS; i++) {
+    drops.push({
+      x: Math.random() * logicalW,
+      y: Math.random() * logicalH,
+      speed: Math.random() * 30 + 25,
+      length: Math.random() * 80 + 40,
+      thickness: Math.random() > 0.8 ? 1 : 0.5
+    });
+  }
  ```

- [ ] **Step 2: Limit splash allocation frequency**
  Reduce the splash creation chances on mobile to decrease GC load.

  Modify [GlobalRain.vue](file:///d:/IdeaProjects/Web-Personal/src/components/GlobalRain.vue#L77-L80):
  ```diff
  -      const splashChance = intensity.value > 0.8 ? 0.95 : 0.99;
  +      const baseSplashChance = isMobile ? 0.98 : 0.95;
+      const splashChance = intensity.value > 0.8 ? baseSplashChance : 0.99;
        if (drop.y > logicalH - 10 || Math.random() > splashChance) {
  -        if (Math.random() < intensity.value * 0.6) { // More splashes when heavier
  +        const maxSplashChance = isMobile ? 0.2 : 0.6;
+        if (Math.random() < intensity.value * maxSplashChance) {
  ```

- [ ] **Step 3: Run build to verify compilation**
  Run: `npm run build`
  Expected: PASS

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/components/GlobalRain.vue
  git commit -m "perf: reduce rain particle count and splash generation on mobile viewports"
  ```

---

### Task 6: Automate Build Image Optimization

**Files:**
- Modify: `package.json`
- Verify: Run full build and observe that images are optimized and code is built.

- [ ] **Step 1: Integrate optimize-images script into build command**
  Automate image compression by running the Jimp image optimization script prior to running Vite build.

  Modify [package.json](file:///d:/IdeaProjects/Web-Personal/package.json#L8):
  ```diff
  -    "build": "vite build",
  +    "build": "node scripts/optimize-images.cjs && vite build",
  ```

- [ ] **Step 2: Run full build and optimize images**
  Run: `npm run build`
  Expected: The output log lists image optimization steps followed by Vite building client assets successfully.

- [ ] **Step 3: Commit changes**
  ```bash
  git add package.json
  git commit -m "build: run image optimization script automatically before production build"
  ```
