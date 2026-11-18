import { useCallback, useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data/portfolio';
import { ChromaticShaderCanvas } from '../components/ChromaticShaderCanvas';
import { soundEngine } from '../utils/sound';

interface WorkPageProps {
  onNavigate: (path: string) => void;
}

export function WorkPage({ onNavigate }: WorkPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Smooth spring-lerped horizontal offset state stored in refs for zero-React-re-render 120fps motion
  const currentOffsetRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const velocityRef = useRef(0);
  const stepWidthRef = useRef(560);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartTargetRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const activeIndexRef = useRef(0);

  const measureGeometry = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const firstCard = track.querySelector<HTMLElement>('.work-card');
    if (!firstCard) return;

    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || '48') || 48;
    const cardWidth = firstCard.offsetWidth;
    stepWidthRef.current = cardWidth + gap;

    // Snap target cleanly to active index on resize
    targetOffsetRef.current = activeIndexRef.current * stepWidthRef.current;
    currentOffsetRef.current = targetOffsetRef.current;
  }, []);

  const goToIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(PROJECTS.length - 1, idx));
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
    targetOffsetRef.current = clamped * stepWidthRef.current;
  }, []);

  useEffect(() => {
    measureGeometry();
    window.addEventListener('resize', measureGeometry, { passive: true });

    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      const prev = currentOffsetRef.current;
      currentOffsetRef.current += (targetOffsetRef.current - currentOffsetRef.current) * 0.1;
      velocityRef.current = currentOffsetRef.current - prev;

      const firstCard = track.querySelector<HTMLElement>('.work-card');
      const cardWidth = firstCard ? firstCard.offsetWidth : 500;
      const centerShift = viewport.clientWidth / 2 - cardWidth / 2;
      const x = centerShift - currentOffsetRef.current;

      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

      // Sync active index dynamically while scrolling/dragging
      const step = Math.max(stepWidthRef.current, 1);
      const nearest = Math.max(
        0,
        Math.min(PROJECTS.length - 1, Math.round(currentOffsetRef.current / step))
      );
      if (nearest !== activeIndexRef.current) {
        activeIndexRef.current = nearest;
        setActiveIndex(nearest);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', measureGeometry);
    };
  }, [measureGeometry]);

  // Wheel & keyboard navigation
  useEffect(() => {
    let snapTimer: number | null = null;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const maxOffset = (PROJECTS.length - 1) * stepWidthRef.current;
      targetOffsetRef.current = Math.max(0, Math.min(maxOffset, targetOffsetRef.current + delta * 1.15));

      if (snapTimer) window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        const nearest = Math.round(targetOffsetRef.current / Math.max(stepWidthRef.current, 1));
        goToIndex(nearest);
      }, 150);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        soundEngine.playHover();
        goToIndex(activeIndexRef.current + 1);
      } else if (e.key === 'ArrowLeft') {
        soundEngine.playHover();
        goToIndex(activeIndexRef.current - 1);
      } else if (e.key === 'Enter') {
        soundEngine.playClick();
        onNavigate(`/work/${PROJECTS[activeIndexRef.current].id}`);
      }
    };

    const viewport = viewportRef.current;
    viewport?.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (snapTimer) window.clearTimeout(snapTimer);
      viewport?.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [goToIndex, onNavigate]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartTargetRef.current = targetOffsetRef.current;
    dragDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = dragStartXRef.current - e.clientX;
    dragDistanceRef.current = Math.abs(dx);
    const maxOffset = (PROJECTS.length - 1) * stepWidthRef.current;
    targetOffsetRef.current = Math.max(0, Math.min(maxOffset, dragStartTargetRef.current + dx * 1.25));
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const nearest = Math.round(targetOffsetRef.current / Math.max(stepWidthRef.current, 1));
    goToIndex(nearest);
  };

  const handleCardClick = (idx: number, projectId: string) => {
    if (dragDistanceRef.current > 10) return;
    soundEngine.playClick();
    if (idx === activeIndex) {
      onNavigate(`/work/${projectId}`);
    } else {
      goToIndex(idx);
    }
  };

  const activeProject = PROJECTS[activeIndex] ?? PROJECTS[0];

  return (
    <main className="work-page">
      <ChromaticShaderCanvas velocityRef={velocityRef} />

      {/* Minimal top-center scroll wheel indicator */}
      <div className="work-page__scroll-icon" aria-hidden="true">
        <div className="work-page__scroll-wheel" />
      </div>

      {/* Interactive horizontal momentum carousel */}
      <div
        ref={viewportRef}
        className="work-slider-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div ref={trackRef} className="work-slider-track">
          {PROJECTS.map((project, idx) => (
            <article
              key={project.id}
              className={`work-card ${idx === activeIndex ? 'is-active' : ''}`}
              data-cursor={idx === activeIndex ? 'card' : 'hover'}
              onClick={() => handleCardClick(idx, project.id)}
              onMouseEnter={() => soundEngine.playHover()}
            >
              <img
                src={project.image}
                alt={project.title}
                className="work-card__img"
                draggable={false}
              />
              {project.status && <span className="work-card__badge">{project.status}</span>}
            </article>
          ))}
        </div>
      </div>

      {/* Bottom character-animated project title + description */}
      <div className="work-page__caption">
        <h1 key={activeProject.id} className="work-page__title">
          {activeProject.title.split('').map((ch, i) => (
            <span
              key={`${activeProject.id}-${i}`}
              className="work-page__title-char"
              style={{ animationDelay: `${i * 22}ms` }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </h1>
        <p className="work-page__desc">{activeProject.shortDescription}</p>
      </div>

      <div className="work-page__index-pill">
        ( {activeProject.index} / 0 {PROJECTS.length} )
      </div>

      <div className="work-page__nav-controls">
        <button
          type="button"
          className="work-page__nav-btn"
          aria-label="Previous project"
          disabled={activeIndex === 0}
          style={{ opacity: activeIndex === 0 ? 0.35 : 1 }}
          onClick={() => {
            soundEngine.playClick();
            goToIndex(activeIndex - 1);
          }}
        >
          ←
        </button>
        <button
          type="button"
          className="work-page__nav-btn"
          aria-label="Next project"
          disabled={activeIndex === PROJECTS.length - 1}
          style={{ opacity: activeIndex === PROJECTS.length - 1 ? 0.35 : 1 }}
          onClick={() => {
            soundEngine.playClick();
            goToIndex(activeIndex + 1);
          }}
        >
          →
        </button>
      </div>
    </main>
  );
}
