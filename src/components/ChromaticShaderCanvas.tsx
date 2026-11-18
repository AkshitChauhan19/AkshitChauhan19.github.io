import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ChromaticShaderCanvasProps {
  velocityRef: React.MutableRefObject<number>;
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Ultra-lightweight analytical iridescent silk fluid shader
// Mirrors lewiszhang.dev/work pearlescent white / periwinkle / sky-cyan / violet folds at locked 120fps
const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform float uVelocity;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // Subtle pointer & carousel momentum warp
    vec2 mouse = (uPointer - 0.5) * vec2(aspect, 1.0);
    float mDist = length(p - mouse);
    float mPull = exp(-mDist * 2.1) * 0.22;

    float t = uTime * 0.32;
    float velShift = clamp(uVelocity * 0.012, -0.8, 0.8);

    // Two graceful folded fluid ribbons matching the upper/lower pearl domes on lewiszhang.dev/work
    float wave1 = sin(p.x * 2.35 + t + velShift + cos(p.y * 2.6 - t * 0.8) * 0.9);
    float wave2 = cos(p.x * 1.85 - t * 0.75 - p.y * 2.1 + mPull * 3.0);
    float fold = sin((p.y * 2.4 + wave1 * 0.52 + wave2 * 0.35) * 1.45);

    // Pearlescent base palette
    vec3 pearlWhite = vec3(0.918, 0.922, 0.935);
    vec3 periwinkle = vec3(0.555, 0.615, 0.985);
    vec3 lavender = vec3(0.685, 0.545, 0.985);
    vec3 skyCyan = vec3(0.455, 0.815, 0.975);
    vec3 softBlush = vec3(0.935, 0.795, 0.945);

    // Top and bottom soft pearlescent light orbs (exact silhouette from /work)
    float topDome = smoothstep(0.62, 0.05, length(vec2(p.x * 0.85, p.y - 0.56 - wave1 * 0.06)));
    float bottomDome = smoothstep(0.66, 0.06, length(vec2(p.x * 0.82, p.y + 0.56 + wave2 * 0.06)));

    vec3 chromatic = mix(periwinkle, skyCyan, smoothstep(-0.8, 0.9, p.x * 0.9 + wave2 * 0.45));
    chromatic = mix(chromatic, lavender, smoothstep(-0.3, 0.85, -p.x * 0.75 + fold * 0.55));
    chromatic = mix(chromatic, softBlush, smoothstep(0.35, 0.95, abs(fold) * 0.7 + mPull));

    float domeMask = clamp(topDome + bottomDome, 0.0, 1.0);
    vec3 color = mix(chromatic, pearlWhite, smoothstep(0.08, 0.86, domeMask));

    // Iridescent ribbon edge sheen
    float ribbonSheen = exp(-pow(domeMask - 0.38, 2.0) * 32.0);
    color += vec3(0.06, 0.04, 0.09) * ribbonSheen;

    // Fine subtle film grain to prevent gradient banding
    float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.028;
    color += grain;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

export function ChromaticShaderCanvas({ velocityRef }: ChromaticShaderCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Smooth gradients look identical at 1.25 DPR while cutting GPU fragment cost by 60%+
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(width, height) },
      uVelocity: { value: 0 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    const targetPtr = { x: 0.5, y: 0.5 };
    const currentPtr = { x: 0.5, y: 0.5 };
    let smoothVel = 0;
    let rafId = 0;
    let last = performance.now();

    const onPointerMove = (e: PointerEvent) => {
      targetPtr.x = e.clientX / Math.max(window.innerWidth, 1);
      targetPtr.y = 1 - e.clientY / Math.max(window.innerHeight, 1);
    };

    const onResize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      uniforms.uResolution.value.set(w, h);
      renderer.setSize(w, h);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const dt = Math.min((now - last) * 0.001, 0.05);
      last = now;
      uniforms.uTime.value += dt;

      currentPtr.x += (targetPtr.x - currentPtr.x) * 0.05;
      currentPtr.y += (targetPtr.y - currentPtr.y) * 0.05;
      uniforms.uPointer.value.set(currentPtr.x, currentPtr.y);

      smoothVel += (velocityRef.current - smoothVel) * 0.08;
      uniforms.uVelocity.value = smoothVel;

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [velocityRef]);

  return <div ref={hostRef} className="work-page__shader" aria-hidden="true" />;
}
