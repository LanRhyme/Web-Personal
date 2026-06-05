# Aesthetic Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the site's visual design from harsh Brutalism to Elegant Dark Glassmorphism, retaining the #6b8f72 sage green accent.

**Architecture:** We will modify the global `style.css` to change component textures (backdrop-filter) and transitions. We will update `App.vue` to soften the cursor and canvas animations, and `Home.vue` to refine interactions. No structural or routing changes are needed.

**Tech Stack:** Vue 3, Tailwind CSS (v4), Vanilla CSS, HTML5 Canvas.

---

### Task 1: Refine Global CSS and Base Material (`src/style.css`)

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Write the minimal implementation**

Update `src/style.css` to soften the root colors and redefine `.cyber-glass`, buttons, and animations.

```css
/* In src/style.css */
/* Update root variables to soften borders and add glass variables */
:root {
  color-scheme: dark;
  --color-bg: #111111;
  --color-text: #ffffff;
  --color-text-dim: #a0a0a0;
  
  --color-brand: #6b8f72;
  --color-brand-rgb: 107, 143, 114;
  --color-brand-secondary: #5a7a60;
  
  --color-border: rgba(255, 255, 255, 0.08); /* Softer border */
  --color-card: rgba(20, 20, 20, 0.7); /* More transparent for blur */
  --color-card-solid: #0f0f0f;
  --color-hud: rgba(107, 143, 114, 0.2);
}

/* ... existing code ... */

/* Soften the .btn-terminal */
.btn-terminal {
  /* ... existing code ... */
  border: 1px solid var(--color-border);
  border-radius: 6px; /* Added radius */
  /* ... existing code ... */
}
.btn-terminal:hover {
  border-color: rgba(var(--color-brand-rgb), 0.6);
  box-shadow: 0 0 15px rgba(var(--color-brand-rgb), 0.2);
  /* ... */
}

/* Transform .cyber-glass into Glassmorphism */
.cyber-glass {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px; /* Smooth corners */
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  position: relative;
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); /* Base soft shadow */
}

.cyber-glass:hover {
  border-color: rgba(var(--color-brand-rgb), 0.3);
  background: rgba(30, 30, 30, 0.75);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(var(--color-brand-rgb), 0.1);
  transform: translateY(-2px);
}

/* Remove thin edge accents (corner dots) to keep it clean */
.cyber-glass::after {
  display: none;
}

/* ... existing code ... */

/* Refine glitch to a soft glow pulse instead of jagged movement */
@keyframes text-glow-pulse {
  0% { text-shadow: 0 0 5px rgba(var(--color-brand-rgb), 0.2); }
  50% { text-shadow: 0 0 15px rgba(var(--color-brand-rgb), 0.6); }
  100% { text-shadow: 0 0 5px rgba(var(--color-brand-rgb), 0.2); }
}

.glitch-hover {
  display: inline-block;
  transition: all 0.4s ease;
}
.glitch-hover:hover {
  color: var(--color-brand);
  animation: text-glow-pulse 2s infinite ease-in-out;
}

/* Smooth out custom cursor in CSS */
.cursor-dot {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 8px;
  height: 8px;
  background-color: var(--color-brand);
  border-radius: 50%;
  transition: opacity 0.3s, transform 0.2s;
  box-shadow: 0 0 10px rgba(var(--color-brand-rgb), 0.5);
}

.cursor-frame {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid rgba(var(--color-brand-rgb), 0.4);
  border-radius: 50%;
  transition: border-color 0.3s, background-color 0.3s;
  will-change: transform, width, height;
}

.cursor-dot.hovering {
  transform: scale(0.5);
}

.cursor-frame.hovering {
  border-color: rgba(var(--color-brand-rgb), 0.8);
  background-color: rgba(var(--color-brand-rgb), 0.05);
  backdrop-filter: blur(2px);
}
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev`
Expected: View the site in the browser. Cards should now have rounded corners (`12px`) and a glassy blur effect. Hovering over cards should produce a soft glow rather than sharp brutalist lines.

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "style: upgrade to elegant dark glassmorphism base"
```

### Task 2: Soften Background Elements (`src/App.vue`)

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Write the minimal implementation**

Update the Matrix Canvas drawing logic and ambient HUD opacity in `src/App.vue`.

```typescript
// In src/App.vue, locate the MatrixDrop draw method and update it:
  draw(ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number) {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let drawX = this.x;
    let drawY = this.y;
    // Softer repel
    if (dist < 120) {
      const force = (120 - dist) / 120;
      drawX += (dx / dist) * force * 10;
      drawY += (dy / dist) * force * 10;
      // Soft glow near mouse
      ctx.fillStyle = `rgba(107, 143, 114, ${0.1 + force * 0.4})`;
    } else {
      // Extremely subtle background drops
      ctx.fillStyle = 'rgba(107, 143, 114, 0.05)';
    }
    
    // Add subtle shadow for glow
    ctx.shadowColor = 'rgba(107, 143, 114, 0.5)';
    ctx.shadowBlur = dist < 120 ? 10 : 0;
    
    ctx.fillText(this.char, drawX, drawY);
    ctx.shadowBlur = 0; // reset
  }
