<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const containerRef = ref<HTMLElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let planeMesh: THREE.Mesh;
let animationId: number;

const mouseX = ref(0);
const mouseY = ref(0);
const targetX = ref(0);
const targetY = ref(0);

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
      uMouse: { value: new THREE.Vector2(0, 0) }
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
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        uv.x *= uResolution.x / uResolution.y;

        // Shift UV by mouse interaction
        vec2 st = uv + uMouse * 0.05;

        // Base noise
        float n1 = snoise(vec3(st * 1.5, uTime * 0.08));
        // Add detail
        float n2 = snoise(vec3(st * 3.0, uTime * 0.12)) * 0.5;
        float noiseVal = n1 + n2;

        // Contour math - safer implementation without fwidth
        float linesCount = 12.0;
        float f = fract(noiseVal * linesCount);
        
        // Fixed thickness to avoid WebGL derivative issues on some machines
        float lineThickness = 0.03;
        float edgeSoftness = 0.03;
        
        // Draw lines at boundaries (f is close to 0 or 1)
        float lineAlpha = smoothstep(lineThickness + edgeSoftness, lineThickness, f) 
                        + smoothstep(1.0 - lineThickness - edgeSoftness, 1.0 - lineThickness, f);

        // Gradient color for lines
        vec3 color1 = vec3(0.5, 0.6, 0.55); // darker greyish green
        vec3 color2 = vec3(0.8, 0.9, 0.85); // lighter glow
        // Normalize noiseVal approx from [-1.5, 1.5] to [0, 1]
        vec3 finalColor = mix(color1, color2, clamp((noiseVal + 1.0) * 0.5, 0.0, 1.0));

        gl_FragColor = vec4(finalColor, lineAlpha * 0.7);
      }
    `,
    transparent: true,
    depthWrite: false
  });

  planeMesh = new THREE.Mesh(geometry, shaderMaterial);
  scene.add(planeMesh);

  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.001;
  
  targetX.value += (mouseX.value - targetX.value) * 0.05;
  targetY.value += (mouseY.value - targetY.value) * 0.05;

  if (planeMesh) {
    const mat = planeMesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uMouse.value.set(targetX.value, targetY.value);
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
  if (planeMesh) {
    planeMesh.geometry.dispose();
    (planeMesh.material as THREE.Material).dispose();
  }
});
</script>

<template>
  <div ref="containerRef" class="fixed inset-0 pointer-events-none z-[-1] opacity-70"></div>
</template>
