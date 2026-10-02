/**
 * Three.js WebGL Interactive 3D Viewport for the Smart Office Digital Twin.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ViewMode,
  CameraPreset,
  ZoneData,
  ElectricalLoads,
  RenewableGridState,
  EquipmentItem,
  OccupantAvatar,
} from '../../types/digitalTwin';
import { createModernOfficeScene, OfficeSceneObjects } from './OfficeGeometry';

interface OfficeSceneProps {
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  timeOfDayHours: number;
  zones: ZoneData[];
  loads: ElectricalLoads;
  renewable: RenewableGridState;
  occupants: OccupantAvatar[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string, type: 'zone' | 'equipment' | 'occupant') => void;
}

export const OfficeScene: React.FC<OfficeSceneProps> = ({
  viewMode,
  cameraPreset,
  timeOfDayHours,
  zones,
  loads,
  renewable,
  occupants,
  selectedEntityId,
  onSelectEntity,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneObjectsRef = useRef<OfficeSceneObjects | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const zonesRef = useRef<ZoneData[]>(zones);

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  // Camera preset coordinates map
  const cameraTargets: Record<CameraPreset, { pos: [number, number, number]; lookAt: [number, number, number] }> = {
    isometric: { pos: [26, 22, 28], lookAt: [0, 1.5, 0] },
    workspace: { pos: [-2, 7, 8], lookAt: [-2, 1, 0] },
    boardroom: { pos: [11.5, 6, 4], lookAt: [11.5, 1.5, -6] },
    'server-room': { pos: [-9, 4.5, -1], lookAt: [-11, 1.5, -6] },
    'utility-plant': { pos: [-16, 6, 8], lookAt: [-14, 2, -4] },
    'top-down': { pos: [0, 36, 0.1], lookAt: [0, 0, 0] },
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16); // Deep slate obsidian backdrop

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 200);
    const initialTarget = cameraTargets[cameraPreset] || cameraTargets.isometric;
    camera.position.set(...initialTarget.pos);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(...initialTarget.lookAt);
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent dipping below ground
    controls.minDistance = 5;
    controls.maxDistance = 70;
    controlsRef.current = controls;

    // 5. Environmental Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(20, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Subtle blue fill light from the north
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-15, 20, -20);
    scene.add(fillLight);

    // 6. Build procedural office models with working occupants
    const officeScene = createModernOfficeScene(occupants);
    sceneObjectsRef.current = officeScene;
    scene.add(officeScene.rootGroup);

    // 7. Raycasting for click selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(officeScene.interactiveObjects, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && hitObj !== scene) {
          if (hitObj.userData?.isZone) {
            onSelectEntity(hitObj.userData.zoneId, 'zone');
            return;
          }
          if (hitObj.userData?.isEquipment) {
            onSelectEntity(hitObj.userData.equipmentId, 'equipment');
            return;
          }
          if (hitObj.userData?.isOccupant) {
            onSelectEntity(hitObj.userData.avatarData.id, 'occupant');
            return;
          }
          hitObj = hitObj.parent;
        }
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(officeScene.interactiveObjects, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        let label = '';
        while (hitObj && hitObj !== scene) {
          if (hitObj.userData?.isOccupant) {
            const occ = hitObj.userData.avatarData;
            label = `Worker: ${occ.name} (${occ.role}) · ${occ.currentTask || occ.action}`;
            break;
          }
          if (hitObj.userData?.isZone) {
            label = `Zone: ${hitObj.userData.zoneId.replace('zone-', '').replace('-', ' ').toUpperCase()}`;
            break;
          }
          if (hitObj.userData?.isEquipment) {
            label = `Equipment: ${hitObj.userData.equipmentId.replace('equip-', '').replace('-', ' ').toUpperCase()}`;
            break;
          }
          hitObj = hitObj.parent;
        }
        renderer.domElement.style.cursor = label ? 'pointer' : 'default';
        setHoveredLabel(label || null);
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredLabel(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    // 8. Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation toward preset target
      controls.update();

      // Rotate water pump rotors
      officeScene.waterPumpRotors.forEach((rotor, idx) => {
        rotor.rotation.y += 0.08 * (idx % 2 === 0 ? 1 : -1);
      });

      // Animated Workers (typing on keyboard, looking between screens, presenting, troubleshooting)
      if (officeScene.animatedWorkers) {
        officeScene.animatedWorkers.forEach((worker) => {
          const t = elapsedTime * 3.5 + worker.phase;
          if (worker.action === 'coding' || worker.action === 'analyzing') {
            // Natural typing motion on keyboard: alternating slight wrist/forearm oscillation
            if (worker.leftArm) {
              worker.leftArm.rotation.x = Math.sin(t * 2.2) * 0.05;
              worker.leftArm.rotation.z = Math.cos(t * 1.5) * 0.02;
            }
            if (worker.rightArm) {
              worker.rightArm.rotation.x = Math.cos(t * 2.4) * 0.05;
              worker.rightArm.rotation.z = -Math.sin(t * 1.8) * 0.02;
            }
            // Head looking naturally between dual monitors
            if (worker.head) {
              worker.head.rotation.y = worker.initialHeadRotY + Math.sin(elapsedTime * 0.9 + worker.phase) * 0.14;
            }
          } else if (worker.action === 'presenting') {
            // Presenter in boardroom gesturing toward large 85" screen
            if (worker.rightArm) {
              worker.rightArm.rotation.x = -Math.PI / 12 + Math.sin(elapsedTime * 1.6) * 0.12;
              worker.rightArm.rotation.y = Math.cos(elapsedTime * 1.2) * 0.08;
            }
            if (worker.head) {
              worker.head.rotation.y = Math.sin(elapsedTime * 0.8) * 0.18;
            }
          } else if (worker.action === 'troubleshooting') {
            // Technician in server room reviewing tablet
            if (worker.rightArm) {
              worker.rightArm.rotation.x = Math.sin(elapsedTime * 3) * 0.03;
            }
            if (worker.head) {
              worker.head.rotation.x = 0.15 + Math.sin(elapsedTime * 0.6) * 0.04;
            }
          } else if (worker.action === 'coffee') {
            // Coffee break holding mug
            if (worker.rightArm) {
              worker.rightArm.rotation.x = Math.sin(elapsedTime * 0.5) * 0.06;
            }
            if (worker.head) {
              worker.head.rotation.y = Math.sin(elapsedTime * 0.6 + worker.phase) * 0.15;
            }
          } else if (worker.action === 'collaborating' || worker.action === 'reviewing') {
            // Reviewing & nodding in meeting / office
            if (worker.head) {
              worker.head.rotation.x = 0.1 + Math.sin(elapsedTime * 1.4 + worker.phase) * 0.06;
              worker.head.rotation.y = worker.initialHeadRotY + Math.cos(elapsedTime * 0.8 + worker.phase) * 0.1;
            }
            if (worker.leftArm) {
              worker.leftArm.rotation.x = Math.sin(elapsedTime * 1.2) * 0.03;
            }
            if (worker.rightArm) {
              worker.rightArm.rotation.x = Math.cos(elapsedTime * 1.2) * 0.03;
            }
          }
        });
      }

      // Flashing server rack LEDs
      if (officeScene.serverLeds) {
        const colors = (officeScene.serverLeds.geometry.attributes.color as THREE.BufferAttribute);
        if (colors) {
          for (let i = 0; i < colors.count; i++) {
            if (Math.random() < 0.05) {
              const intensity = Math.random() > 0.3 ? 0.9 : 0.1;
              colors.setY(i, intensity);
            }
          }
          colors.needsUpdate = true;
        }
      }

      // Airflow particle cascade
      if (officeScene.airflowParticles) {
        const positions = (officeScene.airflowParticles.geometry.attributes.position as THREE.BufferAttribute);
        if (positions) {
          for (let i = 0; i < positions.count; i++) {
            let y = positions.getY(i);
            y -= 0.025;
            if (y < 0.6) y = 3.2;
            positions.setY(i, y);
          }
          positions.needsUpdate = true;
        }
      }

      // Energy particles animation along conduits
      if (officeScene.energyFlowParticles) {
        const positions = (officeScene.energyFlowParticles.geometry.attributes.position as THREE.BufferAttribute);
        if (positions) {
          for (let i = 0; i < positions.count; i++) {
            let x = positions.getX(i);
            let z = positions.getZ(i);
            x += Math.sin(elapsedTime * 2 + i) * 0.015;
            z += Math.cos(elapsedTime * 2 + i) * 0.015;
            positions.setX(i, x);
            positions.setZ(i, z);
          }
          positions.needsUpdate = true;
        }
      }

      // Simulated 3D Sensors dynamic LED pulse
      if (officeScene.sensorIndicators) {
        officeScene.sensorIndicators.forEach((indicators, zId) => {
          const zone = zonesRef.current.find((z) => z.id === zId);
          const isOcc = zone ? zone.occupancySensor.isOccupied : true;
          if (indicators.pirLed) {
            const pirMat = indicators.pirLed.material as THREE.MeshBasicMaterial;
            if (isOcc) {
              const pulse = Math.sin(elapsedTime * 6) > 0.1;
              pirMat.color.setHex(pulse ? 0x10b981 : 0x059669);
            } else {
              pirMat.color.setHex(0xb45309); // Standby amber
            }
          }
          if (indicators.cameraLed) {
            const camMat = indicators.cameraLed.material as THREE.MeshBasicMaterial;
            camMat.color.setHex(isOcc ? 0x06b6d4 : 0x1e293b);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.dispose();
    };
  }, []);

  // Update Camera Preset when changed
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const target = cameraTargets[cameraPreset];
    if (target) {
      const cam = cameraRef.current;
      const ctrl = controlsRef.current;
      // Animate smoothly to new position
      const startPos = cam.position.clone();
      const endPos = new THREE.Vector3(...target.pos);
      const startLook = ctrl.target.clone();
      const endLook = new THREE.Vector3(...target.lookAt);

      let t = 0;
      const tweenCamera = () => {
        t += 0.05;
        if (t <= 1) {
          cam.position.lerpVectors(startPos, endPos, t);
          ctrl.target.lerpVectors(startLook, endLook, t);
          ctrl.update();
          requestAnimationFrame(tweenCamera);
        } else {
          cam.position.copy(endPos);
          ctrl.target.copy(endLook);
          ctrl.update();
        }
      };
      tweenCamera();
    }
  }, [cameraPreset]);

  // Update Sun and Ambient Light based on time of day
  useEffect(() => {
    if (!sunLightRef.current || !ambientLightRef.current || !sceneRef.current) return;
    const sun = sunLightRef.current;
    const ambient = ambientLightRef.current;

    const isDay = timeOfDayHours >= 6.0 && timeOfDayHours <= 19.5;
    if (isDay) {
      const sunProgress = (timeOfDayHours - 6.0) / 13.5;
      const angle = sunProgress * Math.PI;
      const sunX = Math.cos(angle) * 35;
      const sunY = Math.sin(angle) * 38;
      const sunZ = 20;
      sun.position.set(sunX, Math.max(8, sunY), sunZ);

      // Warm sunlight during dawn/dusk, crisp white midday
      if (sunProgress < 0.2 || sunProgress > 0.8) {
        sun.color.setHex(0xfba94c); // Golden hour
        sun.intensity = 1.1;
        ambient.intensity = 0.45;
        sceneRef.current.background = new THREE.Color(0x181e2b);
      } else {
        sun.color.setHex(0xfffbeb);
        sun.intensity = 1.45;
        ambient.intensity = 0.65;
        sceneRef.current.background = new THREE.Color(0x090d16);
      }
    } else {
      // Night mode
      sun.intensity = 0.08;
      sun.color.setHex(0x38bdf8);
      ambient.intensity = 0.25;
      sceneRef.current.background = new THREE.Color(0x040711);
    }
  }, [timeOfDayHours]);

  // Update View Modes (Architectural, Energy Flow, Thermal Heatmap, Airflow, Lighting)
  useEffect(() => {
    if (!sceneObjectsRef.current) return;
    const {
      zoneMeshes,
      energyConduitsGroup,
      energyFlowParticles,
      airflowParticles,
      ceilingLightsGroup,
      hvacDuctsGroup,
      sensorIndicators,
    } = sceneObjectsRef.current;

    // Toggle sensor coverage cones in occupancy-sensors viewMode
    if (sensorIndicators) {
      sensorIndicators.forEach((ind) => {
        if (ind.coverageCone) {
          ind.coverageCone.visible = viewMode === 'occupancy-sensors';
        }
      });
    }

    // Default visibilities
    energyFlowParticles.visible = viewMode === 'energy-flow';
    airflowParticles.visible = viewMode === 'airflow-ducts' || viewMode === 'architectural';

    if (viewMode === 'energy-flow') {
      energyConduitsGroup.visible = true;
      energyFlowParticles.visible = true;
      // Boost conduit glowing emissive
      energyConduitsGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 1.2;
        }
      });
    } else {
      energyConduitsGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.4;
        }
      });
    }

    // Dynamically adjust ceiling light fixtures based on zone occupancy dimming
    if (ceilingLightsGroup) {
      const avgLighting = zones.reduce((acc, z) => acc + z.lightingDimmablePercent, 0) / (zones.length || 1);
      const intensity = Math.max(0.12, (avgLighting / 100) * 0.95);
      ceilingLightsGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat.emissive && mat.emissive.getHex() === 0xfef08a) {
            mat.emissiveIntensity = intensity;
          }
        }
      });
    }

    // Thermal Heatmap coloring on zone floors
    if (viewMode === 'thermal-heatmap') {
      zoneMeshes.forEach((mesh, zId) => {
        const zone = zones.find((z) => z.id === zId);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.55;
        if (zone) {
          // Color based on PMV (-1.5 = cool blue, 0 = comfortable green, +1.5 = warm red)
          if (zone.pmv < -0.5) mat.color.setHex(0x38bdf8); // Cold
          else if (zone.pmv <= 0.5) mat.color.setHex(0x22c55e); // Optimal
          else mat.color.setHex(0xef4444); // Warm
        }
      });
    } else {
      zoneMeshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.06;
      });
    }

    // Airflow mode highlight
    if (viewMode === 'airflow-ducts') {
      hvacDuctsGroup.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
          m.color.setHex(0x38bdf8);
        }
      });
    } else {
      hvacDuctsGroup.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
          m.color.setHex(0x94a3b8);
        }
      });
    }
  }, [viewMode, zones]);

  // Battery State-of-charge LED bar update
  useEffect(() => {
    if (!sceneObjectsRef.current) return;
    const { batteryLedBar } = sceneObjectsRef.current;
    if (batteryLedBar) {
      const scale = Math.max(0.1, renewable.batterySoc / 100);
      batteryLedBar.scale.set(1, scale, 1);
      const mat = batteryLedBar.material as THREE.MeshStandardMaterial;
      if (renewable.batterySoc < 20) {
        mat.color.setHex(0xef4444);
        mat.emissive.setHex(0xdc2626);
      } else {
        mat.color.setHex(0x10b981);
        mat.emissive.setHex(0x059669);
      }
    }
  }, [renewable.batterySoc]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <div ref={mountRef} className="w-full h-full" />

      {/* Hover tooltip */}
      {hoveredLabel && (
        <div className="absolute top-20 left-6 z-20 pointer-events-none px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-xs font-mono text-cyan-300 shadow-xl flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{hoveredLabel}</span>
          <span className="text-slate-400 text-[10px] ml-1">(Click to Inspect)</span>
        </div>
      )}

      {/* Navigation Helper HUD in bottom-left */}
      <div className="absolute bottom-4 left-6 z-10 pointer-events-none hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 text-xs text-slate-400 font-mono">
        <span>Left Drag: Rotate</span>
        <span>·</span>
        <span>Right Drag: Pan</span>
        <span>·</span>
        <span>Scroll: Zoom</span>
        <span>·</span>
        <span>Click: Inspect Zone/Asset</span>
      </div>
    </div>
  );
};
