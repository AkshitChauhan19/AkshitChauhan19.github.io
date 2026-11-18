import { useEffect, useState } from 'react';
import { PERSONAL_INFO } from '../data/portfolio';

interface PreloaderProps {
  onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [percent, setPercent] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 920; // Fast & crisp (~0.9s instead of multi-second blocking load)
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(eased * 100);
      setPercent(val);

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => {
          setExiting(true);
          window.setTimeout(onComplete, 620);
        }, 140);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  const padded = String(percent).padStart(3, '0').split('').join(' ');

  return (
    <div className={`preloader ${exiting ? 'is-exit' : ''}`} aria-hidden={exiting}>
      <div className="preloader__center">
        <span className="preloader__name">{PERSONAL_INFO.fullName}</span>
        <span className="preloader__divider" />
        <span className="preloader__role">
          {PERSONAL_INFO.headline}
          <span className="preloader__asterisk" aria-hidden="true">
            {' '}
            ✳
          </span>
        </span>
      </div>
      <div className="preloader__percent">{padded} %</div>
    </div>
  );
}
