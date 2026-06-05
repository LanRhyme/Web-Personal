# Aesthetics Optimization: Generative Topographic Lines

## Overview
The user selected Option A: "Generative Topographic" (流体等高线地形). The objective is to replace the current particle-based Mobius strip with a highly sophisticated, minimalist graphic design pattern featuring animated 3D topographic lines.

## Visual Design
- **Concept**: A 3D landscape built purely out of elegant, horizontal glowing lines.
- **Color Palette**: Monochromatic (White/Grey lines on the existing dark background). 
- **Animation**: The lines undulate smoothly using Perlin/Simplex noise in a vertex shader, simulating fluid terrain or sound waves. Parallax effect follows the mouse.
- **Aesthetic**: Minimalist cyber-brutalist, echoing high-end graphic design and data visualization.

## Technical Implementation
- **Component**: `src/components/Background3D.vue` (Overwriting current).
- **Three.js Primitives**:
  - `THREE.Line` or `THREE.LineSegments`.
  - We will generate multiple horizontal curves. Each curve consists of N segments.
  - A custom `THREE.ShaderMaterial` will manipulate the vertex `y` positions based on `sin` waves combined with UVs and time `uTime` to create organic, non-repeating rolling hills.
- **Performance**: High. Lines are very cheap to render. The noise calculations are offloaded to the GPU vertex shader.
- **Integration**: Remove the old `TorusKnotGeometry` and `Points`. Initialize a series of `Line` geometries. 

## Success Criteria
- The background looks like a beautifully composed graphic design poster.
- The animation is fluid, smooth, and feels organic.
- The UI glassmorphism panels sit elegantly on top without visual clutter.
