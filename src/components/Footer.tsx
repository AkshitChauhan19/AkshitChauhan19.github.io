import { PERSONAL_INFO } from '../data/portfolio';
import { soundEngine } from '../utils/sound';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const scrollToTop = () => {
    soundEngine.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <h2 className="site-footer__headline">Mobile &amp; Digital Experiences</h2>
        <div className="monogram-square monogram-square--dark" aria-hidden="true">
          {PERSONAL_INFO.monogram}
        </div>
      </div>

      <div className="site-footer__middle">
        <div className="site-footer__columns">
          <div className="site-footer__col">
            <a
              href={PERSONAL_INFO.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__link"
              onMouseEnter={() => soundEngine.playHover()}
            >
              LinkedIn
            </a>
            <a
              href={PERSONAL_INFO.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__link"
              onMouseEnter={() => soundEngine.playHover()}
            >
              GitHub
            </a>
            <a
              href={PERSONAL_INFO.emailHref}
              className="site-footer__link"
              onMouseEnter={() => soundEngine.playHover()}
            >
              Email
            </a>
            <a
              href={PERSONAL_INFO.resumeUrl}
              download={PERSONAL_INFO.resumeFileName}
              className="site-footer__link"
              onClick={() => soundEngine.playClick()}
              onMouseEnter={() => soundEngine.playHover()}
            >
              Resume ↓
            </a>
          </div>

          <div className="site-footer__col">
            <button
              type="button"
              className="site-footer__link"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('/');
              }}
              onMouseEnter={() => soundEngine.playHover()}
            >
              Home
            </button>
            <button
              type="button"
              className="site-footer__link"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('/work');
              }}
              onMouseEnter={() => soundEngine.playHover()}
            >
              Work
            </button>
            <button
              type="button"
              className="site-footer__link"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('/contact');
              }}
              onMouseEnter={() => soundEngine.playHover()}
            >
              Contact
            </button>
          </div>
        </div>

        <button
          type="button"
          className="site-footer__backtop"
          onClick={scrollToTop}
          onMouseEnter={() => soundEngine.playHover()}
          aria-label="Scroll back to top"
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      <div className="site-footer__bottom">
        <span className="site-footer__brand">{PERSONAL_INFO.brandMark}</span>
        <span className="site-footer__copy">
          ©2026 {PERSONAL_INFO.fullName}. {PERSONAL_INFO.headline}
        </span>
      </div>
    </footer>
  );
}
