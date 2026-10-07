import * as THREE from 'three';

export interface PetalData {
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  angle: number;
  length: number;
  baseRotX: number;
  baseRotY: number;
  baseRotZ: number;
  radiusOffset: number;
  yOffset: number;
  isPlucked: boolean;
  bloomDelay: number;
}

export interface FallingPetal {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  flutterPhase: number;
  flutterSpeed: number;
  life: number;
  maxLife: number;
}

/**
 * Creates a single organic daisy petal geometry.
 * Base is centered at (0, 0, 0), extending forward along +Z from z=0 to z=length.
 * Width is along X, cup/curvature is along Y, normal faces upward (+Y).
 */
export function createDaisyPetalGeometry(length = 1.45, width = 0.32): THREE.BufferGeometry {
  const xSegments = 10;
  const zSegments = 24;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= zSegments; j++) {
    const t = j / zSegments; // 0 = base, 1 = tip
    const z = t * length;

    // Botanical width profile:
    // Slender base (t=0 -> 0.35 width), widest at 60-70% length, gently tapering to a soft rounded tip
    let widthFactor = 1.0;
    if (t < 0.25) {
      widthFactor = 0.35 + (t / 0.25) * 0.65;
    } else if (t > 0.7) {
      const tipRatio = (t - 0.7) / 0.3;
      widthFactor = 1.0 - Math.pow(tipRatio, 1.7) * 0.48;
    }

    const currentWidth = width * widthFactor;

    for (let i = 0; i <= xSegments; i++) {
      const uFactor = i / xSegments; // 0 = left edge, 1 = right edge
      const x = (uFactor - 0.5) * currentWidth;

      // Spoon cupping effect: longitudinal depression along petal center
      const normX = (uFactor - 0.5) * 2.0; // -1 to 1
      const cupDepth = -0.045 * (1.0 - normX * normX) * Math.sin(t * Math.PI);

      // Organic upward/downward tip curl
      const tipCurl = Math.pow(t, 2.3) * 0.09;

      const y = cupDepth + tipCurl;

      positions.push(x, y, z);
      // UV: u across width (0 to 1), v along length (0 at base, 1 at tip)
      uvs.push(uFactor, t);
    }
  }

  // Generate triangle strip indices
  for (let j = 0; j < zSegments; j++) {
    for (let i = 0; i < xSegments; i++) {
      const row1 = j * (xSegments + 1);
      const row2 = (j + 1) * (xSegments + 1);

      const a = row1 + i;
      const b = row1 + i + 1;
      const c = row2 + i;
      const d = row2 + i + 1;

      // Two triangles per quad
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates a smooth domed center disc (Capítulo) with planar top-down UV projection
 * so Fibonacci phyllotaxis spirals map cleanly without distortion.
 */
export function createDaisyCenterGeometry(radius = 0.52, height = 0.18): THREE.BufferGeometry {
  const rings = 16;
  const segments = 48;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Apex (center top)
  positions.push(0, height, 0);
  uvs.push(0.5, 0.5);

  for (let r = 1; r <= rings; r++) {
    const rf = r / rings;
    const currentRadius = radius * rf;
    // Cosine dome profile
    const currentHeight = height * Math.cos(rf * (Math.PI / 2));

    for (let s = 0; s < segments; s++) {
      const theta = (s / segments) * Math.PI * 2;
      const x = Math.cos(theta) * currentRadius;
      const z = Math.sin(theta) * currentRadius;
      positions.push(x, currentHeight, z);

      // Planar top-down UV projection
      const u = x / (radius * 2.05) + 0.5;
      const v = z / (radius * 2.05) + 0.5;
      uvs.push(u, v);
    }
  }

  // Apex fan
  for (let s = 0; s < segments; s++) {
    const nextS = (s + 1) % segments;
    indices.push(0, s + 1, nextS + 1);
  }

  // Ring strips
  for (let r = 1; r < rings; r++) {
    const innerStart = 1 + (r - 1) * segments;
    const outerStart = 1 + r * segments;
    for (let s = 0; s < segments; s++) {
      const nextS = (s + 1) % segments;
      const i0 = innerStart + s;
      const i1 = innerStart + nextS;
      const i2 = outerStart + s;
      const i3 = outerStart + nextS;

      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates green receptacle cup for underside of the flower head
 */
export function createReceptacleGeometry(radius = 0.50, depth = 0.22): THREE.BufferGeometry {
  const geom = new THREE.ConeGeometry(radius, depth, 32, 1, false);
  geom.rotateX(Math.PI);
  geom.translate(0, -depth / 2, 0);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Daisy flower 3D representation
 */
export class DaisyFlower {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public stemMesh: THREE.Mesh | null = null;
  public centerMesh: THREE.Mesh;
  public receptacleMesh: THREE.Mesh;
  public sepalsGroup: THREE.Group;
  public petals: PetalData[] = [];
  public bloomProgress: number = 1.0;
  public targetBloom: number = 1.0;
  public windPhase: number = Math.random() * Math.PI * 2;
  public height: number = 3.2;
  public baseStemCurve: THREE.CatmullRomCurve3;
  public isInteractive: boolean = false;
  public glowSprite: THREE.Sprite | null = null;

  private petalMaterial: THREE.MeshStandardMaterial;
  private centerMaterial: THREE.MeshStandardMaterial;
  private stemMaterial: THREE.MeshStandardMaterial;

  constructor(
    textures: {
      center: THREE.CanvasTexture;
      centerBump: THREE.CanvasTexture;
      petal: THREE.CanvasTexture;
      glow?: THREE.CanvasTexture;
    },
    options: {
      height?: number;
      stemBend?: { x: number; z: number };
      isInteractive?: boolean;
      petalCount?: number;
    } = {}
  ) {
    this.height = options.height || 3.2;
    this.isInteractive = !!options.isInteractive;
    this.group = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.sepalsGroup = new THREE.Group();

    // 1. High Quality Botanical Materials
    this.petalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.petal,
      roughness: 0.32,
      metalness: 0.02,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });

    this.centerMaterial = new THREE.MeshStandardMaterial({
      map: textures.center,
      bumpMap: textures.centerBump,
      bumpScale: 0.06,
      roughness: 0.65,
      metalness: 0.04,
    });

    this.stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x417826,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    // 2. Build Domed Flower Center (Capítulo)
    const centerGeom = createDaisyCenterGeometry(0.52, 0.18);
    this.centerMesh = new THREE.Mesh(centerGeom, this.centerMaterial);
    this.centerMesh.castShadow = true;
    this.centerMesh.receiveShadow = true;
    this.headGroup.add(this.centerMesh);

    // 3. Build Receptacle (Cáliz verde de apoyo)
    const receptacleGeom = createReceptacleGeometry(0.50, 0.20);
    this.receptacleMesh = new THREE.Mesh(receptacleGeom, this.stemMaterial);
    this.receptacleMesh.castShadow = true;
    this.receptacleMesh.receiveShadow = true;
    this.headGroup.add(this.receptacleMesh);

    // Green Involucral Bracts (Sepal teeth surrounding bottom)
    const sepalCount = 18;
    for (let i = 0; i < sepalCount; i++) {
      const angle = (i / sepalCount) * Math.PI * 2;
      const toothGeom = new THREE.ConeGeometry(0.065, 0.26, 4);
      toothGeom.rotateX(Math.PI / 2);
      const tooth = new THREE.Mesh(toothGeom, this.stemMaterial);

      tooth.position.set(Math.cos(angle) * 0.46, -0.04, Math.sin(angle) * 0.46);
      tooth.rotation.y = -angle + Math.PI / 2;
      tooth.rotation.x = 0.35;
      this.sepalsGroup.add(tooth);
    }
    this.headGroup.add(this.sepalsGroup);

    // 4. Build Petals arranged radially in 360 degrees (2 natural overlapping layers)
    const petalCount = options.petalCount || 30;
    const basePetalGeom = createDaisyPetalGeometry(1.45, 0.32);

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const isInnerLayer = i % 2 === 1;

      // Radial offsets: inner petals sit slightly higher and closer to center
      const radiusOffset = isInnerLayer ? 0.36 : 0.43;
      const yOffset = isInnerLayer ? 0.025 : -0.01;
      const lengthVariation = 0.95 + Math.random() * 0.12;

      // Dedicated pivot for exact radial heading
      const pivot = new THREE.Group();
      pivot.rotation.y = angle;
      this.headGroup.add(pivot);

      const petalMesh = new THREE.Mesh(basePetalGeom, this.petalMaterial);
      petalMesh.castShadow = true;
      petalMesh.receiveShadow = true;
      petalMesh.scale.set(1.0, 1.0, lengthVariation);

      // Position petal along +Z in its local pivot coordinate space
      petalMesh.position.set(0, yOffset, radiusOffset);

      // Natural organic droop: petals gently curve downward
      const baseDroop = isInnerLayer ? 0.05 + Math.random() * 0.05 : 0.12 + Math.random() * 0.08;
      const baseRoll = (Math.random() - 0.5) * 0.06;
      const baseYaw = (Math.random() - 0.5) * 0.04;

      petalMesh.rotation.set(baseDroop, baseYaw, baseRoll);
      pivot.add(petalMesh);

      // Metadata for bloom, raycasting & pluck physics
      const petalData: PetalData = {
        pivot,
        mesh: petalMesh,
        angle,
        length: 1.45 * lengthVariation,
        baseRotX: baseDroop,
        baseRotY: baseYaw,
        baseRotZ: baseRoll,
        radiusOffset,
        yOffset,
        isPlucked: false,
        bloomDelay: (i / petalCount) * 0.28,
      };

      petalMesh.userData = {
        isPetal: true,
        petalIndex: i,
        parentFlower: this,
        data: petalData,
      };

      this.petals.push(petalData);
    }

    // 5. Build Curved Stem & Leaves
    const bendX = options.stemBend?.x ?? (Math.random() - 0.5) * 0.35;
    const bendZ = options.stemBend?.z ?? (Math.random() - 0.5) * 0.35;

    this.baseStemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(bendX * 0.25, this.height * 0.3, bendZ * 0.25),
      new THREE.Vector3(bendX * 0.65, this.height * 0.68, bendZ * 0.65),
      new THREE.Vector3(bendX, this.height, bendZ),
    ]);

    const stemGeom = new THREE.TubeGeometry(this.baseStemCurve, 32, 0.075, 12, false);
    this.stemMesh = new THREE.Mesh(stemGeom, this.stemMaterial);
    this.stemMesh.castShadow = true;
    this.stemMesh.receiveShadow = true;
    this.group.add(this.stemMesh);

    // Leaves along the stem
    this.addLeaves();

    // Attach head to top of stem
    this.headGroup.position.set(bendX, this.height, bendZ);
    // Slight natural angle toward the sun
    this.headGroup.rotation.x = 0.22 + (Math.random() - 0.5) * 0.12;
    this.headGroup.rotation.z = (Math.random() - 0.5) * 0.15;

    // Glowing aura halo sprite (for magical Flores Brillantes mode)
    if (textures.glow) {
      const glowMat = new THREE.SpriteMaterial({
        map: textures.glow,
        color: 0xffd043,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      this.glowSprite = new THREE.Sprite(glowMat);
      this.glowSprite.scale.set(3.4, 3.4, 1);
      this.glowSprite.position.set(0, 0.05, 0);
      this.glowSprite.visible = false;
      this.headGroup.add(this.glowSprite);
    }

    this.group.add(this.headGroup);
  }

  private addLeaves() {
    const leafGeom = new THREE.PlaneGeometry(0.38, 0.95, 4, 8);
    const pos = leafGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const ny = (y + 0.475) / 0.95;
      const widthF = Math.sin(ny * Math.PI) * 1.15;
      pos.setX(i, x * widthF);
      pos.setZ(i, -0.045 * (1.0 - Math.abs(x * 2)));
    }
    leafGeom.translate(0, 0.475, 0);
    leafGeom.computeVertexNormals();

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d7024,
      roughness: 0.48,
      side: THREE.DoubleSide,
    });

    const leafHeights = [0.32, 0.55, 0.76];
    leafHeights.forEach((hFraction, idx) => {
      const pt = this.baseStemCurve.getPoint(hFraction);
      const leaf = new THREE.Mesh(leafGeom, leafMaterial);
      leaf.castShadow = true;
      leaf.position.copy(pt);
      const angle = idx * 2.2 + (Math.random() - 0.5) * 0.4;
      leaf.rotation.y = angle;
      leaf.rotation.z = 0.65 + Math.random() * 0.25;
      leaf.rotation.x = 0.25;
      leaf.scale.setScalar(0.75 + Math.random() * 0.3);
      this.group.add(leaf);
    });
  }

  /**
   * Plucks a specific petal and returns world transformation for falling physics
   */
  public pluckPetal(index: number): { position: THREE.Vector3; quaternion: THREE.Quaternion; mesh: THREE.Mesh } | null {
    const petalData = this.petals[index];
    if (!petalData || petalData.isPlucked) return null;

    petalData.isPlucked = true;
    const mesh = petalData.mesh;

    // Get world position and rotation before removing from flower head
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    mesh.getWorldPosition(worldPos);
    mesh.getWorldQuaternion(worldQuat);

    // Detach from pivot
    petalData.pivot.remove(mesh);

    return { position: worldPos, quaternion: worldQuat, mesh };
  }

  /**
   * Regrows all plucked petals with a blooming animation
   */
  public resetPetals() {
    this.petals.forEach((p) => {
      if (p.isPlucked) {
        p.isPlucked = false;
        p.mesh.position.set(0, p.yOffset, p.radiusOffset);
        p.mesh.rotation.set(-1.22, p.baseRotY, p.baseRotZ);
        p.mesh.scale.set(0.001, 0.001, 0.001);
        p.pivot.add(p.mesh);
      }
    });
    this.bloomProgress = 0.0;
    this.targetBloom = 1.0;
  }

  public getUnpluckedCount(): number {
    return this.petals.filter((p) => !p.isPlucked).length;
  }

  /**
   * Updates wind animation and blooming state
   */
  public update(time: number, windStrength: number, delta: number) {
    // 1. Smooth bloom interpolation
    if (Math.abs(this.bloomProgress - this.targetBloom) > 0.002) {
      this.bloomProgress += (this.targetBloom - this.bloomProgress) * delta * 2.8;
    } else {
      this.bloomProgress = this.targetBloom;
    }

    // 2. Petal bloom scaling and unfurling
    const bp = this.bloomProgress;
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      if (p.isPlucked) continue;

      // Individual staggered blooming
      const petalBloom = Math.min(Math.max((bp - p.bloomDelay * 0.35) / 0.75, 0.001), 1.0);
      const scaleEase = Math.sin((petalBloom * Math.PI) / 2);

      p.mesh.scale.set(scaleEase, scaleEase, scaleEase * (p.length / 1.45));

      // Unfurl angle: when closed bud (bp=0), petals stand upright (-1.22 rad); when bloomed, open to baseDroop
      const closedTilt = -1.22; // ~ -70 degrees upright bud
      const currentTiltX = THREE.MathUtils.lerp(closedTilt, p.baseRotX, scaleEase);

      // Micro-flutter in wind (natural gentle wobble)
      let flutter = 0;
      if (windStrength > 0.01) {
        flutter = Math.sin(time * 3.5 + p.angle * 3.0) * 0.035 * windStrength;
      }

      p.mesh.rotation.x = currentTiltX + flutter;
    }

    // Center disc scales gracefully with bloom
    const centerScale = 0.65 + bp * 0.35;
    this.centerMesh.scale.set(centerScale, centerScale, centerScale);
    this.receptacleMesh.scale.set(centerScale, centerScale, centerScale);

    // 3. Flower Wind Swaying
    if (windStrength > 0.001) {
      const swayX = Math.sin(time * 1.5 + this.windPhase) * 0.075 * windStrength;
      const swayZ = Math.cos(time * 1.2 + this.windPhase * 1.3) * 0.065 * windStrength;
      const gust = Math.sin(time * 0.65 + this.windPhase * 0.6) * 0.035 * windStrength;

      this.headGroup.rotation.x = 0.22 + swayX + gust;
      this.headGroup.rotation.z = swayZ;

      // Secondary sway on stem
      if (this.stemMesh) {
        this.stemMesh.rotation.x = swayX * 0.35;
        this.stemMesh.rotation.z = swayZ * 0.35;
      }
    }
  }

  public setGlowMode(enabled: boolean) {
    if (this.glowSprite) {
      this.glowSprite.visible = enabled;
    }
    if (enabled) {
      this.petalMaterial.emissive.setHex(0xffea75);
      this.petalMaterial.emissiveIntensity = 0.55;
      this.centerMaterial.emissive.setHex(0xff9400);
      this.centerMaterial.emissiveIntensity = 1.05;
      this.stemMaterial.emissive.setHex(0x286918);
      this.stemMaterial.emissiveIntensity = 0.28;
    } else {
      this.petalMaterial.emissive.setHex(0x000000);
      this.petalMaterial.emissiveIntensity = 0;
      this.centerMaterial.emissive.setHex(0x000000);
      this.centerMaterial.emissiveIntensity = 0;
      this.stemMaterial.emissive.setHex(0x000000);
      this.stemMaterial.emissiveIntensity = 0;
    }
  }
}


