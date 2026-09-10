import { ref } from 'vue';

export interface SpatialCardOptions {
  maxRotation?: number; // max tilt degrees (e.g. 12)
  depth?: number;       // translateZ in px (e.g. 25)
  perspective?: number; // perspective in px (e.g. 1000)
}

export function useSpatialCard(options: SpatialCardOptions = {}) {
  const maxRotation = options.maxRotation ?? 10;
  const depth = options.depth ?? 18;
  const perspective = options.perspective ?? 1000;

  const cardTransform = ref('');
  const shineStyle = ref({
    background: 'none',
    opacity: 0
  });

  const onMouseMove = (e: MouseEvent) => {
    const card = e.currentTarget as HTMLElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = x / rect.width;
    const yPct = y / rect.height;

    const rotateX = (0.5 - yPct) * maxRotation;
    const rotateY = (xPct - 0.5) * maxRotation;

    cardTransform.value = `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(${depth}px)`;

    // Specular shine gradient
    shineStyle.value = {
      background: `radial-gradient(circle at ${xPct * 100}% ${yPct * 100}%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)`,
      opacity: 1
    };
  };

  const onMouseLeave = () => {
    cardTransform.value = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    shineStyle.value = {
      background: 'none',
      opacity: 0
    };
  };

  return {
    cardTransform,
    shineStyle,
    onMouseMove,
    onMouseLeave
  };
}
