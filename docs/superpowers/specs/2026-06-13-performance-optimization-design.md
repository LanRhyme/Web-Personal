# Design Spec: Website Performance Optimization

This specification details the optimizations planned for the website. The main goal is to improve loading speed (especially initial page load), reduce GPU and CPU overhead on low-end and mobile devices, and eliminate build warnings.

## 1. Goals & Success Criteria
- **Initial Bundle Size**: Shrink the main `index.js` chunk from ~650KB to under 200KB.
- **Run-time Performance (FPS)**: Keep rendering at 60 FPS on mid-range and mobile devices.
- **Thermals / Battery**: Reduce GPU draw overhead by turning off unnecessary antialiasing on full-screen shader quads and scaling down resolution/calculations on mobile.
- **Build Cleanliness**: Fix all CSS syntax warning errors during compilation.

## 2. Proposed Changes

### Bundle & Build Pipeline

#### [MODIFY] [package.json](file:///d:/IdeaProjects/Web-Personal/package.json)
- Integrate image optimization into the build command to ensure high-resolution images are automatically compressed before building the site.
- Change `"build": "vite build"` to `"build": "node scripts/optimize-images.cjs && vite build"`.

#### [MODIFY] [App.vue](file:///d:/IdeaProjects/Web-Personal/src/App.vue)
- Dynamic-import `Background3D.vue` using Vue 3's `defineAsyncComponent`.
- Since Three.js is primarily pulled into the main entry bundle through the static import of `Background3D.vue`, splitting it out dynamically allows the heavy Three.js library to load asynchronously while the `Preloader` is running.

#### [MODIFY] [MusicCard.vue](file:///d:/IdeaProjects/Web-Personal/src/components/MusicCard.vue)
- Replace CSS arbitrary class `.perspective-\\[800px\\]` with a standard scoped selector `.music-card-perspective` to avoid backslash escaping issues in CSS processing (esbuild) that cause compilation warnings.

---

### Run-time & GPU Rendering Optimization

#### [MODIFY] [Background3D.vue](file:///d:/IdeaProjects/Web-Personal/src/components/Background3D.vue)
- Detect if the current browser viewport is a mobile screen (width < 640px) on load.
- Pass a `uLowPower` boolean uniform to the fragment shader.
- **Renderer Optimization**:
  - Set `antialias: false` (since MSAA has no effect on screen-aligned full-screen quad fragment evaluation but consumes heavy GPU cycles).
  - Limit `pixelRatio` to `Math.min(window.devicePixelRatio, 1.5)` for desktop, and `1.0` for mobile.
- **GLSL Shader Optimization**:
  - In the fragment shader, read `uLowPower`.
  - If `uLowPower` is true, reduce the FBM octave loop count from `4` to `2` to cut fragment noise operations in half.

#### [MODIFY] [GlobalRain.vue](file:///d:/IdeaProjects/Web-Personal/src/components/GlobalRain.vue)
- Scale the active drops based on screen size:
  - If mobile (width < 640px), limit `MAX_DROPS` to `300` instead of `1200` to prevent mobile frame drop.
  - Scale down splash generation rate to reduce garbage collection (GC) pressure.

---

## 3. Verification Plan

### Automated Checks
- Run `npm run build` and verify:
  - Initial bundle size (`dist/assets/index-*.js`) is under 250KB.
  - No CSS compilation errors or warnings are emitted.
- Run the build and ensure the generated build output executes cleanly in the browser.

### Manual Verification
- Test in mobile simulation (Chrome DevTools) to ensure the 3D background is simplified, rain drops are reduced, and FPS stays smooth.
- Verify image assets inside `dist/` are optimized.