/**
 * Ambient floating petals drifting through the wind
 */
export class AmbientPetalSystem {
  public group: THREE.Group;
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    rotSpeed: THREE.Vector3;
    initialPos: THREE.Vector3;
    scale: number;
  }[] = [];

  constructor(count = 35, petalTexture: THREE.CanvasTexture) {
    this.group = new THREE.Group();
    const geom = createDaisyPetalGeometry(0.65, 0.16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: petalTexture,
      roughness: 0.38,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      const scale = 0.45 + Math.random() * 0.55;
      mesh.scale.setScalar(scale);

      const x = (Math.random() - 0.5) * 22;
      const y = 0.4 + Math.random() * 7;
      const z = (Math.random() - 0.5) * 22;
      mesh.position.set(x, y, z);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          0.35 + Math.random() * 0.5,
          -0.18 - Math.random() * 0.25,
          (Math.random() - 0.5) * 0.4
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 2.2
        ),
        initialPos: new THREE.Vector3(x, y, z),
        scale,
      });
    }
  }

  public update(delta: number, windStrength: number) {
    const effectiveWind = 0.3 + windStrength * 1.8;

    this.particles.forEach((p) => {
      p.mesh.position.x += p.velocity.x * effectiveWind * delta;
      p.mesh.position.y += p.velocity.y * delta;
      p.mesh.position.z += p.velocity.z * effectiveWind * delta;

      // Fluttering rotation
      p.mesh.rotation.x += p.rotSpeed.x * delta;
      p.mesh.rotation.y += p.rotSpeed.y * delta;
      p.mesh.rotation.z += p.rotSpeed.z * delta;

      // Wrap around bounds
      if (p.mesh.position.x > 14) p.mesh.position.x = -14;
      if (p.mesh.position.y < 0.08) p.mesh.position.y = 7 + Math.random() * 2.5;
      if (p.mesh.position.z > 14) p.mesh.position.z = -14;
      if (p.mesh.position.z < -14) p.mesh.position.z = 14;
    });
  }
}

