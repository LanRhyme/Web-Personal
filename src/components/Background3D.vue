<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const containerRef = ref<HTMLElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let linesGroup: THREE.Group;
let shaderMaterial: THREE.ShaderMaterial;
let animationId: number;

const mouseX = ref(0);
const mouseY = ref(0);
const targetX = ref(0);
const targetY = ref(0);

const initThree = () => {
  if (!containerRef.value) return;

  scene = new THREE.Scene();
  
  // Create camera with a low angle looking across the terrain
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(0, 20, 80);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  containerRef.value.appendChild(renderer.domElement);

  linesGroup = new THREE.Group();
  scene.add(linesGroup);

  // Custom Shader Material for Topographic Lines
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      varying float vDepth;
      
      void main() {
        vec3 pos = position;
        
        // Fluid topographic noise using combined sine waves
        float wave1 = sin(pos.x * 0.05 + uTime * 0.6) * 6.0;
        float wave2 = sin(pos.z * 0.04 + uTime * 0.4) * 8.0;
        float wave3 = sin((pos.x + pos.z) * 0.03 - uTime * 0.3) * 5.0;
        
        pos.y = wave1 + wave2 + wave3;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Pass original Z to fragment for depth fading
        vDepth = pos.z;
      }
    `,
    fragmentShader: `
      varying float vDepth;
      void main() {
        // Fade out lines in the distance (z goes from -150 to 150)
        // front is ~100, back is ~-100
        float alpha = smoothstep(-150.0, 80.0, vDepth);
        // Soft mint/grey tone to fit the site aesthetic
        gl_FragColor = vec4(0.7, 0.8, 0.75, alpha * 0.3);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  // Generate parallel lines for the topography
  const lineCount = 100; // Number of horizontal lines
  const pointsPerLine = 150;
  const width = 300;
  const depth = 300;

  for (let i = 0; i < lineCount; i++) {
    const points = new Float32Array(pointsPerLine * 3);
    const zPos = (i / (lineCount - 1)) * depth - depth / 2;
    
    for (let j = 0; j < pointsPerLine; j++) {
      const xPos = (j / (pointsPerLine - 1)) * width - width / 2;
      points[j * 3] = xPos;
      points[j * 3 + 1] = 0; // Y is calculated in shader
      points[j * 3 + 2] = zPos;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const line = new THREE.Line(geometry, shaderMaterial);
    linesGroup.add(line);
  }

  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.001;
  
  // Mouse parallax interpolation
  targetX.value += (mouseX.value - targetX.value) * 0.05;
  targetY.value += (mouseY.value - targetY.value) * 0.05;

  if (linesGroup) {
    // Subtle rotation based on mouse
    linesGroup.rotation.y = targetX.value * 0.15;
    linesGroup.rotation.x = targetY.value * 0.1;
    
    // Update shader time
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = time;
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
  if (linesGroup) {
    linesGroup.children.forEach(child => {
      const line = child as THREE.Line;
      line.geometry.dispose();
    });
  }
  if (shaderMaterial) {
    shaderMaterial.dispose();
  }
});
</script>

<template>
  <div ref="containerRef" class="fixed inset-0 pointer-events-none z-[-1] opacity-80"></div>
</template>
