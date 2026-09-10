/**
 * Rain World Signal Extinction & Dawn Reawakening Animation
 * Completely authentic vintage CRT monitor collapse:
 * 1. Multi-band horizontal slice tearing with H-sync dislocation
 * 2. RGB phosphor chromatic aberration (red/cyan channel divergence)
 * 3. CRT scanlines and rolling vertical hum bar
 * 4. Authentic raster vertical/horizontal compression into blackness without any white highlight lines
 * 5. Organic dawn reawakening
 */
export async function triggerShatterEffect(): Promise<() => void> {
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

  // CRT fine raster scanlines
  const scanlines = document.createElement('div');
  scanlines.style.position = 'absolute';
  scanlines.style.inset = '0';
  scanlines.style.pointerEvents = 'none';
  scanlines.style.background = 'repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0.45) 2px, rgba(0, 0, 0, 0.45) 3px)';
  scanlines.style.opacity = '0.85';
  scanlines.style.mixBlendMode = 'multiply';
  overlay.appendChild(scanlines);

  // CRT tube curvature vignette
  const vignette = document.createElement('div');
  vignette.style.position = 'absolute';
  vignette.style.inset = '0';
  vignette.style.pointerEvents = 'none';
  vignette.style.background = 'radial-gradient(circle at 50% 50%, transparent 62%, rgba(0, 0, 0, 0.75) 100%)';
  overlay.appendChild(vignette);

  // Rolling CRT field sync hum bar (dark scan band that rolls down the monitor)
  const humBar = document.createElement('div');
  humBar.style.position = 'absolute';
  humBar.style.left = '0';
  humBar.style.width = '100%';
  humBar.style.height = '140px';
  humBar.style.pointerEvents = 'none';
  humBar.style.background = 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.45) 50%, transparent)';
  humBar.style.top = '-140px';
  humBar.style.transition = 'top 0.28s linear';
  overlay.appendChild(humBar);

  // CRT rolling static canvas
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.style.position = 'absolute';
  noiseCanvas.style.inset = '0';
  noiseCanvas.style.width = '100%';
  noiseCanvas.style.height = '100%';
  noiseCanvas.style.pointerEvents = 'none';
  noiseCanvas.style.mixBlendMode = 'screen';
  noiseCanvas.style.opacity = '0.28';
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
      if (Math.random() < 0.18) {
        const val = (Math.random() * 255) | 0;
        buf[i] = (35 << 24) | (val << 16) | (val << 8) | val;
      }
    }
    nCtx.putImageData(imgData, 0, 0);

    // Occasional horizontal glitch static band
    if (Math.random() < 0.55) {
      const barY = Math.random() * nH;
      const barH = Math.random() * 16 + 4;
      nCtx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      nCtx.fillRect(0, barY, nW, barH);
    }

    requestAnimationFrame(renderNoise);
  };
  requestAnimationFrame(renderNoise);

  // Trigger hum bar downward roll
  requestAnimationFrame(() => {
    humBar.style.top = '100vh';
  });

  // Multi-band horizontal slice tearing container (NO white borders, pure screen content)
  const tearContainer = document.createElement('div');
  tearContainer.style.position = 'fixed';
  tearContainer.style.inset = '0';
  tearContainer.style.pointerEvents = 'none';
  tearContainer.style.overflow = 'hidden';
  overlay.appendChild(tearContainer);

  const sliceWrappers: HTMLElement[] = [];
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const viewportH = window.innerHeight;

  // 4 horizontal scan slices covering 100% of the screen
  let currentBands = [
    { top: 0, bottom: 26 },
    { top: 26, bottom: 48 },
    { top: 48, bottom: 74 },
    { top: 74, bottom: 100 }
  ];

  try {
    if (target) {
      for (let i = 0; i < currentBands.length; i++) {
        const band = currentBands[i];
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.inset = '0';
        wrapper.style.overflow = 'hidden';
        wrapper.style.clipPath = `polygon(0% ${band.top}%, 100% ${band.top}%, 100% ${band.bottom}%, 0% ${band.bottom}%)`;
        wrapper.style.willChange = 'transform, filter, opacity';

        const clone = target.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.top = `-${scrollY}px`;
        clone.style.left = '0';
        clone.style.width = `${target.offsetWidth}px`;
        clone.style.margin = '0';
        clone.style.pointerEvents = 'none';
        clone.style.userSelect = 'none';

        wrapper.appendChild(clone);
        tearContainer.appendChild(wrapper);
        sliceWrappers.push(wrapper);
      }

      // Hide original target while tear slices animate the page
      target.style.opacity = '0';
    }
  } catch (e) {
    console.error('Failed to setup CRT tearing slices:', e);
  }

  // --- Step 1: Authentic Old CRT Screen Tearing (0 - 280ms) ---
  // Frame 1A (0 - 65ms): Initial horizontal hold slip + chromatic separation
  if (sliceWrappers.length === 4) {
    sliceWrappers[0].style.transform = 'translateX(-32px)';
    sliceWrappers[0].style.filter = 'drop-shadow(-8px 0 0 rgba(255, 30, 80, 0.85)) contrast(1.4)';

    sliceWrappers[1].style.transform = 'translateX(42px)';
    sliceWrappers[1].style.filter = 'drop-shadow(8px 0 0 rgba(0, 230, 255, 0.85)) contrast(1.4)';

    sliceWrappers[2].style.transform = 'translateX(-48px)';
    sliceWrappers[2].style.filter = 'drop-shadow(-10px 0 0 rgba(255, 30, 80, 0.85)) contrast(1.4)';

    sliceWrappers[3].style.transform = 'translateX(36px)';
    sliceWrappers[3].style.filter = 'drop-shadow(10px 0 0 rgba(0, 230, 255, 0.85)) contrast(1.4)';
  }
  await new Promise(r => setTimeout(r, 65));

  // Frame 1B (65 - 135ms): Slices re-divide at different vertical heights with reverse slip & jitter
  currentBands = [
    { top: 0, bottom: 38 },
    { top: 38, bottom: 60 },
    { top: 60, bottom: 82 },
    { top: 82, bottom: 100 }
  ];
  if (sliceWrappers.length === 4) {
    sliceWrappers[0].style.clipPath = `polygon(0% ${currentBands[0].top}%, 100% ${currentBands[0].top}%, 100% ${currentBands[0].bottom}%, 0% ${currentBands[0].bottom}%)`;
    sliceWrappers[0].style.transform = 'translateX(55px) translateY(3px)';
    sliceWrappers[0].style.filter = 'drop-shadow(12px 0 0 rgba(0, 230, 255, 0.9)) contrast(1.8) brightness(1.2)';

    sliceWrappers[1].style.clipPath = `polygon(0% ${currentBands[1].top}%, 100% ${currentBands[1].top}%, 100% ${currentBands[1].bottom}%, 0% ${currentBands[1].bottom}%)`;
    sliceWrappers[1].style.transform = 'translateX(-65px) translateY(-3px)';
    sliceWrappers[1].style.filter = 'drop-shadow(-12px 0 0 rgba(255, 30, 80, 0.9)) contrast(1.8) brightness(1.2)';

    sliceWrappers[2].style.clipPath = `polygon(0% ${currentBands[2].top}%, 100% ${currentBands[2].top}%, 100% ${currentBands[2].bottom}%, 0% ${currentBands[2].bottom}%)`;
    sliceWrappers[2].style.transform = 'translateX(70px) translateY(4px)';
    sliceWrappers[2].style.filter = 'drop-shadow(14px 0 0 rgba(0, 230, 255, 0.9)) contrast(1.8) brightness(1.2)';

    sliceWrappers[3].style.clipPath = `polygon(0% ${currentBands[3].top}%, 100% ${currentBands[3].top}%, 100% ${currentBands[3].bottom}%, 0% ${currentBands[3].bottom}%)`;
    sliceWrappers[3].style.transform = 'translateX(-50px) translateY(-2px)';
    sliceWrappers[3].style.filter = 'drop-shadow(-14px 0 0 rgba(255, 30, 80, 0.9)) contrast(1.8) brightness(1.2)';
  }
  await new Promise(r => setTimeout(r, 70));

  // Frame 1C (135 - 215ms): Major deflection loss, extreme chromatic shear
  currentBands = [
    { top: 0, bottom: 20 },
    { top: 20, bottom: 52 },
    { top: 52, bottom: 78 },
    { top: 78, bottom: 100 }
  ];
  if (sliceWrappers.length === 4) {
    sliceWrappers[0].style.clipPath = `polygon(0% ${currentBands[0].top}%, 100% ${currentBands[0].top}%, 100% ${currentBands[0].bottom}%, 0% ${currentBands[0].bottom}%)`;
    sliceWrappers[0].style.transform = 'translateX(-95px)';
    sliceWrappers[0].style.filter = 'drop-shadow(-18px 0 0 rgba(255, 30, 80, 0.95)) contrast(2.2) brightness(1.35)';

    sliceWrappers[1].style.clipPath = `polygon(0% ${currentBands[1].top}%, 100% ${currentBands[1].top}%, 100% ${currentBands[1].bottom}%, 0% ${currentBands[1].bottom}%)`;
    sliceWrappers[1].style.transform = 'translateX(110px)';
    sliceWrappers[1].style.filter = 'drop-shadow(18px 0 0 rgba(0, 230, 255, 0.95)) contrast(2.2) brightness(1.35)';

    sliceWrappers[2].style.clipPath = `polygon(0% ${currentBands[2].top}%, 100% ${currentBands[2].top}%, 100% ${currentBands[2].bottom}%, 0% ${currentBands[2].bottom}%)`;
    sliceWrappers[2].style.transform = 'translateX(-120px)';
    sliceWrappers[2].style.filter = 'drop-shadow(-22px 0 0 rgba(255, 30, 80, 0.95)) contrast(2.2) brightness(1.35)';

    sliceWrappers[3].style.clipPath = `polygon(0% ${currentBands[3].top}%, 100% ${currentBands[3].top}%, 100% ${currentBands[3].bottom}%, 0% ${currentBands[3].bottom}%)`;
    sliceWrappers[3].style.transform = 'translateX(100px)';
    sliceWrappers[3].style.filter = 'drop-shadow(22px 0 0 rgba(0, 230, 255, 0.95)) contrast(2.2) brightness(1.35)';
  }
  await new Promise(r => setTimeout(r, 80));

  // Frame 1D (215 - 280ms): High-frequency voltage fluctuation before raster collapse
  if (sliceWrappers.length === 4) {
    sliceWrappers[0].style.transform = 'translateX(35px) scaleY(0.95)';
    sliceWrappers[1].style.transform = 'translateX(-40px) scaleY(0.95)';
    sliceWrappers[2].style.transform = 'translateX(45px) scaleY(0.95)';
    sliceWrappers[3].style.transform = 'translateX(-30px) scaleY(0.95)';
  }
  await new Promise(r => setTimeout(r, 65));

  // --- Step 2: Vintage CRT Raster Collapse (NO white highlight lines) ---
  noiseActive = false;
  noiseCanvas.remove();
  overlay.style.backgroundColor = '#000000';

  // Slices implode into horizontal center midline of the monitor
  sliceWrappers.forEach((wrapper, idx) => {
    const band = currentBands[idx];
    const midY = (band.top + band.bottom) / 2;
    const dy = (50 - midY) * (viewportH / 100);
    wrapper.style.transition = 'transform 0.20s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.18s ease-out';
    wrapper.style.transform = `translateY(${dy}px) scaleY(0.003) scaleX(1.0)`;
    wrapper.style.opacity = '0.75';
    wrapper.style.filter = 'contrast(2.0) brightness(1.6)';
  });

  await new Promise(r => setTimeout(r, 200));

  // --- Step 3: Horizontal Raster Pinch & Blackout (NO white line, pure content collapse) ---
  sliceWrappers.forEach((wrapper, idx) => {
    const band = currentBands[idx];
    const midY = (band.top + band.bottom) / 2;
    const dy = (50 - midY) * (viewportH / 100);
    wrapper.style.transition = 'transform 0.14s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.14s ease-out';
    wrapper.style.transform = `translateY(${dy}px) scaleY(0.003) scaleX(0.002)`;
    wrapper.style.opacity = '0';
  });

  await new Promise(r => setTimeout(r, 140));

  // Clean up tear slice elements
  tearContainer.remove();

  // Full extinction into silent blackness
  if (target) {
    target.style.transform = 'scale(0)';
    target.style.opacity = '0';
  }

  // --- Step 4: Organic Dawn Reawakening (NO white lines) ---
  return () => {
    return new Promise<void>(resolve => {
      // Fade out black overlay
      overlay.style.transition = 'opacity 0.85s ease-out';
      overlay.style.opacity = '0';

      // Page smoothly expands back from center like monitor powering back on
      if (target) {
        target.style.transition = 'transform 0.95s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.85s ease-out';
        target.style.transform = 'scale(1)';
        target.style.opacity = '1';
        target.style.filter = 'none';
        target.style.transformOrigin = 'center center';
      }

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
      }, 900);
    });
  };
}
