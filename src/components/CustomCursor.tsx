import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
      return;
    }

    const el = cursorRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!el || !dot) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let lastX = -100;
    let lastY = -100;

    let dotX = -100;
    let dotY = -100;

    let angle = 0;
    let stretch = 0;
    let isPressed = false;
    let isHover = false;
    let isCard = false;
    let isVisible = false;

    let magneticX: number | null = null;
    let magneticY: number | null = null;

    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
        lastX = targetX;
        lastY = targetY;
        dotX = targetX;
        dotY = targetY;
        el.classList.add('is-visible');
        dot.classList.add('is-visible');
      }

      const target = e.target as HTMLElement | null;
      const cardHit = target?.closest('[data-cursor="card"]');
      const interactiveHit = target?.closest('a, button, input, textarea, select, [data-cursor="hover"]');

      isCard = !!cardHit;
      isHover = !cardHit && !!interactiveHit;

      if (isCard) {
        el.classList.add('is-card');
        el.classList.remove('is-hover');
        dot.classList.add('is-hidden');
        if (label) label.textContent = 'EXPLORE';
        magneticX = null;
        magneticY = null;
      } else if (isHover) {
        el.classList.add('is-hover');
        el.classList.remove('is-card');
        dot.classList.add('is-hidden');
        if (label) label.textContent = '';

        // Subtle magnetic pull toward button center if nearby
        if (interactiveHit) {
          const rect = (interactiveHit as HTMLElement).getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const dist = Math.hypot(targetX - centerX, targetY - centerY);
          if (dist < Math.max(rect.width, rect.height, 48) * 0.75) {
            magneticX = centerX;
            magneticY = centerY;
          } else {
            magneticX = null;
            magneticY = null;
          }
        }
      } else {
        el.classList.remove('is-hover', 'is-card');
        dot.classList.remove('is-hidden');
        if (label) label.textContent = '';
        magneticX = null;
        magneticY = null;
      }
    };

    const onPointerDown = () => {
      isPressed = true;
    };

    const onPointerUp = () => {
      isPressed = false;
    };

    const onPointerLeave = () => {
      isVisible = false;
      el.classList.remove('is-visible');
      dot.classList.remove('is-visible');
    };

    const render = () => {
      // Effective target incorporating magnetic elasticity
      const destX = magneticX !== null ? magneticX * 0.42 + targetX * 0.58 : targetX;
      const destY = magneticY !== null ? magneticY * 0.42 + targetY * 0.58 : targetY;

      // Smooth organic spring lerp
      currentX += (destX - currentX) * 0.28;
      currentY += (destY - currentY) * 0.28;

      // Velocity & direction vector calculation
      const vx = currentX - lastX;
      const vy = currentY - lastY;
      lastX = currentX;
      lastY = currentY;

      const speed = Math.hypot(vx, vy);

      if (speed > 0.4) {
        angle = Math.atan2(vy, vx);
      }

      // Dynamic liquid squash & stretch along movement direction (suppressed on cards/hover)
      const targetStretch = isHover || isCard ? 0 : Math.min(speed * 0.042, 0.58);
      stretch += (targetStretch - stretch) * 0.24;

      const baseScale = isPressed ? 0.78 : 1.0;
      const scaleX = (baseScale * (1 + stretch)).toFixed(3);
      const scaleY = (baseScale * (1 / (1 + stretch * 0.65))).toFixed(3);
      const rot = angle.toFixed(3);

      el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${rot}rad) scale(${scaleX}, ${scaleY})`;

      // Pinpoint center dot tracks tightly (0.85) for 100% click precision
      dotX += (targetX - dotX) * 0.85;
      dotY += (targetY - dotY) * 0.85;
      dot.style.transform = `translate3d(${dotX.toFixed(2)}px, ${dotY.toFixed(2)}px, 0) translate(-50%, -50%)`;

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('mouseleave', onPointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" aria-hidden="true">
        <span ref={labelRef} className="custom-cursor__label" />
      </div>
      <div ref={dotRef} className="custom-cursor__dot" aria-hidden="true" />
    </>
  );
}
