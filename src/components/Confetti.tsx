import { useEffect, useRef } from 'react';

const COLORS = ['#f1ecce', '#9fc2cc', '#1b5299', '#f4b942', '#e8735c'];
const PIECE_COUNT = 140;
const GRAVITY = 0.16;
const DRAG = 0.005;
const FALL_DURATION_MS = 3200;
const FADE_DURATION_MS = 600;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
};

function createPiece(width: number): Piece {
  return {
    x: Math.random() * width,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 6,
    vy: 2 + Math.random() * 3,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    width: 6 + Math.random() * 6,
    height: 10 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

/**
 * A one-shot confetti burst, fired once on mount. Renders nothing when the
 * visitor prefers reduced motion. The canvas removes itself from the DOM once
 * the burst has fully faded, rather than lingering as an empty overlay.
 */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const pieces = Array.from({ length: PIECE_COUNT }, () => createPiece(canvas.width));
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const fadeStart = FALL_DURATION_MS - FADE_DURATION_MS;
      const alpha = elapsed <= fadeStart ? 1 : Math.max(0, 1 - (elapsed - fadeStart) / FADE_DURATION_MS);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (elapsed >= FALL_DURATION_MS) {
        canvas.remove();
        return;
      }

      ctx.globalAlpha = alpha;
      for (const piece of pieces) {
        piece.vy += GRAVITY;
        piece.vx *= 1 - DRAG;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        ctx.restore();
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
