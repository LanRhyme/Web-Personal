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
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 12;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  containerRef.value.appendChild(renderer.domElement);

  // Generate Base Geometry (Mobius-like Ribbon)
  // parameters: radius, tube, tubularSegments, radialSegments, p, q
  const baseGeometry = new THREE.TorusKnotGeometry(3.5, 1.2, 400, 64, 1, 3);
  
  // Create Particles from the geometry vertices
  const particlesGeometry = new THREE.BufferGeometry();
  const positionAttribute = baseGeometry.getAttribute('position');
  
  const vertexCount = positionAttribute.count;
  const colorArray = new Float32Array(vertexCount * 3);
  const offsetArray = new Float32Array(vertexCount); 

  for (let i = 0; i < vertexCount; i++) {
    // Random black & white / grey tones for each particle
    const shade = 0.3 + Math.random() * 0.7; // 0.3 to 1.0
    colorArray[i * 3] = shade;
    colorArray[i * 3 + 1] = shade;
    colorArray[i * 3 + 2] = shade;
    // Random offset for organic breathing animation
    offsetArray[i] = Math.random() * Math.PI * 2;
  }

  particlesGeometry.setAttribute('position', positionAttribute);
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  particlesGeometry.setAttribute('aOffset', new THREE.BufferAttribute(offsetArray, 1));

  // Custom Shader Material for dynamic particle breathing and glowing effect
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      attribute vec3 color;
      attribute float aOffset;
      varying vec3 vColor;
      
      void main() {
        vColor = color;
        vec3 pos = position;
        
        // Organic breathing effect
        vec3 dir = normalize(pos);
        float displacement = sin(uTime * 2.0 + aOffset) * 0.15;
        pos += dir * displacement;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Size attenuation
        gl_PointSize = (2.0 + sin(uTime * 3.0 + aOffset) * 1.5) * (30.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        // Soft circular particle with gradient
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = (0.5 - dist) * 2.0;
        gl_FragColor = vec4(vColor, alpha * 0.7);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  particlesMesh = new THREE.Points(particlesGeometry, shaderMaterial);
  scene.add(particlesMesh);

  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.0005;
  
  targetX.value += (mouseX.value - targetX.value) * 0.05;
  targetY.value += (mouseY.value - targetY.value) * 0.05;

  if (particlesMesh) {
    // Rotate the entire mobius strip
    particlesMesh.rotation.y = time * 0.2 + targetX.value * 0.3;
    particlesMesh.rotation.x = time * 0.1 + targetY.value * 0.3;
    particlesMesh.rotation.z = time * 0.05;
    
    // Pass time to shader
    (particlesMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
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
