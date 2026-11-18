import { PERSONAL_INFO } from '../data/portfolio';
import { soundEngine } from '../utils/sound';

interface SideBadgeProps {
  onNavigate: (path: string) => void;
}

export function SideBadge({ onNavigate }: SideBadgeProps) {
  return (
    <button
      type="button"
      className="side-badge"
      onClick={() => {
        soundEngine.playClick();
        onNavigate('/work');
      }}
      onMouseEnter={() => soundEngine.playHover()}
      aria-label="Explore Akshit's Portfolio Work"
    >
      <span className="side-badge__mark">{PERSONAL_INFO.monogram}</span>
      <span className="side-badge__label">Portfolio</span>
    </button>
  );
}