```

```html
<!-- In src/App.vue, update HUD lines opacity to be very subtle -->
<!-- Replace existing blueprint lines with: -->
<div class="absolute top-0 left-[8%] w-[1px] h-full bg-[var(--color-border)] opacity-10"></div>
<div class="absolute top-0 right-[8%] w-[1px] h-full bg-[var(--color-border)] opacity-10"></div>
<div class="absolute top-[15%] left-0 w-full h-[1px] bg-[var(--color-border)] opacity-10"></div>

<!-- And corner crosshairs: -->
<div class="absolute top-[15%] left-[8%] -translate-x-1/2 -translate-y-1/2 text-[var(--color-brand)] opacity-20 text-[10px] font-mono leading-none">+</div>
<div class="absolute top-[15%] right-[8%] translate-x-1/2 -translate-y-1/2 text-[var(--color-brand)] opacity-20 text-[10px] font-mono leading-none">+</div>

<!-- And Top Left Data opacity: -->
<span class="opacity-30">CPU: {{ cpuLoad.toString().padStart(2, '0') }}%</span>
<span class="opacity-30">MEM: {{ memLoad.toFixed(1) }}%</span>
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev`
Expected: The background characters should be very faint (`0.05` opacity) and subtly glow when the mouse is near. The blueprint grid lines should be almost imperceptible (`opacity-10`).

- [ ] **Step 3: Commit**

```bash
git add src/App.vue
git commit -m "style: soften matrix canvas and ambient HUD elements"
```

### Task 3: Refine Layout Components (`src/views/Home.vue`)

**Files:**
- Modify: `src/views/Home.vue`

- [ ] **Step 1: Write the minimal implementation**

Adjust text opacities and interactions to align with the elegant aesthetic.

```html
<!-- In src/views/Home.vue, find the glitch-hover text and uppercase tracking -->
<!-- e.g. update the system status block -->
<div class="text-sm sm:text-sm tracking-[0.3em] uppercase max-w-sm font-mono text-[var(--color-text-dim)]">
  <span class="text-[var(--color-brand)] font-bold animate-pulse drop-shadow-[0_0_8px_rgba(107,143,114,0.6)]">> STATUS: ONLINE</span><br><br>
  <!-- ... -->
</div>

<!-- Update the "SYS.EXPLORE" header -->
<div class="reveal border-b border-[rgba(255,255,255,0.05)] pb-3 md:pb-4 text-sm md:text-base font-bold flex justify-between font-mono tracking-[0.2em] md:tracking-[0.3em]">
  <span class="text-[var(--color-text)]"><span class="animate-pulse text-[var(--color-brand)] drop-shadow-[0_0_5px_rgba(107,143,114,0.8)]">></span> SYS.EXPLORE</span>
  <span class="opacity-40">DIR_LIST</span>
</div>

<!-- Update the Route Buttons cyber-glass to make sure hover states match -->
<!-- The classes are already .cyber-glass, so the CSS updates from Task 1 will apply automatically. Just ensure any explicit hover translations (-translate-y-2) remain smooth. -->
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev`
Expected: Home page elements should look cleaner, with borders blending softly into the background. Glowing text (like `STATUS: ONLINE`) should have a luxurious drop-shadow.

- [ ] **Step 3: Commit**

```bash
git add src/views/Home.vue
git commit -m "style: refine typography and glow effects on home page"
```
