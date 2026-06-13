export async function triggerShatterEffect(): Promise<() => void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.zIndex = '2147483647';
  container.style.pointerEvents = 'none';
  container.style.perspective = '1500px';
  container.style.overflow = 'hidden';
  
  document.body.appendChild(container);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const cx = W / 2 + (Math.random() - 0.5) * 200;
  const cy = H / 2 + (Math.random() - 0.5) * 200;

  const edgePoints = [
    { x: 0, y: 0 },
    { x: W * 0.3 + Math.random() * 100, y: 0 },
    { x: W * 0.7 + Math.random() * 100, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H * 0.3 + Math.random() * 100 },
    { x: W, y: H * 0.7 + Math.random() * 100 },
    { x: W, y: H },
    { x: W * 0.7 + Math.random() * 100, y: H },
    { x: W * 0.3 + Math.random() * 100, y: H },
    { x: 0, y: H },
    { x: 0, y: H * 0.7 + Math.random() * 100 },
    { x: 0, y: H * 0.3 + Math.random() * 100 }
  ];

  // Make the app root physically drop away into the void
  const appRoot = document.querySelector('.app-root') as HTMLElement | null;
  if (appRoot) {
    appRoot.style.transition = 'transform 2.5s cubic-bezier(0.5, 0, 0.1, 1), opacity 2s ease-in, filter 2s';
    appRoot.style.transformOrigin = 'bottom center';
    appRoot.style.transform = `perspective(1000px) translateZ(-800px) translateY(100vh) rotateX(60deg) rotateY(${Math.random() * 20 - 10}deg)`;
    appRoot.style.opacity = '0';
    appRoot.style.filter = 'brightness(0) blur(10px)';
  }

  // Generate pure CSS glass shards using backdrop-filter
  for (let i = 0; i < edgePoints.length; i++) {
    const p1 = edgePoints[i];
    const p2 = edgePoints[(i + 1) % edgePoints.length];
    
    const shard = document.createElement('div');
    shard.style.position = 'absolute';
    shard.style.inset = '-20%'; // extend beyond screen
    
    // Create a polygon that forms a triangle from center to the two edge points
    // Clip path uses percentages relative to inset size. We calculate based on window dimensions
    const toPctX = (px: number) => ((px + W * 0.2) / (W * 1.4) * 100).toFixed(2) + '%';
    const toPctY = (px: number) => ((px + H * 0.2) / (H * 1.4) * 100).toFixed(2) + '%';
    
    shard.style.clipPath = `polygon(${toPctX(cx)} ${toPctY(cy)}, ${toPctX(p1.x)} ${toPctY(p1.y)}, ${toPctX(p2.x)} ${toPctY(p2.y)})`;
    
    // Shattered glass effect
    shard.style.backdropFilter = `contrast(${1.5 + Math.random()}) brightness(${Math.random() > 0.5 ? 1.2 : 0.8}) blur(${Math.random() * 4}px) hue-rotate(${Math.random() * 30 - 15}deg)`;
    shard.style.backgroundColor = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
    shard.style.border = '1px solid rgba(255,255,255,0.2)'; // slight edge gleam
    
    // Animate exploding outwards
    const tx = (Math.random() - 0.5) * 1000;
    const ty = Math.random() * 800 + 400; // fall down
    const tz = (Math.random() - 0.5) * 1000;
    const rx = (Math.random() - 0.5) * 360;
    const ry = (Math.random() - 0.5) * 360;
    const rz = (Math.random() - 0.5) * 180;
    
    container.appendChild(shard);
    
    shard.animate([
      { transform: `translate3d(0,0,0) rotateX(0) rotateY(0) rotateZ(0)`, opacity: 1 },
      { transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`, opacity: 0 }
    ], {
      duration: 2500 + Math.random() * 1000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });
  }

  // Flash bang effect
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.inset = '0';
  flash.style.backgroundColor = 'white';
  flash.style.pointerEvents = 'none';
  flash.style.zIndex = '2147483647';
  document.body.appendChild(flash);
  
  flash.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], { duration: 300, easing: 'ease-out', fill: 'forwards' });

  return () => {
    container.remove();
    flash.remove();
    if (appRoot) {
      appRoot.style.transition = '';
      appRoot.style.transform = '';
      appRoot.style.opacity = '';
      appRoot.style.filter = '';
    }
  };
}
