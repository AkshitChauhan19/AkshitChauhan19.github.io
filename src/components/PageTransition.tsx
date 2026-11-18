import { PERSONAL_INFO } from '../data/portfolio';

interface PageTransitionProps {
  phase: 'idle' | 'entering' | 'leaving';
}

export function PageTransition({ phase }: PageTransitionProps) {
  return (
    <div
      className={`page-transition ${
        phase === 'entering' ? 'is-entering' : phase === 'leaving' ? 'is-leaving' : ''
      }`}
      aria-hidden="true"
    >
      <div className="page-transition__monogram-wrap">
        <span className="page-transition__monogram">{PERSONAL_INFO.monogramLetter}</span>
      </div>
    </div>
  );
}
