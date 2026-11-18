import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPixelRatio;

  attribute float aScale;
  attribute float aRandom;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Gentle organic petal breathing purely on GPU
    float wave = sin(uTime * 0.9 + pos.x * 2.1 + pos.y * 1.7 + aRandom * 6.2831);
    float radial = length(pos.xz);
    pos.y += wave * 0.045 * (0.35 + radial * 0.45);
    pos.x += cos(uTime * 0.65 + aRandom * 6.2831) * 0.025 * radial;
    pos.z += sin(uTime * 0.65 + aRandom * 6.2831) * 0.025 * radial;

    // Subtle pointer sway
    pos.x += uPointer.x * 0.16 * (0.4 + radial * 0.35);
    pos.y += uPointer.y * 0.14 * (0.4 + radial * 0.35);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float shimmer = 0.78 + 0.22 * sin(uTime * 2.2 + aRandom * 25.0);
    gl_PointSize = aScale * uPixelRatio * (19.0 / max(-mvPosition.z, 1.2)) * shimmer;

    vColor = aColor;
    vAlpha = clamp(0.45 + 0.55 * shimmer, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    // Crisp luminous core with soft amber/crimson halo
    float strength = pow(1.0 - dist * 2.0, 2.2);
    gl_FragColor = vec4(vColor, strength * vAlpha * 0.92);
  }
`;

function buildRoseParticleGeometry(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const randoms = new Float32Array(count);

  // Warm rose-gold / crimson / ember palette matching lewiszhang.dev hero rose
  const coreColor = new THREE.Color('#fff1d6');
  const amberColor = new THREE.Color('#ff8c42');
  const crimsonColor = new THREE.Color('#c92a2a');
  const outerGold = new THREE.Color('#d9a066');
  const deepEmber = new THREE.Color('#5c1212');
  const tmpColor = new THREE.Color();

  const goldenAngle = 2.399963229728653;

  for (let i = 0; i < count; i++) {
    const t = i / count;

    if (t < 0.86) {
      // Parametric layered rose petals (phyllotaxis spiral + cupped rose fold)
      const u = t / 0.86;
      const theta = i * goldenAngle;
      const petalRings = 1.0 - 0.5 * Math.pow(((3.6 * theta) % (Math.PI * 2)) / Math.PI - 1.0, 2.0);

      // Radius expands outward across petal whorls
      const rBase = Math.pow(u, 0.58) * 2.15;
      const petalCurl = Math.sin(theta * 5.0 + u * 6.5) * 0.24 * u;
      const r = rBase * (0.76 + 0.32 * petalRings) + petalCurl;

      // Cupped height profile: tight bud in center, gracefully flared outer petals
      const cup = Math.pow(u, 1.35) * 0.95 - Math.cos(u * Math.PI * 1.45) * 0.52;
      const ruffle = Math.sin(theta * 6.0 - u * 5.0) * 0.16 * u;

      const jitter = (Math.random() - 0.5) * 0.08 * (0.3 + u);
      const x = Math.cos(theta) * r + jitter;
      const z = Math.sin(theta) * r + jitter;
      const y = cup + ruffle + (Math.random() - 0.5) * 0.07;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y - 0.15;
      positions[i * 3 + 2] = z;

      // Color gradient: hot glowing stamen core -> fiery crimson mid -> delicate gold outer edges
      if (u < 0.14) {
        tmpColor.copy(coreColor).lerp(amberColor, u / 0.14);
      } else if (u < 0.56) {
        tmpColor.copy(amberColor).lerp(crimsonColor, (u - 0.14) / 0.42);
      } else {
        const edgeMix = (u - 0.56) / 0.44;
        tmpColor.copy(crimsonColor).lerp(Math.random() > 0.42 ? outerGold : deepEmber, edgeMix);
      }

      scales[i] = (0.7 + Math.random() * 1.45) * (1.25 - u * 0.45);
    } else {
      // Delicate floating ambient stardust wisps around the rose
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.4 + Math.random() * 1.85;
      const height = (Math.random() - 0.5) * 2.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      tmpColor.copy(outerGold).lerp(deepEmber, Math.random() * 0.65);
      scales[i] = 0.45 + Math.random() * 0.95;
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
    randoms[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
  return geometry;
}

export function ParticleRoseCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 40);
    camera.position.set(0, 3.15, 4.75);
    camera.lookAt(0, -0.05, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const isMobile = window.innerWidth < 768;
    const geometry = buildRoseParticleGeometry(isMobile ? 7500 : 13500);

    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: dpr },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.rotation.x = 0.28;
    scene.add(points);

    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };
    let isVisible = true;
    let rafId = 0;
    let lastTime = performance.now();

    const onPointerMove = (e: PointerEvent) => {
      pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.02 }
    );
    observer.observe(container);

    const onVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
      } else {
        lastTime = performance.now();
        isVisible = true;
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const dt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;
      uniforms.uTime.value += dt;

      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.06;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.06;
      uniforms.uPointer.value.set(pointerCurrent.x, pointerCurrent.y);

      points.rotation.y += dt * 0.14;
      points.rotation.x = 0.28 + pointerCurrent.y * 0.24;
      points.rotation.z = -pointerCurrent.x * 0.14;

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="home-hero__canvas" aria-hidden="true" />;
}