/**
 * Firefly system for magical night mode
 */
export class FireflySystem {
  public group: THREE.Group;
  private fireflies: {
    mesh: THREE.Mesh;
    basePos: THREE.Vector3;
    freq: number;
    phase: number;
    orbitRadius: number;
    light?: THREE.PointLight;
  }[] = [];
  public visible: boolean = false;

  constructor(count = 45) {
    this.group = new THREE.Group();
    const geom = new THREE.SphereGeometry(0.042, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xcaff3a,
      transparent: true,
      opacity: 0.95,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat.clone());
      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        0.7 + Math.random() * 4.2,
        (Math.random() - 0.5) * 16
      );
      mesh.position.copy(basePos);

      let light: THREE.PointLight | undefined;
      // Real point lights on top fireflies for realistic night glow
      if (i < 8) {
        light = new THREE.PointLight(0xcaff3a, 0.6, 3.5);
        mesh.add(light);
      }

      this.group.add(mesh);
      this.fireflies.push({
        mesh,
        basePos,
        freq: 0.8 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        orbitRadius: 0.4 + Math.random() * 1.2,
        light,
      });
    }

    this.group.visible = false;
  }

  public setVisible(val: boolean) {
    this.visible = val;
    this.group.visible = val;
  }

  public update(time: number) {
    if (!this.visible) return;

    this.fireflies.forEach((f) => {
      const t = time * f.freq + f.phase;
      f.mesh.position.x = f.basePos.x + Math.sin(t) * f.orbitRadius;
      f.mesh.position.y = f.basePos.y + Math.cos(t * 0.8) * (f.orbitRadius * 0.5);
      f.mesh.position.z = f.basePos.z + Math.cos(t) * f.orbitRadius;

      // Pulsing glow brightness
      const pulse = 0.35 + 0.65 * Math.pow(Math.sin(t * 2.2), 4);
      (f.mesh.material as THREE.MeshBasicMaterial).opacity = pulse;

      if (f.light) {
        f.light.intensity = pulse * 0.8;
      }
    });
  }
}

