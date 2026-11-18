import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PROJECTS } from '../data/portfolio';
import { soundEngine } from '../utils/sound';

interface MacBookShowcaseProps {
  onSelectProject: (projectId: string) => void;
}

const SCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCREEN_FRAG = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;
  varying vec2 vUv;

  void main() {
    vec4 colorA = texture2D(uTexA, vUv);
    vec4 colorB = texture2D(uTexB, vUv);
    vec4 finalCol = mix(colorA, colorB, smoothstep(0.0, 1.0, uMix));
    // Subtle screen gloss vignette
    float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.16;
    gl_FragColor = vec4(finalCol.rgb * vig, 1.0);
  }
`;

function createFallbackTexture(title: string, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 1024, 640);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 640);

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(512, 320, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '300 54px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 512, 336);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildProceduralMacBook(screenMaterial: THREE.ShaderMaterial): THREE.Group {
  const laptop = new THREE.Group();

  // Sleek anodized silver aluminum matching lewiszhang.dev MacBook
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xc8ccd0,
    metalness: 0.72,
    roughness: 0.28,
  });

  const darkDeckMat = new THREE.MeshStandardMaterial({
    color: 0x161719,
    metalness: 0.25,
    roughness: 0.65,
  });

  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0xb7bbc0,
    metalness: 0.65,
    roughness: 0.34,
  });

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b0c,
    metalness: 0.35,
    roughness: 0.22,
  });

  // 1. Base chassis
  const baseGeo = new THREE.BoxGeometry(3.38, 0.1, 2.28);
  const baseMesh = new THREE.Mesh(baseGeo, aluminumMat);
  baseMesh.position.set(0, -0.78, 0.62);
  laptop.add(baseMesh);

  // Recessed matte black keyboard deck
  const keyboardGeo = new THREE.BoxGeometry(2.68, 0.015, 1.02);
  const keyboardMesh = new THREE.Mesh(keyboardGeo, darkDeckMat);
  keyboardMesh.position.set(0, -0.725, 0.22);
  laptop.add(keyboardMesh);

  // Trackpad with hairline outline
  const trackpadGeo = new THREE.BoxGeometry(1.16, 0.01, 0.74);
  const trackpadMesh = new THREE.Mesh(trackpadGeo, trackpadMat);
  trackpadMesh.position.set(0, -0.728, 1.24);
  laptop.add(trackpadMesh);

  // Subtle front thumb notch
  const notchGeo = new THREE.BoxGeometry(0.46, 0.035, 0.04);
  const notchMesh = new THREE.Mesh(notchGeo, darkDeckMat);
  notchMesh.position.set(0, -0.755, 1.755);
  laptop.add(notchMesh);

  // 2. Hinge
  const hingeGeo = new THREE.CylinderGeometry(0.042, 0.042, 2.86, 16);
  const hingeMesh = new THREE.Mesh(hingeGeo, darkDeckMat);
  hingeMesh.rotation.z = Math.PI / 2;
  hingeMesh.position.set(0, -0.72, -0.49);
  laptop.add(hingeMesh);

  // 3. Lid & Screen Group pivoted at hinge
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, -0.72, -0.5);
  lidGroup.rotation.x = -0.14; // Open ergonomic angle

  // Outer silver aluminum lid
  const lidBackGeo = new THREE.BoxGeometry(3.38, 2.18, 0.065);
  const lidBack = new THREE.Mesh(lidBackGeo, aluminumMat);
  lidBack.position.set(0, 1.09, -0.02);
  lidGroup.add(lidBack);

  // Front dark glass bezel
  const bezelGeo = new THREE.BoxGeometry(3.32, 2.12, 0.02);
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.set(0, 1.09, 0.012);
  lidGroup.add(bezel);

  // Crisp glowing screen plane (16:10)
  const screenGeo = new THREE.PlaneGeometry(3.12, 1.94);
  const screenMesh = new THREE.Mesh(screenGeo, screenMaterial);
  screenMesh.position.set(0, 1.1, 0.024);
  lidGroup.add(screenMesh);

  laptop.add(lidGroup);
  return laptop;
}

export function MacBookShowcase({ onSelectProject }: MacBookShowcaseProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollProgressRef = useRef(0);
  const targetProgressRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    const host = canvasHostRef.current;
    if (!track || !host) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 1.35, 7.25);
    camera.lookAt(0, 0.08, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    host.appendChild(renderer.domElement);

    // Crisp studio lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.05);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
    keyLight.position.set(3.5, 5.2, 4.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xcbd5e1, 0.95);
    rimLight.position.set(-4.0, 2.2, -2.5);
    scene.add(rimLight);

    // Load crisp textures for all 4 projects with instant canvas fallbacks
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = PROJECTS.map((proj) =>
      createFallbackTexture(proj.title, proj.accentColor)
    );

    PROJECTS.forEach((proj, idx) => {
      loader.load(proj.image, (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.minFilter = THREE.LinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        const old = textures[idx];
        textures[idx] = loaded;
        old.dispose();
      });
    });

    const screenUniforms = {
      uTexA: { value: textures[0] },
      uTexB: { value: textures[1] || textures[0] },
      uMix: { value: 0 },
    };

    const screenMaterial = new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERT,
      fragmentShader: SCREEN_FRAG,
      uniforms: screenUniforms,
    });

    const laptop = buildProceduralMacBook(screenMaterial);
    scene.add(laptop);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let isVisible = false;
    let rafId = 0;
    let lastReportedIndex = 0;

    const updateTargetFromScroll = () => {
      const rect = track.getBoundingClientRect();
      const totalScrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), totalScrollable);
      targetProgressRef.current = scrolled / totalScrollable;
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onResize = () => {
      if (!host) return;
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      const scaleFactor = w < 640 ? 0.72 : w < 960 ? 0.86 : 1;
      laptop.scale.setScalar(scaleFactor);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      updateTargetFromScroll();
    };
    onResize();

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
      },
      { rootMargin: '140px 0px' }
    );
    observer.observe(track);

    window.addEventListener('scroll', updateTargetFromScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    const maxSlide = Math.max(PROJECTS.length - 1, 1);

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      // Smooth responsive lerp for scroll progress while pinned
      scrollProgressRef.current += (targetProgressRef.current - scrollProgressRef.current) * 0.16;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      const scaled = scrollProgressRef.current * maxSlide;
      const idxA = Math.min(Math.floor(scaled), maxSlide);
      const idxB = Math.min(idxA + 1, maxSlide);
      const frac = scaled - idxA;

      screenUniforms.uTexA.value = textures[idxA];
      screenUniforms.uTexB.value = textures[idxB];
      screenUniforms.uMix.value = frac;

      const nearest = Math.round(scaled);
      if (nearest !== lastReportedIndex) {
        lastReportedIndex = nearest;
        setActiveIndex(nearest);
      }

      // Elegant sculptural rotation across projects + subtle float
      const sweepAngle = Math.sin(scrollProgressRef.current * Math.PI * 2) * 0.22;
      laptop.rotation.y = sweepAngle + pointer.x * 0.16;
      laptop.rotation.x = 0.08 - pointer.y * 0.08;
      laptop.position.y = Math.sin(time * 0.0014) * 0.045;

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('scroll', updateTargetFromScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      textures.forEach((t) => t.dispose());
      screenMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  const currentProject = PROJECTS[activeIndex] ?? PROJECTS[0];

  const jumpToProject = (idx: number) => {
    soundEngine.playClick();
    const track = trackRef.current;
    if (!track) return;
    const totalScrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
    const ratio = idx / Math.max(PROJECTS.length - 1, 1);
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: trackTop + ratio * totalScrollable,
      behavior: 'smooth',
    });
  };

  return (
    <section ref={trackRef} className="macbook-scroll-track" aria-label="Recent Work Showcase">
      <div className="macbook-sticky">
        <div
          ref={canvasHostRef}
          className="macbook-sticky__canvas"
          data-cursor="card"
          onClick={() => {
            soundEngine.playClick();
            onSelectProject(currentProject.id);
          }}
          role="button"
          tabIndex={0}
          aria-label={`Open ${currentProject.title} case study`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectProject(currentProject.id);
            }
          }}
        />

        <div className="macbook-sticky__top">
          <h2 className="macbook-sticky__heading">Recent Work</h2>
          <span className="macbook-sticky__counter">( {currentProject.index} )</span>
        </div>

        <span className="macbook-sticky__hint">Scroll to explore · Click to open</span>

        <div className="macbook-sticky__bottom">
          <div
            className="macbook-sticky__project-info"
            onClick={() => {
              soundEngine.playClick();
              onSelectProject(currentProject.id);
            }}
            onMouseEnter={() => soundEngine.playHover()}
            data-cursor="hover"
          >
            <h3 className="macbook-sticky__title">{currentProject.displayTitle}</h3>
            <span className="macbook-sticky__category">{currentProject.category}</span>
          </div>

          <div className="macbook-sticky__right-controls">
            <div className="macbook-sticky__dots" role="tablist" aria-label="Select project">
              {PROJECTS.map((proj, idx) => (
                <button
                  key={proj.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeIndex}
                  aria-label={`Show ${proj.title}`}
                  className={`macbook-sticky__dot ${idx === activeIndex ? 'is-active' : ''}`}
                  onClick={() => jumpToProject(idx)}
                />
              ))}
            </div>
            <span className="macbook-sticky__year">{currentProject.year}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
