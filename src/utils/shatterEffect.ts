/**
 * Rain World Signal Extinction & Dawn Reawakening Animation
 * Simulates authentic old CRT television signal collapse:
 * 1. Screen tearing jitter & chromatic RGB split directly on the page
 * 2. CRT scanlines and rolling TV static interference
 * 3. Vertical raster collapse into horizontal phosphor razor beam
 * 4. Horizontal beam pinch into a central dying phosphor dot
 * 5. Morning light reawakening
 */
export async function triggerShatterEffect(): Promise<() => void> {
  // Target container to collapse
  const target = (document.querySelector('.shake-container') || document.querySelector('.app-root') || document.body) as HTMLElement;

  // Main extinction overlay
  const overlay = document.createElement('div');
  overlay.className = 'extinction-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483647';
  overlay.style.pointerEvents = 'all';
  overlay.style.backgroundColor = 'transparent';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  // CRT fine scanlines
  const scanlines = document.createElement('div');
  scanlines.style.position = 'absolute';
  scanlines.style.inset = '0';
  scanlines.style.pointerEvents = 'none';
  scanlines.style.background = 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px)';
  scanlines.style.opacity = '0.75';
  scanlines.style.mixBlendMode = 'multiply';
  overlay.appendChild(scanlines);

  // CRT tube curvature vignette
  const vignette = document.createElement('div');
  vignette.style.position = 'absolute';
  vignette.style.inset = '0';
  vignette.style.pointerEvents = 'none';
  vignette.style.background = 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(0, 0, 0, 0.75) 100%)';
  overlay.appendChild(vignette);

  // CRT rolling TV static canvas
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.style.position = 'absolute';
  noiseCanvas.style.inset = '0';
  noiseCanvas.style.width = '100%';
  noiseCanvas.style.height = '100%';
  noiseCanvas.style.pointerEvents = 'none';
  noiseCanvas.style.mixBlendMode = 'screen';
  noiseCanvas.style.opacity = '0.35';
  overlay.appendChild(noiseCanvas);

  const nCtx = noiseCanvas.getContext('2d');
  let noiseActive = true;
  const nW = (noiseCanvas.width = Math.min(640, window.innerWidth));
  const nH = (noiseCanvas.height = Math.min(360, window.innerHeight));

  const renderNoise = () => {
    if (!noiseActive || !nCtx) return;
    const imgData = nCtx.createImageData(nW, nH);
    const buf = new Uint32Array(imgData.data.buffer);
    const len = buf.length;
    for (let i = 0; i < len; i++) {
      if (Math.random() < 0.2) {
        const val = (Math.random() * 255) | 0;
        buf[i] = (40 << 24) | (val << 16) | (val << 8) | val;
      }
    }
    nCtx.putImageData(imgData, 0, 0);

    // Occasional horizontal glitch static tear bar
    if (Math.random() < 0.6) {
      const barY = Math.random() * nH;
      const barH = Math.random() * 22 + 4;
      nCtx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      nCtx.fillRect(0, barY, nW, barH);
    }

    requestAnimationFrame(renderNoise);
  };
  requestAnimationFrame(renderNoise);

  // Central CRT horizontal beam
  const beam = document.createElement('div');
  beam.style.position = 'absolute';
  beam.style.top = '50%';
  beam.style.left = '0';
  beam.style.width = '100%';
  beam.style.height = '2px';
  beam.style.backgroundColor = '#ffffff';
  beam.style.boxShadow = '0 0 24px 6px rgba(255, 255, 255, 1), 0 0 70px 16px rgba(130, 210, 255, 0.85)';
  beam.style.transform = 'scaleX(0) scaleY(1)';
  beam.style.opacity = '0';
  beam.style.transformOrigin = 'center center';
  overlay.appendChild(beam);

  // Central phosphor dot (lingers right as beam pinches inward)
  const dot = document.createElement('div');
  dot.style.position = 'absolute';
  dot.style.top = '50%';
  dot.style.left = '50%';
  dot.style.width = '6px';
  dot.style.height = '6px';
  dot.style.marginTop = '-3px';
  dot.style.marginLeft = '-3px';
  dot.style.borderRadius = '50%';
  dot.style.backgroundColor = '#ffffff';
  dot.style.boxShadow = '0 0 16px 6px rgba(255, 255, 255, 1), 0 0 45px 12px rgba(130, 210, 255, 0.9)';
  dot.style.transform = 'scale(0)';
  dot.style.opacity = '0';
  overlay.appendChild(dot);

  // --- Step 1: Entire Page Screen Tearing & Chromatic Aberration (0 - 270ms) ---
  if (target) {
    target.style.transformOrigin = 'center center';
    target.style.transition = 'none';

    // Frame 1A (0 - 50ms): Initial jitter + chromatic red/cyan shift
    target.style.transform = 'translateX(-16px) skewX(-2.5deg)';
    target.style.filter = 'drop-shadow(-8px 0 0 rgba(255, 30, 90, 0.85)) drop-shadow(8px 0 0 rgba(0, 235, 255, 0.85)) contrast(1.5) brightness(1.25)';
    await new Promise(r => setTimeout(r, 50));

    // Frame 1B (50 - 105ms): Reverse jerk + stronger chromatic dislocation + inversion flash
    target.style.transform = 'translateX(26px) skewX(3.5deg)';
    target.style.filter = 'drop-shadow(14px 0 0 rgba(255, 30, 90, 0.9)) drop-shadow(-14px 0 0 rgba(0, 235, 255, 0.9)) contrast(2.2) brightness(1.6) invert(0.12)';
    await new Promise(r => setTimeout(r, 55));

    // Frame 1C (105 - 165ms): Major H-sync tearing offset
    target.style.transform = 'translateX(-38px) skewX(-4.5deg)';
    target.style.filter = 'drop-shadow(-20px 0 0 rgba(255, 30, 90, 0.95)) drop-shadow(20px 0 0 rgba(0, 235, 255, 0.95)) contrast(2.8) brightness(2.0)';
    await new Promise(r => setTimeout(r, 60));

    // Frame 1D (165 - 225ms): Peak chromatic splitting
    target.style.transform = 'translateX(46px) skewX(5.5deg)';
    target.style.filter = 'drop-shadow(28px 0 0 rgba(255, 30, 90, 1.0)) drop-shadow(-28px 0 0 rgba(0, 235, 255, 1.0)) contrast(3.4) brightness(2.6) invert(0.16)';
    await new Promise(r => setTimeout(r, 60));

    // Frame 1E (225 - 270ms): Electrical pre-collapse shudder
    target.style.transform = 'translateX(-10px) scaleY(0.92) skewX(-2deg)';
    target.style.filter = 'drop-shadow(-32px 0 0 rgba(255, 30, 90, 1.0)) drop-shadow(32px 0 0 rgba(0, 235, 255, 1.0)) contrast(4.0) brightness(3.5)';
    await new Promise(r => setTimeout(r, 45));
  }

  // --- Step 2: CRT Raster Vertical Collapse into Razor Slit (270ms - 490ms) ---
  noiseActive = false;
  noiseCanvas.remove();
  overlay.style.backgroundColor = '#000000';
  beam.style.opacity = '1';
  beam.style.transform = 'scaleX(1) scaleY(2.0)';

  if (target) {
    target.style.transition = 'transform 0.22s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.20s ease-out, filter 0.20s ease-out';
    target.style.transform = 'scaleY(0.002) scaleX(1.0)';
    target.style.opacity = '0.5';
    target.style.filter = 'brightness(5.0) contrast(4.0)';
  }

  await new Promise(r => setTimeout(r, 220));

  // --- Step 3: Horizontal Pinch into Central Phosphor Dot (490ms - 630ms) ---
  beam.style.transition = 'transform 0.14s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.14s ease-out';
  beam.style.transform = 'scaleX(0.003) scaleY(3.0)';

  if (target) {
    target.style.transform = 'scaleY(0.002) scaleX(0.001)';
    target.style.opacity = '0';
  }

  await new Promise(r => setTimeout(r, 140));

  // --- Step 4: Dying Phosphor Dot Fade into Silent Darkness (630ms - 850ms) ---
  beam.style.opacity = '0';
  dot.style.opacity = '1';
  dot.style.transform = 'scale(1)';

  await new Promise(r => setTimeout(r, 30));

  dot.style.transition = 'opacity 0.22s ease-out, transform 0.22s ease-out';
  dot.style.opacity = '0';
  dot.style.transform = 'scale(0.15)';

  await new Promise(r => setTimeout(r, 220));

  // Total extinction blackout
  if (target) {
    target.style.transform = 'scale(0)';
    target.style.opacity = '0';
  }

  // Return clean reawakening / restoration handler
  return () => {
    return new Promise<void>(resolve => {
      // Dawn reawakening: central morning light slit expands
      beam.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out';
      beam.style.transform = 'scaleX(0.92) scaleY(1.0)';
      beam.style.boxShadow = '0 0 35px 8px rgba(220, 240, 255, 0.85), 0 0 90px 25px rgba(180, 220, 255, 0.45)';
      beam.style.opacity = '0.92';

      setTimeout(() => {
        // Page gently expands from morning light with softening fade
        if (target) {
          target.style.transition = 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.0s ease-out, filter 1.0s ease-out';
          target.style.transform = 'scale(1)';
          target.style.opacity = '1';
          target.style.filter = 'blur(0px) brightness(1.0) contrast(1.0)';
        }

        // Fade out overlay & beam
        overlay.style.transition = 'opacity 1.0s ease-out';
        overlay.style.opacity = '0';

        setTimeout(() => {
          overlay.remove();
          if (target) {
            target.style.transition = '';
            target.style.transform = '';
            target.style.opacity = '';
            target.style.filter = '';
            target.style.transformOrigin = '';
          }
          resolve();
        }, 1050);
      }, 250);
    });
  };
}
