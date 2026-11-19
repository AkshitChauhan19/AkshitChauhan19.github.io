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

    // Organic cosmic swirl and harmonic ripple waves on GPU
    float wave = sin(uTime * 0.95 + pos.x * 1.8 + pos.y * 1.5 + aRandom * 6.2831);
    float radial = length(pos.xz);
    pos.y += wave * 0.055 * (0.35 + radial * 0.35);
    pos.x += cos(uTime * 0.6 + aRandom * 6.2831) * 0.028 * (0.5 + radial * 0.4);
    pos.z += sin(uTime * 0.6 + aRandom * 6.2831) * 0.028 * (0.5 + radial * 0.4);

    // Subtle pointer + gyroscope sway
    pos.x += uPointer.x * 0.22 * (0.4 + radial * 0.3);
    pos.y += uPointer.y * 0.18 * (0.4 + radial * 0.3);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float shimmer = 0.82 + 0.18 * sin(uTime * 2.4 + aRandom * 25.0);
    gl_PointSize = aScale * uPixelRatio * (28.0 / max(-mvPosition.z, 0.85)) * shimmer;

    vColor = aColor;
    vAlpha = clamp(0.72 + 0.28 * shimmer, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered);
    if (dist > 0.5) discard;

    // Glowing luminous core with soft radiant halo
    float strength = pow(1.0 - dist * 2.0, 1.75);
    gl_FragColor = vec4(vColor, strength * vAlpha * 0.98);
  }
`;

function buildGalaxyParticleGeometry(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const randoms = new Float32Array(count);

  // Vibrant, glowing color palette — NO muddy or dark shades
  const cWhite = new THREE.Color('#ffffff');
  const cGold = new THREE.Color('#ffd43b');
  const cAmber = new THREE.Color('#ffa94d');
  const cFlame = new THREE.Color('#ff7828');
  const cRose = new THREE.Color('#ff6b6b');
  const cCrimson = new THREE.Color('#e03131');
  const cChampagne = new THREE.Color('#ffe8cc');
  const tmpColor = new THREE.Color();

  const numArms = 4;
  const armCurl = 3.2;

  for (let i = 0; i < count; i++) {
    const t = i / count;

    if (t < 0.28) {
      // 1. DENSE LUMINOUS CORE & PHYLLOTAXIS ROSE WHORL (Hero focal nucleus)
      const u = t / 0.28;
      const goldenAngle = 2.399963229728653;
      const theta = i * goldenAngle;
      const r = Math.pow(u, 0.62) * 2.15;
      const cup = Math.pow(u, 1.4) * 0.92 - Math.cos(u * Math.PI * 1.5) * 0.45;
      const jitter = (Math.random() - 0.5) * 0.12 * (0.2 + u);

      positions[i * 3] = Math.cos(theta) * r + jitter;
      positions[i * 3 + 1] = cup + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = Math.sin(theta) * r + jitter;

      if (u < 0.2) {
        tmpColor.copy(cWhite).lerp(cGold, u / 0.2);
      } else if (u < 0.6) {
        tmpColor.copy(cGold).lerp(cAmber, (u - 0.2) / 0.4);
      } else {
        tmpColor.copy(cAmber).lerp(cFlame, (u - 0.6) / 0.4);
      }
      scales[i] = 1.0 + Math.random() * 1.6;
    } else if (t < 0.72) {
      // 2. FOUR EXPANSIVE SPIRAL ARMS SWEEPING ACROSS THE ENTIRE CANVAS
      const u = (t - 0.28) / 0.44;
      const armIndex = i % numArms;
      const armBaseAngle = (armIndex / numArms) * Math.PI * 2;

      // Radius sweeps from 0.8 out to 6.2 (covers entire screen width & height)
      const r = 0.8 + Math.pow(u, 0.75) * 5.4;
      const theta = armBaseAngle + Math.log(r + 0.5) * armCurl;

      // Arm width dispersion increases with distance
      const dispersion = 0.18 + 0.38 * (r / 6.2);
      const angleJitter = (Math.random() - 0.5) * dispersion;
      const radiusJitter = (Math.random() - 0.5) * 0.4;
      const finalR = Math.max(0.2, r + radiusJitter);

      // Flared vertical height of galaxy disc
      const height = (Math.random() - 0.5) * (0.4 + 0.35 * (r / 6.2));

      positions[i * 3] = Math.cos(theta + angleJitter) * finalR;
      positions[i * 3 + 1] = height + Math.sin(theta * 2.0) * 0.15;
      positions[i * 3 + 2] = Math.sin(theta + angleJitter) * finalR;

      // Color transitions along the arm: warm amber near center -> vibrant rose & crimson outer
      const colorMix = u;
      if (colorMix < 0.35) {
        tmpColor.copy(cGold).lerp(cAmber, colorMix / 0.35);
      } else if (colorMix < 0.75) {
        tmpColor.copy(cAmber).lerp(cRose, (colorMix - 0.35) / 0.4);
      } else {
        tmpColor.copy(cRose).lerp(cCrimson, (colorMix - 0.75) / 0.25);
      }

      // 10% chance of an incandescent highlight star
      if (Math.random() < 0.1) {
        tmpColor.copy(cChampagne);
      }

      scales[i] = 0.9 + Math.random() * 1.5;
    } else {
      // 3. VOLUMETRIC COSMIC DUST & GLOWING EMBERS FILLING THE ENTIRE 3D SPACE
      // Distributed across the entire field of view so every part of the webpage is uniformly filled
      const r = 0.5 + Math.pow(Math.random(), 0.5) * 5.8;
      const theta = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 5.2;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      const seed = Math.random();
      if (seed < 0.3) {
        tmpColor.copy(cWhite).lerp(cGold, Math.random());
      } else if (seed < 0.65) {
        tmpColor.copy(cAmber).lerp(cFlame, Math.random());
      } else {
        tmpColor.copy(cRose).lerp(cCrimson, Math.random());
      }

      scales[i] = 0.75 + Math.random() * 1.4;
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
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 3.2, 5.0);
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
    const geometry = buildGalaxyParticleGeometry(isMobile ? 12000 : 22000);

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
    points.rotation.x = 0.32;
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

      // Scale galaxy smoothly so spiral arms reach the edges on any screen
      const galaxyScale = aspect < 1 ? Math.max(0.72, aspect * 1.25) : 1.05;
      points.scale.setScalar(galaxyScale);
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

      // Continuous fluid 3D cosmic rotation + tilt — constant speed and presence
      points.rotation.y += dt * 0.14 + gyroX * 0.012;
      points.rotation.x = 0.32 + combinedY * 0.24;
      points.rotation.z = -combinedX * 0.16;

      // Gentle continuous parallax travel with scroll
      currentScrollY += (targetScrollY - currentScrollY) * 0.08;
      const scrollNorm = currentScrollY / Math.max(window.innerHeight, 1);
      camera.position.y = 3.2 - Math.sin(scrollNorm * 0.28) * 0.35;
      points.position.y = -Math.sin(scrollNorm * 0.22) * 0.3;

      // Graceful fade out only when entering the stark white footer
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const distFromBottom = maxScroll - currentScrollY;
      if (distFromBottom < 340) {
        const fade = Math.max(0, distFromBottom / 340);
        renderer.domElement.style.opacity = `${fade}`;
      } else if (renderer.domElement.style.opacity !== '1') {
        renderer.domElement.style.opacity = '1';
      }

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