/**
 * Rising glowing pollen / magical dust particles for the Flores Brillantes mode
 */
export class RisingPollenSystem {
  public group: THREE.Group;
  private particles: {
    mesh: THREE.Mesh;
    baseX: number;
    baseZ: number;
    speedY: number;
    driftFreq: number;
    driftAmp: number;
    phase: number;
  }[] = [];
  public visible: boolean = false;

  constructor(count = 130) {
    this.group = new THREE.Group();
    const geom = new THREE.SphereGeometry(0.035, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffea78,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat.clone());
      const baseX = (Math.random() - 0.5) * 7;
      const baseZ = (Math.random() - 0.5) * 7;
      const y = Math.random() * 6.0;
      mesh.position.set(baseX, y, baseZ);

      const scale = 0.6 + Math.random() * 1.3;
      mesh.scale.setScalar(scale);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        baseX,
        baseZ,
        speedY: 0.35 + Math.random() * 0.6,
        driftFreq: 1.0 + Math.random() * 2.2,
        driftAmp: 0.2 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.group.visible = false;
  }

  public setVisible(val: boolean) {
    this.visible = val;
    this.group.visible = val;
  }

  public update(delta: number, time: number) {
    if (!this.visible) return;

    this.particles.forEach((p) => {
      p.mesh.position.y += p.speedY * delta;

      const t = time * p.driftFreq + p.phase;
      p.mesh.position.x = p.baseX + Math.sin(t) * p.driftAmp;
      p.mesh.position.z = p.baseZ + Math.cos(t) * p.driftAmp;

      // Soft vertical fade
      const y = p.mesh.position.y;
      const normY = y / 6.0;
      let alpha = 0.85;
      if (normY < 0.15) alpha = normY / 0.15;
      else if (normY > 0.85) alpha = (1.0 - normY) / 0.15;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, alpha * 0.9);

      if (p.mesh.position.y > 6.0) {
        p.mesh.position.y = 0.1;
        p.baseX = (Math.random() - 0.5) * 6.5;
        p.baseZ = (Math.random() - 0.5) * 6.5;
      }
    });
  }
}

