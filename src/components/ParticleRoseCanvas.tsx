import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gyro } from '../utils/gyroscope';

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

    // Gentle organic breathing purely on GPU
    float wave = sin(uTime * 0.9 + pos.x * 2.1 + pos.y * 1.7 + aRandom * 6.2831);
    float radial = length(pos.xz);
    pos.y += wave * 0.045 * (0.35 + radial * 0.45);
    pos.x += cos(uTime * 0.65 + aRandom * 6.2831) * 0.025 * radial;
    pos.z += sin(uTime * 0.65 + aRandom * 6.2831) * 0.025 * radial;

    // Subtle pointer + gyroscope sway
    pos.x += uPointer.x * 0.16 * (0.4 + radial * 0.35);
    pos.y += uPointer.y * 0.14 * (0.4 + radial * 0.35);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float shimmer = 0.78 + 0.22 * sin(uTime * 2.2 + aRandom * 25.0);
    gl_PointSize = aScale * uPixelRatio * (20.0 / max(-mvPosition.z, 1.2)) * shimmer;

    vColor = aColor;
    vAlpha = clamp(0.48 + 0.52 * shimmer, 0.0, 1.0);
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
    float strength = pow(1.0 - dist * 2.0, 2.1);
    gl_FragColor = vec4(vColor, strength * vAlpha * 0.94);
  }
`;

function buildRoseParticleGeometry(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const randoms = new Float32Array(count);

  // Warm rose-gold / crimson / ember palette matching lewiszhang.dev hero rose
  const coreColor = new THREE.Color('#fff4e0');
  const amberColor = new THREE.Color('#ff8f3d');
  const crimsonColor = new THREE.Color('#c92a2a');
  const outerGold = new THREE.Color('#d9a066');
  const deepEmber = new THREE.Color('#5c1212');
  const tmpColor = new THREE.Color();

  const goldenAngle = 2.399963229728653;
  const coreRatio = 0.62;

  for (let i = 0; i < count; i++) {
    const t = i / count;

    if (t < coreRatio) {
      // Parametric layered rose petals & spiral galaxy whorls
      const u = t / coreRatio;
      const theta = i * goldenAngle;
      const petalRings = 1.0 - 0.5 * Math.pow(((3.6 * theta) % (Math.PI * 2)) / Math.PI - 1.0, 2.0);

      // Radius expands outward across petal whorls
      const rBase = Math.pow(u, 0.58) * 2.25;
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

      scales[i] = (0.75 + Math.random() * 1.45) * (1.25 - u * 0.45);
    } else {
      // Expansive 3D cosmic dust cloud and nebula stars drifting throughout the entire page
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.pow(Math.random(), 0.65) * 4.4;
      const height = (Math.random() - 0.5) * 4.6;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Warm stars and embers
      const starMix = Math.random();
      if (starMix < 0.3) {
        tmpColor.copy(coreColor);
      } else if (starMix < 0.7) {
        tmpColor.copy(amberColor).lerp(outerGold, Math.random());
      } else {
        tmpColor.copy(outerGold).lerp(deepEmber, Math.random() * 0.75);
      }
      scales[i] = 0.5 + Math.random() * 1.25;
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
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
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
    renderer.domElement.style.transition = 'opacity 0.25s ease-out';
    container.appendChild(renderer.domElement);

    const isMobile = window.innerWidth < 768;
    const geometry = buildRoseParticleGeometry(isMobile ? 9000 : 16000);

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
    let currentScrollY = window.scrollY;
    let targetScrollY = window.scrollY;

    const onPointerMove = (e: PointerEvent) => {
      pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onScroll = () => {
      targetScrollY = window.scrollY;
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / Math.max(h, 1);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();

      // Scale smoothly on narrow portrait screens so petals and star field fit harmoniously
      const roseScale = aspect < 1 ? Math.max(0.62, aspect * 1.15) : 1;
      points.scale.setScalar(roseScale);
      renderer.setSize(w, h);
    };
    onResize();

    const onVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
      } else {
        lastTime = performance.now();
        isVisible = true;
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const dt = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;
      uniforms.uTime.value += dt;

      // Smooth pointer easing
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.06;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.06;

      // Sample mobile gyroscope
      const { x: gyroX, y: gyroY } = gyro.update(0.08);

      // Blend pointer (desktop mouse) + gyroscope tilt (mobile orientation)
      const combinedX = pointerCurrent.x + gyroX * 0.65;
      const combinedY = pointerCurrent.y + gyroY * 0.55;
      uniforms.uPointer.value.set(combinedX, combinedY);

      // Continuous fluid 3D cosmic rotation + tilt
      points.rotation.y += dt * 0.12 + gyroX * 0.012;
      points.rotation.x = 0.28 + combinedY * 0.26;
      points.rotation.z = -combinedX * 0.16;

      // Smooth scroll parallax
      currentScrollY += (targetScrollY - currentScrollY) * 0.08;
      const scrollNorm = currentScrollY / Math.max(window.innerHeight, 1);
      camera.position.y = 3.15 - Math.sin(scrollNorm * 0.28) * 0.4;
      points.position.y = -Math.sin(scrollNorm * 0.22) * 0.35;

      // Dynamic opacity: 1.0 in hero -> smoothly reduce to 0.18 once scrolled past hero
      // This ensures 100% readability of text and information while keeping ambient galaxy depth
      const heroThreshold = Math.max(window.innerHeight * 0.55, 300);
      let targetOpacity = 1.0;
      if (currentScrollY <= heroThreshold) {
        const progress = Math.max(0, currentScrollY / heroThreshold);
        // Smoothstep curve for seamless easing
        const t = progress * progress * (3 - 2 * progress);
        targetOpacity = 1.0 - t * (1.0 - 0.18);
      } else {
        targetOpacity = 0.18;
      }

      // Graceful fade out only when scrolling into the stark white footer
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const distFromBottom = maxScroll - currentScrollY;
      if (distFromBottom < 340) {
        const fade = Math.max(0, distFromBottom / 340);
        targetOpacity *= fade;
      }

      renderer.domElement.style.opacity = targetOpacity.toFixed(3);

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
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

  return <div ref={containerRef} className="global-galaxy-canvas" aria-hidden="true" />;
}
