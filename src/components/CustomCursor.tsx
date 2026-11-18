import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
      return;
    }

    const el = cursorRef.current;
    if (!el) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let visible = false;
    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        currentX = targetX;
        currentY = targetY;
        el.classList.add('is-visible');
      }

      const target = e.target as HTMLElement | null;
      const cardHit = target?.closest('[data-cursor="card"]');
      const interactiveHit = target?.closest('a, button, input, textarea, [data-cursor="hover"]');

      if (cardHit) {
        el.classList.add('is-card');
        el.classList.remove('is-hover');
      } else if (interactiveHit) {
        el.classList.add('is-hover');
        el.classList.remove('is-card');
      } else {
        el.classList.remove('is-hover', 'is-card');
      }
    };

    const onPointerLeave = () => {
      visible = false;
      el.classList.remove('is-visible');
    };

    const render = () => {
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;
      const offset = el.classList.contains('is-card')
        ? 29
        : el.classList.contains('is-hover')
          ? 22
          : 9;
      el.style.transform = `translate3d(${(currentX - offset).toFixed(2)}px, ${(currentY - offset).toFixed(2)}px, 0)`;
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={cursorRef} className="custom-cursor" aria-hidden="true" />;
}
