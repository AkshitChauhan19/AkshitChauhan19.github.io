import { useEffect } from 'react';
import { EDUCATION, EXPERIENCE, PERSONAL_INFO, TECHNICAL_SKILLS } from '../data/portfolio';
import { ParticleRoseCanvas } from '../components/ParticleRoseCanvas';
import { MacBookShowcase } from '../components/MacBookShowcase';
import { Footer } from '../components/Footer';
import { soundEngine } from '../utils/sound';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  useEffect(() => {
    // 1. Scroll-triggered reveal animations
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-inview');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach((node) => observer.observe(node));

    // 2. Interactive 3D glass card tilt & spotlight on cursor hover/movement
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.glass-card'));
    const cleanups: (() => void)[] = [];

    cards.forEach((card) => {
      const onPointerMove = (e: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${mouseX}px`);
        card.style.setProperty('--mouse-y', `${mouseY}px`);

        // Normalized offset (-0.5 to 0.5) from card center
        const normX = mouseX / rect.width - 0.5;
        const normY = mouseY / rect.height - 0.5;

        // Elegant 3D tilt with perspective and subtle lift
        const rotX = -normY * 8;
        const rotY = normX * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-8px) scale3d(1.015, 1.015, 1.015)`;
      };

      const onPointerEnter = () => {
        card.style.transition = 'transform 0.12s ease-out, box-shadow 0.3s ease, border-color 0.3s ease';
      };

      const onPointerLeave = () => {
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.5s ease';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
      };

      card.addEventListener('pointermove', onPointerMove, { passive: true });
      card.addEventListener('pointerenter', onPointerEnter, { passive: true });
      card.addEventListener('pointerleave', onPointerLeave, { passive: true });

      cleanups.push(() => {
        card.removeEventListener('pointermove', onPointerMove);
        card.removeEventListener('pointerenter', onPointerEnter);
        card.removeEventListener('pointerleave', onPointerLeave);
      });
    });

    return () => {
      observer.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <main style={{ position: 'relative' }}>
      {/* Persistent 3D Cosmic Galaxy Canvas — Fluid galaxy background throughout the whole website */}
      <ParticleRoseCanvas />

      {/* Hidden SVG clipPath definition for the organic wavy portrait mask */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <clipPath id="organic-portrait-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.08,0.01 C 0.34,0.0 0.68,0.0 0.90,0.02 C 0.99,0.11 0.96,0.24 0.98,0.38 C 1.0,0.52 0.95,0.66 0.98,0.80 C 0.99,0.91 0.94,0.98 0.86,0.99 C 0.62,1.0 0.34,1.0 0.08,0.98 C 0.02,0.89 0.06,0.75 0.02,0.62 C -0.01,0.48 0.06,0.34 0.02,0.20 C 0.0,0.11 0.03,0.04 0.08,0.01 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* 1. HERO SECTION — Massive Display Title */}
      <section className="home-hero">
        <div className="home-hero__content">
          <p className="home-hero__caption">{PERSONAL_INFO.heroCaption}</p>
          <h1 className="home-hero__title">{PERSONAL_INFO.heroHeadline}</h1>
        </div>
      </section>

      {/* 2. BIO / ABOUT SECTION */}
      <section className="bio-section">
        <div className="bio-grid">
          <div className="bio-text reveal">
            <p>{PERSONAL_INFO.bioParagraph1}</p>
            <p>{PERSONAL_INFO.bioParagraph2}</p>
            <div className="bio-text__meta">
              <span>{PERSONAL_INFO.headline}</span>
              <span>·</span>
              <span>{PERSONAL_INFO.subHeadline}</span>
              <span>·</span>
              <span>{PERSONAL_INFO.location}</span>
            </div>
          </div>

          <div className="bio-portrait-wrap reveal">
            <div className="bio-portrait-svg-mask">
              <img
                src="/images/bio-portrait.jpg"
                alt={`${PERSONAL_INFO.fullName} — ${PERSONAL_INFO.headline}`}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTINUOUS GPU MARQUEE TICKER */}
      <div className="marquee-band" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((loopIdx) => (
            <div key={loopIdx} className="marquee-group">
              {PERSONAL_INFO.marqueeItems.map((item, idx) => (
                <span key={`${loopIdx}-${item}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '36px' }}>
                  <span className={idx % 2 === 1 ? 'marquee-item marquee-item--italic' : 'marquee-item'}>
                    {item}
                  </span>
                  <span className="marquee-dot">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 4. EXPERIENCE, SKILLS & EDUCATION (Editorial Monochrome) */}
      <section className="resume-section" aria-label="Experience, Skills, and Education">
        <div className="editorial-header reveal">
          <h2 className="editorial-header__title">Experience</h2>
          <span className="editorial-header__num">( 0 1 )</span>
        </div>

        {EXPERIENCE.map((exp) => (
          <article key={exp.company} className="experience-card glass-card reveal">
            <div>
              <h3 className="experience-card__company">{exp.company}</h3>
              <p className="experience-card__role">{exp.role}</p>
              <div className="experience-card__meta">
                <span>{exp.period}</span>
                <span>·</span>
                <span>{exp.location}</span>
              </div>
              <span className="experience-card__badge">{exp.type}</span>
            </div>

            <ul className="experience-list">
              {exp.highlights.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}

        <div className="editorial-header reveal">
          <h2 className="editorial-header__title">Skills &amp; Education</h2>
          <span className="editorial-header__num">( 0 2 )</span>
        </div>

        <div className="skills-edu-grid">
          <div className="skills-groups glass-card reveal">
            {TECHNICAL_SKILLS.map((group) => (
              <div key={group.category} className="skill-category-group">
                <h3 className="skill-group__title">{group.category}</h3>
                <div className="skill-pills">
                  {group.items.map((skill) => (
                    <span key={skill} className="skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="education-card glass-card reveal">
            <p className="education-card__eyebrow">Education · {EDUCATION.period}</p>
            <h3 className="education-card__inst">{EDUCATION.institution}</h3>
            <p className="education-card__degree">{EDUCATION.degree}</p>
            <p className="education-card__cgpa">CGPA: {EDUCATION.cgpa}</p>
            <div className="education-card__schooling">
              {EDUCATION.schooling.map((row) => (
                <div key={row.label} className="education-card__school-row">
                  <span>{row.label}</span>
                  <strong>{row.score}</strong>
                </div>
              ))}
              <div className="education-card__school-row" style={{ paddingTop: '6px', opacity: 0.65 }}>
                <span>Location</span>
                <span>{EDUCATION.location}</span>
              </div>
            </div>
          </aside>
        </div>

        {/* RESUME DOWNLOAD SECTION */}
        <div className="editorial-header reveal" style={{ marginTop: '80px' }}>
          <h2 className="editorial-header__title">Resume</h2>
          <span className="editorial-header__num">( 0 3 )</span>
        </div>

        <div className="resume-download-card glass-card reveal">
          <div>
            <h3 className="resume-download-card__title">Curriculum Vitae</h3>
            <p className="resume-download-card__desc">
              Download my full resume in PDF format for a complete overview of my Flutter &amp; Android engineering experience, projects, technical skills, and education.
            </p>
          </div>
          <div className="resume-download-card__actions">
            <a
              href={PERSONAL_INFO.resumeUrl}
              download={PERSONAL_INFO.resumeFileName}
              className="resume-download-btn"
              onClick={() => soundEngine.playClick()}
              onMouseEnter={() => soundEngine.playHover()}
            >
              <span aria-hidden="true">↓</span> Download Resume
            </a>
            <a
              href={PERSONAL_INFO.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="resume-preview-btn"
              onClick={() => soundEngine.playClick()}
              onMouseEnter={() => soundEngine.playHover()}
            >
              View PDF <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* 5. RECENT WORK — 3D SILVER MACBOOK STICKY SCROLL SHOWCASE */}
      <MacBookShowcase onSelectProject={(id) => onNavigate(`/work/${id}`)} />

      {/* 6. LET'S WORK TOGETHER CTA */}
      <section className="cta-section">
        <h2 className="cta-section__title reveal">Let&apos;s work together</h2>
        <p className="cta-section__subtitle reveal">
          I&apos;m here to help you make your next big idea a reality. Contact me now.
        </p>
        <button
          type="button"
          className="cta-pill reveal"
          onClick={() => {
            soundEngine.playClick();
            onNavigate('/contact');
          }}
          onMouseEnter={() => soundEngine.playHover()}
        >
          <span className="status-dot" />
          Connect With Me
        </button>
      </section>

      {/* 7. STARK WHITE FOOTER */}
      <Footer onNavigate={onNavigate} />
    </main>
  );
}
