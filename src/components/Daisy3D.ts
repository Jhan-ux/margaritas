import * as THREE from 'three';
import { createFlowerCenterTexture, createPetalTexture, createGrassTexture } from '@/lib/textures';

export interface PetalData {
  mesh: THREE.Mesh;
  angle: number;
  length: number;
  baseRotX: number;
  baseRotY: number;
  baseRotZ: number;
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
 * Creates a single organic petal geometry with curvature and cupped center
 */
export function createDaisyPetalGeometry(length = 1.35, width = 0.32): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(width, length, 6, 14);
  const pos = geom.attributes.position;
  const count = pos.count;

  for (let i = 0; i < count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);

    // Normalize y along petal length from 0 (base) to 1 (tip)
    const normalizedY = (y + length / 2) / length;

    // Width curve: slender base, widest at 65% length, gently tapering and rounded at tip
    let widthFactor = 1.0;
    if (normalizedY < 0.25) {
      widthFactor = 0.4 + (normalizedY / 0.25) * 0.6;
    } else if (normalizedY > 0.8) {
      const tipRatio = (normalizedY - 0.8) / 0.2;
      widthFactor = 1.0 - Math.pow(tipRatio, 1.8) * 0.45;
    }

    pos.setX(i, x * widthFactor);

    // Cupping curve along width (spoon effect)
    const normX = Math.abs(x / (width * 0.5));
    const cupDepth = -0.06 * (1.0 - normX * normX) * Math.sin(normalizedY * Math.PI);

    // Tip curl upward/downward for organic natural look
    const curl = Math.pow(normalizedY, 2.2) * 0.12;

    pos.setZ(i, cupDepth + curl);
  }

  // Pivot point shifted to the petal base
  geom.translate(0, length / 2, 0);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Daisy flower representation
 */
export class DaisyFlower {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public stemMesh: THREE.Mesh | null = null;
  public centerMesh: THREE.Mesh;
  public sepalsGroup: THREE.Group;
  public petals: PetalData[] = [];
  public bloomProgress: number = 1.0;
  public targetBloom: number = 1.0;
  public windPhase: number = Math.random() * Math.PI * 2;
  public height: number = 3.2;
  public baseStemCurve: THREE.CatmullRomCurve3;
  public isInteractive: boolean = false;

  private petalMaterial: THREE.MeshStandardMaterial;
  private centerMaterial: THREE.MeshStandardMaterial;
  private stemMaterial: THREE.MeshStandardMaterial;

  constructor(
    textures: {
      center: THREE.CanvasTexture;
      centerBump: THREE.CanvasTexture;
      petal: THREE.CanvasTexture;
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

    // 1. Shared High Quality Materials
    this.petalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.petal,
      roughness: 0.38,
      metalness: 0.04,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });

    this.centerMaterial = new THREE.MeshStandardMaterial({
      map: textures.center,
      bumpMap: textures.centerBump,
      bumpScale: 0.08,
      roughness: 0.65,
      metalness: 0.05,
    });

