/**
 * Rain World Signal Extinction & Dawn Reawakening Animation
 * Simulates violent horizontal slice tearing, chromatic RGB dislocation, and CRT power-down cutoff into darkness,
 * followed by gentle morning light reawakening.
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

  // Central CRT horizontal beam
  const beam = document.createElement('div');
  beam.style.position = 'absolute';
  beam.style.top = '50%';
  beam.style.left = '0';
  beam.style.width = '100%';
  beam.style.height = '3px';
  beam.style.backgroundColor = '#ffffff';
  beam.style.boxShadow = '0 0 28px 8px rgba(255, 255, 255, 0.95), 0 0 90px 20px rgba(0, 240, 255, 0.8)';
  beam.style.transform = 'scaleX(0) scaleY(1)';
  beam.style.opacity = '0';
  beam.style.transformOrigin = 'center center';
  overlay.appendChild(beam);

  // Signal tear white strobe
  const strobe = document.createElement('div');
  strobe.style.position = 'absolute';
  strobe.style.inset = '0';
  strobe.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
  strobe.style.opacity = '0';
  strobe.style.pointerEvents = 'none';
  overlay.appendChild(strobe);

  // Slice container for horizontal tearing
  const sliceContainer = document.createElement('div');
  sliceContainer.style.position = 'fixed';
  sliceContainer.style.inset = '0';
  sliceContainer.style.pointerEvents = 'none';
  sliceContainer.style.overflow = 'hidden';
  overlay.appendChild(sliceContainer);

  const sliceBands = [
    { top: 0, bottom: 13 },
    { top: 13, bottom: 25 },
    { top: 25, bottom: 39 },
    { top: 39, bottom: 53 },
    { top: 53, bottom: 67 },
    { top: 67, bottom: 81 },
    { top: 81, bottom: 92 },
    { top: 92, bottom: 100 }
  ];

  const sliceWrappers: HTMLElement[] = [];
  const seams: HTMLElement[] = [];
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const viewportH = window.innerHeight;

  try {
    if (target) {
      for (let i = 0; i < sliceBands.length; i++) {
        const band = sliceBands[i];
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
        sliceContainer.appendChild(wrapper);
        sliceWrappers.push(wrapper);

        // Fracture seam line
        if (i > 0) {
          const seam = document.createElement('div');
          seam.style.position = 'absolute';
          seam.style.top = `${band.top}%`;
          seam.style.left = '-10%';
          seam.style.width = '120%';
          seam.style.height = '2px';
          seam.style.background = i % 2 === 0
            ? 'linear-gradient(90deg, transparent, #00f0ff, #ffffff, #00f0ff, transparent)'
            : 'linear-gradient(90deg, transparent, #ff0055, #ffffff, #ff0055, transparent)';
          seam.style.boxShadow = i % 2 === 0 ? '0 0 10px 2px #00f0ff' : '0 0 10px 2px #ff0055';
          seam.style.opacity = '0';
          seam.style.willChange = 'opacity, transform';
          sliceContainer.appendChild(seam);
          seams.push(seam);
        }
      }

      // Hide original target while slices represent the page
      target.style.opacity = '0';
    }
  } catch (e) {
    console.error('Failed to create tearing slices:', e);
  }

  // --- Step 1: Violent Fracture & Horizontal Slice Jitter (0 - 150ms) ---
  // Frame 1A (0 - 45ms): Initial fracture rupture with chromatic split
  strobe.style.opacity = '0.7';
  seams.forEach(s => (s.style.opacity = '0.9'));

  sliceWrappers.forEach((w, idx) => {
    const dir = idx % 2 === 0 ? 1 : -1;
    const dist = (35 + (idx * 11) % 45) * dir;
    const skew = (3.5 + (idx % 3) * 2) * dir;
    w.style.transform = `translateX(${dist}px) skewX(${skew}deg)`;
    w.style.filter = dir > 0
      ? 'drop-shadow(10px 0 0 rgba(0, 240, 255, 0.85)) brightness(1.5)'
      : 'drop-shadow(-10px 0 0 rgba(255, 0, 85, 0.85)) brightness(1.5)';
  });

  await new Promise(r => setTimeout(r, 45));

  // Frame 1B (45 - 95ms): Violent reversal and electrical glitch spike
  strobe.style.opacity = '0.15';
  sliceWrappers.forEach((w, idx) => {
    const dir = idx % 2 === 0 ? -1 : 1;
    const dist = (55 + (idx * 13) % 55) * dir;
    const skew = (5.0 + (idx % 3) * 2.5) * dir;
    w.style.transform = `translateX(${dist}px) skewX(${skew}deg)`;
    w.style.filter = 'contrast(2.8) brightness(2.2) invert(0.6)';
  });

  await new Promise(r => setTimeout(r, 50));

  // Frame 1C (95 - 150ms): Peak dislocation right before implosion
  strobe.style.opacity = '0.4';
  sliceWrappers.forEach((w, idx) => {
    const dir = idx % 2 === 0 ? 1 : -1;
    const dist = (80 + (idx * 15) % 65) * dir;
    const skew = (6.0 + (idx % 4) * 2) * dir;
    w.style.transform = `translateX(${dist}px) skewX(${skew}deg)`;
    w.style.filter = dir > 0
      ? 'drop-shadow(14px 0 0 rgba(0, 240, 255, 0.95)) brightness(2.0)'
      : 'drop-shadow(-14px 0 0 rgba(255, 0, 85, 0.95)) brightness(2.0)';
  });

  await new Promise(r => setTimeout(r, 55));

  // --- Step 2: CRT Collapse Implosion (150ms - 370ms) ---
  strobe.style.opacity = '0';
  overlay.style.backgroundColor = '#000000';
  beam.style.opacity = '1';
  beam.style.transform = 'scaleX(1) scaleY(1.8)';

  // Slices implode into horizontal center midline
  sliceWrappers.forEach((w, idx) => {
    const band = sliceBands[idx];
    const midY = (band.top + band.bottom) / 2;
    const dy = (50 - midY) * (viewportH / 100);
    w.style.transition = 'transform 0.22s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.20s ease-out';
    w.style.transform = `translateY(${dy}px) scaleY(0.005) scaleX(1.0)`;
    w.style.opacity = '0.3';
  });
  seams.forEach(s => {
    s.style.transition = 'opacity 0.15s ease-out';
    s.style.opacity = '0';
  });

  await new Promise(r => setTimeout(r, 220));

  // Clean up slices after implosion
  sliceContainer.remove();

  // --- Step 3: Horizontal Snap into Central Pinpoint (370ms - 500ms) ---
  beam.style.transition = 'transform 0.13s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.13s ease-out';
  beam.style.transform = 'scaleX(0.002) scaleY(2.5)';

  await new Promise(r => setTimeout(r, 130));

  // Full extinction into silent blackness
  beam.style.opacity = '0';
  if (target) {
    target.style.transform = 'scale(0)';
    target.style.opacity = '0';
  }

  // Return clean reawakening / restoration handler
  return () => {
    return new Promise<void>(resolve => {
      // Dawn reawakening: central morning light slit expands
      beam.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out';
      beam.style.transform = 'scaleX(0.85) scaleY(1.0)';
      beam.style.boxShadow = '0 0 35px 8px rgba(220, 240, 255, 0.85), 0 0 90px 25px rgba(180, 220, 255, 0.45)';
      beam.style.opacity = '0.9';

      setTimeout(() => {
        // Page gently expands from morning light with softening fade
        if (target) {
          target.style.transition = 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.1s ease-out, filter 1.1s ease-out';
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
