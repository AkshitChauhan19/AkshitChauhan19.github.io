import { PROJECTS } from '../data/portfolio';
import { Footer } from '../components/Footer';
import { soundEngine } from '../utils/sound';

interface ProjectDetailPageProps {
  projectId: string;
  onNavigate: (path: string) => void;
}

export function ProjectDetailPage({ projectId, onNavigate }: ProjectDetailPageProps) {
  const currentIdx = Math.max(
    0,
    PROJECTS.findIndex((p) => p.id === projectId)
  );
  const project = PROJECTS[currentIdx] ?? PROJECTS[0];
  const nextProject = PROJECTS[(currentIdx + 1) % PROJECTS.length];

  return (
    <main className="detail-page">
      <section className="detail-hero">
        <div className="detail-hero__top">
          <div>
            <p className="detail-hero__eyebrow">
              ( {project.index} ) · {project.category}
            </p>
            <h1 className="detail-hero__title">{project.title}</h1>
          </div>

          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-live-btn"
            onMouseEnter={() => soundEngine.playHover()}
          >
            {project.liveLabel} <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="detail-hero__meta-row">
          <div className="detail-meta-item">
            <span>Role</span>
            <strong>{project.role}</strong>
          </div>
          <div className="detail-meta-item">
            <span>Year</span>
            <strong>{project.year}</strong>
          </div>
          {project.status && (
            <div className="detail-meta-item">
              <span>Status</span>
              <strong>{project.status}</strong>
            </div>
          )}
        </div>
      </section>

      {/* Luminous pastel gradient showcase frame mirroring lewiszhang.dev case study hero */}
      <section
        className="detail-showcase-band"
        style={{
          background: `linear-gradient(120deg, ${project.gradientFrom} 0%, #f8fafc 48%, ${project.gradientTo} 100%)`,
        }}
      >
        <div className="detail-showcase-frame" data-cursor="card">
          <img src={project.image} alt={`${project.title} showcase`} />
        </div>
      </section>

      {/* Case study narrative + engineering highlights */}
      <section className="detail-body">
        <div>
          <h2 className="detail-body__heading">Project Overview</h2>
          <p className="detail-body__overview">{project.overview}</p>
          <div className="detail-tech-list">
            {project.techStack.map((tech) => (
              <span key={tech} className="detail-tech-tag">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="detail-body__heading">Engineering Highlights</h2>
          <ul className="detail-highlights">
            {project.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pitch-black Discover More Projects CTA mirroring step_34.png */}
      <section className="detail-more">
        <p className="detail-more__label">Discover More Projects</p>
        <button
          type="button"
          className="detail-more__next"
          onClick={() => {
            soundEngine.playClick();
            onNavigate(`/work/${nextProject.id}`);
          }}
          onMouseEnter={() => soundEngine.playHover()}
        >
          {nextProject.title} →
        </button>

        <button
          type="button"
          className="detail-more__back-pill"
          onClick={() => {
            soundEngine.playClick();
            onNavigate('/work');
          }}
          onMouseEnter={() => soundEngine.playHover()}
        >
          ← Back to the work list
        </button>
      </section>

      <Footer onNavigate={onNavigate} />
    </main>
  );
}
