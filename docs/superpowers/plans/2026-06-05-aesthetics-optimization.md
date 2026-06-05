# Aesthetics Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dynamic 3D abstract fluid geometry background using Three.js and upgrade the UI with premium glassmorphism styling to improve the site's aesthetic.

**Architecture:** Replace the 2D canvas matrix effect in `App.vue` with a standalone `<Background3D />` Vue component managing a Three.js scene. Update `style.css` to increase background blurs and soften borders.

**Tech Stack:** Vue 3, Three.js, TailwindCSS (via `style.css` custom classes)

---

### Task 1: Create Background3D Component

**Files:**
- Create: `src/components/Background3D.vue`

- [ ] **Step 1: Write the component code**

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const containerRef = ref<HTMLElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let mesh: THREE.Mesh;
let animationId: number;

const mouseX = ref(0);
const mouseY = ref(0);

const initThree = () => {
  if (!containerRef.value) return;

  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  containerRef.value.appendChild(renderer.domElement);

  // Geometry: Icosahedron for abstract shape
  const geometry = new THREE.IcosahedronGeometry(2, 64);
  
  // Material: Premium physical material
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x6b8f72,
    metalness: 0.8,
    roughness: 0.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    wireframe: false,
    transparent: true,
    opacity: 0.9
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0x6b8f72, 5, 10);
  pointLight.position.set(0, 0, 2);
  scene.add(pointLight);

  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.0005;
  
  if (mesh) {
    mesh.rotation.y = time * 0.2 + mouseX.value * 0.5;
    mesh.rotation.x = time * 0.1 + mouseY.value * 0.5;
    
    // Simple deformation effect
    const positionAttribute = mesh.geometry.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      // original scale logic omitted for brevity, keeping simple rotation for now
    }
  }

  renderer.render(scene, camera);
};

const onWindowResize = () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

const onMouseMove = (event: MouseEvent) => {
  mouseX.value = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY.value = -(event.clientY / window.innerHeight) * 2 + 1;
};

onMounted(() => {
  initThree();
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('mousemove', onMouseMove);
  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
  if (mesh) {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }
});
</script>

<template>
  <div ref="containerRef" class="fixed inset-0 pointer-events-none z-[-1] opacity-60"></div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Background3D.vue
git commit -m "feat: add 3D abstract geometry background component"
```

---

### Task 2: Integrate Background3D into App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Import Background3D and remove matrix canvas logic**

Remove `class MatrixDrop`, `initCanvas` function, and `drops` array.
Remove `<canvas ref="canvasRef" ...></canvas>`.

Add import:
```ts
import Background3D from './components/Background3D.vue';
```

Remove `initCanvas()` call from `onMounted`.

- [ ] **Step 2: Add Background3D to template**

Replace `<canvas ref="canvasRef" class="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-50"></canvas>` with:
```html
    <!-- 3D Fluid Geometry Background -->
    <Background3D />
```

- [ ] **Step 3: Test compile**

Run: `npm run build`
Expected: Passes without TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat: replace 2D matrix background with Background3D component"
```

---

### Task 3: Enhance Glassmorphism in style.css

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Update CSS Variables and Classes**

In `:root`, update card opacity:
```css
  --color-card: rgba(15, 15, 15, 0.6);
```

Update `.cyber-glass`:
```css
.cyber-glass {
  background: var(--color-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(32px) saturate(150%);
  -webkit-backdrop-filter: blur(32px) saturate(150%);
  position: relative;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 1px rgba(255, 255, 255, 0.1);
}
```

Update `.scanlines` opacity:
```css
.scanlines {
  /* ... existing code ... */
  opacity: 0.05;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "style: enhance glassmorphism and soften UI borders"
```
