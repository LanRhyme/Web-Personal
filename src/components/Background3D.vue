<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const containerRef = ref<HTMLElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let particlesMesh: THREE.Points;
let animationId: number;

const mouseX = ref(0);
const mouseY = ref(0);
const targetX = ref(0);
const targetY = ref(0);

const initThree = () => {
  if (!containerRef.value) return;

  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 800;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  containerRef.value.appendChild(renderer.domElement);

  // Create Particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 8000;
  const posArray = new Float32Array(particlesCount * 3);
  const colorArray = new Float32Array(particlesCount * 3);

  for(let i = 0; i < particlesCount * 3; i+=3) {
    // Spread particles in a wide area
    posArray[i] = (Math.random() - 0.5) * 3000;
    posArray[i+1] = (Math.random() - 0.5) * 3000;
    posArray[i+2] = (Math.random() - 0.5) * 3000;
    
    // Black and White shades (mostly white/grey with different intensities)
    const colorVal = Math.random() * 0.5 + 0.5; // 0.5 to 1.0 (grey to white)
    colorArray[i] = colorVal;
    colorArray[i+1] = colorVal;
    colorArray[i+2] = colorVal;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 2.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.0001;
  
  // Smoothly interpolate target mouse position
  targetX.value += (mouseX.value - targetX.value) * 0.05;
  targetY.value += (mouseY.value - targetY.value) * 0.05;

  if (particlesMesh) {
    // Slow continuous rotation
    particlesMesh.rotation.y = time * 0.5;
    particlesMesh.rotation.x = time * 0.2;
    
    // Mouse parallax
    particlesMesh.position.x = -targetX.value * 200;
    particlesMesh.position.y = -targetY.value * 200;
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
  if (particlesMesh) {
    particlesMesh.geometry.dispose();
    (particlesMesh.material as THREE.Material).dispose();
  }
});
</script>

<template>
  <div ref="containerRef" class="fixed inset-0 pointer-events-none z-[-1] opacity-70"></div>
</template>
