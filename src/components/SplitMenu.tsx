import { PERSONAL_INFO } from '../data/portfolio';
import { useLocalTime } from '../hooks/useLocalTime';
import { soundEngine } from '../utils/sound';

interface SplitMenuProps {
  isOpen: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Work', path: '/work' },
  { label: 'Contact', path: '/contact' },
];

export function SplitMenu({ isOpen, currentPath, onNavigate, onClose }: SplitMenuProps) {
  const localTime = useLocalTime();

  const handleLinkClick = (path: string) => {
    soundEngine.playClick();
    onClose();
    if (path !== currentPath) {
      onNavigate(path);
    }
  };

  return (
    <div className={`split-menu ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <nav className="split-menu__left" aria-label="Main navigation">
        {NAV_LINKS.map((item) => {
          const active =
            item.path === '/'
              ? currentPath === '/'
              : currentPath === item.path || currentPath.startsWith(`${item.path}/`);
          return (
            <button
              key={item.path}
              type="button"
              className={`split-menu__nav-item ${active ? 'is-active' : ''}`}
              onClick={() => handleLinkClick(item.path)}
              onMouseEnter={() => soundEngine.playHover()}
            >
              <span className="split-menu__nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="split-menu__right">
        <div>
          <div className="split-menu__contact-block">
            <a
              href={PERSONAL_INFO.phoneHref}
              className="split-menu__contact-link"
              onMouseEnter={() => soundEngine.playHover()}
            >
              {PERSONAL_INFO.phone}
            </a>
            <a
              href={PERSONAL_INFO.emailHref}
              className="split-menu__contact-link"
              onMouseEnter={() => soundEngine.playHover()}
            >
              {PERSONAL_INFO.email}
            </a>
            <a
              href={PERSONAL_INFO.resumeUrl}
              download={PERSONAL_INFO.resumeFileName}
              className="split-menu__contact-link"
              onClick={() => soundEngine.playClick()}
              onMouseEnter={() => soundEngine.playHover()}
            >
              Download Resume ↓
            </a>
          </div>

          <div className="split-menu__socials">
            <a
              href={PERSONAL_INFO.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="social-pill"
              aria-label="GitHub"
              onMouseEnter={() => soundEngine.playHover()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
              </svg>
            </a>

            <a
              href={PERSONAL_INFO.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="social-pill"
              aria-label="LinkedIn"
              onMouseEnter={() => soundEngine.playHover()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-7.9c0-1.88-.04-4.3-2.62-4.3-2.62 0-3.02 2.05-3.02 4.16V23h-4V8z" />
              </svg>
            </a>

            <a
              href={PERSONAL_INFO.emailHref}
              className="social-pill"
              aria-label="Email"
              onMouseEnter={() => soundEngine.playHover()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </a>

            <a
              href={PERSONAL_INFO.resumeUrl}
              download={PERSONAL_INFO.resumeFileName}
              className="social-pill"
              aria-label="Download Resume"
              title="Download Resume (PDF)"
              onClick={() => soundEngine.playClick()}
              onMouseEnter={() => soundEngine.playHover()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12" />
                <path d="M7 10l5 5 5-5" />
                <path d="M5 20h14" />
              </svg>
            </a>
          </div>

          <div className="split-menu__meta-grid">
            <div>
              <span className="split-menu__meta-title">Based in</span>
              <span className="split-menu__meta-val">{PERSONAL_INFO.locationShort}</span>
            </div>
            <div>
              <span className="split-menu__meta-title">Local Time</span>
              <span className="split-menu__meta-val">{localTime}</span>
            </div>
            <div>
              <span className="split-menu__meta-title">Current Status</span>
              <span className="split-menu__meta-val">
                <span className="status-dot" />
                {PERSONAL_INFO.status}
              </span>
            </div>
          </div>
        </div>

        <div className="monogram-square monogram-square--muted" aria-hidden="true">
          {PERSONAL_INFO.monogram}
        </div>
      </div>
    </div>
  );
}
