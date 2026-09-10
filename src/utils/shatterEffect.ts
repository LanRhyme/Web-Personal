/**
 * Rain World Signal Extinction & Dawn Reawakening Animation
 * Simulates CRT power-off cutoff into darkness, followed by gentle morning light reawakening
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
  beam.style.boxShadow = '0 0 24px 6px rgba(255, 255, 255, 0.95), 0 0 80px 16px rgba(180, 220, 255, 0.7)';
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

  // Step 1: Pre-collapse signal glitch flash (50ms)
  strobe.style.opacity = '0.65';
  await new Promise(r => setTimeout(r, 50));
  strobe.style.opacity = '0';
  await new Promise(r => setTimeout(r, 30));

  // Step 2: CRT vertical collapse into horizontal razor slit (220ms)
  overlay.style.backgroundColor = '#000000';
  beam.style.opacity = '1';
  beam.style.transform = 'scaleX(1) scaleY(1.5)';

  if (target) {
    target.style.transition = 'transform 0.22s cubic-bezier(0.7, 0, 0.84, 0), filter 0.22s ease-out, opacity 0.22s ease-out';
    target.style.transformOrigin = 'center center';
    target.style.transform = 'scaleY(0.003) scaleX(1.0)';
    target.style.filter = 'brightness(3.0) contrast(2.5)';
  }

  await new Promise(r => setTimeout(r, 220));

  // Step 3: Horizontal snap into central pinpoint (130ms)
  beam.style.transition = 'transform 0.13s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.13s ease-out';
  beam.style.transform = 'scaleX(0.002) scaleY(2.5)';

  if (target) {
    target.style.transition = 'transform 0.13s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.13s ease-out';
    target.style.transform = 'scaleY(0.003) scaleX(0.002)';
    target.style.opacity = '0';
  }

  await new Promise(r => setTimeout(r, 130));

  // Step 4: Full extinction into silent blackness
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
