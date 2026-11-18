import { PERSONAL_INFO } from '../data/portfolio';
import { soundEngine } from '../utils/sound';

interface HeaderProps {
  currentPath: string;
  menuOpen: boolean;
  soundOn: boolean;
  onToggleMenu: () => void;
  onToggleSound: () => void;
  onNavigate: (path: string) => void;
}

export function Header({
  currentPath,
  menuOpen,
  soundOn,
  onToggleMenu,
  onToggleSound,
  onNavigate,
}: HeaderProps) {
  const isWorkList = currentPath === '/work';
  const isProjectDetail = currentPath.startsWith('/work/');
  const isContact = currentPath === '/contact';
  const isDarkText = menuOpen || isWorkList || isProjectDetail;
  const backTarget = isProjectDetail ? '/work' : isWorkList || isContact ? '/' : null;

  return (
    <header className={`site-header ${isDarkText ? 'is-dark-text' : ''}`}>
      <button
        type="button"
        className="site-header__logo"
        onClick={() => {
          soundEngine.playClick();
          onNavigate('/');
        }}
        onMouseEnter={() => soundEngine.playHover()}
      >
        {PERSONAL_INFO.brandMark}
      </button>

      {backTarget && !menuOpen && (
        <button
          type="button"
          className="site-header__back"
          onClick={() => {
            soundEngine.playClick();
            onNavigate(backTarget);
          }}
          onMouseEnter={() => soundEngine.playHover()}
        >
          <span aria-hidden="true">←</span> Back.
        </button>
      )}

      <div className="site-header__controls">
        <button
          type="button"
          className="sound-toggle"
          onClick={onToggleSound}
          aria-label={soundOn ? 'Mute sound effects' : 'Enable sound effects'}
          title={soundOn ? 'Sound On' : 'Sound Off'}
        >
          {soundOn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path
                d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path
                d="M16 9.5l5 5M21 9.5l-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          className="menu-trigger"
          onClick={() => {
            soundEngine.playClick();
            onToggleMenu();
          }}
          onMouseEnter={() => soundEngine.playHover()}
          aria-expanded={menuOpen}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>
    </header>
  );
}
