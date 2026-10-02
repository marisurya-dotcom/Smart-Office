/**
 * Procedural 3D Geometry and Assets for the Smart Office Digital Twin.
 * Creates an architectural cutaway modern office with detailed workstations,
 * meeting room, server room, HVAC, solar, battery, distribution panel, water pumps,
 * energy conduits, and occupants.
 */

import * as THREE from 'three';
import { ZoneData, ElectricalLoads, RenewableGridState, OccupantAvatar } from '../../types/digitalTwin';

export interface AnimatedWorker {
  id: string;
  group: THREE.Group;
  action: 'coding' | 'presenting' | 'reviewing' | 'analyzing' | 'troubleshooting' | 'collaborating' | 'coffee';
  pose?: string;
  leftArm?: THREE.Mesh | THREE.Group;
  rightArm?: THREE.Mesh | THREE.Group;
  head?: THREE.Mesh | THREE.Group;
  leftLeg?: THREE.Mesh;
  rightLeg?: THREE.Mesh;
  initialHeadRotY: number;
  phase: number;
}

export interface OfficeSceneObjects {
  rootGroup: THREE.Group;
  zoneMeshes: Map<string, THREE.Mesh>;
  equipmentMeshes: Map<string, THREE.Group>;
  energyConduitsGroup: THREE.Group;
  airflowParticles: THREE.Points;
  energyFlowParticles: THREE.Points;
  ceilingLightsGroup: THREE.Group;
  solarPanelsGroup: THREE.Group;
  batteryLedBar: THREE.Mesh;
  serverLeds: THREE.Points;
  waterPumpRotors: THREE.Mesh[];
  occupantsGroup: THREE.Group;
  hvacDuctsGroup: THREE.Group;
  interactiveObjects: THREE.Object3D[];
  animatedWorkers: AnimatedWorker[];
  sensorGroup: THREE.Group;
  sensorIndicators: Map<string, { pirLed: THREE.Mesh; cameraLed: THREE.Mesh; coverageCone: THREE.Mesh }>;
}