    this.stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x487e2b,
      roughness: 0.55,
      metalness: 0.05,
    });

    // 2. Build Flower Center (Capítulo)
    const centerGeom = new THREE.SphereGeometry(0.55, 32, 24);
    // Squash sphere into a domed button
    centerGeom.scale(1.0, 0.42, 1.0);
    this.centerMesh = new THREE.Mesh(centerGeom, this.centerMaterial);
    this.centerMesh.castShadow = true;
    this.centerMesh.receiveShadow = true;
    this.headGroup.add(this.centerMesh);

    // 3. Build Sepals (Cáliz verde de apoyo)
    const sepalGeom = new THREE.ConeGeometry(0.48, 0.4, 16, 1, true);
    sepalGeom.rotateX(Math.PI);
    const sepalMesh = new THREE.Mesh(sepalGeom, this.stemMaterial);
    sepalMesh.position.y = -0.15;
    this.sepalsGroup.add(sepalMesh);

    // Little sepal teeth
    for (let i = 0; i < 12; i++) {
      const toothGeom = new THREE.ConeGeometry(0.08, 0.28, 4);
      const tooth = new THREE.Mesh(toothGeom, this.stemMaterial);
      const angle = (i / 12) * Math.PI * 2;
      tooth.position.set(Math.cos(angle) * 0.44, -0.05, Math.sin(angle) * 0.44);
      tooth.rotation.z = Math.cos(angle) * 0.4;
      tooth.rotation.x = -Math.sin(angle) * 0.4;
      this.sepalsGroup.add(tooth);
    }
    this.headGroup.add(this.sepalsGroup);

    // 4. Build Petals (2 layers for density and realism)
    const petalCount = options.petalCount || 30;
    const basePetalGeom = createDaisyPetalGeometry(1.45, 0.32);

    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const isInnerLayer = i % 2 === 1;
      const radiusOffset = isInnerLayer ? 0.38 : 0.44;
      const lengthVariation = 0.95 + Math.random() * 0.15;

      const petalMesh = new THREE.Mesh(basePetalGeom, this.petalMaterial.clone());
      petalMesh.castShadow = true;
      petalMesh.receiveShadow = true;

      // Scale variation
      petalMesh.scale.set(1.0, lengthVariation, 1.0);

      // Natural organic tilt: daisies have slightly drooping or slightly upturned petals
      const naturalDroop = isInnerLayer ? 0.08 + Math.random() * 0.06 : 0.18 + Math.random() * 0.1;
      const tiltX = Math.PI / 2 + naturalDroop;
      const tiltZ = -angle;

      petalMesh.position.set(
        Math.cos(angle) * radiusOffset,
        -0.02 + (isInnerLayer ? 0.04 : 0),
        Math.sin(angle) * radiusOffset
      );

      // Orient petal pointing outward radially
      petalMesh.rotation.order = 'ZYX';
      petalMesh.rotation.z = tiltZ;
      petalMesh.rotation.x = tiltX;

      // Custom metadata for interactivity & bloom
      const petalData: PetalData = {
        mesh: petalMesh,
        angle,
        length: 1.45 * lengthVariation,
        baseRotX: petalMesh.rotation.x,
        baseRotY: petalMesh.rotation.y,
        baseRotZ: petalMesh.rotation.z,
        isPlucked: false,
        bloomDelay: (i / petalCount) * 0.35,
      };

      petalMesh.userData = {
        isPetal: true,
        petalIndex: i,
        parentFlower: this,
        data: petalData,
      };

      this.petals.push(petalData);
      this.headGroup.add(petalMesh);
    }

    // 5. Build Curved Stem & Leaves
    const bendX = options.stemBend?.x || (Math.random() - 0.5) * 0.4;
    const bendZ = options.stemBend?.z || (Math.random() - 0.5) * 0.4;

    this.baseStemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(bendX * 0.3, this.height * 0.3, bendZ * 0.3),
      new THREE.Vector3(bendX * 0.7, this.height * 0.7, bendZ * 0.7),
      new THREE.Vector3(bendX, this.height, bendZ),
    ]);

    const stemGeom = new THREE.TubeGeometry(this.baseStemCurve, 28, 0.075, 10, false);
    this.stemMesh = new THREE.Mesh(stemGeom, this.stemMaterial);
    this.stemMesh.castShadow = true;
    this.stemMesh.receiveShadow = true;
    this.group.add(this.stemMesh);

    // Leaves along the stem
    this.addLeaves();

    // Attach head to top of stem
    this.headGroup.position.set(bendX, this.height, bendZ);
    // Slight natural angle toward the sun
    this.headGroup.rotation.x = 0.2 + (Math.random() - 0.5) * 0.15;
    this.headGroup.rotation.z = (Math.random() - 0.5) * 0.2;
    this.group.add(this.headGroup);
  }

  private addLeaves() {
    const leafGeom = new THREE.PlaneGeometry(0.35, 0.9, 4, 8);
    // Leaf shape tapering
    const pos = leafGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const ny = (y + 0.45) / 0.9;
      const widthF = Math.sin(ny * Math.PI) * 1.1;
      pos.setX(i, x * widthF);
      pos.setZ(i, -0.04 * (1.0 - Math.abs(x * 2)));
    }
    leafGeom.translate(0, 0.45, 0);
    leafGeom.computeVertexNormals();

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d7024,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });

    // 2-3 leaves at different heights
    const leafHeights = [0.35, 0.58, 0.78];
    leafHeights.forEach((hFraction, idx) => {
      const pt = this.baseStemCurve.getPoint(hFraction);
      const leaf = new THREE.Mesh(leafGeom, leafMaterial);
      leaf.castShadow = true;
      leaf.position.copy(pt);
      const angle = idx * 2.1 + (Math.random() - 0.5) * 0.4;
      leaf.rotation.y = angle;
      leaf.rotation.z = 0.6 + Math.random() * 0.3;
      leaf.rotation.x = 0.3;
      leaf.scale.setScalar(0.7 + Math.random() * 0.3);
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

    // Remove from head
    this.headGroup.remove(mesh);

    return { position: worldPos, quaternion: worldQuat, mesh };
  }

  /**
   * Regrows all plucked petals with a blooming animation
   */
  public resetPetals() {
    this.petals.forEach((p) => {
      if (p.isPlucked) {
        p.isPlucked = false;
        p.mesh.position.set(
          Math.cos(p.angle) * 0.42,
          -0.02,
          Math.sin(p.angle) * 0.42
        );
        p.mesh.rotation.set(p.baseRotX, p.baseRotY, p.baseRotZ);
        p.mesh.scale.set(0.001, 0.001, 0.001);
        this.headGroup.add(p.mesh);
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
    if (Math.abs(this.bloomProgress - this.targetBloom) > 0.005) {
      this.bloomProgress += (this.targetBloom - this.bloomProgress) * delta * 2.8;
    } else {
      this.bloomProgress = this.targetBloom;
    }

    // 2. Petal bloom scaling and unfurling
    const bp = this.bloomProgress;
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      if (p.isPlucked) continue;

      // Individual petals open gradually
      const petalBloom = Math.min(Math.max((bp - p.bloomDelay * 0.4) / 0.7, 0.001), 1.0);
      const scaleEase = Math.sin((petalBloom * Math.PI) / 2);

      p.mesh.scale.set(scaleEase, scaleEase, scaleEase);

      // Unfurl angle: when closed, petals point upwards like a tight bud
      const closedTilt = 0.25;
      const currentTiltX = THREE.MathUtils.lerp(closedTilt, p.baseRotX, scaleEase);
      p.mesh.rotation.x = currentTiltX;

      // Micro-flutter in wind
      if (windStrength > 0.01) {
        const flutter = Math.sin(time * 3.5 + p.angle * 4.0) * 0.035 * windStrength;
        p.mesh.rotation.x = currentTiltX + flutter;
      }
    }

    // Center disc scales with bloom
    const centerScale = 0.6 + bp * 0.4;
    this.centerMesh.scale.set(centerScale, 0.42 * centerScale, centerScale);

    // 3. Flower Wind Swaying
    if (windStrength > 0.001) {
      const swayX = Math.sin(time * 1.6 + this.windPhase) * 0.08 * windStrength;
      const swayZ = Math.cos(time * 1.3 + this.windPhase * 1.2) * 0.07 * windStrength;
      const gust = Math.sin(time * 0.7 + this.windPhase * 0.5) * 0.04 * windStrength;

      this.headGroup.rotation.x = 0.2 + swayX + gust;
      this.headGroup.rotation.z = swayZ;

      // Secondary sway on stem
      if (this.stemMesh) {
        this.stemMesh.rotation.x = swayX * 0.4;
        this.stemMesh.rotation.z = swayZ * 0.4;
      }
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
    const geom = createDaisyPetalGeometry(0.7, 0.18);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: petalTexture,
      roughness: 0.4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      const scale = 0.5 + Math.random() * 0.6;
      mesh.scale.setScalar(scale);

      const x = (Math.random() - 0.5) * 22;
      const y = 0.5 + Math.random() * 8;
      const z = (Math.random() - 0.5) * 22;
      mesh.position.set(x, y, z);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          0.4 + Math.random() * 0.6,
          -0.2 - Math.random() * 0.3,
          (Math.random() - 0.5) * 0.4
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
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
      if (p.mesh.position.y < 0.1) p.mesh.position.y = 8 + Math.random() * 3;
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
    const geom = new THREE.SphereGeometry(0.045, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xcaff3a,
      transparent: true,
      opacity: 0.95,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat.clone());
      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        0.8 + Math.random() * 4.2,
        (Math.random() - 0.5) * 16
      );
      mesh.position.copy(basePos);

      let light: THREE.PointLight | undefined;
      // Attach real point lights to top 8 fireflies for stunning glow bounce
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
