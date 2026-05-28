<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: 'LanRhyme.'
  }
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number;
let particles: Particle[] = [];

// Mouse physics state
let mouse = { x: -9999, y: -9999, radius: 100 };
let mouseVelocity = { x: 0, y: 0 };
let mouseSpeed = 0;
let targetMouseSpeed = 0;
let isHovering = false;

const INTERNAL_FONT_SIZE = 180; 
const INTERNAL_PADDING = 40;

class Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  friction: number;
  spring: number;
  floatAngle: number;
  floatSpeed: number;
  floatRadius: number;

  constructor(x: number, y: number, color: string) {
    this.baseX = x;
    this.baseY = y;
    this.x = x + (Math.random() - 0.5) * 300;
    this.y = y + (Math.random() - 0.5) * 300;
    this.originX = x;
    this.originY = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5;
    this.color = color;
    this.size = Math.random() * 2 + 1.5;
    this.friction = Math.random() * 0.04 + 0.86;
    this.spring = Math.random() * 0.04 + 0.04;

    this.floatAngle = Math.random() * Math.PI * 2;
    this.floatSpeed = Math.random() * 0.02 + 0.01;
    this.floatRadius = Math.random() * 4 + 1; 
  }

  update() {
    // 1. Natural Floating Effect
    this.floatAngle += this.floatSpeed;
    this.originX = this.baseX + Math.cos(this.floatAngle) * this.floatRadius;
    this.originY = this.baseY + Math.sin(this.floatAngle) * this.floatRadius;

    // 2. Fluid Disturbance / Ripple Logic
    let dx = mouse.x - this.x;
    let dy = mouse.y - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate speed-based intensity (0 when still, up to 1 when fast)
    let speedIntensity = Math.min(mouseSpeed / 15, 1);
    // Apply easing for smoother transition
    speedIntensity = speedIntensity * speedIntensity;
    // Minimum intensity when hovering (so there's still a small effect when still)
    let hoverIntensity = isHovering ? (0.1 + speedIntensity * 0.9) : 0;
    
    if (isHovering && distance < mouse.radius) {
      // Quadratic falloff for smooth blending at the edges of the radius
      let force = (mouse.radius - distance) / mouse.radius;
      force = force * force * hoverIntensity;
      
      let angle = Math.atan2(dy, dx);
      
      // A. Drag effect (particles are pulled slightly by the mouse's motion vector)
      this.vx += mouseVelocity.x * force * 0.15;
      this.vy += mouseVelocity.y * force * 0.15;

      // B. Swirl/Vortex effect (particles spin around the mouse instead of just flying away)
      this.vx += Math.sin(angle) * force * 2.5;
      this.vy -= Math.cos(angle) * force * 2.5;

      // C. Very subtle outward push for volume (doesn't push out a blank hole anymore)
      this.vx -= Math.cos(angle) * force * 1.2;
      this.vy -= Math.sin(angle) * force * 1.2;
    }

    // Spring back to shape and apply friction
    this.vx += (this.originX - this.x) * this.spring;
    this.vy += (this.originY - this.y) * this.spring;
    this.vx *= this.friction;
    this.vy *= this.friction;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    const speedX = Math.abs(this.vx);
    const speedY = Math.abs(this.vy);
    const width = this.size + speedX * 1.5;
    const height = this.size + speedY * 1.5;
    
    ctx.fillRect(this.x - width/2, this.y - height/2, width, height);
  }
}

const initParticles = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const fontString = `italic bold ${INTERNAL_FONT_SIZE}px "Playfair Display", serif`;
  
  ctx.font = fontString;
  const metrics = ctx.measureText(props.text);
  const textWidth = metrics.width;
  
  canvas.width = textWidth + INTERNAL_PADDING * 2;
  canvas.height = INTERNAL_FONT_SIZE + INTERNAL_PADDING * 2;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = fontString;
  ctx.textBaseline = 'middle';
  ctx.fillText(props.text, INTERNAL_PADDING, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  particles = [];
  
  for (let y = 0; y < canvas.height; y += 6) {
    for (let x = 0; x < canvas.width; x += 6) {
      const index = (y * canvas.width + x) * 4;
      if (data[index + 3] > 128) {
        let color = '#ffffff';
        const rand = Math.random();
        if (rand > 0.95) color = '#6b8f72';
        else if (rand > 0.9) color = '#a0a0a0';
        
        particles.push(new Particle(x, y, color));
      }
    }
  }
};

const animate = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Decay the mouse velocity so the fluid settles when the mouse stops moving
  mouseVelocity.x *= 0.85;
  mouseVelocity.y *= 0.85;
  
  // Smooth mouse speed for gradual intensity changes
  targetMouseSpeed = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y);
  mouseSpeed += (targetMouseSpeed - mouseSpeed) * 0.15;

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw(ctx);
  }
  
  animationFrameId = requestAnimationFrame(animate);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;
  
  const newX = (e.clientX - rect.left) * scaleX;
  const newY = (e.clientY - rect.top) * scaleY;
  
  // Calculate movement velocity vector for drag effects
  if (mouse.x !== -9999) {
    mouseVelocity.x = newX - mouse.x;
    mouseVelocity.y = newY - mouse.y;
  }
  
  mouse.x = newX;
  mouse.y = newY;
  
  mouse.radius = 120 * scaleX; 
  isHovering = true;
};

const handleMouseLeave = () => {
  isHovering = false;
  mouse.x = -9999;
  mouse.y = -9999;
  mouseVelocity.x = 0;
  mouseVelocity.y = 0;
  targetMouseSpeed = 0;
  mouseSpeed = 0;
};

let resizeTimeout: number;
const handleResize = () => {
  if(resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    initParticles();
    animate();
  }, 300);
};

onMounted(() => {
  document.fonts.ready.then(() => {
    initParticles();
    animate();
  });
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div class="particle-wrapper cursor-crosshair relative inline-block w-full">
    <span class="sr-only">{{ text }}</span>
    <canvas 
      ref="canvasRef" 
      class="particle-text w-full h-auto object-contain transition-transform duration-300 hover:scale-[1.02]"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    ></canvas>
  </div>
</template>

<style scoped>
.particle-wrapper {
  z-index: 10;
  overflow: hidden;
}
.particle-text {
  display: block;
  margin-left: -2%;
  max-width: 104%;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
