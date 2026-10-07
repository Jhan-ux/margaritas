import * as THREE from 'three';

/**
 * Procedural texture generator for Daisies (Margaritas).
 * Generates high-res textures entirely in-memory using HTML5 Canvas.
 */

function createFallbackTexture(): THREE.CanvasTexture {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return new THREE.CanvasTexture(canvas);
  }
  return new THREE.Texture() as unknown as THREE.CanvasTexture;
}

// 1. Center Disc (Botón Floral / Capítulo) with Phyllotaxis pattern
export function createFlowerCenterTexture(): { texture: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      texture: createFallbackTexture(),
      bumpMap: createFallbackTexture(),
    };
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.46;

  // Background gradient for the flower center
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  bgGrad.addColorStop(0, '#c27803');     // Darker golden amber in the very center
  bgGrad.addColorStop(0.35, '#d98b04');  // Rich golden orange
  bgGrad.addColorStop(0.7, '#f5af0b');   // Vibrant golden yellow
  bgGrad.addColorStop(0.92, '#facc15');  // Bright sunny yellow
  bgGrad.addColorStop(1, '#eab308');     // Outer border rim

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Bump map background
  bumpCtx.fillStyle = '#666666';
  bumpCtx.fillRect(0, 0, size, size);

  // Draw Fibonacci spiral florets (Phyllotaxis: Golden angle = 137.508 degrees)
  const goldenAngle = 137.507764 * (Math.PI / 180);
  const totalFlorets = 600;

  for (let i = 0; i < totalFlorets; i++) {
    const r = radius * Math.sqrt(i / totalFlorets);
    const theta = i * goldenAngle;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);

    const floretRadius = 2.2 + (r / radius) * 3.5;
    const normDist = r / radius;

    // Floret color variation
    ctx.beginPath();
    ctx.arc(x, y, floretRadius, 0, Math.PI * 2);
    if (normDist < 0.25) {
      ctx.fillStyle = i % 2 === 0 ? '#9a5c02' : '#b46d03';
    } else if (normDist < 0.65) {
      ctx.fillStyle = i % 3 === 0 ? '#d97706' : '#f59e0b';
    } else {
      ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#fef08a';
    }
    ctx.fill();

    // Bump map dot
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, floretRadius * 0.8, 0, Math.PI * 2);
    const bumpShade = Math.floor(180 + Math.sin(i * 1.5) * 60);
    bumpCtx.fillStyle = `rgb(${bumpShade}, ${bumpShade}, ${bumpShade})`;
    bumpCtx.fill();
  }

  // Soft rim shadow
  const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius);
  rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
  rimGrad.addColorStop(1, 'rgba(100,50,0,0.4)');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.ClampToEdgeWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;

  return { texture, bumpMap };
}

// 2. Petal Texture (Subtle ribbed longitudinal striations and green base gradient)
export function createPetalTexture(): THREE.CanvasTexture {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return createFallbackTexture();
  }

  const width = 128;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // White base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Soft longitudinal vein lines
  ctx.strokeStyle = 'rgba(235, 240, 235, 0.55)';
  ctx.lineWidth = 1.2;
  for (let i = 20; i < width - 20; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.bezierCurveTo(i - 4, height * 0.3, i + 4, height * 0.7, i, height);
    ctx.stroke();
  }

  // Base attachment gradient (pale chartreuse / lime green where petal meets the stem)
  const baseGrad = ctx.createLinearGradient(0, height, 0, height * 0.75);
  baseGrad.addColorStop(0, 'rgba(145, 195, 80, 0.75)');
  baseGrad.addColorStop(0.5, 'rgba(210, 240, 160, 0.35)');
  baseGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);

  // Edge softness
  const edgeGrad = ctx.createLinearGradient(0, 0, width, 0);
  edgeGrad.addColorStop(0, 'rgba(230, 238, 230, 0.4)');
  edgeGrad.addColorStop(0.15, 'rgba(255, 255, 255, 0)');
  edgeGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0)');
  edgeGrad.addColorStop(1, 'rgba(230, 238, 230, 0.4)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 3. Ground / Meadow grass detail texture
export function createGrassTexture(): THREE.CanvasTexture {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return createFallbackTexture();
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base lush meadow green
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, size, size);

  // Varied grass speckles and blades
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 3 + Math.random() * 8;
    const angle = Math.random() * Math.PI;

    const greens = ['#386b31', '#1f441b', '#48823f', '#2a5525', '#559449'];
    ctx.strokeStyle = greens[Math.floor(Math.random() * greens.length)];
    ctx.lineWidth = 1 + Math.random() * 1.5;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
}
