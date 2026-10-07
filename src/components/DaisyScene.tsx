'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import {
  DaisyFlower,
  AmbientPetalSystem,
  FireflySystem,
  FallingPetal,
  RisingPollenSystem,
} from './Daisy3D';
import {
  createFlowerCenterTexture,
  createPetalTexture,
  createGrassTexture,
  createGlowTexture,
} from '@/lib/textures';
import { sound } from '@/lib/sound';
import { UIOverlay } from './UIOverlay';

export type SceneMode = 'solo' | 'bouquet' | 'meadow';
export type TimeOfDay = 'day' | 'sunset' | 'night';

export default function DaisyScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Experience start screen state
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // UI state
  const [mode, setMode] = useState<SceneMode>('bouquet');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('night');
  const [windSpeed, setWindSpeed] = useState<number>(0.45);
  const [bloomProgress, setBloomProgress] = useState<number>(1.0);
  const [isAutoBloom, setIsAutoBloom] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isGlowingMode, setIsGlowingMode] = useState<boolean>(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);

  // Dedication Card state
  const [isLetterOpen, setIsLetterOpen] = useState<boolean>(false);
  const [dedicationTo, setDedicationTo] = useState<string>('Alguien Muy Especial');
  const [dedicationMsg, setDedicationMsg] = useState<string>(
    'Que nunca dejes de brillar tan hermosa como estas flores. En cada pétalo hay un motivo para sonreír y ser feliz. 🌼✨'
  );
  const [dedicationFrom, setDedicationFrom] = useState<string>('Con todo mi cariño 💛');

  // "Me quiere, no me quiere" game state
  const [remainingPetals, setRemainingPetals] = useState<number>(30);
  const [totalPetals, setTotalPetals] = useState<number>(30);
  const [lastPluckedStatus, setLastPluckedStatus] = useState<string | null>(null);
  const [finalVerdict, setFinalVerdict] = useState<string | null>(null);

  // Internal Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const texturesRef = useRef<{
    center: THREE.CanvasTexture;
    centerBump: THREE.CanvasTexture;
    petal: THREE.CanvasTexture;
    glow: THREE.CanvasTexture;
  } | null>(null);

  // Entities
  const heroFlowerRef = useRef<DaisyFlower | null>(null);
  const allFlowersRef = useRef<DaisyFlower[]>([]);
  const ambientPetalsRef = useRef<AmbientPetalSystem | null>(null);
  const firefliesRef = useRef<FireflySystem | null>(null);
  const pollenRef = useRef<RisingPollenSystem | null>(null);
  const fallingPetalsRef = useRef<FallingPetal[]>([]);
  const lightsRef = useRef<{
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    ambientLight: THREE.AmbientLight;
    pointLight: THREE.PointLight;
  } | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);

  // Camera targets
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    isTransitioning: boolean;
  }>({
    pos: new THREE.Vector3(0, 3.4, 5.8),
    lookAt: new THREE.Vector3(0, 2.6, 0),
    isTransitioning: false,
  });

  // Pluck a petal from hero flower
  const pluckNextPetal = useCallback(() => {
    const hero = heroFlowerRef.current;
    if (!hero) return;

    const availableIndex = hero.petals.findIndex((p) => !p.isPlucked);
    if (availableIndex === -1) return;

    const pluckData = hero.pluckPetal(availableIndex);
    if (!pluckData || !sceneRef.current) return;

    sound.playPetalPluck(0.92 + Math.random() * 0.28);

    const fallMesh = pluckData.mesh.clone();
    const worldScale = new THREE.Vector3();
    pluckData.mesh.getWorldScale(worldScale);
    fallMesh.scale.copy(worldScale);
    fallMesh.position.copy(pluckData.position);
    fallMesh.quaternion.copy(pluckData.quaternion);
    sceneRef.current.add(fallMesh);

    const falling: FallingPetal = {
      mesh: fallMesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.6 + 0.3 * windSpeed,
        -0.22 - Math.random() * 0.25,
        (Math.random() - 0.5) * 0.6
      ),
      angularVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 3.5
      ),
      flutterPhase: Math.random() * Math.PI * 2,
      flutterSpeed: 3 + Math.random() * 4,
      life: 0,
      maxLife: 6.5,
    };
    fallingPetalsRef.current.push(falling);

    const remaining = hero.getUnpluckedCount();
    setRemainingPetals(remaining);

    const isLovesMe = (totalPetals - remaining) % 2 === 1;
    const phrase = isLovesMe ? '¡Me quiere! 🌼' : 'No me quiere... 🥀';
    setLastPluckedStatus(phrase);

    if (remaining === 0) {
      const verdict = isLovesMe
        ? '❤️ ¡EL DESTINO HA HABLADO: SÍ TE QUIERE CON TODO EL CORAZÓN! ❤️'
        : '✨ ¡EL DESTINO DICE QUE ERES MUY ESPECIAL Y TE QUIERE MUCHO! ✨';
      setFinalVerdict(verdict);
      sound.playCelebration();

      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#facc15', '#ffffff', '#4ade80', '#f43f5e', '#fbbf24', '#ffd700'],
      });
    }
  }, [totalPetals, windSpeed]);

  // Regrow all petals
  const handleRegrow = useCallback(() => {
    const hero = heroFlowerRef.current;
    if (!hero) return;

    hero.resetPetals();
    setRemainingPetals(hero.petals.length);
    setLastPluckedStatus(null);
    setFinalVerdict(null);
    sound.playBloom();
  }, []);

  // Mode transitions
  const applyMode = useCallback((newMode: SceneMode) => {
    setMode(newMode);
    const scene = sceneRef.current;
    if (!scene) return;

    allFlowersRef.current.forEach((f) => scene.remove(f.group));
    allFlowersRef.current = [];

    const textures = texturesRef.current || (window as any).__daisyTextures;
    if (!textures || !textures.center) return;

    if (newMode === 'solo') {
      const hero = new DaisyFlower(textures, {
        height: 3.2,
        isInteractive: true,
        petalCount: 30,
        stemBend: { x: 0.15, z: -0.1 },
      });
      heroFlowerRef.current = hero;
      allFlowersRef.current.push(hero);
      scene.add(hero.group);
      setTotalPetals(30);
      setRemainingPetals(30);
      setLastPluckedStatus(null);
      setFinalVerdict(null);

      cameraTargetRef.current = {
        pos: new THREE.Vector3(0, 3.8, 3.6),
        lookAt: new THREE.Vector3(0, 3.2, 0),
        isTransitioning: true,
      };
    } else if (newMode === 'bouquet') {
      const hero = new DaisyFlower(textures, {
        height: 3.4,
        isInteractive: true,
        petalCount: 30,
        stemBend: { x: 0.05, z: 0.05 },
      });
      heroFlowerRef.current = hero;
      allFlowersRef.current.push(hero);
      scene.add(hero.group);

      const count = 8;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 0.65 + Math.random() * 0.45;
        const h = 2.7 + Math.random() * 0.6;
        const fl = new DaisyFlower(textures, {
          height: h,
          stemBend: {
            x: Math.cos(angle) * (0.3 + Math.random() * 0.3),
            z: Math.sin(angle) * (0.3 + Math.random() * 0.3),
          },
          petalCount: 26 + Math.floor(Math.random() * 6),
        });
        fl.group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        allFlowersRef.current.push(fl);
        scene.add(fl.group);
      }

      setTotalPetals(hero.petals.length);
      setRemainingPetals(hero.petals.length);
      setLastPluckedStatus(null);
      setFinalVerdict(null);

      cameraTargetRef.current = {
        pos: new THREE.Vector3(0, 3.4, 5.8),
        lookAt: new THREE.Vector3(0, 2.6, 0),
        isTransitioning: true,
      };
    } else if (newMode === 'meadow') {
      const hero = new DaisyFlower(textures, {
        height: 3.0,
        isInteractive: true,
        petalCount: 28,
        stemBend: { x: 0.1, z: 0.1 },
      });
      heroFlowerRef.current = hero;
      hero.group.position.set(0, 0, 1.0);
      allFlowersRef.current.push(hero);
      scene.add(hero.group);

      for (let i = 0; i < 42; i++) {
        const dist = 1.4 + Math.random() * 9.0;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;

        const h = 1.8 + Math.random() * 1.5;
        const flower = new DaisyFlower(textures, {
          height: h,
          stemBend: {
            x: (Math.random() - 0.5) * 0.5,
            z: (Math.random() - 0.5) * 0.5,
          },
          petalCount: 22 + Math.floor(Math.random() * 8),
        });
        flower.group.position.set(x, 0, z);
        flower.group.rotation.y = Math.random() * Math.PI * 2;
        const s = 0.75 + Math.random() * 0.45;
        flower.group.scale.set(s, s, s);

        allFlowersRef.current.push(flower);
        scene.add(flower.group);
      }

      setTotalPetals(hero.petals.length);
      setRemainingPetals(hero.petals.length);
      setLastPluckedStatus(null);
      setFinalVerdict(null);

      cameraTargetRef.current = {
        pos: new THREE.Vector3(0, 4.6, 9.2),
        lookAt: new THREE.Vector3(0, 2.0, 0),
        isTransitioning: true,
      };
    }

    // Apply glow mode to all instantiated flowers
    allFlowersRef.current.forEach((f) => f.setGlowMode(isGlowingMode));
  }, [isGlowingMode]);

  // Lighting & Sky atmosphere update
  const applyTimeOfDay = useCallback((tod: TimeOfDay) => {
    setTimeOfDay(tod);
    const scene = sceneRef.current;
    const lights = lightsRef.current;
    if (!scene || !lights) return;

    if (tod === 'day') {
      scene.background = new THREE.Color('#94d2f8');
      scene.fog = new THREE.FogExp2('#b8e4fc', 0.035);

      lights.dirLight.color.set('#fff8e6');
      lights.dirLight.intensity = 2.4;
      lights.dirLight.position.set(6, 12, 7);

      lights.hemiLight.color.set('#e8f5ff');
      lights.hemiLight.groundColor.set('#3a5e2a');
      lights.hemiLight.intensity = 1.2;

      lights.ambientLight.color.set('#ffffff');
      lights.ambientLight.intensity = 0.6;

      firefliesRef.current?.setVisible(false);
    } else if (tod === 'sunset') {
      scene.background = new THREE.Color('#381b37');
      scene.fog = new THREE.FogExp2('#703649', 0.045);

      lights.dirLight.color.set('#ff8a3d');
      lights.dirLight.intensity = 2.8;
      lights.dirLight.position.set(10, 4.5, 6);

      lights.hemiLight.color.set('#ffad75');
      lights.hemiLight.groundColor.set('#271b26');
      lights.hemiLight.intensity = 1.3;

      lights.ambientLight.color.set('#ff7b54');
      lights.ambientLight.intensity = 0.55;

      firefliesRef.current?.setVisible(false);
    } else if (tod === 'night') {
      // Midnight glowing atmospheric sky
      scene.background = new THREE.Color('#060b1c');
      scene.fog = new THREE.FogExp2('#0c1630', 0.042);

      lights.dirLight.color.set('#6a9fd8');
      lights.dirLight.intensity = 0.95;
      lights.dirLight.position.set(-6, 9, -5);

      lights.hemiLight.color.set('#37527a');
      lights.hemiLight.groundColor.set('#0a131f');
      lights.hemiLight.intensity = 0.75;

      lights.ambientLight.color.set('#1b2845');
      lights.ambientLight.intensity = 0.5;

      firefliesRef.current?.setVisible(true);
    }
  }, []);

  // Toggle Glowing Flowers Mode (Video Style)
  const handleToggleGlowingMode = useCallback(() => {
    const next = !isGlowingMode;
    setIsGlowingMode(next);
    allFlowersRef.current.forEach((f) => f.setGlowMode(next));
    pollenRef.current?.setVisible(next);

    const lights = lightsRef.current;
    if (lights) {
      if (next) {
        lights.pointLight.intensity = 2.2;
        lights.pointLight.color.set('#ffc83b');
      } else {
        lights.pointLight.intensity = 1.0;
        lights.pointLight.color.set('#ffe6a3');
      }
    }
  }, [isGlowingMode]);

  // Toggle Music Box Melody
  const handleToggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      sound.stopMelody();
      setIsMusicPlaying(false);
    } else {
      sound.setMuted(false);
      setIsMuted(false);
      sound.startMelody();
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying]);

  // Audio mute toggle
  const handleToggleSound = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    if (nextMuted) {
      sound.stopMelody();
      setIsMusicPlaying(false);
    } else {
      sound.startAmbientWind();
      sound.updateWindIntensity(windSpeed);
      sound.startMelody();
      setIsMusicPlaying(true);
    }
  }, [isMuted, windSpeed]);

  // Experience Start Action ("Tocar para florecer")
  const handleStartExperience = () => {
    setHasStarted(true);
    sound.setMuted(false);
    setIsMuted(false);
    sound.startAmbientWind();
    sound.startMelody();
    setIsMusicPlaying(true);
    sound.playBloom();

    // Trigger opening bloom animation
    setBloomProgress(0.1);
    allFlowersRef.current.forEach((f) => {
      f.bloomProgress = 0.1;
      f.targetBloom = 1.0;
      f.setGlowMode(true);
    });
    setBloomProgress(1.0);
  };

  // Screenshot capture
  const handleTakeScreenshot = useCallback(() => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `margaritas-brillantes-3d-${Date.now()}.png`;
    a.click();
  }, []);

  // Main Three.js Setup Effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 80);
    camera.position.set(0, 3.4, 5.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.4;
    controls.maxDistance = 24;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.target.set(0, 2.6, 0);
    controlsRef.current = controls;

    // 3. Generate High Res Textures
    const centerTexObj = createFlowerCenterTexture();
    const petalTex = createPetalTexture();
    const grassTex = createGrassTexture();
    const glowTex = createGlowTexture();

    const textures = {
      center: centerTexObj.texture,
      centerBump: centerTexObj.bumpMap,
      petal: petalTex,
      glow: glowTex,
    };
    texturesRef.current = textures;
    (window as any).__daisyTextures = textures;

    // 4. Lights
    const dirLight = new THREE.DirectionalLight('#fff8e6', 2.4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 28;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0002;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight('#e8f5ff', '#3a5e2a', 1.2);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight('#ffc83b', 2.0, 9);
    pointLight.position.set(0, 3.6, 1.2);
    scene.add(pointLight);

    lightsRef.current = { dirLight, hemiLight, ambientLight, pointLight };

    // 5. Ground
    const groundGeom = new THREE.CircleGeometry(26, 64);
    groundGeom.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d6e2e,
      map: grassTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);
    groundRef.current = ground;

    // 6. Ambient Floating Petals
    const ambientPetals = new AmbientPetalSystem(35, petalTex);
    ambientPetalsRef.current = ambientPetals;
    scene.add(ambientPetals.group);

    // 7. Fireflies
    const fireflies = new FireflySystem(45);
    firefliesRef.current = fireflies;
    scene.add(fireflies.group);

    // 8. Rising Glowing Pollen System (For magical YouTube video aesthetic)
    const pollen = new RisingPollenSystem(140);
    pollen.setVisible(true);
    pollenRef.current = pollen;
    scene.add(pollen.group);

    // Initial setup: Bouquet mode + Night + Glowing flowers (matching video)
    applyTimeOfDay('night');
    applyMode('bouquet');

    // 9. Raycasting for Petal Plucking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!renderer.domElement) return;

      const rect = renderer.domElement.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ('touches' in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if ('clientX' in event) {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const hero = heroFlowerRef.current;
      if (!hero) return;

      const interactiveMeshes = hero.petals
        .filter((p) => !p.isPlucked)
        .map((p) => p.mesh);

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const pIndex = clickedMesh.userData.petalIndex;
        if (typeof pIndex === 'number') {
          const pluckData = hero.pluckPetal(pIndex);
          if (pluckData && sceneRef.current) {
            sound.playPetalPluck(0.95 + Math.random() * 0.28);

            const fallMesh = pluckData.mesh.clone();
            const worldScale = new THREE.Vector3();
            pluckData.mesh.getWorldScale(worldScale);
            fallMesh.scale.copy(worldScale);
            fallMesh.position.copy(pluckData.position);
            fallMesh.quaternion.copy(pluckData.quaternion);
            sceneRef.current.add(fallMesh);

            fallingPetalsRef.current.push({
              mesh: fallMesh,
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.6 + 0.25 * windSpeed,
                -0.22 - Math.random() * 0.25,
                (Math.random() - 0.5) * 0.6
              ),
              angularVelocity: new THREE.Vector3(
                (Math.random() - 0.5) * 3.5,
                (Math.random() - 0.5) * 3.5,
                (Math.random() - 0.5) * 3.5
              ),
              flutterPhase: Math.random() * Math.PI * 2,
              flutterSpeed: 3 + Math.random() * 4,
              life: 0,
              maxLife: 6.5,
            });

            const remaining = hero.getUnpluckedCount();
            setRemainingPetals(remaining);

            const isLovesMe = (totalPetals - remaining) % 2 === 1;
            const phrase = isLovesMe ? '¡Me quiere! 🌼' : 'No me quiere... 🥀';
            setLastPluckedStatus(phrase);

            if (remaining === 0) {
              const verdict = isLovesMe
                ? '❤️ ¡EL DESTINO HA HABLADO: SÍ TE QUIERE CON TODO EL CORAZÓN! ❤️'
                : '✨ ¡EL DESTINO DICE QUE ERES MUY ESPECIAL Y TE QUIERE MUCHO! ✨';
              setFinalVerdict(verdict);
              sound.playCelebration();
              confetti({
                particleCount: 140,
                spread: 90,
                origin: { y: 0.6 },
                colors: ['#facc15', '#ffffff', '#4ade80', '#f43f5e', '#fbbf24', '#ffd700'],
              });
            }
          }
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handlePointerDown);

    // 10. Resize Listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. Render Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation
      if (cameraTargetRef.current.isTransitioning) {
        camera.position.lerp(cameraTargetRef.current.pos, delta * 3.5);
        controls.target.lerp(cameraTargetRef.current.lookAt, delta * 3.5);
        if (camera.position.distanceTo(cameraTargetRef.current.pos) < 0.05) {
          cameraTargetRef.current.isTransitioning = false;
        }
      }

      controls.update();

      // Update all flowers
      allFlowersRef.current.forEach((flower) => {
        flower.update(elapsedTime, windSpeed, delta);
      });

      // Update ambient drifting petals
      ambientPetals.update(delta, windSpeed);

      // Update fireflies
      fireflies.update(elapsedTime);

      // Update rising golden pollen
      pollen.update(delta, elapsedTime);

      // Update falling plucked petals
      const activeFalling: FallingPetal[] = [];
      const currentFalling = fallingPetalsRef.current;

      for (let i = 0; i < currentFalling.length; i++) {
        const fp = currentFalling[i];
        fp.life += delta;

        fp.flutterPhase += delta * fp.flutterSpeed;
        const flutterX = Math.sin(fp.flutterPhase) * 0.4;
        const flutterZ = Math.cos(fp.flutterPhase * 0.7) * 0.3;

        fp.mesh.position.x += (fp.velocity.x + flutterX + windSpeed * 0.5) * delta;
        fp.mesh.position.y += fp.velocity.y * delta;
        fp.mesh.position.z += (fp.velocity.z + flutterZ) * delta;

        fp.mesh.rotation.x += fp.angularVelocity.x * delta;
        fp.mesh.rotation.y += fp.angularVelocity.y * delta;
        fp.mesh.rotation.z += fp.angularVelocity.z * delta;

        if (fp.mesh.position.y <= 0.04) {
          fp.mesh.position.y = 0.04;
          fp.velocity.set(0, 0, 0);
          fp.angularVelocity.set(0, 0, 0);
        }

        if (fp.life < fp.maxLife) {
          activeFalling.push(fp);
        } else {
          scene.remove(fp.mesh);
        }
      }
      fallingPetalsRef.current = activeFalling;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('click', handlePointerDown);
      controls.dispose();
      renderer.dispose();
      if (domElement.parentElement) {
        domElement.parentElement.removeChild(domElement);
      }
    };
  }, [applyMode, applyTimeOfDay, totalPetals, windSpeed]);

  const handleWindChange = (val: number) => {
    setWindSpeed(val);
    sound.updateWindIntensity(val);
  };

  const handleBloomChange = (val: number) => {
    setBloomProgress(val);
    allFlowersRef.current.forEach((f) => {
      f.targetBloom = val;
    });
  };

  useEffect(() => {
    if (!isAutoBloom) return;
    let step = 0;
    const interval = setInterval(() => {
      step += 0.04;
      const b = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(step));
      setBloomProgress(b);
      allFlowersRef.current.forEach((f) => {
        f.targetBloom = b;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isAutoBloom]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-black">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Intro "Tocar para florecer" Overlay (Like the viral YouTube project) */}
      {!hasStarted && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-40 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-[0_0_50px_rgba(250,204,21,0.6)] mb-6 animate-pulse">
            <span className="text-4xl">🌼</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-3">
            Margaritas Brillantes 3D
          </h2>
          <p className="text-sm md:text-base text-yellow-100/90 max-w-md mb-8 font-medium leading-relaxed">
            Una experiencia botánica y musical iluminada en la noche. Toca el botón para hacer florecer las margaritas con destellos dorados.
          </p>
          <button
            onClick={handleStartExperience}
            className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 font-extrabold text-lg shadow-[0_0_35px_rgba(250,204,21,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 cursor-pointer"
          >
            <span>✨ Toca para Florecer ✨</span>
          </button>
        </div>
      )}

      {/* Floating Modern UI Controls Overlay */}
      {hasStarted && (
        <UIOverlay
          mode={mode}
          timeOfDay={timeOfDay}
          windSpeed={windSpeed}
          bloomProgress={bloomProgress}
          isAutoBloom={isAutoBloom}
          isMuted={isMuted}
          isGlowingMode={isGlowingMode}
          isMusicPlaying={isMusicPlaying}
          remainingPetals={remainingPetals}
          totalPetals={totalPetals}
          lastPluckedStatus={lastPluckedStatus}
          finalVerdict={finalVerdict}
          isLetterOpen={isLetterOpen}
          dedicationTo={dedicationTo}
          dedicationMsg={dedicationMsg}
          dedicationFrom={dedicationFrom}
          onModeChange={applyMode}
          onTimeOfDayChange={applyTimeOfDay}
          onWindSpeedChange={handleWindChange}
          onBloomChange={handleBloomChange}
          onToggleAutoBloom={() => setIsAutoBloom(!isAutoBloom)}
          onToggleSound={handleToggleSound}
          onToggleGlowingMode={handleToggleGlowingMode}
          onToggleMusic={handleToggleMusic}
          onToggleLetter={() => setIsLetterOpen(!isLetterOpen)}
          onUpdateDedication={(to, msg, from) => {
            setDedicationTo(to);
            setDedicationMsg(msg);
            setDedicationFrom(from);
          }}
          onPluckPetal={pluckNextPetal}
          onRegrow={handleRegrow}
          onTakeScreenshot={handleTakeScreenshot}
        />
      )}
    </div>
  );
}
