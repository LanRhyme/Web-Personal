<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  path: string
  color?: string
  hovered?: boolean
  active?: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

// All animation state is OUTSIDE Vue reactivity (plain variables)
let ctx: CanvasRenderingContext2D | null = null
let particles: { 
  x: number; y: number; 
  vx: number; vy: number; 
  tx: number; ty: number; 
  sx: number; sy: number; 
  sz: number; a: number; 
  sp: number; ph: number;
  stiffness: number;
  friction: number;
}[] = []
let animId = 0
let time = 0
let isHovered = false
let canvasW = 0
let canvasH = 0
let introPhase = 1 // Controls global fade-in

// Sync prop without re-render
watch(() => props.hovered, (v) => { isHovered = !!v }, { immediate: true })

watch(() => props.active, (v, oldV) => {
  if (v && !oldV) {
    scatter()
  }
})

function scatter() {
  introPhase = 0 // Start fade-in from 0
  const center = 50
  particles.forEach(p => {
    // Create a beautiful vortex / swirl effect
    const angle = Math.random() * Math.PI * 2
    // Start them in a wide ring outside the center
    const radius = 100 + Math.random() * 60
    
    p.x = center + Math.cos(angle) * radius
    p.y = center + Math.sin(angle) * radius
    
    // Give them tangential velocity to create a spinning swirl
    const swirlSpeed = 15 + Math.random() * 10
    p.vx = -Math.sin(angle) * swirlSpeed
    p.vy = Math.cos(angle) * swirlSpeed
  })
}

function samplePath(svgPath: string, n: number) {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.style.cssText = 'position:absolute;visibility:hidden'
  document.body.appendChild(svg)
  const p = document.createElementNS(ns, 'path')
  p.setAttribute('d', svgPath)
  svg.appendChild(p)
  const pts: { x: number; y: number }[] = []
  const len = p.getTotalLength()
  for (let i = 0; i < n; i++) {
    const pt = p.getPointAtLength((i / n) * len)
    pts.push({ x: pt.x, y: pt.y })
  }
  document.body.removeChild(svg)
  return pts
}

function init() {
  if (!props.path) return
  const pts = samplePath(props.path, 80)
  const all = [...pts]
  for (let i = 0; i < 30; i++) {
    const b = pts[Math.floor(Math.random() * pts.length)]
    all.push({ x: b.x + (Math.random() - 0.5) * 18, y: b.y + (Math.random() - 0.5) * 18 })
  }
  particles = all.map(p => {
    const dx = p.x - 50, dy = p.y - 50
    const d = Math.sqrt(dx * dx + dy * dy) || 1
    const px = 50 + (Math.random() - 0.5) * 80
    const py = 50 + (Math.random() - 0.5) * 80
    return {
      x: px, y: py,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      tx: p.x, ty: p.y,
      sx: p.x + (dx / d) * 18 + (Math.random() - 0.5) * 8,
      sy: p.y + (dy / d) * 18 + (Math.random() - 0.5) * 8,
      sz: 1.2 + Math.random() * 3.5,
      a: 0.6 + Math.random() * 0.4,
      sp: 0.025 + Math.random() * 0.04,
      ph: Math.random() * Math.PI * 2,
      stiffness: 0.005 + Math.random() * 0.02, 
      friction: 0.85 + Math.random() * 0.06 
    }
  })
}

function tick() {
  if (!ctx || !canvasW) { animId = requestAnimationFrame(tick); return }
  const c = ctx!
  const padding = 0.5
  const usableW = canvasW / (1 + padding * 2)
  const s = usableW / 100
  const offset = usableW * padding
  c.clearRect(0, 0, canvasW, canvasH)
  
  const now = performance.now() * 0.001
  const dt = Math.min(now - time, 0.05) 
  time = now
  const col = props.color || '#e8e8f0'
  const hov = isHovered
  
  if (introPhase < 1) {
    introPhase += dt * 2.0 
    if (introPhase > 1) introPhase = 1
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    const tx = hov ? p.sx : p.tx
    const ty = hov ? p.sy : p.ty
    
    p.vx += (tx - p.x) * (hov ? 0.04 : p.stiffness)
    p.vy += (ty - p.y) * (hov ? 0.04 : p.stiffness)
    p.vx *= (hov ? 0.78 : p.friction)
    p.vy *= (hov ? 0.78 : p.friction)
    p.x += p.vx
    p.y += p.vy

    const fx = Math.sin(now * 0.7 + p.ph) * 1.0
    const fy = Math.cos(now * 0.5 + p.ph * 1.3) * 1.0
    const px_final = offset + (p.x + fx) * s
    const py_final = offset + (p.y + fy) * s

    const br = (hov ? 0.9 : 0.6) + Math.sin(now + p.ph) * 0.2
    const a = Math.max(0, Math.min(1, p.a * br)) * introPhase
    const ah = Math.floor(a * 255).toString(16).padStart(2, '0')

    c.beginPath()
    c.arc(px_final, py_final, p.sz * s * 0.8, 0, 6.2832)
    c.fillStyle = col + ah
    c.fill()
  }

  animId = requestAnimationFrame(tick)
}

function resize() {
  const cv = canvasRef.value
  if (!cv) return
  const par = cv.parentElement
  if (!par) return
  const baseSz = Math.max(par.clientWidth, par.clientHeight, 64)
  const padding = 0.5 
  const sz = baseSz * (1 + padding * 2)
  const dpr = Math.min(devicePixelRatio, 2)
  canvasW = Math.floor(sz * dpr)
  canvasH = Math.floor(sz * dpr)
  cv.width = canvasW
  cv.height = canvasH
  cv.style.width = sz + 'px'
  cv.style.height = sz + 'px'
}

let observer: ResizeObserver | null = null

onMounted(() => {
  ctx = canvasRef.value?.getContext('2d') || null
  const cv = canvasRef.value
  
  if (cv && cv.parentElement) {
    observer = new ResizeObserver(() => {
      resize()
    })
    observer.observe(cv.parentElement)
  }

  requestAnimationFrame(() => {
    resize()
    init()
    time = performance.now() * 0.001
    tick()
  })
})

watch(() => props.path, () => { init() })

onUnmounted(() => { 
  cancelAnimationFrame(animId)
  if (observer) observer.disconnect()
})
</script>

<template>
  <canvas ref="canvasRef" class="particle-symbol"></canvas>
</template>

<style scoped>
.particle-symbol { 
  display: block; 
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
