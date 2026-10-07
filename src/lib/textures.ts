import * as THREE from 'three';

/**
 * Procedural texture generator for Daisies (Margaritas).
 * Generates ultra-crisp high-res botanical textures entirely in-memory using HTML5 Canvas.
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

  const size = 1024;
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
  const radius = size * 0.48;

  // Background radial gradient for the flower center
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  bgGrad.addColorStop(0, '#a35702');     // Deep amber in the very center disc
  bgGrad.addColorStop(0.3, '#c26e03');   // Warm golden amber
  bgGrad.addColorStop(0.65, '#eab308');  // Rich sunflower yellow
  bgGrad.addColorStop(0.9, '#facc15');   // Bright radiant yellow
  bgGrad.addColorStop(1.0, '#ca8a04');   // Outer attachment border

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Bump map background neutral
  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, size, size);

  // Draw Fibonacci spiral florets (Phyllotaxis: Golden angle = 137.507764 degrees)
  const goldenAngle = 137.507764 * (Math.PI / 180);
  const totalFlorets = 750;

  for (let i = 0; i < totalFlorets; i++) {
    const r = radius * Math.sqrt(i / totalFlorets) * 0.96;
    const theta = i * goldenAngle;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);

    const normDist = r / radius;
    const floretRadius = 3.0 + normDist * 4.5;

    // Floret color variation (inner tubular florets are amber/bronze, outer open florets are bright yellow)
    ctx.beginPath();
    ctx.arc(x, y, floretRadius, 0, Math.PI * 2);

    if (normDist < 0.22) {
      ctx.fillStyle = i % 2 === 0 ? '#78350f' : '#92400e';
    } else if (normDist < 0.55) {
      ctx.fillStyle = i % 3 === 0 ? '#b45309' : '#d97706';
    } else if (normDist < 0.85) {
      ctx.fillStyle = i % 2 === 0 ? '#eab308' : '#facc15';
    } else {
      ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#fef08a';
    }
    ctx.fill();

    // Subtle dark center dot on each floret
    ctx.beginPath();
    ctx.arc(x, y, floretRadius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = normDist < 0.4 ? 'rgba(60, 20, 0, 0.45)' : 'rgba(160, 90, 0, 0.3)';
    ctx.fill();

    // Bump map height map
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, floretRadius * 0.85, 0, Math.PI * 2);
    const bumpShade = Math.floor(190 + Math.sin(i * 1.8) * 55);
    bumpCtx.fillStyle = `rgb(${bumpShade}, ${bumpShade}, ${bumpShade})`;
    bumpCtx.fill();

    // Center indentation on bump map
    bumpCtx.beginPath();
    bumpCtx.arc(x, y, floretRadius * 0.3, 0, Math.PI * 2);
    bumpCtx.fillStyle = '#666666';
    bumpCtx.fill();
  }

  // Soft rim shadow
  const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, radius);
  rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
  rimGrad.addColorStop(1, 'rgba(120, 60, 0, 0.4)');
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

  const width = 256;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Pure silk white base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Soft longitudinal vein lines (silk texture)
  ctx.strokeStyle = 'rgba(230, 235, 230, 0.45)';
  ctx.lineWidth = 1.4;
  for (let i = 28; i < width - 28; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, height);
    ctx.bezierCurveTo(i - 5, height * 0.7, i + 5, height * 0.3, i, 0);
    ctx.stroke();
  }

  // Base attachment gradient (pale lime/chartreuse green where petal attaches to center)
  // In UV mapping: v=0 is at bottom (y=height)
  const baseGrad = ctx.createLinearGradient(0, height, 0, height * 0.72);
  baseGrad.addColorStop(0, 'rgba(120, 185, 65, 0.85)');
  baseGrad.addColorStop(0.35, 'rgba(180, 225, 120, 0.45)');
  baseGrad.addColorStop(0.7, 'rgba(235, 250, 200, 0.15)');
  baseGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, height * 0.65, width, height * 0.35);

  // Subtle translucent edge shading
  const edgeGrad = ctx.createLinearGradient(0, 0, width, 0);
  edgeGrad.addColorStop(0, 'rgba(225, 232, 225, 0.35)');
  edgeGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0)');
  edgeGrad.addColorStop(0.88, 'rgba(255, 255, 255, 0)');
  edgeGrad.addColorStop(1, 'rgba(225, 232, 225, 0.35)');
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
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 3 + Math.random() * 9;
    const angle = Math.random() * Math.PI;

    const greens = ['#386b31', '#1f441b', '#48823f', '#2a5525', '#559449', '#63a354'];
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

// 4. Soft Radial Glow Aura texture for magical glowing flower mode
export function createGlowTexture(): THREE.CanvasTexture {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return createFallbackTexture();
  }

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 235, 130, 1)');
  grad.addColorStop(0.2, 'rgba(255, 210, 80, 0.7)');
  grad.addColorStop(0.5, 'rgba(255, 180, 40, 0.25)');
  grad.addColorStop(0.8, 'rgba(255, 160, 20, 0.06)');
  grad.addColorStop(1, 'rgba(255, 150, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

