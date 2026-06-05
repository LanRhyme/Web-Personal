# Aesthetic Upgrade Design Spec

## Goal
Elevate the personal website's visual design from a harsh "Premium ASCII Brutalism" to an "Elegant Dark Glassmorphism" aesthetic. The goal is to retain the existing dark mode and sage green identity (`#6b8f72`), but make the UI feel significantly more premium, modern, and polished.

## Core Aesthetic Changes

1. **Material & Texture (Glassmorphism)**
   - Replace opaque or solid dark backgrounds on `.cyber-glass` and similar components with translucent, blurred backgrounds using `backdrop-filter: blur(24px)` (or similar).
   - Use ultra-thin, semi-transparent borders (e.g., `rgba(255, 255, 255, 0.1)`) combined with soft inner shadows to create depth.
   
2. **Color Palette & Lighting**
   - **Primary Background**: Keep it deep/obsidian (`#111111` or `#0a0a0a`).
   - **Accent Color**: Sage Green (`#6b8f72`).
   - **Lighting Effects**: Move away from solid borders. Instead, use soft radial gradients, glowing drop-shadows, and ambient background glows (e.g., tracking mouse position) to make the green appear as a gentle, luxurious emission rather than a hard line.

3. **Micro-interactions & Animation**
   - **Hover States**: Replace the jittery glitch animations (`.glitch-hover`) and harsh slide effects with smooth, liquid-like transitions (fade-ins, soft scales, and easing curves).
   - **Custom Cursor**: Change the current harsh square frame into a smooth, elegant dot or rounded ring with physics-based trailing.

4. **Background Ambient Elements**
   - **Matrix Canvas**: Soften the ASCII rain. Reduce opacity, perhaps add a slight blur, or make the particles finer so it serves as a subtle texture rather than distracting noise.
   - **Scanlines**: Reduce their visibility/opacity to be barely perceptible.
   - **HUD Elements**: Simplify or thin out the artificial corner crosshairs and technical text to look more refined.

## Component Specifics

- **`.cyber-glass` (Cards)**: Will receive the main glassmorphism treatment. Needs inner borders, subtle gradients, and large, soft box-shadows.
- **Buttons (`.btn-terminal`)**: Softer borders, rounded corners (e.g., `border-radius: 8px` or `4px` instead of `0`), glowing hover effect.
- **Typography**: Retain fonts (`Space Grotesk`, `JetBrains Mono`, `Playfair Display`), but increase letter-spacing and line-heights in body text for better breathing room.
- **LanPet AI Companion**: Ensure its dark mode styling matches the elegant green glow.

## Scope
This spec focuses purely on the CSS/UI styling, canvas rendering logic, and cursor logic located primarily in `src/style.css`, `tailwind.config.js`, and `src/App.vue`. No structural changes to the page layouts or content are required, ensuring backward compatibility with existing features and the ARG logic.

## Open Questions / Ambiguities
- **Border Radius**: Brutalism typically uses `0px`. For this elegant glass look, we will use a subtle `border-radius: 12px` to `16px` on large cards, and `4px` to `8px` on smaller elements.
- **Matrix Canvas Performance**: The current canvas logic is quite custom. We will only adjust its colors, sizes, and opacities (alpha channels) to achieve the softer look without overhauling its update loop.