export function createModernOfficeScene(occupantsList: OccupantAvatar[] = []): OfficeSceneObjects {
  const rootGroup = new THREE.Group();
  const zoneMeshes = new Map<string, THREE.Mesh>();
  const equipmentMeshes = new Map<string, THREE.Group>();
  const interactiveObjects: THREE.Object3D[] = [];
  const waterPumpRotors: THREE.Mesh[] = [];
  const animatedWorkers: AnimatedWorker[] = [];
  const sensorGroup = new THREE.Group();
  const sensorIndicators = new Map<string, { pirLed: THREE.Mesh; cameraLed: THREE.Mesh; coverageCone: THREE.Mesh }>();

  // ==========================================
  // 1. MATERIALS PALETTE (Architectural & PBR)
  // ==========================================
  const floorWoodMat = new THREE.MeshStandardMaterial({
    color: 0xdfd7cc,
    roughness: 0.65,
    metalness: 0.05,
  });

  const floorTileMat = new THREE.MeshStandardMaterial({
    color: 0x242b35,
    roughness: 0.4,
    metalness: 0.2,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.8,
    metalness: 0.02,
  });

  const cutawayWallMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.7,
    metalness: 0.05,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.24,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.85,
    ior: 1.5,
  });

  const darkMullionMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.7,
  });

  const deskWoodMat = new THREE.MeshStandardMaterial({
    color: 0xe8dbcd,
    roughness: 0.55,
    metalness: 0.05,
  });

  const deskLegsMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.8,
  });

  const acousticMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.9,
    metalness: 0.0,
  });

  const screenBezelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.6,
  });

  const screenActiveMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });

  const chairMeshMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.2,
  });

  const metalGalvanizedMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.35,
    metalness: 0.75,
  });

  // ==========================================
  // 2. FOUNDATION & MAIN FLOOR
  // ==========================================
  const podiumGeo = new THREE.BoxGeometry(38, 0.8, 26);
  const podiumMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const podium = new THREE.Mesh(podiumGeo, podiumMat);
  podium.position.set(0, -0.4, 0);
  podium.receiveShadow = true;
  rootGroup.add(podium);

  // Main office floor (Wood texture / parquet color)
  const floorGeo = new THREE.BoxGeometry(36, 0.15, 24);
  const floorMesh = new THREE.Mesh(floorGeo, floorWoodMat);
  floorMesh.position.set(0, 0.075, 0);
  floorMesh.receiveShadow = true;
  rootGroup.add(floorMesh);

  // Server Room & Utility Section tiled dark flooring
  const tileFloorGeo = new THREE.BoxGeometry(10, 0.16, 24);
  const tileFloor = new THREE.Mesh(tileFloorGeo, floorTileMat);
  tileFloor.position.set(-13, 0.08, 0);
  tileFloor.receiveShadow = true;
  rootGroup.add(tileFloor);

  // ==========================================
  // 3. ARCHITECTURAL WALLS & CUTAWAY
  // ==========================================
  // North Wall (Back) - Full height with ribbon windows
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(36, 3.8, 0.4), wallMat);
  northWall.position.set(0, 1.9, -12);
  northWall.receiveShadow = true;
  rootGroup.add(northWall);

  // West Wall (Left - Utility side) - Full height
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.8, 24), wallMat);
  westWall.position.set(-18, 1.9, 0);
  westWall.receiveShadow = true;
  rootGroup.add(westWall);

  // South Cutaway Wall (Front) - Low architectural cutaway (0.6m) so we can look inside!
  const southCutaway = new THREE.Mesh(new THREE.BoxGeometry(36, 0.7, 0.4), cutawayWallMat);
  southCutaway.position.set(0, 0.35, 12);
  rootGroup.add(southCutaway);

  // East Cutaway Wall (Right) - Low cutaway
  const eastCutaway = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 24), cutawayWallMat);
  eastCutaway.position.set(18, 0.35, 0);
  rootGroup.add(eastCutaway);

  // ==========================================
  // 4. INTERIOR PARTITION GLASS WALLS
  // ==========================================
  // Divider between utility/server corridor and open office (x = -8)
  const serverDivider = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 24), glassMat);
  serverDivider.position.set(-8, 1.75, 0);
  rootGroup.add(serverDivider);

  // Mullions for server divider
  for (let z = -10; z <= 10; z += 4) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.5, 0.1), darkMullionMat);
    post.position.set(-8, 1.75, z);
    rootGroup.add(post);
  }

  // Divider between Open Office and Meeting Room (x = 5, z from -12 to 0)
  const boardroomGlass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 12), glassMat);
  boardroomGlass.position.set(5, 1.75, -6);
  rootGroup.add(boardroomGlass);

  // Boardroom south glass partition (z = 0, x from 5 to 18)
  const boardroomSouthGlass = new THREE.Mesh(new THREE.BoxGeometry(13, 3.5, 0.2), glassMat);
  boardroomSouthGlass.position.set(11.5, 1.75, 0);
  rootGroup.add(boardroomSouthGlass);

  // Divider between Executive Suite and Open Office (z = 0, x from 5 to 18)
  // Executive Suite north glass wall (at z = 0) with door frame
  for (let x = 6; x <= 16; x += 3.5) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 0.25), darkMullionMat);
    mullion.position.set(x, 1.75, 0);
    rootGroup.add(mullion);
  }

  // Structural Round Columns in Open Office
  const colGeo = new THREE.CylinderGeometry(0.3, 0.3, 3.8, 16);
  const colMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const colPositions = [
    [-2, 1.9, -6],
    [-2, 1.9, 6],
    [2, 1.9, -6],
    [2, 1.9, 6],
  ];
  colPositions.forEach(([cx, cy, cz]) => {
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.set(cx, cy, cz);
    col.castShadow = true;
    rootGroup.add(col);
  });

  // ==========================================
  // 5. ZONE INTERACTIVE DETECTOR FLOORS
  // ==========================================
  // Invisible or subtle tinted floor planes for raycasting & thermal heatmap
  const zonePlanes = [
    { id: 'zone-open-office', x: -1.5, z: 0, w: 13, d: 24, color: 0x38bdf8 },
    { id: 'zone-boardroom', x: 11.5, z: -6, w: 13, d: 12, color: 0x10b981 },
    { id: 'zone-executive', x: 11.5, z: 6, w: 13, d: 12, color: 0x8b5cf6 },
    { id: 'zone-server', x: -13, z: -6, w: 10, d: 12, color: 0x06b6d4 },
    { id: 'zone-breakout', x: -13, z: 6, w: 10, d: 12, color: 0xf59e0b },
  ];

  zonePlanes.forEach((zp) => {
    const zMat = new THREE.MeshStandardMaterial({
      color: zp.color,
      transparent: true,
      opacity: 0.05,
      roughness: 0.3,
    });
    const zMesh = new THREE.Mesh(new THREE.PlaneGeometry(zp.w - 0.2, zp.d - 0.2), zMat);
    zMesh.rotation.x = -Math.PI / 2;
    zMesh.position.set(zp.x, 0.17, zp.z);
    zMesh.userData = { isZone: true, zoneId: zp.id };
    rootGroup.add(zMesh);
    zoneMeshes.set(zp.id, zMesh);
    interactiveObjects.push(zMesh);
  });

  // ==========================================
  // 6. OPEN WORKSPACE FURNITURE (Desks, Chairs, Monitors)
  // ==========================================
  const deskClustersGroup = new THREE.Group();

  // Helper to create illuminated procedural monitor textures
  function createProceduralScreenTexture(type: 'code' | 'chart' | 'presentation') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#0b132b';
    ctx.fillRect(0, 0, 256, 160);

    // Title bar with macOS/window dots
    ctx.fillStyle = '#1c2541';
    ctx.fillRect(0, 0, 256, 18);
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(10, 9, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(20, 9, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(30, 9, 3, 0, Math.PI * 2); ctx.fill();

    if (type === 'code') {
      const colors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#facc15', '#cbd5e1'];
      for (let y = 28; y < 150; y += 10) {
        const indent = y % 4 === 0 ? 32 : y % 3 === 0 ? 20 : 10;
        ctx.fillStyle = colors[(y * 7) % colors.length];
        const w = 35 + ((y * 29) % 150);
        ctx.fillRect(indent, y, w, 5);
      }
    } else if (type === 'chart') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('ENERGY TELEMETRY kW', 42, 13);
      for (let i = 0; i < 15; i++) {
        const h = 15 + Math.sin(i * 0.7) * 32 + ((i * 11) % 35);
        ctx.fillStyle = i % 2 === 0 ? '#06b6d4' : '#10b981';
        ctx.fillRect(14 + i * 15, 145 - h, 10, h);
      }
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 85);
      for (let i = 0; i < 15; i++) {
        ctx.lineTo(14 + i * 15 + 5, 80 - Math.sin(i * 0.8) * 20);
      }
      ctx.stroke();
    } else if (type === 'presentation') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 256, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('OCCUPANCY INTEL & NET-ZERO', 12, 16);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(65, 95, 38, 0, Math.PI * 1.4);
      ctx.lineTo(65, 95);
      ctx.fill();
      ctx.fillStyle = '#0b132b';
      ctx.beginPath();
      ctx.arc(65, 95, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('78% ECO', 42, 98);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText('• PIR Setback: -68% kW', 125, 65);
      ctx.fillText('• Auto-Dimming: Active', 125, 85);
      ctx.fillText('• Smart Comfort: 22°C', 125, 105);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const codeTex = createProceduralScreenTexture('code');
  const chartTex = createProceduralScreenTexture('chart');
  const presentationTex = createProceduralScreenTexture('presentation');

  const screenCodeMat = new THREE.MeshStandardMaterial({
    map: codeTex,
    emissive: 0xffffff,
    emissiveMap: codeTex,
    emissiveIntensity: 0.75,
    roughness: 0.3,
  });

  const screenChartMat = new THREE.MeshStandardMaterial({
    map: chartTex,
    emissive: 0xffffff,
    emissiveMap: chartTex,
    emissiveIntensity: 0.75,
    roughness: 0.3,
  });

  const screenPresMat = new THREE.MeshStandardMaterial({
    map: presentationTex,
    emissive: 0xffffff,
    emissiveMap: presentationTex,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  // ==========================================
  // ERGONOMIC OFFICE TASK CHAIR BUILDER
  // ==========================================
  function createErgonomicChair() {
    const chair = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });

    // 5-Star Spider Caster Base
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.28), baseMat);
      arm.position.set(Math.sin(angle) * 0.14, 0.045, Math.cos(angle) * 0.14);
      arm.rotation.y = angle;
      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), wheelMat);
      wheel.position.set(Math.sin(angle) * 0.26, 0.024, Math.cos(angle) * 0.26);
      chair.add(arm, wheel);
    }

    // Chrome pneumatic cylinder
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.38, 12), baseMat);
    cylinder.position.set(0, 0.22, 0);
    chair.add(cylinder);

    // Contoured seat cushion (height exactly 0.45m)
    const seatGeo = new THREE.BoxGeometry(0.52, 0.07, 0.50);
    const seatMesh = new THREE.Mesh(seatGeo, chairMeshMat);
    seatMesh.position.set(0, 0.45, 0.05);
    chair.add(seatMesh);

    // High-back breathable mesh backrest with ergonomic lumbar curve
    const backGeo = new THREE.BoxGeometry(0.48, 0.52, 0.06);
    const backMesh = new THREE.Mesh(backGeo, chairMeshMat);
    backMesh.position.set(0, 0.75, -0.19);
    backMesh.rotation.x = -0.06;
    chair.add(backMesh);

    // Lumbar spine bracket
    const lumbarBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.04), baseMat);
    lumbarBar.position.set(0, 0.64, -0.22);
    chair.add(lumbarBar);

    // 3D Adjustable Armrests
    for (const side of [-0.25, 0.25]) {
      const armStem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.20, 8), baseMat);
      armStem.position.set(side, 0.54, 0.02);
      const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.22), wheelMat);
      armPad.position.set(side, 0.64, 0.05);
      chair.add(armStem, armPad);
    }

    return chair;
  }

  function createDeskPod(centerX: number, centerZ: number) {
    const pod = new THREE.Group();
    // 4-person desk cluster (2x2 face to face)
    const deskTopGeo = new THREE.BoxGeometry(4.8, 0.08, 2.4);
    const deskTop = new THREE.Mesh(deskTopGeo, deskWoodMat);
    deskTop.position.set(0, 0.74, 0);
    deskTop.castShadow = true;
    pod.add(deskTop);

    // Metal legs
    const legGeo = new THREE.BoxGeometry(0.08, 0.74, 2.3);
    const legLeft = new THREE.Mesh(legGeo, deskLegsMat);
    legLeft.position.set(-2.3, 0.37, 0);
    const legRight = new THREE.Mesh(legGeo, deskLegsMat);
    legRight.position.set(2.3, 0.37, 0);
    const legCenter = new THREE.Mesh(legGeo, deskLegsMat);
    legCenter.position.set(0, 0.37, 0);
    pod.add(legLeft, legRight, legCenter);

    // Central acoustic felt privacy screen (spine at Z = 0)
    const screenDividerGeo = new THREE.BoxGeometry(4.8, 0.45, 0.06);
    const screenDivider = new THREE.Mesh(screenDividerGeo, acousticMat);
    screenDivider.position.set(0, 0.98, 0);
    pod.add(screenDivider);

    // Mousepad, Keyboard, and Mouse Materials
    const deskPadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const keyboardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const mouseGlowMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const coffeeMat = new THREE.MeshBasicMaterial({ color: 0x3e2723 });

    // 4 Workstation setups (2 North facing South +Z, 2 South facing North -Z)
    const workstations = [
      { x: -1.2, zChair: -0.95, zDesk: -0.58, zMon: -0.22, rot: 0, hasLaptop: false },
      { x: 1.2, zChair: -0.95, zDesk: -0.58, zMon: -0.22, rot: 0, hasLaptop: false },
      { x: -1.2, zChair: 0.95, zDesk: 0.58, zMon: 0.22, rot: Math.PI, hasLaptop: true },
      { x: 1.2, zChair: 0.95, zDesk: 0.58, zMon: 0.22, rot: Math.PI, hasLaptop: false },
    ];

    workstations.forEach((ws) => {
      // 1. Ergonomic Chair at workstation
      const chair = createErgonomicChair();
      chair.position.set(ws.x, 0, ws.zChair);
      chair.rotation.y = ws.rot;
      pod.add(chair);

      // 2. Large Dark Felt Desk Mat
      const deskPad = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.008, 0.36), deskPadMat);
      deskPad.position.set(ws.x, 0.784, ws.zDesk);
      pod.add(deskPad);

      // 3. Backlit Mechanical Keyboard
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.016, 0.14), keyboardMat);
      kb.position.set(ws.x - 0.04, 0.792, ws.zDesk);
      kb.rotation.y = ws.rot;
      pod.add(kb);

      // 4. Ergonomic Optical Mouse with subtle blue glow
      const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.024, 0.105), mouseMat);
      const mouseOffZ = ws.rot === 0 ? 0 : 0;
      mouse.position.set(ws.x + 0.26, 0.796, ws.zDesk + mouseOffZ);
      mouse.rotation.y = ws.rot;
      const mouseGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.02), mouseGlowMat);
      mouseGlow.rotation.x = -Math.PI / 2;
      mouseGlow.position.set(ws.x + 0.26, 0.785, ws.zDesk);
      pod.add(mouse, mouseGlow);

      // 5. Ceramic Coffee Mug
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 12), mugMat);
      mug.position.set(ws.x + 0.38, 0.82, ws.rot === 0 ? ws.zDesk + 0.16 : ws.zDesk - 0.16);
      const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.036, 12), coffeeMat);
      coffee.rotation.x = -Math.PI / 2;
      coffee.position.set(ws.x + 0.38, 0.859, ws.rot === 0 ? ws.zDesk + 0.16 : ws.zDesk - 0.16);
      pod.add(mug, coffee);

      // 6. Dual Monitors or Modern Laptop (facing directly toward the worker!)
      if (ws.hasLaptop) {
        // Slim modern aluminum laptop open at 115 degrees
        const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.012, 0.22), deskLegsMat);
        lapBase.position.set(ws.x, 0.788, ws.rot === 0 ? ws.zDesk + 0.18 : ws.zDesk - 0.18);
        const lapScreen = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.01), screenBezelMat);
        lapScreen.position.set(ws.x, 0.90, ws.rot === 0 ? ws.zDesk + 0.28 : ws.zDesk - 0.28);
        lapScreen.rotation.x = ws.rot === 0 ? -0.35 : 0.35;
        const lapDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.20), screenChartMat);
        lapDisplay.position.set(ws.x, 0.90, ws.rot === 0 ? ws.zDesk + 0.274 : ws.zDesk - 0.274);
        lapDisplay.rotation.x = ws.rot === 0 ? -0.35 : 0.35;
        lapDisplay.rotation.y = ws.rot === 0 ? Math.PI : 0;
        pod.add(lapBase, lapScreen, lapDisplay);
      } else {
        // Dual IPS Monitors on sturdy gas-spring desk clamp arm
        const monGroup = new THREE.Group();
        // Stand base clamp
        const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.06, 12), deskLegsMat);
        standBase.position.set(0, 0.03, 0);
        const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 10), deskLegsMat);
        standPole.position.set(0, 0.20, 0);
        monGroup.add(standBase, standPole);

        // Screen 1 (Left): tilted 14 degrees inwards
        const monGeo = new THREE.BoxGeometry(0.72, 0.42, 0.03);
        const mon1Bezel = new THREE.Mesh(monGeo, screenBezelMat);
        mon1Bezel.position.set(-0.38, 0.36, 0.05);
        mon1Bezel.rotation.y = -0.22;
        const mon1Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.38), screenCodeMat);
        mon1Screen.position.set(-0.38, 0.36, 0.066);
        mon1Screen.rotation.y = -0.22;
        mon1Screen.rotation.y += Math.PI; // Screen normal faces towards worker

        // Screen 2 (Right): tilted -14 degrees inwards
        const mon2Bezel = new THREE.Mesh(monGeo, screenBezelMat);
        mon2Bezel.position.set(0.38, 0.36, 0.05);
        mon2Bezel.rotation.y = 0.22;
        const mon2Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.38), screenChartMat);
        mon2Screen.position.set(0.38, 0.36, 0.066);
        mon2Screen.rotation.y = 0.22;
        mon2Screen.rotation.y += Math.PI; // Screen normal faces towards worker

        monGroup.add(mon1Bezel, mon1Screen, mon2Bezel, mon2Screen);
        monGroup.position.set(ws.x, 0.78, ws.zMon);
        // If worker is on North side (rot = 0), monitor faces North (rot = 0 so back is at +Z)
        // If worker is on South side (rot = Math.PI), monitor faces South (rot = Math.PI)
        monGroup.rotation.y = ws.rot;
        pod.add(monGroup);
      }
    });

    pod.position.set(centerX, 0, centerZ);
    return pod;
  }

  // Add 4 desk pods across Open Workspace
  deskClustersGroup.add(createDeskPod(-4.5, -5.5));
  deskClustersGroup.add(createDeskPod(1.5, -5.5));
  deskClustersGroup.add(createDeskPod(-4.5, 5.5));
  deskClustersGroup.add(createDeskPod(1.5, 5.5));
  rootGroup.add(deskClustersGroup);

  // Large floor architectural plants
  function createFloorPlant(px: number, pz: number) {
    const plantGroup = new THREE.Group();
    const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
    planter.position.set(0, 0.4, 0);
    plantGroup.add(planter);

    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }));
    foliage.scale.set(1.0, 1.8, 1.0);
    foliage.position.set(0, 1.3, 0);
    plantGroup.add(foliage);
    plantGroup.position.set(px, 0, pz);
    return plantGroup;
  }

  rootGroup.add(createFloorPlant(-7.2, -10));
  rootGroup.add(createFloorPlant(-7.2, 10));
  rootGroup.add(createFloorPlant(4.2, 0));

  // ==========================================
  // 7. BOARDROOM / CONFERENCE ROOM (Zone 2)
  // ==========================================
  const boardroomGroup = new THREE.Group();
  // Large boat-shaped conference table
  const confTableGeo = new THREE.BoxGeometry(6.5, 0.1, 2.6);
  const confTableMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.2 });
  const confTable = new THREE.Mesh(confTableGeo, confTableMat);
  confTable.position.set(11.5, 0.75, -6);
  confTable.castShadow = true;
  boardroomGroup.add(confTable);

  // Table pedestal bases
  const pedestalGeo = new THREE.BoxGeometry(0.8, 0.75, 1.2);
  const ped1 = new THREE.Mesh(pedestalGeo, darkMullionMat);
  ped1.position.set(9.5, 0.375, -6);
  const ped2 = new THREE.Mesh(pedestalGeo, darkMullionMat);
  ped2.position.set(13.5, 0.375, -6);
  boardroomGroup.add(ped1, ped2);

  // 8 Executive chairs around table facing inwards towards table
  const chairPositions: [number, number, number][] = [
    // South side chairs facing North (Math.PI) towards table at Z = -6
    [10.0, -4.5, Math.PI],
    [11.5, -4.5, Math.PI],
    [13.0, -4.5, Math.PI],
    // North side chairs facing South (0) towards table at Z = -6
    [10.0, -7.5, 0],
    [11.5, -7.5, 0],
    [13.0, -7.5, 0],
    // End chairs
    [7.8, -6, Math.PI / 2],
    [15.2, -6, -Math.PI / 2],
  ];
  chairPositions.forEach(([cx, cz, crot]) => {
    const cGroup = createErgonomicChair();
    cGroup.position.set(cx, 0, cz);
    cGroup.rotation.y = crot;
    boardroomGroup.add(cGroup);
  });

  // Table accessories (tablets, laptops, water carafes)
  const tablet1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.015, 0.18), darkMullionMat);
  tablet1.position.set(10.0, 0.81, -5.2);
  const tabScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.16), screenPresMat);
  tabScreen.rotation.x = -Math.PI / 2;
  tabScreen.position.set(10.0, 0.819, -5.2);
  boardroomGroup.add(tablet1, tabScreen);

  const lap1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.012, 0.22), deskLegsMat);
  lap1.position.set(13.0, 0.81, -5.2);
  boardroomGroup.add(lap1);

  // Large 85" Video Conference Wall Display
  const tvFrameGeo = new THREE.BoxGeometry(3.6, 1.8, 0.08);
  const tvFrame = new THREE.Mesh(tvFrameGeo, screenBezelMat);
  tvFrame.position.set(11.5, 2.2, -11.9);
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.6), screenPresMat);
  tvScreen.position.set(11.5, 2.2, -11.85);
  boardroomGroup.add(tvFrame, tvScreen);
  rootGroup.add(boardroomGroup);

  // ==========================================
  // 8. EXECUTIVE & FOCUS SUITE (Zone 3)
  // ==========================================
  const execGroup = new THREE.Group();
  // Executive L-shaped wooden desk
  const execDeskMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
  const execDesk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.4), execDeskMat);
  execDesk.position.set(11.5, 0.75, 6);
  const execDeskReturn = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.6), execDeskMat);
  execDeskReturn.position.set(10.5, 0.75, 7.3);
  execGroup.add(execDesk, execDeskReturn);

  // Bookshelf / credenza against wall
  const credenza = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x475569 }));
  credenza.position.set(11.5, 0.7, 11.6);
  execGroup.add(credenza);

  // Executive Ergonomic Chair at desk
  const execChair = createErgonomicChair();
  execChair.position.set(11.5, 0, 6.9);
  execChair.rotation.y = Math.PI; // Facing North towards desk at Z = 6.0
  execGroup.add(execChair);

  // Executive open sleek laptop on desk
  const execLaptop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.012, 0.24), deskLegsMat);
  execLaptop.position.set(11.5, 0.81, 6.3);
  const execLapScreen = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.01), screenBezelMat);
  execLapScreen.position.set(11.5, 0.93, 6.2);
  execLapScreen.rotation.x = -0.35;
  const execLapDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22), screenChartMat);
  execLapDisplay.position.set(11.5, 0.93, 6.206);
  execLapDisplay.rotation.x = -0.35;
  execGroup.add(execLaptop, execLapScreen, execLapDisplay);

  rootGroup.add(execGroup);

  // ==========================================
  // 9. SERVER & IT EQUIPMENT ROOM (Zone 4)
  // ==========================================
  const serverGroup = new THREE.Group();
  serverGroup.userData = { isEquipment: true, equipmentId: 'equip-server-rack' };

  // 2 Standard 42U Server Racks
  function createServerRack(rx: number, rz: number) {
    const rack = new THREE.Group();
    // Steel cabinet frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 1.1), frameMat);
    rackFrame.position.set(0, 1.2, 0);
    rack.add(rackFrame);

    // Front vented glass/mesh door
    const meshDoorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), meshDoorMat);
    door.position.set(0, 1.2, 0.56);
    rack.add(door);

    // In-rack server blades
    for (let u = 0.3; u <= 2.1; u += 0.22) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.9), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 }));
      blade.position.set(0, u, 0.05);
      rack.add(blade);
    }

    rack.position.set(rx, 0, rz);
    return rack;
  }

  const rack1 = createServerRack(-12, -7);
  const rack2 = createServerRack(-10.2, -7);
  serverGroup.add(rack1, rack2);

  // Server rack status LEDs (flashing green/cyan/amber particles)
  const ledGeo = new THREE.BufferGeometry();
  const ledCount = 36;
  const ledPositions = new Float32Array(ledCount * 3);
  const ledColors = new Float32Array(ledCount * 3);
  let pIdx = 0;
  for (let r = 0; r < 2; r++) {
    const rx = r === 0 ? -12 : -10.2;
    for (let i = 0; i < 18; i++) {
      const u = 0.3 + (i * 0.1);
      ledPositions[pIdx * 3] = rx + (Math.random() * 0.8 - 0.4);
      ledPositions[pIdx * 3 + 1] = u;
      ledPositions[pIdx * 3 + 2] = -6.44;

      // Green / Cyan emissive color
      ledColors[pIdx * 3] = 0.1;
      ledColors[pIdx * 3 + 1] = 0.9;
      ledColors[pIdx * 3 + 2] = 0.4;
      pIdx++;
    }
  }
  ledGeo.setAttribute('position', new THREE.BufferAttribute(ledPositions, 3));
  ledGeo.setAttribute('color', new THREE.BufferAttribute(ledColors, 3));
  const ledMat = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
  });
  const serverLeds = new THREE.Points(ledGeo, ledMat);
  serverGroup.add(serverLeds);

  // Dedicated In-Row CRAC Cooling Unit for server room
  const cracMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.3 });
  const cracUnit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 1.1), cracMat);
  cracUnit.position.set(-8.8, 1.2, -7);
  serverGroup.add(cracUnit);

  rootGroup.add(serverGroup);
  equipmentMeshes.set('equip-server-rack', serverGroup);
  interactiveObjects.push(serverGroup);

  // ==========================================
  // 10. MAIN ELECTRICAL DISTRIBUTION PANEL (MDP)
  // ==========================================
  const mdpGroup = new THREE.Group();
  mdpGroup.userData = { isEquipment: true, equipmentId: 'equip-mdp' };

  // Steel Enclosure Cabinet
  const mdpCabinet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.6), new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.3,
    metalness: 0.7,
  }));
  mdpCabinet.position.set(-15, 1.2, -10.5);
  mdpGroup.add(mdpCabinet);

  // Digital Multi-Function Meter Screen (glowing cyan display)
  const mdpScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.8,
  }));
  mdpScreen.position.set(-15, 1.8, -10.19);
  mdpGroup.add(mdpScreen);

  // 4 Main Circuit Breaker Banks (AC, Lighting, Computers, Water Motor)
  const labels = ['AC', 'LGT', 'IT', 'PUMP'];
  labels.forEach((lbl, idx) => {
    const breaker = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.12), new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
    }));
    breaker.position.set(-15.4 + idx * 0.28, 1.2, -10.18);

    // Indicator LED
    const ind = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.0,
    }));
    ind.position.set(-15.4 + idx * 0.28, 1.32, -10.15);
    mdpGroup.add(breaker, ind);
  });

  rootGroup.add(mdpGroup);
  equipmentMeshes.set('equip-mdp', mdpGroup);
  interactiveObjects.push(mdpGroup);

  // ==========================================
  // 11. WATER BOOSTER PUMP & MOTOR STATION
  // ==========================================
  const waterPumpGroup = new THREE.Group();
  waterPumpGroup.userData = { isEquipment: true, equipmentId: 'equip-water-pump' };

  // Concrete Equipment Inertia Pad
  const pumpPad = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }));
  pumpPad.position.set(-14.5, 0.18, -3.5);
  waterPumpGroup.add(pumpPad);

  // Dual Multistage Vertical Pumps
  for (let p = 0; p < 2; p++) {
    const px = -15.2 + p * 1.4;
    // Motor Casing (Industrial Blue)
    const motorCasing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.7, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.6 })
    );
    motorCasing.position.set(px, 1.2, -3.5);

    // Pump Base / Volute
    const pumpVolute = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 })
    );
    pumpVolute.position.set(px, 0.6, -3.5);

    // Stainless steel spinning cooling fan rotor indicator on top
    const rotor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
    );
    rotor.position.set(px, 1.6, -3.5);
    waterPumpRotors.push(rotor);

    waterPumpGroup.add(motorCasing, pumpVolute, rotor);
  }

  // Piping Manifolds (Suction & Discharge) with Brass Valves
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.3 });

  // Main header pipe
  const headerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 12), pipeMat);
  headerPipe.rotation.z = Math.PI / 2;
  headerPipe.position.set(-14.5, 0.7, -4.2);
  waterPumpGroup.add(headerPipe);

  // Pressure Gauge
  const gaugeDial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  gaugeDial.rotation.x = Math.PI / 2;
  gaugeDial.position.set(-14.5, 1.2, -4.2);
  waterPumpGroup.add(gaugeDial);

  rootGroup.add(waterPumpGroup);
  equipmentMeshes.set('equip-water-pump', waterPumpGroup);
  interactiveObjects.push(waterPumpGroup);

  // ==========================================
  // 12. BATTERY ENERGY STORAGE SYSTEM (BESS)
  // ==========================================
  const bessGroup = new THREE.Group();
  bessGroup.userData = { isEquipment: true, equipmentId: 'equip-bess-battery' };

  // Industrial Outdoor BESS Enclosure (Matte White / Tesla Megapack aesthetic)
  const bessCabinet = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 1.2), new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.3,
    metalness: 0.4,
  }));
  bessCabinet.position.set(-14.5, 1.38, 2.5);
  bessGroup.add(bessCabinet);

  // Dynamic LED State-of-Charge Bar on Front Panel
  const ledBarGeo = new THREE.BoxGeometry(0.12, 1.4, 0.04);
  const ledBarMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.9,
  });
  const batteryLedBar = new THREE.Mesh(ledBarGeo, ledBarMat);
  batteryLedBar.position.set(-13.29, 1.4, 2.5);
  batteryLedBar.rotation.y = Math.PI / 2;
  bessGroup.add(batteryLedBar);

  rootGroup.add(bessGroup);
  equipmentMeshes.set('equip-bess-battery', bessGroup);
  interactiveObjects.push(bessGroup);

  // ==========================================
  // 13. GRID CONNECTION & TRANSFORMER FEED
  // ==========================================
  const gridGroup = new THREE.Group();
  // Pad-mounted utility transformer box at exterior left corner
  const transformer = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.6), new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.5,
  }));
  transformer.position.set(-16.5, 0.8, -13.5);
  gridGroup.add(transformer);

  // Utility high-voltage conduit running into building
  const feedConduit = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 12), pipeMat);
  feedConduit.position.set(-16.0, 0.4, -12.0);
  feedConduit.rotation.x = Math.PI / 4;
  gridGroup.add(feedConduit);
  rootGroup.add(gridGroup);

  // ==========================================
  // 14. ROOFTOP SOLAR PV ARRAYS & PERGOLA
  // ==========================================
  const solarPanelsGroup = new THREE.Group();
  solarPanelsGroup.userData = { isEquipment: true, equipmentId: 'equip-solar-pv' };

  // Steel Pergola Supports over East wing
  const pergolaFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
  const pBeam1 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 0.2), pergolaFrameMat);
  pBeam1.position.set(10.5, 4.2, -6);
  const pBeam2 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 0.2), pergolaFrameMat);
  pBeam2.position.set(10.5, 4.2, 6);
  solarPanelsGroup.add(pBeam1, pBeam2);

  // Photovoltaic Panels (High-efficiency monocrystalline with metallic sheen)
  const pvMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.85,
    roughness: 0.2,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.25,
  });

  const panelGeo = new THREE.BoxGeometry(1.8, 0.04, 3.2);
  for (let px = 5.5; px <= 15.5; px += 2.2) {
    for (let pz = -4.5; pz <= 4.5; pz += 4.5) {
      const panel = new THREE.Mesh(panelGeo, pvMat);
      panel.position.set(px, 4.4, pz);
      // Tilt 22 degrees south
      panel.rotation.x = 0.22;
      panel.castShadow = true;
      solarPanelsGroup.add(panel);
    }
  }

  // Solar String Inverter Box
  const inverterBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 }));
  inverterBox.position.set(4.5, 3.8, 0);
  solarPanelsGroup.add(inverterBox);

  rootGroup.add(solarPanelsGroup);
  equipmentMeshes.set('equip-solar-pv', solarPanelsGroup);
  interactiveObjects.push(solarPanelsGroup);

  // ==========================================
  // 15. ROOFTOP HVAC CHILLER UNIT & DUCTS
  // ==========================================
  const hvacGroup = new THREE.Group();
  hvacGroup.userData = { isEquipment: true, equipmentId: 'equip-hvac-unit' };

  // Main Chiller Enclosure on Roof above Utility section
  const chillerGeo = new THREE.BoxGeometry(4.2, 2.0, 2.4);
  const chiller = new THREE.Mesh(chillerGeo, metalGalvanizedMat);
  chiller.position.set(-13, 4.8, -6);
  chiller.castShadow = true;
  hvacGroup.add(chiller);

  // Twin circular condenser exhaust cowls
  for (let f = 0; f < 2; f++) {
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16), darkMullionMat);
    cowl.position.set(-14.2 + f * 2.4, 5.9, -6);
    hvacGroup.add(cowl);
  }

  rootGroup.add(hvacGroup);
  equipmentMeshes.set('equip-hvac-unit', hvacGroup);
  interactiveObjects.push(hvacGroup);

  // Ceiling Supply Air Ducts Network (Galvanized sheet metal)
  const hvacDuctsGroup = new THREE.Group();
  // Main spine duct traversing building from HVAC unit across open office
  const mainSpineDuct = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 0.6), metalGalvanizedMat);
  mainSpineDuct.position.set(0, 3.4, 0);
  hvacDuctsGroup.add(mainSpineDuct);

  // North branch duct into Meeting Room
  const northBranch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 10), metalGalvanizedMat);
  northBranch.position.set(10.5, 3.4, -5);
  hvacDuctsGroup.add(northBranch);

  // South branch duct into Open Office Pods
  const southBranch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 10), metalGalvanizedMat);
  southBranch.position.set(-3.5, 3.4, 0);
  hvacDuctsGroup.add(southBranch);

  // Supply Air Diffusers (Ceiling grilles)
  const diffuserMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const diffuserPositions: [number, number, number][] = [
    [-4.5, 3.2, -5.5],
    [1.5, 3.2, -5.5],
    [-4.5, 3.2, 5.5],
    [1.5, 3.2, 5.5],
    [11.5, 3.2, -6],
    [11.5, 3.2, 6],
    [-11, 3.2, -6],
  ];

  diffuserPositions.forEach(([dx, dy, dz]) => {
    const diff = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.7), diffuserMat);
    diff.position.set(dx, dy, dz);
    hvacDuctsGroup.add(diff);
  });
  rootGroup.add(hvacDuctsGroup);

  // ==========================================
  // 16. ANIMATED AIRFLOW PARTICLES (From Diffusers)
  // ==========================================
  const airflowParticleCount = 180;
  const airflowGeo = new THREE.BufferGeometry();
  const airflowPos = new Float32Array(airflowParticleCount * 3);
  const airflowColors = new Float32Array(airflowParticleCount * 3);

  for (let i = 0; i < airflowParticleCount; i++) {
    const dIdx = i % diffuserPositions.length;
    const [dx, dy, dz] = diffuserPositions[dIdx];
    airflowPos[i * 3] = dx + (Math.random() * 0.8 - 0.4);
    airflowPos[i * 3 + 1] = dy - Math.random() * 2.2;
    airflowPos[i * 3 + 2] = dz + (Math.random() * 0.8 - 0.4);

    // Cool refreshing cyan/blue airflow color
    airflowColors[i * 3] = 0.22;
    airflowColors[i * 3 + 1] = 0.74;
    airflowColors[i * 3 + 2] = 0.98;
  }
  airflowGeo.setAttribute('position', new THREE.BufferAttribute(airflowPos, 3));
  airflowGeo.setAttribute('color', new THREE.BufferAttribute(airflowColors, 3));

  const airflowMat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
  });
  const airflowParticles = new THREE.Points(airflowGeo, airflowMat);
  rootGroup.add(airflowParticles);

  // ==========================================
  // 17. ELECTRICAL CONDUITS & ENERGY FLOW PARTICLES
  // ==========================================
  // Physical conduit pipes running along baseboards/ceiling
  const energyConduitsGroup = new THREE.Group();
  const conduitMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.5,
    roughness: 0.2,
  });

  // Conduits from Grid/Solar/Battery to MDP
  // Feed 1: Transformer to MDP
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.5), conduitMat);
  c1.position.set(-15.8, 0.3, -12);
  // Feed 2: Solar to MDP
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.0, 0.12), conduitMat);
  c2.position.set(-15, 2.0, -10.2);
  // Feed 3: Battery to MDP
  const c3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 12), conduitMat);
  c3.position.set(-15, 0.3, -4);
  // Feeds from MDP to branch loads (HVAC, Lighting, Servers, Water Pump)
  const c4 = new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 0.12), conduitMat);
  c4.position.set(-11.5, 0.3, -10.5);

  energyConduitsGroup.add(c1, c2, c3, c4);
  rootGroup.add(energyConduitsGroup);

  // Moving Animated Energy Particles
  const energyParticleCount = 300;
  const energyGeo = new THREE.BufferGeometry();
  const energyPos = new Float32Array(energyParticleCount * 3);
  const energyCol = new Float32Array(energyParticleCount * 3);

  for (let i = 0; i < energyParticleCount; i++) {
    energyPos[i * 3] = -15 + Math.random() * 20;
    energyPos[i * 3 + 1] = 0.35 + Math.random() * 3.0;
    energyPos[i * 3 + 2] = -10 + Math.random() * 18;

    // Glowing electric gold/cyan
    energyCol[i * 3] = 0.2;
    energyCol[i * 3 + 1] = 0.85;
    energyCol[i * 3 + 2] = 1.0;
  }
  energyGeo.setAttribute('position', new THREE.BufferAttribute(energyPos, 3));
  energyGeo.setAttribute('color', new THREE.BufferAttribute(energyCol, 3));

  const energyMat = new THREE.PointsMaterial({
    size: 0.16,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
  });
  const energyFlowParticles = new THREE.Points(energyGeo, energyMat);
  rootGroup.add(energyFlowParticles);

  // ==========================================
  // 18. CEILING LIGHT FIXTURES
  // ==========================================
  const ceilingLightsGroup = new THREE.Group();
  const lightHousingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
  const lightLensMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfef08a,
    emissiveIntensity: 0.9,
    roughness: 0.1,
  });

  // Linear suspended LED fixtures over desk pods
  const linearLightGeo = new THREE.BoxGeometry(4.6, 0.08, 0.16);
  const lightZPositions = [-5.5, 5.5];
  const lightXPositions = [-4.5, 1.5];

  lightZPositions.forEach((lz) => {
    lightXPositions.forEach((lx) => {
      const fixture = new THREE.Group();
      const housing = new THREE.Mesh(linearLightGeo, lightHousingMat);
      housing.position.set(0, 0, 0);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.02, 0.14), lightLensMat);
      lens.position.set(0, -0.04, 0);
      // Suspension wires
      const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6), lightHousingMat);
      wire1.position.set(-2.0, 0.3, 0);
      const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6), lightHousingMat);
      wire2.position.set(2.0, 0.3, 0);

      fixture.add(housing, lens, wire1, wire2);
      fixture.position.set(lx, 3.2, lz);
      ceilingLightsGroup.add(fixture);
    });
  });

  // Boardroom chandelier / square pendant light
  const boardroomLight = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.08, 1.8), lightLensMat);
  boardroomLight.position.set(11.5, 3.2, -6);
  ceilingLightsGroup.add(boardroomLight);

  rootGroup.add(ceilingLightsGroup);

  // ==========================================
  // 19. OCCUPANTS (Realistic Working 3D Persons)
  // ==========================================
  const occupantsGroup = new THREE.Group();

  const skinPalette = [0xfbe0d0, 0xe5b89a, 0xc68642, 0x8d5524, 0xd2a679, 0xf5cfb3];
  const hairPalette = [0x1e1e1e, 0x3d2314, 0x5a3825, 0x111827, 0x78350f, 0x27272a];
  const shirtPalette = [0x0284c7, 0x0f766e, 0x334155, 0x1e3a8a, 0x881337, 0x14532d, 0xf8fafc, 0xb45309];
  const pantsPalette = [0x1e293b, 0x0f172a, 0x334155, 0x475569];

  function createStylizedHuman(avatar: OccupantAvatar, idx: number) {
    const person = new THREE.Group();
    person.userData = { isOccupant: true, avatarData: avatar };

    const skinColor = skinPalette[idx % skinPalette.length];
    const hairColor = hairPalette[(idx * 2) % hairPalette.length];
    const shirtColor = shirtPalette[idx % shirtPalette.length];
    const pantsColor = pantsPalette[idx % pantsPalette.length];

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const lanyardMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
    const idBadgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const isSeated = avatar.isSeated;
    const baseH = isSeated ? 0.45 : 0.0;

    // --- HEAD GROUP ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, isSeated ? 1.05 : 1.55, 0);

    // Head sphere
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), skinMat);
    headGroup.add(headMesh);

    // Hairstyle
    const hairStyleType = idx % 4;
    if (hairStyleType === 0) {
      // Short textured crop with side taper
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.29), hairMat);
      hair.position.set(0, 0.08, -0.01);
      headGroup.add(hair);
    } else if (hairStyleType === 1) {
      // Bob haircut / medium length
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 12), hairMat);
      hairTop.position.set(0, 0.03, -0.02);
      headGroup.add(hairTop);
      const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.2), hairMat);
      hairSideL.position.set(-0.13, -0.04, -0.02);
      const hairSideR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.2), hairMat);
      hairSideR.position.set(0.13, -0.04, -0.02);
      headGroup.add(hairSideL, hairSideR);
    } else if (hairStyleType === 2) {
      // Chic high bun
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), hairMat);
      hairBase.position.set(0, 0.04, -0.02);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), hairMat);
      bun.position.set(0, 0.14, -0.08);
      headGroup.add(hairBase, bun);
    } else {
      // Curly volume
      const hairCurly = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 12), hairMat);
      hairCurly.position.set(0, 0.04, -0.01);
      headGroup.add(hairCurly);
    }

    // Over-ear headphones for specific developers (David Kim & James Wilson)
    if (avatar.id === 'occ-4' || avatar.id === 'occ-11') {
      const phoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 16, Math.PI), phoneMat);
      band.rotation.z = -Math.PI;
      band.position.set(0, 0.02, 0);
      const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), phoneMat);
      cupL.rotation.z = Math.PI / 2;
      cupL.position.set(-0.14, 0.0, 0);
      const cupR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), phoneMat);
      cupR.rotation.z = Math.PI / 2;
      cupR.position.set(0.14, 0.0, 0);
      headGroup.add(band, cupL, cupR);
    }

    // Glasses for Elena Vance & Marcus Chen
    if (avatar.id === 'occ-1' || avatar.id === 'occ-2') {
      const glassFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      const frameL = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 12), glassFrameMat);
      frameL.position.set(-0.05, 0.02, 0.13);
      const frameR = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 12), glassFrameMat);
      frameR.position.set(0.05, 0.02, 0.13);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.01), glassFrameMat);
      bridge.position.set(0, 0.02, 0.13);
      headGroup.add(frameL, frameR, bridge);
    }

    person.add(headGroup);

    // --- TORSO & CLOTHING ---
    const torsoY = isSeated ? 0.74 : 1.22;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 0.22), shirtMat);
    torso.position.set(0, torsoY, 0);
    torso.castShadow = true;
    person.add(torso);

    // Employee security ID lanyard ribbon & badge on chest
    const lanyardStrap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.01), lanyardMat);
    lanyardStrap.position.set(0, torsoY + 0.06, 0.115);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.012), idBadgeMat);
    badge.position.set(0, torsoY - 0.06, 0.12);
    person.add(lanyardStrap, badge);

    // --- ARMS & WORKING HANDS ---
    const leftArmGroup = new THREE.Group();
    const rightArmGroup = new THREE.Group();

    if (isSeated) {
      // Seated at desk: Natural working posture with forearms resting horizontally on desk
      // Shoulders at Y = 0.86, Desk top at Y = 0.74
      leftArmGroup.position.set(-0.20, torsoY + 0.14, 0.02);
      const leftUpper = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.22, 0.08), shirtMat);
      leftUpper.position.set(0, -0.09, 0.06);
      leftUpper.rotation.x = -Math.PI / 5;

      const leftFore = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.24), shirtMat);
      leftFore.position.set(0.04, -0.19, 0.22);
      leftFore.rotation.x = 0.04;

      const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.028, 0.08), skinMat);
      leftHand.position.set(0.05, -0.19, 0.35);

      leftArmGroup.add(leftUpper, leftFore, leftHand);

      // Right arm on mouse or keyboard
      rightArmGroup.position.set(0.20, torsoY + 0.14, 0.02);
      const isUsingMouse = avatar.pose === 'mouse-review' || avatar.action === 'analyzing';

      const rightUpper = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.22, 0.08), shirtMat);
      rightUpper.position.set(isUsingMouse ? 0.03 : 0, -0.09, 0.06);
      rightUpper.rotation.x = -Math.PI / 5;
      if (isUsingMouse) rightUpper.rotation.z = -0.12;

      const rightFore = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.24), shirtMat);
      rightFore.position.set(isUsingMouse ? 0.06 : -0.04, -0.19, 0.22);
      rightFore.rotation.x = 0.04;

      const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.028, 0.08), skinMat);
      rightHand.position.set(isUsingMouse ? 0.07 : -0.05, -0.19, 0.35);

      rightArmGroup.add(rightUpper, rightFore, rightHand);
    } else {
      // Standing Persons (Presenter, Technician, Coffee break)
      if (avatar.action === 'presenting') {
        // Left arm by side
        leftArmGroup.position.set(-0.21, torsoY + 0.15, 0);
        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.09), shirtMat);
        lArm.position.set(0, -0.24, 0);
        leftArmGroup.add(lArm);

        // Right arm raised pointing to screen with laser pointer
        rightArmGroup.position.set(0.21, torsoY + 0.15, 0);
        const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.08), shirtMat);
        rUpper.position.set(0, 0.05, 0.12);
        rUpper.rotation.x = -Math.PI / 2.5;

        const rFore = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.26, 0.07), shirtMat);
        rFore.position.set(0, 0.18, 0.32);
        rFore.rotation.x = -Math.PI / 2.8;

        const pointer = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), darkMullionMat);
        pointer.rotation.x = Math.PI / 2;
        pointer.position.set(0, 0.22, 0.48);

        // Laser beam dot indicator
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const laserDot = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), dotMat);
        laserDot.position.set(0, 0.22, 1.2);

        rightArmGroup.add(rUpper, rFore, pointer, laserDot);
      } else if (avatar.action === 'troubleshooting') {
        // Holding diagnostic tablet with both hands in front
        leftArmGroup.position.set(-0.2, torsoY + 0.15, 0);
        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), shirtMat);
        lArm.position.set(0.06, -0.1, 0.16);
        lArm.rotation.x = -Math.PI / 3;
        leftArmGroup.add(lArm);

        rightArmGroup.position.set(0.2, torsoY + 0.15, 0);
        const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), shirtMat);
        rArm.position.set(-0.06, -0.1, 0.16);
        rArm.rotation.x = -Math.PI / 3;
        rightArmGroup.add(rArm);

        // Glowing tablet with illuminated telemetry screen
        const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 0.20), darkMullionMat);
        tablet.position.set(0, torsoY + 0.04, 0.28);
        tablet.rotation.x = 0.4;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.18), screenChartMat);
        screen.position.set(0, torsoY + 0.05, 0.28);
        screen.rotation.x = -Math.PI / 2 + 0.4;
        person.add(tablet, screen);
      } else {
        // Coffee break / walking
        leftArmGroup.position.set(-0.21, torsoY + 0.15, 0);
        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.09), shirtMat);
        lArm.position.set(0, -0.24, 0);
        leftArmGroup.add(lArm);

        rightArmGroup.position.set(0.21, torsoY + 0.15, 0);
        const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.08), shirtMat);
        rUpper.position.set(0, -0.08, 0.08);
        rUpper.rotation.x = -Math.PI / 4;
        const rFore = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.07), shirtMat);
        rFore.position.set(-0.04, -0.05, 0.2);
        rFore.rotation.x = -Math.PI / 2.2;
        const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.06), skinMat);
        rHand.position.set(-0.04, -0.05, 0.28);

        const handMug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
        handMug.position.set(-0.04, -0.01, 0.32);

        rightArmGroup.add(rUpper, rFore, rHand, handMug);
      }
    }

    person.add(leftArmGroup, rightArmGroup);

    // --- LEGS & SHOES ---
    if (isSeated) {
      // Pelvis is at Y = 0.45 (sitting on chair)
      // Thighs extend horizontally forward along the seat pan
      const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.34), pantsMat);
      thighL.position.set(-0.11, 0.45, 0.16);
      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.34), pantsMat);
      thighR.position.set(0.11, 0.45, 0.16);

      // Shins extend vertically down from knees (Z = 0.32) to floor (Y = 0.05)
      const shinL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.11), pantsMat);
      shinL.position.set(-0.11, 0.22, 0.30);
      const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.11), pantsMat);
      shinR.position.set(0.11, 0.22, 0.30);

      // Shoes flat on floor under desk
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.18), shoeMat);
      shoeL.position.set(-0.11, 0.03, 0.34);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.18), shoeMat);
      shoeR.position.set(0.11, 0.03, 0.34);

      person.add(thighL, thighR, shinL, shinR, shoeL, shoeR);
    } else {
      // Standing legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.15), pantsMat);
      legL.position.set(-0.1, 0.42, 0);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.15), pantsMat);
      legR.position.set(0.1, 0.42, 0);

      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), shoeMat);
      shoeL.position.set(-0.1, 0.04, 0.03);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.22), shoeMat);
      shoeR.position.set(0.1, 0.04, 0.03);

      person.add(legL, legR, shoeL, shoeR);
    }

    // --- COMFORT STATUS INDICATOR RING OVER HEAD ---
    const haloColor =
      avatar.comfortPerception === 'Ideal'
        ? 0x10b981
        : avatar.comfortPerception === 'Comfortable'
        ? 0x06b6d4
        : 0xf59e0b;

    const haloMat = new THREE.MeshBasicMaterial({
      color: haloColor,
      transparent: true,
      opacity: 0.75,
    });
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.13, 16), haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(0, isSeated ? 1.28 : 1.78, 0);
    person.add(halo);

    // Place person in 3D world space
    person.position.set(avatar.position[0], 0, avatar.position[2]);
    person.rotation.y = avatar.rotation;

    // Register animated worker for render loop
    animatedWorkers.push({
      id: avatar.id,
      group: person,
      action: avatar.action || 'coding',
      leftArm: leftArmGroup,
      rightArm: rightArmGroup,
      head: headGroup,
      initialHeadRotY: 0,
      phase: idx * 1.4,
    });

    return person;
  }

  // Populate all occupants from list
  occupantsList.forEach((occ, idx) => {
    const personObj = createStylizedHuman(occ, idx);
    occupantsGroup.add(personObj);
    interactiveObjects.push(personObj);
  });

  rootGroup.add(occupantsGroup);

  // ==========================================
  // 20. SIMULATED 3D SENSORS (Ceiling Cameras, PIR Motion & IAQ Pucks)
  // ==========================================
  const sensorDomeMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85,
  });
  const sensorHousingMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const pirLensMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7, metalness: 0.1 });

  function createZoneSensors(zoneId: string, cameraPos: [number, number, number], pirPos: [number, number, number]) {
    const zGroup = new THREE.Group();

    // 1. Ceiling-Mounted Dome Camera
    const camBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), sensorHousingMat);
    camBase.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
    const camDome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), sensorDomeMat);
    camDome.position.set(cameraPos[0], cameraPos[1] - 0.015, cameraPos[2]);
    camDome.rotation.x = Math.PI; // Face downward
    const camEye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    camEye.position.set(cameraPos[0], cameraPos[1] - 0.075, cameraPos[2]);

    // Active AI Vision LED Ring
    const camLedMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const camLed = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.14, 16), camLedMat);
    camLed.rotation.x = Math.PI / 2;
    camLed.position.set(cameraPos[0], cameraPos[1] - 0.018, cameraPos[2]);

    zGroup.add(camBase, camDome, camEye, camLed);

    // 2. Ceiling-Mounted PIR Motion Detector
    const pirHousing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.16), sensorHousingMat);
    pirHousing.position.set(pirPos[0], pirPos[1], pirPos[2]);
    const pirFresnel = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), pirLensMat);
    pirFresnel.rotation.x = Math.PI;
    pirFresnel.position.set(pirPos[0], pirPos[1] - 0.017, pirPos[2]);

    // PIR Motion Pulse LED
    const pirLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const pirLed = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), pirLedMat);
    pirLed.rotation.x = Math.PI / 2;
    pirLed.position.set(pirPos[0] + 0.045, pirPos[1] - 0.019, pirPos[2]);

    zGroup.add(pirHousing, pirFresnel, pirLed);

    // 3. Sensor Coverage Cone (Visible in occupancy-sensors view mode)
    const coneGeo = new THREE.ConeGeometry(3.5, 3.2, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.08,
      wireframe: true,
      side: THREE.DoubleSide,
    });
    const coverageCone = new THREE.Mesh(coneGeo, coneMat);
    coverageCone.position.set(cameraPos[0], cameraPos[1] - 1.6, cameraPos[2]);
    coverageCone.visible = false;
    zGroup.add(coverageCone);

    sensorGroup.add(zGroup);
    sensorIndicators.set(zoneId, { pirLed, cameraLed: camLed, coverageCone });
  }

  createZoneSensors('zone-open-office', [-3.0, 3.45, -2.0], [-4.5, 3.45, -5.5]);
  createZoneSensors('zone-boardroom', [11.5, 3.45, -6.0], [11.5, 3.45, -9.0]);
  createZoneSensors('zone-executive', [11.5, 3.45, 6.0], [11.5, 3.45, 9.0]);
  createZoneSensors('zone-server', [-11.0, 3.45, -5.0], [-11.0, 3.45, -7.0]);

  rootGroup.add(sensorGroup);

  return {
    rootGroup,
    zoneMeshes,
    equipmentMeshes,
    energyConduitsGroup,
    airflowParticles,
    energyFlowParticles,
    ceilingLightsGroup,
    solarPanelsGroup,
    batteryLedBar,
    serverLeds,
    waterPumpRotors,
    occupantsGroup,
    hvacDuctsGroup,
    interactiveObjects,
    animatedWorkers,
    sensorGroup,
    sensorIndicators,
  };
}
