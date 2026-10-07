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
} from './Daisy3D';
import {
  createFlowerCenterTexture,
  createPetalTexture,
  createGrassTexture,
} from '@/lib/textures';
import { sound } from '@/lib/sound';
import { UIOverlay } from './UIOverlay';

export type SceneMode = 'solo' | 'bouquet' | 'meadow';
export type TimeOfDay = 'day' | 'sunset' | 'night';

export default function DaisyScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [mode, setMode] = useState<SceneMode>('solo');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [windSpeed, setWindSpeed] = useState<number>(0.5); // 0 to 1
  const [bloomProgress, setBloomProgress] = useState<number>(1.0);
  const [isAutoBloom, setIsAutoBloom] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

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

  // Entities
  const heroFlowerRef = useRef<DaisyFlower | null>(null);
  const allFlowersRef = useRef<DaisyFlower[]>([]);
  const ambientPetalsRef = useRef<AmbientPetalSystem | null>(null);
  const firefliesRef = useRef<FireflySystem | null>(null);
  const fallingPetalsRef = useRef<FallingPetal[]>([]);
  const lightsRef = useRef<{
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    ambientLight: THREE.AmbientLight;
    pointLight: THREE.PointLight;
  } | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);

  // Target camera positions for smooth transitions
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    isTransitioning: boolean;
  }>({
    pos: new THREE.Vector3(0, 3.8, 3.6),
    lookAt: new THREE.Vector3(0, 3.2, 0),
    isTransitioning: false,
  });

  // Pluck a petal from the hero flower
  const pluckNextPetal = useCallback(() => {
    const hero = heroFlowerRef.current;
    if (!hero) return;

    // Find the next available petal
    const availableIndex = hero.petals.findIndex((p) => !p.isPlucked);
    if (availableIndex === -1) return;

    const pluckData = hero.pluckPetal(availableIndex);
    if (!pluckData || !sceneRef.current) return;

    // Play pluck sound with random pitch
    sound.playPetalPluck(0.9 + Math.random() * 0.3);

    // Create falling petal physics simulation
    const fallMesh = pluckData.mesh.clone();
    fallMesh.position.copy(pluckData.position);
    fallMesh.quaternion.copy(pluckData.quaternion);
    sceneRef.current.add(fallMesh);

    const falling: FallingPetal = {
      mesh: fallMesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.8 + 0.3 * windSpeed,
        -0.2 - Math.random() * 0.3,
        (Math.random() - 0.5) * 0.8
      ),
      angularVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      ),
      flutterPhase: Math.random() * Math.PI * 2,
      flutterSpeed: 3 + Math.random() * 4,
      life: 0,
      maxLife: 6.0,
    };
    fallingPetalsRef.current.push(falling);

    // Update game counter
    const remaining = hero.getUnpluckedCount();
    setRemainingPetals(remaining);

    // Alternating statement
    const isLovesMe = (totalPetals - remaining) % 2 === 1;
    const phrase = isLovesMe ? '¡Me quiere! 🌼' : 'No me quiere... 🥀';
    setLastPluckedStatus(phrase);

    // Check if flower has been completely plucked
    if (remaining === 0) {
      const verdict = isLovesMe
        ? '❤️ ¡EL DESTINO HA HABLADO: SÍ TE QUIERE CON TODO EL CORAZÓN! ❤️'
        : '✨ ¡EL DESTINO DICE QUE TE QUIERE MUCHO MÁS DE LO QUE IMAGINAS! ✨';
      setFinalVerdict(verdict);
      sound.playCelebration();

      // Trigger colorful celebratory confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#facc15', '#ffffff', '#4ade80', '#f43f5e', '#fbbf24'],
      });
    }
  }, [totalPetals, windSpeed]);

  // Regrow all petals on the flower
  const handleRegrow = useCallback(() => {
    const hero = heroFlowerRef.current;
    if (!hero) return;

    hero.resetPetals();
    setRemainingPetals(hero.petals.length);
    setLastPluckedStatus(null);
    setFinalVerdict(null);
    sound.playBloom();
  }, []);

  // Mode transitions: setup flower layouts
  const applyMode = useCallback((newMode: SceneMode) => {
    setMode(newMode);
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old flowers
    allFlowersRef.current.forEach((f) => scene.remove(f.group));
    allFlowersRef.current = [];

    const textures = {
      center: (window as any).__daisyTextures?.center,
      centerBump: (window as any).__daisyTextures?.centerBump,
      petal: (window as any).__daisyTextures?.petal,
    };

    if (!textures.center) return;

    if (newMode === 'solo') {
      // 1. Single Hero Daisy
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

      // Camera preset
      cameraTargetRef.current = {
        pos: new THREE.Vector3(0, 3.8, 3.6),
        lookAt: new THREE.Vector3(0, 3.2, 0),
        isTransitioning: true,
      };
    } else if (newMode === 'bouquet') {
      // 2. Bouquet of 9 daisies
      const hero = new DaisyFlower(textures, {
        height: 3.4,
        isInteractive: true,
        petalCount: 28,
        stemBend: { x: 0.05, z: 0.05 },
      });
      heroFlowerRef.current = hero;
      allFlowersRef.current.push(hero);
      scene.add(hero.group);

      const count = 8;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 0.6 + Math.random() * 0.45;
        const h = 2.7 + Math.random() * 0.6;
        const fl = new DaisyFlower(textures, {
          height: h,
          stemBend: {
            x: Math.cos(angle) * (0.3 + Math.random() * 0.3),
            z: Math.sin(angle) * (0.3 + Math.random() * 0.3),
          },
          petalCount: 24 + Math.floor(Math.random() * 6),
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
        pos: new THREE.Vector3(0, 3.5, 6.2),
        lookAt: new THREE.Vector3(0, 2.7, 0),
        isTransitioning: true,
      };
    } else if (newMode === 'meadow') {
      // 3. Meadow of 42 daisies
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

      for (let i = 0; i < 40; i++) {
        const dist = 1.5 + Math.random() * 8.5;
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
  }, []);

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
      scene.background = new THREE.Color('#070d1e');
      scene.fog = new THREE.FogExp2('#0d1833', 0.045);

      lights.dirLight.color.set('#6a9fd8');
      lights.dirLight.intensity = 0.9;
      lights.dirLight.position.set(-6, 9, -5);

      lights.hemiLight.color.set('#37527a');
      lights.hemiLight.groundColor.set('#0a131f');
      lights.hemiLight.intensity = 0.7;

      lights.ambientLight.color.set('#1b2845');
      lights.ambientLight.intensity = 0.45;

      firefliesRef.current?.setVisible(true);
    }
  }, []);

  // Screenshot capture function
  const handleTakeScreenshot = useCallback(() => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `margaritas-3d-${Date.now()}.png`;
    a.click();
  }, []);

  // Audio mute toggle
  const handleToggleSound = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    if (!nextMuted) {
      sound.startAmbientWind();
      sound.updateWindIntensity(windSpeed);
    }
  }, [isMuted, windSpeed]);

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
    camera.position.set(0, 3.8, 3.6);
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
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.6;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI / 2 + 0.02; // Prevent going underground
    controls.target.set(0, 3.2, 0);
    controlsRef.current = controls;

    // 3. Generate High Res Procedural Textures
    const centerTexObj = createFlowerCenterTexture();
    const petalTex = createPetalTexture();
    const grassTex = createGrassTexture();

    (window as any).__daisyTextures = {
      center: centerTexObj.texture,
      centerBump: centerTexObj.bumpMap,
      petal: petalTex,
    };

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
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight('#e8f5ff', '#3a5e2a', 1.2);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight('#ffe6a3', 1.0, 8);
    pointLight.position.set(0, 3.6, 1.2);
    scene.add(pointLight);

    lightsRef.current = { dirLight, hemiLight, ambientLight, pointLight };

    // 5. Ground / Grass Terrain
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

    // 6. Ambient Floating Petals System
    const ambientPetals = new AmbientPetalSystem(35, petalTex);
    ambientPetalsRef.current = ambientPetals;
    scene.add(ambientPetals.group);

    // 7. Night Fireflies System
    const fireflies = new FireflySystem(50);
    firefliesRef.current = fireflies;
    scene.add(fireflies.group);

    // Initial configuration
    applyTimeOfDay('day');
    applyMode('solo');

    // 8. Raycasting for Petal Interactivity (Mouse & Touch)
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

      // Collect all interactive petals
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
          // Pluck this specific petal!
          const pluckData = hero.pluckPetal(pIndex);
          if (pluckData && sceneRef.current) {
            sound.playPetalPluck(0.95 + Math.random() * 0.3);

            const fallMesh = pluckData.mesh.clone();
            fallMesh.position.copy(pluckData.position);
            fallMesh.quaternion.copy(pluckData.quaternion);
            sceneRef.current.add(fallMesh);

            fallingPetalsRef.current.push({
              mesh: fallMesh,
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.6 + 0.25 * windSpeed,
                -0.2 - Math.random() * 0.3,
                (Math.random() - 0.5) * 0.6
              ),
              angularVelocity: new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
              ),
              flutterPhase: Math.random() * Math.PI * 2,
              flutterSpeed: 3 + Math.random() * 4,
              life: 0,
              maxLife: 6.0,
            });

            const remaining = hero.getUnpluckedCount();
            setRemainingPetals(remaining);

            const isLovesMe = (totalPetals - remaining) % 2 === 1;
            const phrase = isLovesMe ? '¡Me quiere! 🌼' : 'No me quiere... 🥀';
            setLastPluckedStatus(phrase);

            if (remaining === 0) {
              const verdict = isLovesMe
                ? '❤️ ¡EL DESTINO HA HABLADO: SÍ TE QUIERE CON TODO EL CORAZÓN! ❤️'
                : '✨ ¡EL DESTINO DICE QUE TE QUIERE MUCHO MÁS DE LO QUE IMAGINAS! ✨';
              setFinalVerdict(verdict);
              sound.playCelebration();
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#facc15', '#ffffff', '#4ade80', '#f43f5e', '#fbbf24'],
              });
            }
          }
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handlePointerDown);

    // 9. Resize Listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Render Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera transition if active
      if (cameraTargetRef.current.isTransitioning) {
        camera.position.lerp(cameraTargetRef.current.pos, delta * 3.5);
        controls.target.lerp(cameraTargetRef.current.lookAt, delta * 3.5);
        if (camera.position.distanceTo(cameraTargetRef.current.pos) < 0.05) {
          cameraTargetRef.current.isTransitioning = false;
        }
      }

      controls.update();

      // Update all daisies
      allFlowersRef.current.forEach((flower) => {
        flower.update(elapsedTime, windSpeed, delta);
      });

      // Update ambient drifting petals
      ambientPetals.update(delta, windSpeed);

      // Update fireflies
      fireflies.update(elapsedTime);

      // Update falling plucked petals
      const activeFalling: FallingPetal[] = [];
      const currentFalling = fallingPetalsRef.current;

      for (let i = 0; i < currentFalling.length; i++) {
        const fp = currentFalling[i];
        fp.life += delta;

        // Aerodynamic physics: flutter and gentle glide
        fp.flutterPhase += delta * fp.flutterSpeed;
        const flutterX = Math.sin(fp.flutterPhase) * 0.45;
        const flutterZ = Math.cos(fp.flutterPhase * 0.7) * 0.35;

        fp.mesh.position.x += (fp.velocity.x + flutterX + windSpeed * 0.6) * delta;
        fp.mesh.position.y += fp.velocity.y * delta;
        fp.mesh.position.z += (fp.velocity.z + flutterZ) * delta;

        fp.mesh.rotation.x += fp.angularVelocity.x * delta;
        fp.mesh.rotation.y += fp.angularVelocity.y * delta;
        fp.mesh.rotation.z += fp.angularVelocity.z * delta;

        // Ground collision: settle gently
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

    // Cleanup
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

  // Handle Wind Speed changes
  const handleWindChange = (val: number) => {
    setWindSpeed(val);
    sound.updateWindIntensity(val);
  };

  // Handle Bloom slider changes
  const handleBloomChange = (val: number) => {
    setBloomProgress(val);
    allFlowersRef.current.forEach((f) => {
      f.targetBloom = val;
    });
  };

  // Auto-bloom pulsating effect
  useEffect(() => {
    if (!isAutoBloom) return;
    let step = 0;
    const interval = setInterval(() => {
      step += 0.05;
      const b = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(step));
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

      {/* Floating Modern UI Controls Overlay */}
      <UIOverlay
        mode={mode}
        timeOfDay={timeOfDay}
        windSpeed={windSpeed}
        bloomProgress={bloomProgress}
        isAutoBloom={isAutoBloom}
        isMuted={isMuted}
        remainingPetals={remainingPetals}
        totalPetals={totalPetals}
        lastPluckedStatus={lastPluckedStatus}
        finalVerdict={finalVerdict}
        onModeChange={applyMode}
        onTimeOfDayChange={applyTimeOfDay}
        onWindSpeedChange={handleWindChange}
        onBloomChange={handleBloomChange}
        onToggleAutoBloom={() => setIsAutoBloom(!isAutoBloom)}
        onToggleSound={handleToggleSound}
        onPluckPetal={pluckNextPetal}
        onRegrow={handleRegrow}
        onTakeScreenshot={handleTakeScreenshot}
      />
    </div>
  );
}
