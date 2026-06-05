# Web Aesthetics Optimization Design: Fluid WebGL & Glassmorphism

## 1. Overview
The goal of this design is to elevate the "Premium ASCII Brutalism" theme of the personal website into a more artistic, comfortable, and visually striking experience. We will achieve this by replacing the static 2D matrix background with a dynamic 3D WebGL fluid geometry, and softening the UI with glassmorphism to create a high-end, breathable aesthetic.

## 2. Core Visual Components

### 2.1 Background 3D Abstract Geometry
- **Implementation**: Replace the existing 2D HTML Canvas Matrix background with a `Three.js` scene wrapped in a Vue component (`Background3D.vue`).
- **Geometry**: An abstract, organic shape (e.g., an Icosahedron modified with Perlin noise in the vertex shader to simulate fluid/breathing motion).
- **Material**: `MeshPhysicalMaterial`
  - High metalness and roughness to give a matte-metallic but reflective feel.
  - Clearcoat applied to create a premium "wet" or glass-like sheen.
  - Color palette mapped to the existing desaturated green (`#6b8f72`), fading into deep shadows.
- **Lighting**: A combination of ambient light, directional light, and a point light that follows the cursor to create dynamic reflections.
- **Interactivity**: 
  - Mouse movement slightly rotates/tilts the geometry (parallax effect).
  - Page scrolling (via `Lenis` progress) affects the rotation and noise frequency of the geometry, creating a sense of progression as the user navigates.

### 2.2 Glassmorphism UI Refinements
- **Backdrop Blur**: Enhance `.cyber-glass` and other container classes in `style.css` by increasing the `backdrop-filter: blur` intensity (e.g., to 24px-32px).
- **Borders**: Soften the harsh 1px solid borders (`var(--color-border)`). Use semi-transparent borders (e.g., `rgba(255, 255, 255, 0.1)`) with subtle inner shadows to simulate glass thickness.
- **Typography & Spacing**: Increase line heights slightly and ensure padding allows the UI to "breathe" over the new 3D background. 

## 3. Architecture & Data Flow

### 3.1 Component Structure
- `src/components/Background3D.vue`: New component responsible for mounting the Three.js scene, rendering the loop, and cleaning up on unmount.
- `src/App.vue`: Remove the `initCanvas` matrix drop logic. Import and place `<Background3D />` globally behind the main router view (`z-index: -1`).
- `src/style.css`: Update the `:root` variables and `.cyber-glass` classes to reflect the glassmorphism changes.

### 3.2 Performance Considerations
- **Throttling**: Cap the `Three.js` render loop to monitor performance, or pause rendering if the tab is inactive.
- **Responsiveness**: Handle window resize events cleanly within `Background3D.vue` to update the camera aspect ratio and renderer size.
- **Geometry Details**: Keep the vertex count reasonable (e.g., an Icosahedron detail level of 32 or 64) to ensure 60fps even on lower-end devices.

## 4. Unchanged Elements (Preserved Features)
- **LanPet AI Companion**: Remains active with its dialogue and ARG logic.
- **Custom Physics Cursor**: Maintained as it perfectly complements the interactive nature of the new background.
- **Routing & Content**: All page components and their data remain functionally unchanged; they only inherit the new aesthetic styles.

## 5. Scope
This design is strictly focused on aesthetic improvements via CSS updates and the introduction of a global Three.js background component. It does not alter the underlying business logic, routing, or the ARG puzzle mechanics.
