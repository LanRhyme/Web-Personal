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

  // Geometry: TorusKnot used as an animated Mobius strip / ribbon
  const geometry = new THREE.TorusKnotGeometry(2.2, 0.6, 256, 64, 1, 3);
  
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
    mesh.rotation.y = time * 0.3 + mouseX.value * 0.5;
    mesh.rotation.x = time * 0.2 + mouseY.value * 0.5;
    mesh.rotation.z = time * 0.15;
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
