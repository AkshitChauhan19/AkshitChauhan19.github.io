import { useCallback, useEffect, useState } from 'react';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/CustomCursor';
import { Header } from './components/Header';
import { SideBadge } from './components/SideBadge';
import { SplitMenu } from './components/SplitMenu';
import { PageTransition } from './components/PageTransition';
import { HomePage } from './pages/HomePage';
import { WorkPage } from './pages/WorkPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ContactPage } from './pages/ContactPage';
import { PERSONAL_INFO, PROJECTS } from './data/portfolio';
import { soundEngine } from './utils/sound';

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function App() {
  const [loaded, setLoaded] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(() => normalizePath(window.location.pathname));
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'entering' | 'leaving'>('idle');

  // Dynamic document title matching lewiszhang.dev convention
  useEffect(() => {
    if (currentPath === '/work') {
      document.title = `Work | ${PERSONAL_INFO.fullName}`;
    } else if (currentPath === '/contact') {
      document.title = `Contact | ${PERSONAL_INFO.fullName}`;
    } else if (currentPath.startsWith('/work/')) {
      const id = currentPath.replace('/work/', '');
      const found = PROJECTS.find((p) => p.id === id);
      document.title = found ? `${found.title} | ${PERSONAL_INFO.fullName}` : `Work | ${PERSONAL_INFO.fullName}`;
    } else {
      document.title = `${PERSONAL_INFO.fullName} | ${PERSONAL_INFO.headline}`;
    }
  }, [currentPath]);

  // Browser back/forward support
  useEffect(() => {
    const onPopState = () => {
      setMenuOpen(false);
      setCurrentPath(normalizePath(window.location.pathname));
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Lock body scroll while split menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Smooth 3D Monogram curtain transition between routes
  const navigate = useCallback(
    (targetPath: string) => {
      const normalized = normalizePath(targetPath);
      setMenuOpen(false);
      if (normalized === currentPath) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      soundEngine.playTransition();
      setTransitionPhase('entering');

      window.setTimeout(() => {
        window.history.pushState({}, '', normalized);
        setCurrentPath(normalized);
        window.scrollTo(0, 0);
        setTransitionPhase('leaving');

        window.setTimeout(() => {
          setTransitionPhase('idle');
        }, 440);
      }, 420);
    },
    [currentPath]
  );

  const handleToggleSound = () => {
    const next = soundEngine.toggle();
    setSoundOn(next);
  };

  const renderRoute = () => {
    if (currentPath === '/work') {
      return <WorkPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/work/')) {
      const id = currentPath.replace('/work/', '');
      return <ProjectDetailPage projectId={id} onNavigate={navigate} />;
    }
    if (currentPath === '/contact') {
      return <ContactPage onNavigate={navigate} />;
    }
    // Catch-all renders Home gracefully just like lewiszhang.dev
    return <HomePage onNavigate={navigate} />;
  };

  return (
    <>
      {!loaded && <Preloader onComplete={() => setLoaded(true)} />}

      <CustomCursor />

      <Header
        currentPath={currentPath}
        menuOpen={menuOpen}
        soundOn={soundOn}
        onToggleMenu={() => setMenuOpen((prev) => !prev)}
        onToggleSound={handleToggleSound}
        onNavigate={navigate}
      />

      <SideBadge onNavigate={navigate} />

      <SplitMenu
        isOpen={menuOpen}
        currentPath={currentPath}
        onNavigate={navigate}
        onClose={() => setMenuOpen(false)}
      />

      <PageTransition phase={transitionPhase} />

      {renderRoute()}
    </>
  );
}

export default App;
