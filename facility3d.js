/**
 * Horizon-X | NASA Space Mission Design Game
 * 3D FPS Room of Facility (Cleanroom Testing Chamber)
 * 
 * DEBUGGED & ENHANCED:
 * 1. Controls: Full WASD + Arrow Keys + Shift Sprint + Q/E Rotation + Smooth Collision Sliding.
 *    Works seamlessly whether Pointer Lock is engaged or not!
 * 2. Hubble Space Telescope: Accurately scaled from the provided .glb (scale ~0.00314, extents 1.65m).
 *    Firmly standing ON THE TABLE inside heavy-duty cleanroom mounting cradle saddles. ZERO FLOATING!
 * 3. Direction East Desk 01: Laptop, Computer (Check-In), Research Papers, Coffee (NIO), Workbench.
 */

class FacilityFPSRoom {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Player State
    this.player = {
      height: 1.7, // eye level in meters
      pos: { x: 0, y: 1.7, z: 2.4 }, // Spawns in clear walkway facing North toward Hubble
      vel: { x: 0, y: 0, z: 0 },
      yaw: 0,   // Facing North (-Z)
      pitch: 0,
      speed: 3.8,
      sprintMult: 1.65,
      turnSpeed: 2.2, // Keyboard turn speed in rad/sec
      radius: 0.38   // Tighter bounding cylinder for smooth navigation
    };

    // Camera Focus Modes: 'third_person' (Character Focus) or 'first_person'
    this.cameraMode = 'third_person';
    this.cameraDistance = 2.4;
    this.cameraHeightOffset = 1.65;
    this.walkCycle = 0;
    this.idleCycle = 0;

    // Local Character Avatar & Rigged Bones
    this.localAvatar = null;
    this.avatarBones = {
      head: null,
      neck: null,
      leftUpLeg: null,
      rightUpLeg: null,
      leftLeg: null,
      rightLeg: null,
      leftArm: null,
      rightArm: null,
      leftForeArm: null,
      rightForeArm: null,
      spine: null,
      hips: null
    };
    this.initialBoneRot = {};
    this.baseHipsY = 0.95;

    // Movement & navigation keys
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      turnLeft: false,
      turnRight: false,
      sprint: false
    };

    this.isLocked = false;
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.bobTimer = 0;
    this.animationFrameId = null;

    if (typeof window !== 'undefined') {
      window.facilityRoomInstance = this;
    }

    // Room Dimensions
    this.room = {
      width: 12.0,  // X: -6.0 to +6.0 (West to East)
      depth: 14.0,  // Z: -7.0 to +7.0 (North to South)
      height: 6.2   // Y: 0 to 6.2 (Elevated High-Bay Space Payload Cleanroom)
    };

    // Obstacle 1: Desk No 02 (West Wall - Electronic Department)
    this.desk02Box = {
      minX: -5.9,
      maxX: -3.8,
      minZ: -2.6,
      maxZ: 2.6,
      height: 0.88
    };

    // Obstacle 2: Center Integration Rig / Payload Dolly (Adjusted for realistic Hubble scale)
    this.centerSlabBox = {
      minX: -1.4,
      maxX: 1.4,
      minZ: -2.4,
      maxZ: 2.4,
      height: 0.96
    };

    // Obstacle 3: Desk No 01 (East Wall)
    this.desk01Box = {
      minX: 3.8,
      maxX: 5.9,
      minZ: -2.6,
      maxZ: 2.6,
      height: 0.88
    };

    // Obstacle 4: Desk No 03 (South Wall - Network & Communication Department)
    this.desk03Box = {
      minX: -2.6,
      maxX: 2.6,
      minZ: 5.6,
      maxZ: 6.8,
      height: 0.88
    };

    // Interactive target coordinates on Desk 01, Desk 02 & Center (3D positions + max reach)
    this.interactables = {
      // Desk 01 (East Wall - Mechanical Department)
      computer: { x: 4.8, y: 1.15, z: -0.2, maxDist: 3.5, label: 'CHECK IN / ACCESS MECHANICAL SESSION SHEET' },
      laptop: { x: 4.8, y: 0.95, z: -1.3, maxDist: 3.5, label: 'OPEN MARKETPLACE (MECHANICAL LOGISTICS)' },
      papers: { x: 4.8, y: 0.93, z: 0.8, maxDist: 3.5, label: 'READ MECHANICAL RESEARCH PAPERS' },
      coffee: { x: 4.3, y: 0.93, z: -1.8, maxDist: 1.8, label: 'COFFEE CUP (NIO - NOT INTERACT OBJECT)' },
      workbench: { x: 4.8, y: 0.95, z: 1.8, maxDist: 3.5, label: 'ACCESS MECHANICAL WORKBENCH' },
      dustbin: { x: 5.65, y: 0.5, z: -3.15, maxDist: 2.5, label: 'CLEANROOM SANITARY DISPOSAL (NIO)' },
      instrument_rack: { x: 5.75, y: 1.1, z: 3.25, maxDist: 2.8, label: 'MECHANICAL INSTRUMENT RACK (NIO)' },
      clock: { x: 5.96, y: 2.20, z: -0.2, maxDist: 3.8, label: 'EAST WALL MISSION CLOCK // UTC (NIO)' },

      // Desk 02 (West Wall - Electronic Department)
      computer_elec: { x: -4.8, y: 1.15, z: -0.2, maxDist: 3.5, label: 'CHECK IN / ACCESS ELECTRICAL SESSION SHEET' },
      laptop_elec: { x: -4.8, y: 0.95, z: -1.3, maxDist: 3.5, label: 'OPEN MARKETPLACE (ELECTRONICS LOGISTICS)' },
      papers_elec: { x: -4.8, y: 0.93, z: 0.8, maxDist: 3.5, label: 'READ ELECTRICAL RESEARCH PAPERS' },
      coffee_elec: { x: -4.3, y: 0.93, z: -1.8, maxDist: 1.8, label: 'COFFEE CUP (NIO - NOT INTERACT OBJECT)' },
      workbench_elec: { x: -4.8, y: 0.95, z: 1.8, maxDist: 3.5, label: 'ACCESS ELECTRONICS WORKBENCH' },

      // Desk 03 (South Wall - Network & Communication Department)
      computer_net: { x: -0.6, y: 1.15, z: 5.9, maxDist: 3.5, label: 'CHECK IN / ACCESS NETWORK SESSION SHEET' },
      laptop_net: { x: -1.8, y: 0.95, z: 5.9, maxDist: 3.5, label: 'OPEN MARKETPLACE (NETWORK LOGISTICS)' },
      papers_net: { x: 0.6, y: 0.93, z: 5.9, maxDist: 3.5, label: 'READ RF & TELEMETRY RESEARCH PAPERS' },
      coffee_net: { x: -2.3, y: 0.93, z: 5.9, maxDist: 1.8, label: 'COFFEE CUP (NIO - NOT INTERACT OBJECT)' },
      workbench_net: { x: 1.8, y: 0.95, z: 5.9, maxDist: 3.5, label: 'ACCESS 3D NETWORK WORKBENCH' },

      hubble: { x: 0.0, y: 1.46, z: 0.0, maxDist: 4.2, label: 'EXAMINE HUBBLE SPACE TELESCOPE' },
      science_screen: { x: 0.0, y: 2.2, z: -6.7, maxDist: 4.8, label: 'INSPECT HUBBLE SCIENCE CAMERA TELEMETRY [WFPC2 / COSTAR]' },
      console: { x: -4.0, y: 1.10, z: -4.5, maxDist: 3.2, label: 'ACCESS MISSION CONSOLE' }
    };

    this.activeInteractable = null;

    // Models & Textures
    this.hubbleModel = null;
    this.lastClockSec = -1;
    this.clockTexture = null;
    this.clockCanvas = null;
    this.clockCtx = null;
    this.remotePlayers = new Map();

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js loading, waiting for library...');
      setTimeout(() => this.init(), 80);
      return;
    }

    // --- 1. Scene & Camera Setup ---
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x18181c);

    const aspect = this.container.clientWidth / this.container.clientHeight || (window.innerWidth / window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    this.camera.position.set(this.player.pos.x, this.player.pos.y, this.player.pos.z);
    this.camera.rotation.order = 'YXZ';

    // --- 2. WebGL Renderer ---
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // --- 3. Lighting ---
    this.setupLighting();

    // --- 4. Room Geometry & Objects ---
    this.buildFacilityRoom();

    // --- 5. Controls & Events ---
    this.setupControls();

    // --- 6. Load Character Avatar ---
    this.loadLocalAvatarModel();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    // Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(this.ambientLight);

    // Ceiling Main Downlights (Elevated for 6.2m high-bay cleanroom)
    this.light1 = new THREE.PointLight(0xffffff, 0.85, 22);
    this.light1.position.set(-2.8, this.room.height - 0.4, -2.5);
    this.light1.castShadow = true;
    this.scene.add(this.light1);

    this.light2 = new THREE.PointLight(0xffffff, 0.85, 22);
    this.light2.position.set(2.8, this.room.height - 0.4, -2.5);
    this.light2.castShadow = true;
    this.scene.add(this.light2);

    // Center Rig Spotlight focused on the realistic ~5.2m Hubble space telescope
    this.centerSpot = new THREE.SpotLight(0xffffff, 2.0, 24, Math.PI / 3, 0.35);
    this.centerSpot.position.set(0, this.room.height - 0.2, 0);
    this.centerSpot.target.position.set(0, 1.4, 0);
    this.centerSpot.castShadow = true;
    this.scene.add(this.centerSpot);
    this.scene.add(this.centerSpot.target);

    // East Desk 01 Downlight
    this.desk01Light = new THREE.PointLight(0xffffff, 0.9, 10);
    this.desk01Light.position.set(4.5, 4.2, 0);
    this.scene.add(this.desk01Light);

    // Soft Entrance Fill Light
    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    this.fillLight.position.set(0, this.room.height - 0.8, 6);
    this.scene.add(this.fillLight);

    // Apply any previously configured brightness
    if (window.currentGameBrightness) {
      this.setBrightness(window.currentGameBrightness);
    }
  }

  setBrightness(percentage) {
    // Range: 25 to 80 (baseline default 50 = factor 1.0)
    const factor = Math.max(0.4, Math.min(1.8, percentage / 50));
    if (this.ambientLight) this.ambientLight.intensity = 0.72 * factor;
    if (this.light1) this.light1.intensity = 0.75 * factor;
    if (this.light2) this.light2.intensity = 0.75 * factor;
    if (this.centerSpot) this.centerSpot.intensity = 1.4 * factor;
    if (this.desk01Light) this.desk01Light.intensity = 0.9 * factor;
    if (this.fillLight) this.fillLight.intensity = 0.35 * factor;
  }

  buildFacilityRoom() {
    const W = this.room.width;
    const D = this.room.depth;
    const H = this.room.height;

    // --- 1. FLOOR (#463f3a with 10% White Grid Lines) ---
    const floorTexture = this.generateGridFloorTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.45,
      metalness: 0.1
    });

    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 0);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // 10% White Grid Overlay
    const gridHelper = new THREE.GridHelper(W, 12, 0xffffff, 0xffffff);
    gridHelper.material.opacity = 0.10;
    gridHelper.material.transparent = true;
    gridHelper.position.set(0, 0.005, 0);
    this.scene.add(gridHelper);

    // --- 2. CEILING ---
    const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xf3eee0 });
    const ceilingGeo = new THREE.PlaneGeometry(W, D);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, H, 0);
    this.scene.add(ceilingMesh);

    this.createCeilingFixtures();

    // --- 3. ALL 4 WALLS (Figma Node 401:8 Theme: #014BAA + #F8F3F0) ---
    const wallTexture = this.generateFacilityWallTexture();
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.55,
      metalness: 0.08,
      side: THREE.FrontSide
    });

    // North Wall
    const northWallGeo = new THREE.PlaneGeometry(W, H);
    const northWall = new THREE.Mesh(northWallGeo, wallMaterial);
    northWall.position.set(0, H / 2, -D / 2);
    northWall.receiveShadow = true;
    this.scene.add(northWall);

    // South Wall
    const southWall = new THREE.Mesh(northWallGeo, wallMaterial);
    southWall.rotation.y = Math.PI;
    southWall.position.set(0, H / 2, D / 2);
    southWall.receiveShadow = true;
    this.scene.add(southWall);

    // West Wall
    const sideWallGeo = new THREE.PlaneGeometry(D, H);
    const westWall = new THREE.Mesh(sideWallGeo, wallMaterial);
    westWall.rotation.y = Math.PI / 2;
    westWall.position.set(-W / 2, H / 2, 0);
    westWall.receiveShadow = true;
    this.scene.add(westWall);

    // East Wall
    const eastWall = new THREE.Mesh(sideWallGeo, wallMaterial);
    eastWall.rotation.y = -Math.PI / 2;
    eastWall.position.set(W / 2, H / 2, 0);
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);

    // --- 5. NEW DESK NO (02) (West Wall - Direction: West - Electronic Department) ---
    this.createDesk02West();

    // --- 6. NEW DESK NO (01) (East Wall - Direction: East - Mechanical Department) ---
    this.createDesk01East();

    // --- 6B. NEW DESK NO (03) (South Wall - Direction: South - Network Department) ---
    this.createDesk03South();

    // --- 7. CENTER BLACK SLAB & HUBBLE STANDING ON TABLE ---
    this.createCenterBlackSlabWithCradle();
    this.loadHubbleTelescopeStandingOnTable();
    // this.createHubbleElectronicsHighlight(); // Bugfix: Removed glowing blue lines and bay banner card
    // this.createMechanicalObjectiveHighlight(); // Bugfix: Removed pulsing floor step highlight rings

    // --- 8. NORTH WALL GSFC SCIENCE TELEMETRY VIDEO WALL ---
    this.createNorthWallScienceTelemetryScreen();

    // --- 9. 3D SPATIAL AUDIO SYSTEM ---
    this.setupSpatialAudio();
  }

  generateFacilityWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8f3f0';
    ctx.fillRect(0, 0, 512, 1024);

    ctx.fillStyle = '#014baa';
    ctx.fillRect(0, 0, 512, 86);
    ctx.fillRect(0, 1024 - 86, 512, 86);

    ctx.strokeStyle = 'rgba(1, 75, 170, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 86);
    ctx.lineTo(512, 86);
    ctx.moveTo(0, 1024 - 86);
    ctx.lineTo(512, 1024 - 86);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  generateGridFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#463f3a';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 3;

    const tileSize = 64;
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 7);
    return texture;
  }

  createEastWallDigitalClock(posX, posY, posZ) {
    const clockGroup = new THREE.Group();

    // Matte black outer housing with subtle bevel (Clock.png)
    const frameGeo = new THREE.BoxGeometry(0.04, 0.28, 1.48);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x08080a,
      roughness: 0.35,
      metalness: 0.75
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0.02, 0, 0);
    clockGroup.add(frameMesh);

    // Canvas display plane
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 200;
    this.clockCanvas = canvas;
    this.clockCtx = canvas.getContext('2d');

    this.clockTexture = new THREE.CanvasTexture(canvas);
    this.clockTexture.minFilter = THREE.LinearFilter;

    this.updateClockTexture();

    const displayMat = new THREE.MeshBasicMaterial({
      map: this.clockTexture,
      transparent: true
    });
    const displayGeo = new THREE.PlaneGeometry(1.44, 0.25);
    const displayMesh = new THREE.Mesh(displayGeo, displayMat);
    displayMesh.position.set(0, 0, 0);
    displayMesh.rotation.y = -Math.PI / 2;
    clockGroup.add(displayMesh);

    clockGroup.position.set(posX, posY, posZ);
    this.scene.add(clockGroup);
  }

  updateClockTexture() {
    if (!this.clockCtx || !this.clockCanvas) return;
    const ctx = this.clockCtx;
    const W = this.clockCanvas.width;
    const H = this.clockCanvas.height;

    // Pure black background matching Clock.png
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, W, H);

    // Rounded glowing red outer border matching Clock.png
    ctx.strokeStyle = '#ff1a2b';
    ctx.lineWidth = 7;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(18, 14, W - 36, H - 28, 20);
    } else {
      ctx.strokeRect(18, 14, W - 36, H - 28);
    }
    ctx.stroke();

    // Subtle neon glow halo
    ctx.strokeStyle = 'rgba(255, 26, 43, 0.25)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Live Time: HH MM SS
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');

    ctx.fillStyle = '#ff1e2e';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 10;
    ctx.font = '700 92px "Tektur", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Helper to draw two-digit group with slashed zero matching Clock.png
    const drawDigitGroup = (digits, centerX, centerY) => {
      ctx.fillText(digits, centerX, centerY);
      const charW = 54;
      const d0 = digits[0];
      const d1 = digits[1];
      ctx.strokeStyle = '#ff1e2e';
      ctx.lineWidth = 5;
      if (d0 === '0') {
        ctx.beginPath();
        ctx.moveTo(centerX - charW * 0.9, centerY + 28);
        ctx.lineTo(centerX - charW * 0.1, centerY - 28);
        ctx.stroke();
      }
      if (d1 === '0') {
        ctx.beginPath();
        ctx.moveTo(centerX + charW * 0.1, centerY + 28);
        ctx.lineTo(centerX + charW * 0.9, centerY - 28);
        ctx.stroke();
      }
    };

    // 3 evenly distributed pairs matching Clock.png
    drawDigitGroup(hrs, 220, H / 2);
    drawDigitGroup(min, 512, H / 2);
    drawDigitGroup(sec, 804, H / 2);

    ctx.shadowBlur = 0;

    if (this.clockTexture) {
      this.clockTexture.needsUpdate = true;
    }
  }

  createDesk02West() {
    const d = this.desk02Box;
    const width = d.maxX - d.minX;
    const length = d.maxZ - d.minZ;
    const height = d.height;
    const posX = d.minX + width / 2;
    const posZ = d.minZ + length / 2;

    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      roughness: 0.35,
      metalness: 0.55
    });

    const topGeo = new THREE.BoxGeometry(width, 0.08, length);
    const topMesh = new THREE.Mesh(topGeo, deskMat);
    topMesh.position.set(posX, height, posZ);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    this.scene.add(topMesh);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0.7, roughness: 0.3 });
    const innerSideLegGeo = new THREE.BoxGeometry(0.08, height, length);
    const innerSideLeg = new THREE.Mesh(innerSideLegGeo, legMat);
    innerSideLeg.position.set(d.maxX - 0.04, height / 2, posZ);
    innerSideLeg.castShadow = true;
    innerSideLeg.receiveShadow = true;
    this.scene.add(innerSideLeg);

    const trayGeo = new THREE.BoxGeometry(0.04, 0.04, length - 0.4);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.5 });
    const trayMesh = new THREE.Mesh(trayGeo, trayMat);
    trayMesh.position.set(d.maxX - 0.08, height - 0.1, posZ);
    this.scene.add(trayMesh);

    // Wall Signage above Desk 02 (West Wall)
    this.createWestWallDigitalSign(-5.96, 2.3, 0);

    const deskY = height + 0.04;
    this.create3DLaptopElec(-4.8, deskY, -1.3);
    this.create3DComputerStationElec(-4.8, deskY, -0.2);
    this.create3DResearchPapersElec(-4.8, deskY, 0.8);
    this.create3DCoffeeCup(-4.3, deskY, -1.8);
    this.create3DWorkbenchZoneElec(-4.8, deskY, 1.8);

    // --- PHASE 02 NIO PROPS (Desk 02 - Electronic) ---
    this.create3DDualScreenMonitor(-5.3, deskY, 0.2, Math.PI / 2);
    this.create3DPenRackCircular(-4.4, deskY, -0.6);
    this.create3DExamPad(-4.5, deskY, 0.4, Math.PI / 2 - 0.1);
    this.create3DSpreadPaperFiles(-4.6, deskY, 1.2, Math.PI / 2 + 0.2);
    this.create3DStandUpLabChair(-3.7, 0, -0.2, -Math.PI / 2);
    this.loadDepartmentStlProp(-4.8, deskY + 0.08, -2.2, '3D-assets/Solar panels.stl', 0.0018, 0x10b981, { x: 0, y: -Math.PI / 4, z: 0 });

  }

    createDepartmentWallText(deptName, subText, posX, posY, posZ, rotY) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 100% Transparent background - NO dark banner box, zero edge clipping
    ctx.clearRect(0, 0, 2048, 512);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top cleanroom facility indicator in sleek aerospace blue
    ctx.fillStyle = '#0284c7';
    ctx.font = '700 36px "Tektur", sans-serif';
    ctx.fillText('NASA GSFC // CLEANROOM FACILITY', 1024, 90);

    // Dynamic auto-fit font sizing with ample horizontal padding so text NEVER clips
    let fontSize = 76;
    ctx.font = `900 ${fontSize}px "Tektur", sans-serif`;
    while (ctx.measureText(deptName).width > 1750 && fontSize > 36) {
      fontSize -= 2;
      ctx.font = `900 ${fontSize}px "Tektur", sans-serif`;
    }

    // Main Department Name in bold vibrant NASA Blue (#014BAA)
    ctx.fillStyle = '#014baa';
    ctx.fillText(deptName, 1024, 220);

    // Sleek dynamic architectural accent line matching text width
    const textWidth = ctx.measureText(deptName).width;
    ctx.strokeStyle = '#014baa';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(1024 - (textWidth / 2) - 40, 295);
    ctx.lineTo(1024 + (textWidth / 2) + 40, 295);
    ctx.stroke();

    // Desk location in sharp aerospace blue
    ctx.fillStyle = '#0369a1';
    ctx.font = '700 38px monospace';
    ctx.fillText(subText, 1024, 375);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const signGeo = new THREE.PlaneGeometry(4.4, 1.1);
    const signMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(posX, posY, posZ);
    signMesh.rotation.y = rotY;
    this.scene.add(signMesh);
    return signMesh;
  }

  createEastWallDepartmentSign(posX, posY, posZ) {
    return this.createDepartmentWallText(
      'MECHANICAL DEPARTMENT',
      'DESK 01 [EAST WALL] // RATE GYROSCOPE RSU & SADM',
      posX,
      posY,
      posZ,
      -Math.PI / 2
    );
  }

  createWestWallDigitalSign(posX, posY, posZ) {
    return this.createDepartmentWallText(
      'ELECTRONIC DEPARTMENT',
      'DESK 02 [WEST WALL] // DF-224 AVIONICS & FGS',
      posX,
      posY,
      posZ,
      Math.PI / 2
    );
  }

  create3DLaptopElec(x, y, z) {
    const laptopGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, metalness: 0.9, roughness: 0.2 });

    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.28), metalMat);
    baseMesh.position.y = 0.008;
    laptopGroup.add(baseMesh);

    const kbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.002, 0.14), new THREE.MeshStandardMaterial({ color: 0x0f1219, roughness: 0.6 }));
    kbMesh.position.set(0, 0.016, -0.02);
    laptopGroup.add(kbMesh);

    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.016, -0.14);

    const lidBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.01), metalMat);
    lidBack.position.set(0, 0.13, 0);
    lidGroup.add(lidBack);

    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 350;
    const sctx = screenCanvas.getContext('2d');
    sctx.fillStyle = '#051329';
    sctx.fillRect(0, 0, 512, 350);
    sctx.fillStyle = '#00f0ff';
    sctx.font = '700 32px "Tektur", sans-serif';
    sctx.fillText('NASA LOGISTICS', 30, 60);
    sctx.fillStyle = '#ffffff';
    sctx.font = '500 24px "Tektur", sans-serif';
    sctx.fillText('ELECTRONICS MARKETPLACE', 30, 100);
    sctx.fillStyle = '#fbbf24';
    sctx.font = '600 28px "Tektur", monospace';
    sctx.fillText('BUDGET: $150,000', 30, 160);
    sctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    sctx.font = '400 20px "Tektur", sans-serif';
    sctx.fillText('PRESS [E] TO BUY INSTRUMENTS', 30, 240);

    const screenTex = new THREE.CanvasTexture(screenCanvas);
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.23), new THREE.MeshBasicMaterial({ map: screenTex }));
    screenMesh.position.set(0, 0.13, 0.006);
    lidGroup.add(screenMesh);

    lidGroup.rotation.x = -Math.PI / 1.35;
    laptopGroup.add(lidGroup);

    laptopGroup.position.set(x, y, z);
    laptopGroup.rotation.y = Math.PI / 2;
    this.scene.add(laptopGroup);
  }

  create3DComputerStationElec(x, y, z) {
    const compGroup = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0x222634, metalness: 0.85, roughness: 0.2 });

    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.02, 16), standMat);
    baseMesh.position.y = 0.01;
    compGroup.add(baseMesh);

    const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 12), standMat);
    armMesh.position.set(0, 0.15, -0.06);
    armMesh.rotation.x = 0.1;
    compGroup.add(armMesh);

    const monW = 0.65;
    const monH = 0.40;
    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(monW, monH, 0.03), new THREE.MeshStandardMaterial({ color: 0x10141d, roughness: 0.3 }));
    frameMesh.position.set(0, 0.30, 0);
    compGroup.add(frameMesh);

    const dispCanvas = document.createElement('canvas');
    dispCanvas.width = 800;
    dispCanvas.height = 500;
    const dctx = dispCanvas.getContext('2d');
    dctx.fillStyle = '#080d1a';
    dctx.fillRect(0, 0, 800, 500);
    dctx.fillStyle = '#0284c7';
    dctx.fillRect(0, 0, 800, 70);
    dctx.fillStyle = '#ffffff';
    dctx.font = '700 28px "Tektur", sans-serif';
    dctx.fillText('GSFC // ELECTRICAL & AVIONICS TERMINAL', 30, 46);

    dctx.fillStyle = '#fbbf24';
    dctx.font = '700 32px "Tektur", sans-serif';
    dctx.fillText('STATUS: NOT CHECKED IN', 30, 150);

    dctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    dctx.font = '500 24px "Tektur", sans-serif';
    dctx.fillText('ROLE: Apprentice (Electronic Dept)', 30, 210);
    dctx.fillText('TASK: Take Control of Electronic Department', 30, 260);

    dctx.fillStyle = '#00f0ff';
    dctx.fillRect(30, 340, 740, 80);
    dctx.fillStyle = '#080d1a';
    dctx.font = '700 34px "Tektur", sans-serif';
    dctx.textAlign = 'center';
    dctx.fillText('PRESS [E] TO CHECK IN NOW', 400, 392);

    const dispTex = new THREE.CanvasTexture(dispCanvas);
    const dispMesh = new THREE.Mesh(new THREE.PlaneGeometry(monW - 0.03, monH - 0.03), new THREE.MeshBasicMaterial({ map: dispTex }));
    dispMesh.position.set(0, 0.30, 0.016);
    compGroup.add(dispMesh);

    const kbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.015, 0.16), new THREE.MeshStandardMaterial({ color: 0x141824, roughness: 0.5 }));
    kbMesh.position.set(0, 0.008, 0.22);
    compGroup.add(kbMesh);

    compGroup.position.set(x, y, z);
    compGroup.rotation.y = Math.PI / 2;
    this.scene.add(compGroup);
  }

  create3DResearchPapersElec(x, y, z) {
    const papersGroup = new THREE.Group();
    const binderMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.42), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }));
    binderMesh.position.set(0, 0.025, 0);
    papersGroup.add(binderMesh);

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 512;
    pCanvas.height = 640;
    const pctx = pCanvas.getContext('2d');
    pctx.fillStyle = '#f8f8fa';
    pctx.fillRect(0, 0, 512, 640);
    pctx.fillStyle = '#0284c7';
    pctx.fillRect(20, 20, 472, 60);
    pctx.fillStyle = '#ffffff';
    pctx.font = '700 24px "Tektur", sans-serif';
    pctx.fillText('NASA TECHNICAL MEMO', 40, 58);
    pctx.fillStyle = '#0f172a';
    pctx.font = '700 20px "Tektur", sans-serif';
    pctx.fillText('HST-SM1 ELECTRONICS MANUAL', 30, 120);

    const paperMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.38), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pCanvas) }));
    paperMesh.rotation.x = -Math.PI / 2;
    paperMesh.position.set(0, 0.052, 0);
    papersGroup.add(paperMesh);

    papersGroup.position.set(x, y, z);
    papersGroup.rotation.y = Math.PI / 2 - 0.15;
    this.scene.add(papersGroup);
  }

  create3DWorkbenchZoneElec(x, y, z) {
    const wbGroup = new THREE.Group();

    // 1. Blue ESD Anti-Static Rubber Mat
    const matMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7, metalness: 0.1 }));
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.set(0, 0.005, 0);
    wbGroup.add(matMesh);

    // 2. Mini Benchtop Digital Oscilloscope
    const scopeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.12), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 }));
    scopeMesh.position.set(-0.25, 0.08, -0.35);
    wbGroup.add(scopeMesh);

    const scopeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.09), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    scopeScreen.position.set(-0.25, 0.08, -0.285);
    wbGroup.add(scopeScreen);

    // 3. Mini DC Power Supply
    const psuMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.10), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 }));
    psuMesh.position.set(0.25, 0.07, -0.35);
    wbGroup.add(psuMesh);

    // 4. Grounding Wrist Strap hanging by side
    const strapMesh = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
    strapMesh.position.set(0.35, 0.02, 0.2);
    wbGroup.add(strapMesh);

    // 5. Umbilical Cable Harness linking to Hubble
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 0.4),
      new THREE.Vector3(1.2, -0.85, 0.8),
      new THREE.Vector3(3.2, -0.88, 0.2),
      new THREE.Vector3(4.8, -0.05, -1.8)
    ]);
    const cableMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.025, 8, false), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
    wbGroup.add(cableMesh);

    const glowMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.008, 6, false), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    wbGroup.add(glowMesh);

    wbGroup.position.set(x, y, z);
    wbGroup.rotation.y = Math.PI / 2;
    this.scene.add(wbGroup);
    this.desk02WorkbenchGroup = wbGroup;
  }

  createHubbleElectronicsHighlight() {
    if (this.hubbleElecHighlight) return;
    const highlightGroup = new THREE.Group();
    highlightGroup.position.set(0, 1.25, 0);

    // Glowing cyan bounding box around Electronics Bay
    const bayGeo = new THREE.BoxGeometry(0.55, 0.55, 0.7);
    const bayMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.75 });
    const bayMesh = new THREE.Mesh(bayGeo, bayMat);
    bayMesh.position.set(0.35, 0.15, -0.2);
    highlightGroup.add(bayMesh);

    // Glowing cyan bounding box around FGS Sensor Bay
    const fgsGeo = new THREE.BoxGeometry(0.45, 0.45, 0.5);
    const fgsMesh = new THREE.Mesh(fgsGeo, bayMat);
    fgsMesh.position.set(-0.35, 0.15, 0.3);
    highlightGroup.add(fgsMesh);

    // Telemetry billboard tag
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 512;
    tagCanvas.height = 128;
    const tctx = tagCanvas.getContext('2d');
    tctx.fillStyle = 'rgba(7, 15, 30, 0.85)';
    tctx.fillRect(0, 0, 512, 128);
    tctx.strokeStyle = '#00f0ff';
    tctx.lineWidth = 4;
    tctx.strokeRect(4, 4, 504, 120);
    tctx.fillStyle = '#00f0ff';
    tctx.font = '700 28px "Tektur", sans-serif';
    tctx.textAlign = 'center';
    tctx.fillText('BAY 1/2 ELECTRONICS & FGS', 256, 52);
    tctx.fillStyle = '#fbbf24';
    tctx.font = '600 22px "Tektur", monospace';
    tctx.fillText('DIAGNOSTIC TARGET // REPAIR REQUIRED', 256, 95);

    const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tagCanvas), transparent: true }));
    tagMesh.position.set(0, 0.7, 0);
    highlightGroup.add(tagMesh);

    this.scene.add(highlightGroup);
    this.hubbleElecHighlight = highlightGroup;
  }

  createDesk01East() {
    const d = this.desk01Box;
    const width = d.maxX - d.minX;
    const length = d.maxZ - d.minZ;
    const height = d.height;
    const posX = d.minX + width / 2;
    const posZ = d.minZ + length / 2;

    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x1b1d24,
      roughness: 0.35,
      metalness: 0.5
    });

    const topGeo = new THREE.BoxGeometry(width, 0.08, length);
    const topMesh = new THREE.Mesh(topGeo, deskMat);
    topMesh.position.set(posX, height, posZ);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    this.scene.add(topMesh);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x121318, metalness: 0.7, roughness: 0.3 });
    const innerSideLegGeo = new THREE.BoxGeometry(0.08, height, length);
    const innerSideLeg = new THREE.Mesh(innerSideLegGeo, legMat);
    innerSideLeg.position.set(d.minX + 0.04, height / 2, posZ);
    innerSideLeg.castShadow = true;
    innerSideLeg.receiveShadow = true;
    this.scene.add(innerSideLeg);

    const trayGeo = new THREE.BoxGeometry(0.04, 0.04, length - 0.4);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x014baa, emissive: 0x014baa, emissiveIntensity: 0.4 });
    const trayMesh = new THREE.Mesh(trayGeo, trayMat);
    trayMesh.position.set(d.minX + 0.08, height - 0.1, posZ);
    this.scene.add(trayMesh);

    const deskY = height + 0.04;

    // --- 8 PROCEDURAL 3D VECTOR OBJECTS (MATCHING REFERENCE IMAGES) ---
    // 1. Modern CNC Laptop (Laptop-mordern.jpeg) - Marketplace
    this.create3DLaptop(4.8, deskY, -1.3);

    // 2. High Quality Computer Station (high-quality-comuter.jpeg) - Check-in
    this.create3DComputerStation(4.8, deskY, -0.2);

    // 3. Technical Research Papers Folder (Papers.jpeg) - Assembly Directives
    this.create3DResearchPapers(4.8, deskY, 0.8);

    // 4. To-Go Paper Coffee Cup with Kraft Sleeve & Lid (Coffee-paper.jpeg)
    this.create3DCoffeeCup(4.3, deskY, -1.8);

    // 5. Technical Blue ESD Blueprint Mat (Work-bech-mat.jpeg) - Workbench Zone
    this.create3DWorkbenchZone(4.8, deskY, 1.8);

    // 6. Digital Cleanroom Wall Clock (Clock.png) - Mounted above Computer Station
    this.createEastWallDigitalClock(5.96, 2.05, -0.2);

    // East Wall Digital Department Typography
    this.createEastWallDepartmentSign(5.98, 2.65, 0.0);

    // 7. Modern Cleanroom Dust Bin with Pictogram (Dust-bin.jpeg) - Floor by South edge
    this.create3DDustBin(5.65, 0.0, -3.15);

    // 8. 4-Tier Open Instrument Rack Shelf (Instrument rack.jpeg) - Floor by North edge
    this.create3DInstrumentRack(5.75, 0.0, 3.25);

    // --- PHASE 02 NIO PROPS (Desk 01 - Mechanical) ---
    this.create3DDualScreenMonitor(5.3, deskY, 0.2, -Math.PI / 2);
    this.create3DPenRackCircular(4.4, deskY, -0.6);
    this.create3DExamPad(4.5, deskY, 0.4, -Math.PI / 2 + 0.1);
    this.create3DSpreadPaperFiles(4.6, deskY, 1.2, -Math.PI / 2 - 0.2);
    this.create3DStandUpLabChair(3.7, 0, -0.2, Math.PI / 2);
    this.loadDepartmentStlProp(4.8, deskY + 0.08, -2.2, '3D-assets/Cover hatch.stl', 0.0018, 0x38bdf8, { x: 0, y: Math.PI / 4, z: 0 });

  }

  // --- 1. MODERN CNC LAPTOP (Laptop-mordern.jpeg) ---
  create3DLaptop(x, y, z) {
    const laptopGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db, // Modern silver CNC aluminum matching Laptop-mordern.jpeg
      metalness: 0.85,
      roughness: 0.22
    });

    // Tapered CNC Aluminum Base Chassis (wedge profile)
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.014, 0.26), metalMat);
    baseMesh.position.y = 0.007;
    laptopGroup.add(baseMesh);

    // Large glass trackpad (dark grey glass matching image)
    const padMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.002, 0.075),
      new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.15, metalness: 0.3 })
    );
    padMesh.position.set(0, 0.015, 0.07);
    laptopGroup.add(padMesh);

    // Keyboard well deck with chiclet key matrix (Laptop-mordern.jpeg)
    const kbMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.33, 0.003, 0.13),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 })
    );
    kbMesh.position.set(0, 0.015, -0.035);
    laptopGroup.add(kbMesh);

    // Display Lid hinged open
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.014, -0.13);

    const lidBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.008), metalMat);
    lidBack.position.set(0, 0.13, 0);
    lidGroup.add(lidBack);

    // Bezel border frame (thin uniform black bezel with top webcam notch)
    const bezelMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.378, 0.258, 0.002),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
    );
    bezelMesh.position.set(0, 0.13, 0.004);
    lidGroup.add(bezelMesh);

    // High-resolution Canvas display with sky-blue glossy reflection streaks (Laptop-mordern.jpeg)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 700;
    const sctx = screenCanvas.getContext('2d');

    // Base dark blueish-teal background
    sctx.fillStyle = '#1e293b';
    sctx.fillRect(0, 0, 1024, 700);

    // Sky-blue glossy reflection diagonal bars matching Laptop-mordern.jpeg
    const grad = sctx.createLinearGradient(0, 0, 1024, 700);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.3, '#1e3a5f');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(0.65, '#0f172a');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 1024, 700);

    // Prominent gloss streak ribbons across screen (matching image)
    sctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
    sctx.beginPath();
    sctx.moveTo(280, 0);
    sctx.lineTo(440, 0);
    sctx.lineTo(240, 700);
    sctx.lineTo(80, 700);
    sctx.closePath();
    sctx.fill();

    sctx.fillStyle = 'rgba(186, 230, 253, 0.20)';
    sctx.beginPath();
    sctx.moveTo(480, 0);
    sctx.lineTo(580, 0);
    sctx.lineTo(380, 700);
    sctx.lineTo(280, 700);
    sctx.closePath();
    sctx.fill();

    // High-tech NASA Marketplace UI Overlay
    sctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    sctx.fillRect(40, 40, 1024 - 80, 700 - 80);

    sctx.fillStyle = '#38bdf8';
    sctx.font = '700 52px "Tektur", sans-serif';
    sctx.fillText('NASA LOGISTICS PORTAL', 80, 130);

    sctx.fillStyle = '#ffffff';
    sctx.font = '500 36px "Tektur", sans-serif';
    sctx.fillText('GSFC AEROSPACE MARKETPLACE', 80, 195);

    sctx.fillStyle = '#fbbf24';
    sctx.font = '700 48px "Tektur", monospace';
    sctx.fillText('BUDGET: $150,000.00', 80, 310);

    sctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    sctx.font = '400 30px "Tektur", sans-serif';
    sctx.fillText('STATUS: PGT Wrench & Alignment Hardware In Stock', 80, 410);

    sctx.fillStyle = '#10b981';
    sctx.fillRect(80, 500, 864, 110);
    sctx.fillStyle = '#0f172a';
    sctx.font = '700 44px "Tektur", sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('PRESS [E] TO PURCHASE TOOLS', 512, 572);

    const screenTex = new THREE.CanvasTexture(screenCanvas);
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.23),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screenMesh.position.set(0, 0.13, 0.006);
    lidGroup.add(screenMesh);

    lidGroup.rotation.x = -Math.PI / 1.35;
    laptopGroup.add(lidGroup);

    laptopGroup.position.set(x, y, z);
    laptopGroup.rotation.y = -Math.PI / 2;
    this.scene.add(laptopGroup);
  }

  // --- 2. HIGH-QUALITY COMPUTER STATION (high-quality-comuter.jpeg) ---
  create3DComputerStation(x, y, z) {
    const compGroup = new THREE.Group();
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x14161b, // Sleek black polymer matching high-quality-comuter.jpeg
      metalness: 0.65,
      roughness: 0.35
    });

    // Curved / Beveled Rectangular Pedestal Base (high-quality-comuter.jpeg)
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.016, 0.18), darkMat);
    baseMesh.position.y = 0.008;
    compGroup.add(baseMesh);

    // Cylindrical Neck Column Stand (high-quality-comuter.jpeg)
    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.032, 0.26, 20),
      darkMat
    );
    neckMesh.position.set(0, 0.14, -0.02);
    compGroup.add(neckMesh);

    // Pivot mount bracket behind monitor
    const pivotMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), darkMat);
    pivotMesh.position.set(0, 0.27, -0.01);
    compGroup.add(pivotMesh);

    // Widescreen Monitor Housing with Ultra-Thin Bezels (high-quality-comuter.jpeg)
    const monW = 0.72;
    const monH = 0.44;
    const monFrame = new THREE.Mesh(
      new THREE.BoxGeometry(monW, monH, 0.024),
      new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.25, metalness: 0.8 })
    );
    monFrame.position.set(0, 0.32, 0.01);
    compGroup.add(monFrame);

    // High-Resolution Display Screen Canvas (1024 x 640)
    const dispCanvas = document.createElement('canvas');
    dispCanvas.width = 1024;
    dispCanvas.height = 640;
    const dctx = dispCanvas.getContext('2d');

    // Deep tech cleanroom background
    dctx.fillStyle = '#080a10';
    dctx.fillRect(0, 0, 1024, 640);

    // NASA Blue Top Banner
    dctx.fillStyle = '#014baa';
    dctx.fillRect(0, 0, 1024, 90);
    dctx.fillStyle = '#ffffff';
    dctx.font = '700 36px "Tektur", sans-serif';
    dctx.fillText('GSFC // MECHANICAL SHIFT CHECK-IN', 40, 58);

    // Shift Status Badge
    dctx.fillStyle = '#fbbf24';
    dctx.font = '700 38px "Tektur", sans-serif';
    dctx.fillText('STATUS: PENDING CHECK-IN', 40, 180);

    dctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    dctx.font = '500 30px "Tektur", sans-serif';
    dctx.fillText('STATION: Desk 01 (Mechanical Integration Bay)', 40, 250);
    dctx.fillText('ASSIGNMENT: Rate Gyroscope RSU-02 & SADM Servicing', 40, 310);

    // Green Prominent Action Button
    dctx.fillStyle = '#10b981';
    dctx.fillRect(40, 420, 944, 110);
    dctx.fillStyle = '#07090e';
    dctx.font = '700 42px "Tektur", sans-serif';
    dctx.textAlign = 'center';
    dctx.fillText('PRESS [E] TO CHECK IN / OPEN SESSION SHEET', 512, 490);

    const dispTex = new THREE.CanvasTexture(dispCanvas);
    const dispMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(monW - 0.02, monH - 0.02),
      new THREE.MeshBasicMaterial({ map: dispTex })
    );
    dispMesh.position.set(0, 0.32, 0.023);
    compGroup.add(dispMesh);

    // Matching Peripherals: Slim Mechanical Keyboard & Optical Mouse
    const kbMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.014, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x161820, roughness: 0.5, metalness: 0.4 })
    );
    kbMesh.position.set(0, 0.007, 0.22);
    compGroup.add(kbMesh);

    // Precision Optical Mouse beside keyboard
    const mouseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.022, 0.11),
      new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.3, metalness: 0.5 })
    );
    mouseMesh.position.set(0.30, 0.011, 0.22);
    compGroup.add(mouseMesh);

    compGroup.position.set(x, y, z);
    compGroup.rotation.y = -Math.PI / 2;
    this.scene.add(compGroup);
  }

  // --- 3. TECHNICAL DIRECTIVE RESEARCH PAPERS (Papers.jpeg) ---
  create3DResearchPapers(x, y, z) {
    const papersGroup = new THREE.Group();

    // Mustard yellow / amber tabbed backing folder (Papers.jpeg)
    const folderMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Golden yellow folder matching image
      roughness: 0.6,
      metalness: 0.1
    });
    const folderBase = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.008, 0.44), folderMat);
    folderBase.position.y = 0.004;
    papersGroup.add(folderBase);

    // Right-side index tab extending out (matching Papers.jpeg)
    const indexTab = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.11), folderMat);
    indexTab.position.set(0.18, 0.004, -0.05);
    papersGroup.add(indexTab);

    // Offset secondary white paper sheet underneath
    const sheetUnder = new THREE.Mesh(
      new THREE.BoxGeometry(0.31, 0.002, 0.39),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
    );
    sheetUnder.position.set(-0.008, 0.009, 0.008);
    sheetUnder.rotation.y = 0.02;
    papersGroup.add(sheetUnder);

    // Top technical directive document with text, signature & circular blue seal (Papers.jpeg)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 1024;
    pCanvas.height = 1360;
    const pctx = pCanvas.getContext('2d');

    // Clean white paper background
    pctx.fillStyle = '#ffffff';
    pctx.fillRect(0, 0, 1024, 1360);

    // Subtle technical margin border
    pctx.strokeStyle = '#e2e8f0';
    pctx.lineWidth = 4;
    pctx.strokeRect(40, 40, 1024 - 80, 1360 - 80);

    // Header banner
    pctx.fillStyle = '#014baa';
    pctx.fillRect(60, 60, 1024 - 120, 75);
    pctx.fillStyle = '#ffffff';
    pctx.font = '700 36px "Tektur", sans-serif';
    pctx.fillText('NASA GSFC // SERVICING MISSION SM-1', 90, 112);

    // Subheader
    pctx.fillStyle = '#0f172a';
    pctx.font = '700 28px "Tektur", sans-serif';
    pctx.fillText('DIRECTIVE: MECHANICAL BAY ALIGNMENT & TORQUE', 80, 195);

    // 4 Distinct Paragraphs of Technical Text Lines matching Papers.jpeg
    const drawParagraphLines = (startY, lineCount) => {
      pctx.fillStyle = '#64748b';
      for (let i = 0; i < lineCount; i++) {
        const lineW = (i === lineCount - 1) ? 520 : 860;
        pctx.fillRect(80, startY + i * 36, lineW, 14);
      }
    };

    drawParagraphLines(240, 4);
    drawParagraphLines(420, 5);
    drawParagraphLines(640, 4);
    drawParagraphLines(820, 3);

    // Bottom Left: Authentic dark ink cursive signature (Papers.jpeg)
    pctx.strokeStyle = '#1e293b';
    pctx.lineWidth = 5;
    pctx.lineCap = 'round';
    pctx.beginPath();
    pctx.moveTo(110, 1180);
    pctx.bezierCurveTo(130, 1130, 160, 1130, 180, 1175);
    pctx.bezierCurveTo(200, 1220, 220, 1150, 250, 1160);
    pctx.bezierCurveTo(270, 1170, 300, 1140, 340, 1155);
    pctx.stroke();

    pctx.fillStyle = '#475569';
    pctx.font = '500 20px "Tektur", sans-serif';
    pctx.fillText('Lead Systems Dir. // Goddard Cleanroom', 90, 1225);

    // Bottom Right: Concentric double-ring Blue Inspection Stamp (Papers.jpeg)
    const stampX = 810;
    const stampY = 1140;
    pctx.strokeStyle = '#0284c7';
    pctx.lineWidth = 7;
    pctx.beginPath();
    pctx.arc(stampX, stampY, 95, 0, Math.PI * 2);
    pctx.stroke();

    pctx.lineWidth = 3;
    pctx.beginPath();
    pctx.arc(stampX, stampY, 82, 0, Math.PI * 2);
    pctx.stroke();

    pctx.lineWidth = 4;
    pctx.beginPath();
    pctx.arc(stampX, stampY, 55, 0, Math.PI * 2);
    pctx.stroke();

    pctx.fillStyle = '#0284c7';
    pctx.font = '700 18px "Tektur", sans-serif';
    pctx.textAlign = 'center';
    pctx.fillText('NASA GSFC', stampX, stampY - 10);
    pctx.fillText('FLIGHT READY', stampX, stampY + 14);

    const paperTex = new THREE.CanvasTexture(pCanvas);
    const topSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(0.30, 0.40),
      new THREE.MeshBasicMaterial({ map: paperTex })
    );
    topSheet.rotation.x = -Math.PI / 2;
    topSheet.position.set(0, 0.012, 0);
    papersGroup.add(topSheet);

    papersGroup.position.set(x, y, z);
    papersGroup.rotation.y = -Math.PI / 2 + 0.12;
    this.scene.add(papersGroup);
  }

  // --- 4. TO-GO PAPER COFFEE CUP (Coffee-paper.jpeg) ---
  create3DCoffeeCup(x, y, z) {
    const cupGroup = new THREE.Group();

    // Bottom rolled white rim collar (Coffee-paper.jpeg)
    const baseCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.033, 0.033, 0.012, 24),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    baseCollar.position.y = 0.006;
    cupGroup.add(baseCollar);

    // Tapered kraft cardboard sleeve cup body (Coffee-paper.jpeg)
    const bodyGeo = new THREE.CylinderGeometry(0.045, 0.033, 0.115, 24);
    const kraftMat = new THREE.MeshStandardMaterial({
      color: 0xba8958, // Kraft brown cardboard matching image
      roughness: 0.85,
      metalness: 0.05
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, kraftMat);
    bodyMesh.position.y = 0.068;
    cupGroup.add(bodyMesh);

    // Molded black plastic drinking sip lid (Coffee-paper.jpeg)
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.35,
      metalness: 0.2
    });

    // Lower snap rim on cup mouth
    const lidRim = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.046, 0.012, 24), lidMat);
    lidRim.position.y = 0.128;
    cupGroup.add(lidRim);

    // Raised contoured sipping dome
    const lidDome = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.046, 0.014, 24), lidMat);
    lidDome.position.y = 0.138;
    cupGroup.add(lidDome);

    // Raised oval drinking aperture notch on edge
    const sipSpout = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.006, 0.012), lidMat);
    sipSpout.position.set(0.032, 0.146, 0);
    cupGroup.add(sipSpout);

    cupGroup.position.set(x, y, z);
    this.scene.add(cupGroup);
  }

  // --- 5. TECHNICAL BLUE ESD BLUEPRINT WORK MAT (Work-bech-mat.jpeg) ---
  create3DWorkbenchZone(x, y, z) {
    const wbGroup = new THREE.Group();

    // Technical Precision Blue ESD Mat Canvas Texture (Work-bech-mat.jpeg)
    const mCanvas = document.createElement('canvas');
    mCanvas.width = 1024;
    mCanvas.height = 1536;
    const mctx = mCanvas.getContext('2d');

    // Deep precision blue background
    mctx.fillStyle = '#1e40af'; // Vibrant blue matching Work-bech-mat.jpeg
    mctx.fillRect(0, 0, 1024, 1536);

    // Minor millimeter grid lines (thin white/cyan)
    mctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    mctx.lineWidth = 1.5;
    for (let gx = 0; gx <= 1024; gx += 24) {
      mctx.beginPath();
      mctx.moveTo(gx, 0);
      mctx.lineTo(gx, 1536);
      mctx.stroke();
    }
    for (let gy = 0; gy <= 1536; gy += 24) {
      mctx.beginPath();
      mctx.moveTo(0, gy);
      mctx.lineTo(1024, gy);
      mctx.stroke();
    }

    // Major 5cm division grid lines
    mctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    mctx.lineWidth = 3.5;
    for (let mx = 0; mx <= 1024; mx += 120) {
      mctx.beginPath();
      mctx.moveTo(mx, 0);
      mctx.lineTo(mx, 1536);
      mctx.stroke();
    }
    for (let my = 0; my <= 1536; my += 120) {
      mctx.beginPath();
      mctx.moveTo(0, my);
      mctx.lineTo(1024, my);
      mctx.stroke();
    }

    // Outer border with calibration ticks
    mctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    mctx.lineWidth = 6;
    mctx.strokeRect(18, 18, 1024 - 36, 1536 - 36);

    // ESD static-dissipative certification text in corner
    mctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    mctx.font = '700 24px "Tektur", sans-serif';
    mctx.fillText('NASA GSFC // ESD WORK SURFACE // MIL-STD-1686', 45, 65);
    mctx.font = '500 20px "Tektur", sans-serif';
    mctx.fillText('SURFACE RESISTANCE: 10^6 - 10^9 OHMS', 45, 95);

    const matTex = new THREE.CanvasTexture(mCanvas);
    const matMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 1.30),
      new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.75, metalness: 0.1 })
    );
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.set(0, 0.005, 0);
    wbGroup.add(matMesh);

    // Chrome ESD Grounding Snap Stud in corner
    const studMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.15 });
    const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 16), studMat);
    stud.position.set(-0.36, 0.01, -0.58);
    wbGroup.add(stud);

    // Coiled grounding cable attached to stud
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.024, 0.006, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 })
    );
    coil.position.set(-0.36, 0.015, -0.54);
    coil.rotation.x = Math.PI / 2;
    wbGroup.add(coil);

    // Molded antistatic parts organizer tray adjacent to mat
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1b1f28, metalness: 0.7, roughness: 0.3 });
    const trayMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.46), trayMat);
    trayMesh.position.set(0.32, 0.02, 0.0);
    wbGroup.add(trayMesh);

    // Internal recessed tray bins
    const binInner = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.015, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x0f1117 })
    );
    binInner.position.set(0.32, 0.03, 0.0);
    wbGroup.add(binInner);

    wbGroup.position.set(x, y, z);
    wbGroup.rotation.y = -Math.PI / 2;
    this.scene.add(wbGroup);
    this.desk01WorkbenchGroup = wbGroup;
  }

  // --- 7. CLEANROOM DISPOSAL DUST BIN (Dust-bin.jpeg) ---
  create3DDustBin(x, y, z) {
    const binGroup = new THREE.Group();
    const binMat = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.45,
      metalness: 0.55
    });

    // 1. Recessed base plinth on floor
    const plinthGeo = new THREE.BoxGeometry(0.32, 0.09, 0.32);
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.6, metalness: 0.3 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = 0.045;
    binGroup.add(plinth);

    // 2. Main rectangular prism body
    const bodyGeo = new THREE.BoxGeometry(0.36, 0.68, 0.36);
    const body = new THREE.Mesh(bodyGeo, binMat);
    body.position.y = 0.09 + 0.34;
    body.castShadow = true;
    body.receiveShadow = true;
    binGroup.add(body);

    // 3. Forward-slanted top lid (slanted ~12 degrees toward the aisle)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.77, 0);
    lidGroup.rotation.z = 0.20; // Slanted towards the walkway

    const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.04, 0.37), binMat);
    lidGroup.add(lidMesh);

    // Top drop chute opening (dark hole for trash disposal)
    const chuteMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.005, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x0a0b0e })
    );
    chuteMesh.position.y = 0.021;
    lidGroup.add(chuteMesh);

    binGroup.add(lidGroup);

    // 4. Front decal with Cleanroom Waste Pictogram & Top Lock (Dust-bin.jpeg)
    const decalCanvas = document.createElement('canvas');
    decalCanvas.width = 512;
    decalCanvas.height = 768;
    const dctx = decalCanvas.getContext('2d');

    // Background matching bin body
    dctx.fillStyle = '#22242a';
    dctx.fillRect(0, 0, 512, 768);

    // Top Lock screw / keyhole
    dctx.fillStyle = '#94a3b8';
    dctx.beginPath();
    dctx.arc(256, 75, 14, 0, Math.PI * 2);
    dctx.fill();
    dctx.fillStyle = '#0f172a';
    dctx.fillRect(254, 66, 4, 18);

    // White circle outline for disposal pictogram
    dctx.strokeStyle = '#ffffff';
    dctx.lineWidth = 14;
    dctx.beginPath();
    dctx.arc(256, 260, 120, 0, Math.PI * 2);
    dctx.stroke();

    // Person silhouette throwing trash into basket
    dctx.fillStyle = '#ffffff';
    // Head
    dctx.beginPath();
    dctx.arc(285, 195, 18, 0, Math.PI * 2);
    dctx.fill();

    // Torso & legs
    dctx.beginPath();
    dctx.moveTo(270, 222);
    dctx.lineTo(295, 222);
    dctx.lineTo(312, 310);
    dctx.lineTo(294, 310);
    dctx.lineTo(282, 265);
    dctx.lineTo(270, 310);
    dctx.lineTo(252, 310);
    dctx.closePath();
    dctx.fill();

    // Arm reaching forward
    dctx.lineWidth = 12;
    dctx.lineCap = 'round';
    dctx.beginPath();
    dctx.moveTo(275, 230);
    dctx.lineTo(235, 225);
    dctx.lineTo(220, 238);
    dctx.stroke();

    // Paper piece falling
    dctx.fillRect(212, 246, 16, 12);

    // Trash basket silhouette with cross-hatch
    dctx.lineWidth = 6;
    dctx.beginPath();
    dctx.moveTo(195, 260);
    dctx.lineTo(238, 260);
    dctx.lineTo(230, 312);
    dctx.lineTo(203, 312);
    dctx.closePath();
    dctx.stroke();
    // Grid lines inside basket
    dctx.lineWidth = 3;
    for (let bx = 205; bx <= 228; bx += 7) {
      dctx.beginPath();
      dctx.moveTo(bx, 260);
      dctx.lineTo(bx - 2, 312);
      dctx.stroke();
    }

    // Subtle label at bottom
    dctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    dctx.font = '600 24px "Tektur", sans-serif';
    dctx.textAlign = 'center';
    dctx.fillText('GSFC CLEANROOM DISPOSAL', 256, 520);
    dctx.fillText('REF NO. MS-BIN-01', 256, 555);

    const decalTex = new THREE.CanvasTexture(decalCanvas);
    const decalPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.52),
      new THREE.MeshBasicMaterial({ map: decalTex })
    );
    // Face towards the walkway (East/West axis - faces -X)
    decalPlane.position.set(-0.181, 0.44, 0);
    decalPlane.rotation.y = -Math.PI / 2;
    binGroup.add(decalPlane);

    binGroup.position.set(x, y, z);
    this.scene.add(binGroup);
  }

  // --- 8. 4-TIER INSTRUMENT RACK SHELF (Instrument rack.jpeg) ---
  create3DInstrumentRack(x, y, z) {
    const rackGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      metalness: 0.85,
      roughness: 0.25
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x935b36, // Warm wood matching Instrument rack.jpeg
      roughness: 0.65,
      metalness: 0.1
    });

    const H = 1.82;
    const W = 0.82;
    const D = 0.36;

    // 4 vertical corner steel posts
    const postGeo = new THREE.BoxGeometry(0.035, H, 0.035);
    const postPositions = [
      [-W / 2 + 0.02, H / 2, -D / 2 + 0.02],
      [W / 2 - 0.02, H / 2, -D / 2 + 0.02],
      [-W / 2 + 0.02, H / 2, D / 2 - 0.02],
      [W / 2 - 0.02, H / 2, D / 2 - 0.02]
    ];
    postPositions.forEach((pos) => {
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(pos[0], pos[1], pos[2]);
      post.castShadow = true;
      rackGroup.add(post);
    });

    // Top loop frames connecting the posts
    const topBarGeo = new THREE.BoxGeometry(0.035, 0.035, D);
    [-W / 2 + 0.02, W / 2 - 0.02].forEach((px) => {
      const topBar = new THREE.Mesh(topBarGeo, frameMat);
      topBar.position.set(px, H - 0.018, 0);
      rackGroup.add(topBar);
    });

    // 4 Wooden Shelves with Raised Rear Lip (matching Instrument rack.jpeg)
    const shelfHeights = [0.22, 0.62, 1.05, 1.48];
    shelfHeights.forEach((shY, sIdx) => {
      // Main horizontal shelf board
      const board = new THREE.Mesh(new THREE.BoxGeometry(W - 0.01, 0.025, D - 0.02), woodMat);
      board.position.set(0, shY, 0);
      board.castShadow = true;
      board.receiveShadow = true;
      rackGroup.add(board);

      // Raised rear wooden lip / backboard matching Instrument rack.jpeg
      const lip = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, 0.09, 0.018), woodMat);
      lip.position.set(0, shY + 0.045, -D / 2 + 0.02);
      rackGroup.add(lip);

      // Add realistic cleanroom equipment onto each shelf
      if (sIdx === 0) {
        // Shelf 1 (Bottom): Heavy Telemetry Power Converter
        const psu = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.16, 0.28),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
        );
        psu.position.set(-0.12, shY + 0.09, 0.02);
        rackGroup.add(psu);

        // Power LED
        const psuLed = new THREE.PointLight(0x10b981, 0.4, 0.8);
        psuLed.position.set(-0.12, shY + 0.14, 0.16);
        rackGroup.add(psuLed);
      } else if (sIdx === 1) {
        // Shelf 2: Pelican Aerospace Flight Tool Cases (Safety Yellow + Navy Blue)
        const case1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.16, 0.24),
          new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5, metalness: 0.3 })
        );
        case1.position.set(-0.16, shY + 0.09, 0.02);
        rackGroup.add(case1);

        const case2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.14, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.3 })
        );
        case2.position.set(0.18, shY + 0.08, 0.01);
        rackGroup.add(case2);
      } else if (sIdx === 2) {
        // Shelf 3: Cleanroom Digital Frequency Diagnostic Oscilloscope
        const osc = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.18, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
        );
        osc.position.set(0.0, shY + 0.10, 0.01);
        rackGroup.add(osc);

        const oscScreen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.20, 0.12),
          new THREE.MeshBasicMaterial({ color: 0x00f0ff })
        );
        oscScreen.position.set(0.0, shY + 0.10, 0.122);
        rackGroup.add(oscScreen);
      } else if (sIdx === 3) {
        // Shelf 4 (Top): Spooled Alignment Telemetry Cables
        const spool = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.12, 18),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6, roughness: 0.4 })
        );
        spool.position.set(-0.16, shY + 0.07, 0.01);
        rackGroup.add(spool);
      }
    });

    rackGroup.position.set(x, y, z);
    rackGroup.rotation.y = -Math.PI / 2; // Face towards the cleanroom aisle
    this.scene.add(rackGroup);
  }

  // --- Center Aerospace Ground Support Equipment (GSE) Spacecraft Integration Platform ---
  createCenterBlackSlabWithCradle() {
    const width = 2.6;    // 2.6m wide
    const length = 4.6;   // 4.6m long
    const deckY = 0.62;   // 0.62m platform deck height
    const deckThickness = 0.08;

    const gseGroup = new THREE.Group();
    gseGroup.name = 'centerIntegrationPlatform';

    // 1. Aerospace Materials (Cleanroom Space-Grade Titanium / Structural Steel)
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x1e2530,
      roughness: 0.35,
      metalness: 0.75
    });
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x242d38,
      roughness: 0.45,
      metalness: 0.55
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.5,
      metalness: 0.4
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.2,
      metalness: 0.9
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d14,
      roughness: 0.92
    });

    // 2. Heavy-Duty Structural Spaceframe (2 Longitudinal I-Beams + 3 Cross-Members)
    const beamGeoX = new THREE.BoxGeometry(width - 0.2, 0.14, 0.18);
    [-1.8, 0, 1.8].forEach(zPos => {
      const crossBeam = new THREE.Mesh(beamGeoX, steelMat);
      crossBeam.position.set(0, deckY - 0.07, zPos);
      crossBeam.castShadow = true;
      crossBeam.receiveShadow = true;
      gseGroup.add(crossBeam);
    });

    const beamGeoZ = new THREE.BoxGeometry(0.18, 0.14, length - 0.2);
    [-width / 2 + 0.25, width / 2 - 0.25].forEach(xPos => {
      const longBeam = new THREE.Mesh(beamGeoZ, steelMat);
      longBeam.position.set(xPos, deckY - 0.07, 0);
      longBeam.castShadow = true;
      longBeam.receiveShadow = true;
      gseGroup.add(longBeam);
    });

    // 3. 6 Heavy-Duty Cleanroom Hydraulic Leveling Jack Legs with Footplates
    const legGeo = new THREE.CylinderGeometry(0.065, 0.065, deckY - 0.08, 16);
    const footpadGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.04, 20);
    const collarGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.05, 16);

    const legPositions = [
      [-width / 2 + 0.25, -1.8], [width / 2 - 0.25, -1.8],
      [-width / 2 + 0.25, 0.0],  [width / 2 - 0.25, 0.0],
      [-width / 2 + 0.25, 1.8],  [width / 2 - 0.25, 1.8]
    ];

    legPositions.forEach(([lx, lz]) => {
      const legY = (deckY - 0.08) / 2;
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(lx, legY + 0.04, lz);
      leg.castShadow = true;
      gseGroup.add(leg);

      const foot = new THREE.Mesh(footpadGeo, chromeMat);
      foot.position.set(lx, 0.02, lz);
      foot.castShadow = true;
      gseGroup.add(foot);

      const collar = new THREE.Mesh(collarGeo, chromeMat);
      collar.position.set(lx, deckY - 0.14, lz);
      gseGroup.add(collar);
    });

    // 4. Cleanroom Metrology Assembly Deck (Solid Brushed Aerospace Platform)
    const deckGeo = new THREE.BoxGeometry(width, deckThickness, length);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, deckY + deckThickness / 2, 0);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    gseGroup.add(deckMesh);

    // Beveled perimeter protective edge bumper
    const rimGeo = new THREE.BoxGeometry(width + 0.04, 0.025, length + 0.04);
    const rimMesh = new THREE.Mesh(rimGeo, trimMat);
    rimMesh.position.set(0, deckY + deckThickness + 0.0125, 0);
    gseGroup.add(rimMesh);

    // 5. Twin Heavy-Duty Aerospace Spacecraft Saddles (Aft & Forward Cradles)
    const cradleTopY = 0.96; // Target telescope rest height
    [-1.45, 0.0, 1.45].forEach((zPos, idx) => {
      this.buildAerospaceCradleSaddle(gseGroup, zPos, deckY + deckThickness, cradleTopY, steelMat, chromeMat, rubberMat, idx === 1);
    });

    this.scene.add(gseGroup);
  }

  buildAerospaceCradleSaddle(parentGroup, zPos, baseY, saddleTopY, steelMat, chromeMat, rubberMat, isCenter) {
    const cradle = new THREE.Group();
    cradle.position.set(0, 0, zPos);

    const saddleHeight = saddleTopY - baseY; // ~0.26m

    // Base Mounting Cross-Spanner
    const spannerGeo = new THREE.BoxGeometry(1.9, 0.06, 0.26);
    const spanner = new THREE.Mesh(spannerGeo, steelMat);
    spanner.position.set(0, baseY + 0.03, 0);
    spanner.castShadow = true;
    spanner.receiveShadow = true;
    cradle.add(spanner);

    // Left & Right Structural Uprights (Trunnion Towers)
    const uprightGeo = new THREE.BoxGeometry(0.18, saddleHeight, 0.22);
    [-0.82, 0.82].forEach(xSide => {
      const upright = new THREE.Mesh(uprightGeo, steelMat);
      upright.position.set(xSide, baseY + saddleHeight / 2 + 0.03, 0);
      upright.castShadow = true;
      upright.receiveShadow = true;
      cradle.add(upright);

      // Machined Stainless Trunnion Bearing Block
      const bearingGeo = new THREE.BoxGeometry(0.20, 0.10, 0.24);
      const bearing = new THREE.Mesh(bearingGeo, chromeMat);
      bearing.position.set(xSide, saddleTopY - 0.02, 0);
      cradle.add(bearing);
    });

    // Precision Curved Saddle Contour (Cushioned Arch)
    const saddleGeo = new THREE.BoxGeometry(1.48, 0.06, 0.24);
    const saddle = new THREE.Mesh(saddleGeo, rubberMat);
    saddle.position.set(0, saddleTopY, 0);
    saddle.castShadow = true;
    cradle.add(saddle);

    // Subtle optical alignment laser dot on center station
    if (isCenter) {
      const ledGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.rotation.x = Math.PI / 2;
      led.position.set(0.85, saddleTopY + 0.04, 0.11);
      cradle.add(led);
    }

    parentGroup.add(cradle);
  }

  // --- Real NASA .GLB Loader: STANDING SOLIDLY ON TABLE WITH 100% ORIGINAL TEXTURES ---
  loadHubbleTelescopeStandingOnTable() {
    const gltfLoaderClass = window.THREE?.GLTFLoader || THREE.GLTFLoader;
    const dracoLoaderClass = window.THREE?.DRACOLoader || THREE.DRACOLoader;

    if (typeof gltfLoaderClass === 'undefined') {
      setTimeout(() => this.loadHubbleTelescopeStandingOnTable(), 80);
      return;
    }

    const loader = new gltfLoaderClass();

    // Attach DRACOLoader to decode KHR_draco_mesh_compression
    if (typeof dracoLoaderClass !== 'undefined') {
      const dracoLoader = new dracoLoaderClass();
      const dracoPath = (window.location.protocol === 'file:')
        ? 'assets/js/draco/'
        : 'https://www.gstatic.com/draco/versioned/decoders/1.4.3/';
      dracoLoader.setDecoderPath(dracoPath);
      loader.setDRACOLoader(dracoLoader);
    }

    const onModelSuccess = (gltf) => {
      const model = gltf.scene;

      // 1. Compute raw bounding box of the unscaled original mesh
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);

      // 2. Scale factor: authentically imposing ~5.20m length (school-bus class spacecraft scale!)
      const targetLength = 5.20;
      const s = targetLength / (maxDim || 1);
      model.scale.set(s, s, s);

      // 3. Recompute bounding box after scale
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());

      // 4. Center horizontally on integration rig (X=0, Z=0)
      model.position.x = -center.x;
      model.position.z = -center.z;

      // 5. CRITICAL: Rest solidly inside the aerospace cradle saddles at working eye-height!
      // Aerospace cradle saddle top is at Y = 0.96m.
      // Lowest point of the telescope mesh (box.min.y) sits flush at Y = 0.96m!
      // Center line of telescope stands at Y = ~1.46m (direct eye-level with astronaut)!
      const cradleRestY = 0.96;
      model.position.y += (cradleRestY - box.min.y);

      // 6. PRESERVE 100% OF THE ORIGINAL NASA TEXTURES & MATERIALS
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.needsUpdate = true;
          }
        }
      });

      this.scene.add(model);
      this.hubbleModel = model;
      console.log('Real NASA Hubble GLB loaded with 100% original textures and standing solidly on table!');
    };

    // Helper: Decode base64 data URI to ArrayBuffer for immediate in-memory parsing
    const parseBase64Data = (dataUri) => {
      try {
        const base64Index = dataUri.indexOf('base64,');
        if (base64Index === -1) return null;
        const b64 = dataUri.substring(base64Index + 7);
        const binStr = window.atob(b64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        return bytes.buffer;
      } catch (e) {
        console.warn('Base64 decode failed:', e);
        return null;
      }
    };

    // Attempt 1: Parse from in-memory Base64 (instant, zero network latency)
    if (window.HUBBLE_GLB_DATA) {
      const buffer = parseBase64Data(window.HUBBLE_GLB_DATA);
      if (buffer) {
        loader.parse(
          buffer,
          '',
          (gltf) => onModelSuccess(gltf),
          (parseErr) => {
            console.warn('loader.parse base64 failed, falling back to network file:', parseErr);
            this.loadHubbleFromFile(loader, onModelSuccess);
          }
        );
        return;
      }
    }

    // Attempt 2: Load via network file
    this.loadHubbleFromFile(loader, onModelSuccess);
  }

  loadHubbleFromFile(loader, onModelSuccess) {
    const primaryUrl = '3D-assets/hubble.glb';
    const fallbackUrl = '3D-assets/Hubble%20Space%20Telescope%20(A).glb';

    loader.load(
      primaryUrl,
      (gltf) => onModelSuccess(gltf),
      undefined,
      (err1) => {
        console.warn('Could not load hubble.glb, trying fallback URL:', err1);
        loader.load(
          fallbackUrl,
          (gltf2) => onModelSuccess(gltf2),
          undefined,
          (err2) => {
            console.error('All Hubble GLB loader attempts failed:', err2);
          }
        );
      }
    );
  }

  createDeskTerminal(x, y, z) {
    const terminalGroup = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0x333338, metalness: 0.8, roughness: 0.3 });

    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 16), standMat);
    baseMesh.position.y = 0.02;
    terminalGroup.add(baseMesh);

    const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 12), standMat);
    stemMesh.position.y = 0.15;
    terminalGroup.add(stemMesh);

    const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.48, 0.05), new THREE.MeshStandardMaterial({ color: 0x1a1a1f }));
    screenMesh.position.set(0, 0.4, 0);
    screenMesh.rotation.y = Math.PI / 4;
    terminalGroup.add(screenMesh);

    const displayFace = new THREE.Mesh(new THREE.PlaneGeometry(0.80, 0.43), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    displayFace.position.set(0, 0.4, 0.03);
    displayFace.rotation.y = Math.PI / 4;
    terminalGroup.add(displayFace);

    terminalGroup.position.set(x, y, z);
    this.scene.add(terminalGroup);
  }

  createCeilingFixtures() {
    const fixtureGeo = new THREE.BoxGeometry(0.4, 0.06, 2.2);
    const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pos = [
      { x: -3.0, z: -2.5 },
      { x: 3.0, z: -2.5 },
      { x: -3.0, z: 2.5 },
      { x: 3.0, z: 2.5 }
    ];
    pos.forEach((p) => {
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(p.x, this.room.height - 0.03, p.z);
      this.scene.add(fixture);
    });
  }

  // --- CONTROLS SETUP (WASD + ARROW KEYS + POINTER LOCK + MOUSE DRAG) ---
  setupControls() {
    const canvas = this.renderer.domElement;
    const lockPrompt = document.getElementById('hudLockPrompt');

    // Click canvas to lock mouse for 360° FPS look
    canvas.addEventListener('click', () => {
      const anyModalOpen = document.querySelector('.facility-modal-backdrop:not(.hidden)');
      if (!anyModalOpen) {
        try { canvas.requestPointerLock(); } catch(e) {}
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas) {
        this.isLocked = true;
        if (lockPrompt) lockPrompt.style.opacity = '0';
      } else {
        this.isLocked = false;
        if (lockPrompt) lockPrompt.style.opacity = '1';
      }
    });

    // Mouse drag support when pointer lock is not active (or trackpad use)
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    canvas.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    // 360° Mouse look (Works both when locked AND when dragging)
    window.addEventListener('mousemove', (e) => {
      const maxPitch = Math.PI / 2.2;
      const hMult = (typeof window.horizSensitivity === 'number' ? window.horizSensitivity : 80) / 80;
      const vMult = (typeof window.vertSensitivity === 'number' ? window.vertSensitivity : 80) / 80;

      if (this.isLocked) {
        const baseSens = 0.0022;
        this.player.yaw -= e.movementX * baseSens * hMult;
        this.player.pitch -= e.movementY * baseSens * vMult;
        this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
      } else if (isMouseDown) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        const baseSens = 0.0035;
        this.player.yaw -= dx * baseSens * hMult;
        this.player.pitch -= dy * baseSens * vMult;
        this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
      }
    });

    // Touch support for mobile/trackpad drag
    let lastTouchX = 0;
    let lastTouchY = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const dx = e.touches[0].clientX - lastTouchX;
        const dy = e.touches[0].clientY - lastTouchY;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;

        const sensitivity = 0.0035;
        this.player.yaw -= dx * sensitivity;
        this.player.pitch -= dy * sensitivity;
        const maxPitch = Math.PI / 2.2;
        this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
      }
    }, { passive: true });

    // KEYDOWN: Handles WASD + ALL ARROW KEYS + SHIFT + Q/C + E
    window.addEventListener('keydown', (e) => {
      // Don't capture keys if typing into an input field
      const activeEl = document.activeElement;
      const activeTag = activeEl?.tagName?.toLowerCase();
      if ((activeTag === 'input' || activeTag === 'textarea') && activeEl.offsetParent !== null) return;

      const code = e.code;
      const key = e.key;

      // FORWARD: W or ArrowUp
      if (code === 'KeyW' || key === 'w' || key === 'W' || code === 'ArrowUp' || key === 'ArrowUp') {
        this.keys.forward = true;
      }
      // BACKWARD: S or ArrowDown
      if (code === 'KeyS' || key === 's' || key === 'S' || code === 'ArrowDown' || key === 'ArrowDown') {
        this.keys.backward = true;
      }
      // MOVE LEFT (STRAFE): A or ArrowLeft
      if (code === 'KeyA' || key === 'a' || key === 'A' || code === 'ArrowLeft' || key === 'ArrowLeft') {
        this.keys.left = true;
      }
      // MOVE RIGHT (STRAFE): D or ArrowRight
      if (code === 'KeyD' || key === 'd' || key === 'D' || code === 'ArrowRight' || key === 'ArrowRight') {
        this.keys.right = true;
      }
      // KEYBOARD ROTATION: Q / Z (Turn Left)
      if (code === 'KeyQ' || key === 'q' || key === 'Q' || code === 'KeyZ' || key === 'z' || key === 'Z') {
        this.keys.turnLeft = true;
      }
      // KEYBOARD ROTATION: C (Turn Right)
      if (code === 'KeyC' || key === 'c' || key === 'C') {
        this.keys.turnRight = true;
      }
      // TOGGLE VIEW [V] (Character Focus / 1st Person)
      if (code === 'KeyV' || key === 'v' || key === 'V') {
        this.toggleCameraMode();
      }
      // SPRINT
      if (e.shiftKey || code === 'ShiftLeft' || code === 'ShiftRight') {
        this.keys.sprint = true;
      }
      // INTERACT [E]
      if (code === 'KeyE' || key === 'e' || key === 'E') {
        this.handleInteractKey();
      }
    });

    // Mouse Wheel: Zoom in to First Person or zoom out to Third Person Focus
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance += (e.deltaY > 0 ? 0.35 : -0.35);
      this.cameraDistance = Math.max(0.0, Math.min(4.5, this.cameraDistance));
      if (this.cameraDistance < 0.6) {
        if (this.cameraMode !== 'first_person') this.setCameraMode('first_person');
      } else {
        if (this.cameraMode !== 'third_person') this.setCameraMode('third_person');
      }
    }, { passive: false });

    // KEYUP: Reset states cleanly
    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key;

      if (code === 'KeyW' || key === 'w' || key === 'W' || code === 'ArrowUp' || key === 'ArrowUp') {
        this.keys.forward = false;
      }
      if (code === 'KeyS' || key === 's' || key === 'S' || code === 'ArrowDown' || key === 'ArrowDown') {
        this.keys.backward = false;
      }
      if (code === 'KeyA' || key === 'a' || key === 'A' || code === 'ArrowLeft' || key === 'ArrowLeft') {
        this.keys.left = false;
      }
      if (code === 'KeyD' || key === 'd' || key === 'D' || code === 'ArrowRight' || key === 'ArrowRight') {
        this.keys.right = false;
      }
      if (code === 'KeyQ' || key === 'q' || key === 'Q' || code === 'KeyZ' || key === 'z' || key === 'Z') {
        this.keys.turnLeft = false;
      }
      if (code === 'KeyC' || key === 'c' || key === 'C') {
        this.keys.turnRight = false;
      }
      if (!e.shiftKey && (code === 'ShiftLeft' || code === 'ShiftRight')) {
        this.keys.sprint = false;
      }
    });
  }

  handleInteractKey() {
    if (!this.activeInteractable) return;

    if (document.pointerLockElement === this.renderer?.domElement) {
      document.exitPointerLock();
    }

    window.dispatchEvent(new CustomEvent('facilityInteract', {
      detail: {
        type: this.activeInteractable.type,
        label: this.activeInteractable.label
      }
    }));
  }

  // --- Collision Detection Helper (Perimeter + Desks + Slab) ---
  checkCollisions(x, z) {
    const pad = this.player.radius;
    const halfW = this.room.width / 2;
    const halfD = this.room.depth / 2;

    // 1. Perimeter Walls
    if (x < -halfW + pad || x > halfW - pad || z < -halfD + pad || z > halfD - pad) {
      return true;
    }

    // 2. Desk No 02 (West Wall)
    const d2 = this.desk02Box;
    if (x >= (d2.minX - pad) && x <= (d2.maxX + pad) && z >= (d2.minZ - pad) && z <= (d2.maxZ + pad)) {
      return true;
    }

    // 3. Center Black Slab (Hubble Table)
    const c = this.centerSlabBox;
    if (x >= (c.minX - pad) && x <= (c.maxX + pad) && z >= (c.minZ - pad) && z <= (c.maxZ + pad)) {
      return true;
    }

    // 4. Desk No 01 (East Wall)
    const d1 = this.desk01Box;
    if (x >= (d1.minX - pad) && x <= (d1.maxX + pad) && z >= (d1.minZ - pad) && z <= (d1.maxZ + pad)) {
      return true;
    }

    // 5. Desk No 03 (South Wall - Network Department)
    const d3 = this.desk03Box;
    if (d3 && x >= (d3.minX - pad) && x <= (d3.maxX + pad) && z >= (d3.minZ - pad) && z <= (d3.maxZ + pad)) {
      return true;
    }

    return false;
  }

  // --- Physics & Smooth Collision Sliding ---
  updatePhysics(delta) {
    // Keyboard rotation if turning with Q/Z or C
    if (this.keys.turnLeft) {
      this.player.yaw += this.player.turnSpeed * delta;
    }
    if (this.keys.turnRight) {
      this.player.yaw -= this.player.turnSpeed * delta;
    }

    let fwd = 0;
    let strafe = 0;

    const currentSpeed = this.player.speed * (this.keys.sprint ? this.player.sprintMult : 1.0);

    if (this.keys.forward) fwd += 1;
    if (this.keys.backward) fwd -= 1;
    if (this.keys.left) strafe -= 1;
    if (this.keys.right) strafe += 1;

    const len = Math.hypot(fwd, strafe);
    if (len > 0) {
      fwd /= len;
      strafe /= len;

      // Absolute correct Three.js directional vectors based on player yaw
      // Standard camera orientation with order 'YXZ':
      // At yaw = 0, camera looks along -Z (North).
      // At yaw = -PI/2 (turned 90° right), camera looks along +X (East).
      const forwardX = -Math.sin(this.player.yaw);
      const forwardZ = -Math.cos(this.player.yaw);
      const rightX = Math.cos(this.player.yaw);
      const rightZ = -Math.sin(this.player.yaw);

      const speed = currentSpeed * delta;
      this.player.vel.x = (forwardX * fwd + rightX * strafe) * speed;
      this.player.vel.z = (forwardZ * fwd + rightZ * strafe) * speed;

      this.bobTimer += delta * (this.keys.sprint ? 14 : 9);
      this.camera.position.y = this.player.height + Math.sin(this.bobTimer) * 0.035;
    } else {
      this.player.vel.x = 0;
      this.player.vel.z = 0;
      this.camera.position.y = this.player.height;
    }

    // --- Smooth Axis-Separated Collision Sliding ---
    // 1. Test X axis movement
    const newX = this.player.pos.x + this.player.vel.x;
    if (!this.checkCollisions(newX, this.player.pos.z)) {
      this.player.pos.x = newX;
    }

    // 2. Test Z axis movement
    const newZ = this.player.pos.z + this.player.vel.z;
    if (!this.checkCollisions(this.player.pos.x, newZ)) {
      this.player.pos.z = newZ;
    }

    // --- Character Avatar Position & Animation ---
    if (this.localAvatar) {
      this.localAvatar.position.set(this.player.pos.x, 0, this.player.pos.z);
      this.localAvatar.rotation.y = this.player.yaw + Math.PI;

      // 1. Head & Neck Movement according to mouse pitch look
      if (this.avatarBones.head) {
        const initHeadX = this.initialBoneRot['Head'] ? this.initialBoneRot['Head'].x : 0;
        this.avatarBones.head.rotation.x = initHeadX - this.player.pitch * 0.75;
      }
      if (this.avatarBones.neck) {
        const initNeckX = this.initialBoneRot['Neck'] ? this.initialBoneRot['Neck'].x : 0;
        this.avatarBones.neck.rotation.x = initNeckX - this.player.pitch * 0.25;
      }

      // 2. Walking Movements Animation
      const speed = Math.hypot(this.player.vel.x, this.player.vel.z);
      const isMoving = speed > 0.001 || fwd !== 0 || strafe !== 0;

      if (isMoving) {
        this.walkCycle += delta * (this.keys.sprint ? 14 : 9.5);
        const stride = this.keys.sprint ? 0.62 : 0.42;
        const phase = Math.sin(this.walkCycle);

        const b = this.avatarBones;
        const inits = this.initialBoneRot;

        // Thighs striding
        if (b.leftUpLeg) b.leftUpLeg.rotation.x = (inits['LeftUpLeg']?.x || 0) + phase * stride;
        if (b.rightUpLeg) b.rightUpLeg.rotation.x = (inits['RightUpLeg']?.x || 0) - phase * stride;

        // Knee bending during step
        if (b.leftLeg) b.leftLeg.rotation.x = (inits['LeftLeg']?.x || 0) + Math.max(0, -phase) * 0.55;
        if (b.rightLeg) b.rightLeg.rotation.x = (inits['RightLeg']?.x || 0) + Math.max(0, phase) * 0.55;

        // Arms natural swinging in counter-phase to legs
        const armStride = this.keys.sprint ? 0.45 : 0.28;
        if (b.leftArm) b.leftArm.rotation.x = (inits['LeftArm']?.x || 0) - phase * armStride;
        if (b.rightArm) b.rightArm.rotation.x = (inits['RightArm']?.x || 0) + phase * armStride;

        // Subtle hip height bounce
        if (b.hips) b.hips.position.y = this.baseHipsY + Math.abs(Math.sin(this.walkCycle * 2)) * 0.025;
      } else {
        // Return smoothly to natural standing pose
        const damp = 0.18;
        const b = this.avatarBones;
        const inits = this.initialBoneRot;
        if (b.leftUpLeg) b.leftUpLeg.rotation.x += ((inits['LeftUpLeg']?.x || 0) - b.leftUpLeg.rotation.x) * damp;
        if (b.rightUpLeg) b.rightUpLeg.rotation.x += ((inits['RightUpLeg']?.x || 0) - b.rightUpLeg.rotation.x) * damp;
        if (b.leftLeg) b.leftLeg.rotation.x += ((inits['LeftLeg']?.x || 0) - b.leftLeg.rotation.x) * damp;
        if (b.rightLeg) b.rightLeg.rotation.x += ((inits['RightLeg']?.x || 0) - b.rightLeg.rotation.x) * damp;
        if (b.leftArm) b.leftArm.rotation.x += ((inits['LeftArm']?.x || 0) - b.leftArm.rotation.x) * damp;
        if (b.rightArm) b.rightArm.rotation.x += ((inits['RightArm']?.x || 0) - b.rightArm.rotation.x) * damp;
        if (b.hips) b.hips.position.y += (this.baseHipsY - b.hips.position.y) * damp;

        // Idle breathing motion
        this.idleCycle += delta * 2.0;
        if (b.spine) {
          b.spine.rotation.x = (inits['Spine']?.x || 0) + Math.sin(this.idleCycle) * 0.015;
        }
      }
    }

    // --- Camera Positioning (Third Person Character Focus vs First Person) ---
    if (this.cameraMode === 'third_person') {
      const pitchClamped = Math.max(-0.62, Math.min(0.65, this.player.pitch));
      const horizDist = this.cameraDistance * Math.cos(pitchClamped);
      const vertDist = this.cameraDistance * Math.sin(pitchClamped);

      const idealCamOffsetX = Math.sin(this.player.yaw) * horizDist;
      const idealCamOffsetZ = Math.cos(this.player.yaw) * horizDist;

      // Safe bounds clearance from outer cleanroom walls
      const boundX = (this.room.width / 2) - 0.65;
      const boundZ = (this.room.depth / 2) - 0.65;

      let t = 1.0;
      if (idealCamOffsetX > 0.001) {
        t = Math.min(t, (boundX - this.player.pos.x) / idealCamOffsetX);
      } else if (idealCamOffsetX < -0.001) {
        t = Math.min(t, (-boundX - this.player.pos.x) / idealCamOffsetX);
      }
      if (idealCamOffsetZ > 0.001) {
        t = Math.min(t, (boundZ - this.player.pos.z) / idealCamOffsetZ);
      } else if (idealCamOffsetZ < -0.001) {
        t = Math.min(t, (-boundZ - this.player.pos.z) / idealCamOffsetZ);
      }

      // 1. Prevent camera from clipping through Desk 03 (South Wall Station)
      const d3 = this.desk03Box;
      if (d3 && idealCamOffsetZ > 0.001) {
        const safeZ = d3.minZ - 0.45;
        if (this.player.pos.z < safeZ && (this.player.pos.z + idealCamOffsetZ) > safeZ) {
          const testX = this.player.pos.x + idealCamOffsetX;
          if (testX >= d3.minX - 0.45 && testX <= d3.maxX + 0.45) {
            t = Math.min(t, (safeZ - this.player.pos.z) / idealCamOffsetZ);
          }
        }
      }

      const minCamDist = 0.6;
      t = Math.max(minCamDist / Math.max(0.1, horizDist), Math.min(1.0, t));

      const camX = this.player.pos.x + idealCamOffsetX * t;
      const camZ = this.player.pos.z + idealCamOffsetZ * t;
      const camY = Math.max(0.45, this.cameraHeightOffset - vertDist * t);

      this.camera.position.set(camX, camY, camZ);
      // Look forward in player orientation, keeping focus forward without flipping into back walls
      const fwdX = -Math.sin(this.player.yaw);
      const fwdZ = -Math.cos(this.player.yaw);
      this.camera.lookAt(this.player.pos.x + fwdX * 4.0, 1.45, this.player.pos.z + fwdZ * 4.0);
      if (this.localAvatar) this.localAvatar.visible = true;
    } else {
      this.camera.position.set(this.player.pos.x, this.player.height, this.player.pos.z);
      this.camera.rotation.y = this.player.yaw;
      this.camera.rotation.x = this.player.pitch;
      if (this.localAvatar) this.localAvatar.visible = false;
    }

    // Check interaction proximity with desk items and center table
    this.checkInteractiveProximity();

    // Coordinates HUD
    const posHud = document.getElementById('hudCoordinates');
    if (posHud) {
      posHud.textContent = `X: ${this.player.pos.x.toFixed(1)}m | Z: ${this.player.pos.z.toFixed(1)}m`;
    }

    // Broadcast local player movement to multiplayer relay
    if (window.multiplayerManager && window.multiplayerManager.isInRoom) {
      const speed = Math.hypot(this.player.vel.x, this.player.vel.z);
      const isMoving = speed > 0.001 || this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
      window.multiplayerManager.sendMovement({
        name: (window.multiplayerManager && window.multiplayerManager.localPlayerName) || 'Astronaut',
        x: this.player.pos.x,
        y: this.player.pos.y,
        z: this.player.pos.z,
        yaw: this.player.yaw,
        pitch: this.player.pitch,
        isMoving: isMoving
      });
    }
  }

  checkInteractiveProximity() {
    if (!this.camera) return;

    const camPos = this.camera.position;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    let bestItem = null;
    let highestScore = -Infinity;

    for (const [key, item] of Object.entries(this.interactables)) {
      const itemPos = new THREE.Vector3(item.x, item.y || 1.0, item.z);
      const toItem = new THREE.Vector3().subVectors(itemPos, camPos);
      const dist = toItem.length();
      const maxAllowed = item.maxDist || 2.8;

      if (dist <= maxAllowed) {
        toItem.normalize();
        const alignment = forward.dot(toItem); // Cosine of angle between camera aim and object

        // Alignment threshold: player must be looking towards the object cone (alignment > 0.65)
        // For larger objects like Hubble, allow wider angle (alignment > 0.50)
        const threshold = (key === 'hubble') ? 0.50 : 0.65;

        if (alignment > threshold) {
          // Weight alignment heavily so whatever is closest to the crosshair center wins!
          const score = Math.pow(alignment, 3) / (dist * 0.4 + 0.6);
          if (score > highestScore) {
            highestScore = score;
            let itemLabel = item.label;
          if (key === 'hubble') {
            const hasPasscode = typeof window.gameState !== 'undefined' && (
              Object.values(window.gameState.assemblyPasscodes || {}).some(Boolean) ||
              window.gameState.subtask02Complete || window.gameState.subtaskE02Complete || window.gameState.subtaskN02Complete
            );
            itemLabel = hasPasscode 
              ? 'ACCESS HUBBLE SUBSYSTEM ASSEMBLY [PASSCODE AUTHORIZED]' 
              : 'EXAMINE HUBBLE SPACE TELESCOPE [ASSEMBLY LOCKED - FINISH WORKBENCH]';
          }
          bestItem = { type: key, label: itemLabel };
          }
        }
      }
    }

    this.activeInteractable = bestItem;

    const promptEl = document.getElementById('hudInteractionPrompt');
    const labelEl = document.getElementById('interactionPromptLabel');

    if (promptEl && labelEl) {
      if (this.activeInteractable) {
        promptEl.style.display = 'block';
        labelEl.textContent = this.activeInteractable.label;
      } else {
        promptEl.style.display = 'none';
      }
    }
  }

  // --- Animation Loop ---
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    // Auto-detect & spawn connected peer astronauts in multiplayer room
    if (window.multiplayerManager && window.multiplayerManager.isInRoom && window.multiplayerManager.currentRoom) {
      const room = window.multiplayerManager.currentRoom;
      if (room.players && Array.isArray(room.players)) {
        room.players.forEach((p) => {
          if (p.socketId && p.socketId !== window.multiplayerManager.socket?.id) {
            if (!this.remotePlayers.has(p.socketId)) {
              this.addRemotePlayer(p.socketId, p);
            }
          }
        });
      }
      // Broadcast initial spawn position immediately so peers see our avatar at once
      window.multiplayerManager.sendMovement({
        name: window.multiplayerManager.localPlayerName || 'Astronaut',
        x: this.player.pos.x,
        y: this.player.pos.y,
        z: this.player.pos.z,
        yaw: this.player.yaw,
        pitch: this.player.pitch,
        isMoving: false
      });
    }

    const loop = (time) => {
      if (!this.isRunning) return;
      if (this.isPaused) {
        this.animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const delta = Math.min((time - this.lastTime) / 1000, 0.1); // Clamp delta to prevent tunneling
      this.lastTime = time;

      this.updatePhysics(delta);

      // Update Digital Wall Clock every second (Clock.png)
      const currentSec = Math.floor(time / 1000);
      if (currentSec !== this.lastClockSec) {
        this.lastClockSec = currentSec;
        this.updateClockTexture();
      }

      // Animate Hubble Electronics Diagnostic Highlight pulse
      if (this.hubbleElecHighlight) {
        const pulse = 0.5 + Math.sin(time * 0.003) * 0.35;
        if (this.updateMechanicalObjectiveHighlight) {
        this.updateMechanicalObjectiveHighlight(time, delta);
      }
      this.hubbleElecHighlight.traverse((child) => {
          if (child.isMesh && child.material && child.material.wireframe) {
            child.material.opacity = pulse;
          }
        });
      }

      // Smoothly interpolate remote players & billboard nameplates & animate 3D bones
      if (this.remotePlayers && this.remotePlayers.size > 0) {
        for (const [sId, rData] of this.remotePlayers.entries()) {
          if (rData.mesh && rData.targetPos) {
            const prevX = rData.mesh.position.x;
            const prevZ = rData.mesh.position.z;

            rData.mesh.position.lerp(rData.targetPos, 0.22);
            let diffYaw = rData.targetYaw - rData.mesh.rotation.y;
            diffYaw = Math.atan2(Math.sin(diffYaw), Math.cos(diffYaw));
            rData.mesh.rotation.y += diffYaw * 0.22;

            if (rData.nameplate) {
              rData.nameplate.quaternion.copy(this.camera.quaternion);
            }

            // Remote Character Walking Animation
            const speed = Math.hypot(rData.mesh.position.x - prevX, rData.mesh.position.z - prevZ);
            const isMoving = speed > 0.001 || rData.isMoving;

            if (rData.bones && isMoving) {
              rData.walkCycle = (rData.walkCycle || 0) + delta * 9.5;
              const phase = Math.sin(rData.walkCycle);
              const stride = 0.42;
              const b = rData.bones;
              const inits = rData.initialBoneRot || {};

              if (b.leftUpLeg) b.leftUpLeg.rotation.x = (inits['LeftUpLeg']?.x || 0) + phase * stride;
              if (b.rightUpLeg) b.rightUpLeg.rotation.x = (inits['RightUpLeg']?.x || 0) - phase * stride;
              if (b.leftLeg) b.leftLeg.rotation.x = (inits['LeftLeg']?.x || 0) + Math.max(0, -phase) * 0.55;
              if (b.rightLeg) b.rightLeg.rotation.x = (inits['RightLeg']?.x || 0) + Math.max(0, phase) * 0.55;
              if (b.leftArm) b.leftArm.rotation.x = (inits['LeftArm']?.x || 0) - phase * 0.28;
              if (b.rightArm) b.rightArm.rotation.x = (inits['RightArm']?.x || 0) + phase * 0.28;
            } else if (rData.bones) {
              const damp = 0.18;
              const b = rData.bones;
              const inits = rData.initialBoneRot || {};
              if (b.leftUpLeg) b.leftUpLeg.rotation.x += ((inits['LeftUpLeg']?.x || 0) - b.leftUpLeg.rotation.x) * damp;
              if (b.rightUpLeg) b.rightUpLeg.rotation.x += ((inits['RightUpLeg']?.x || 0) - b.rightUpLeg.rotation.x) * damp;
              if (b.leftLeg) b.leftLeg.rotation.x += ((inits['LeftLeg']?.x || 0) - b.leftLeg.rotation.x) * damp;
              if (b.rightLeg) b.rightLeg.rotation.x += ((inits['RightLeg']?.x || 0) - b.rightLeg.rotation.x) * damp;
              if (b.leftArm) b.leftArm.rotation.x += ((inits['LeftArm']?.x || 0) - b.leftArm.rotation.x) * damp;
              if (b.rightArm) b.rightArm.rotation.x += ((inits['RightArm']?.x || 0) - b.rightArm.rotation.x) * damp;
            }

            // Head aim pitch
            if (rData.bones && rData.bones.head && typeof rData.targetPitch === 'number') {
              const initHeadX = rData.initialBoneRot?.['Head'] ? rData.initialBoneRot['Head'].x : 0;
              rData.bones.head.rotation.x = initHeadX - rData.targetPitch * 0.75;
            }
          }
        }
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (document.pointerLockElement === this.renderer?.domElement) {
      document.exitPointerLock();
    }
  }

  pauseSpatialAudio() {
    try {
      const now = this.audioListener?.context?.currentTime || 0;
      if (this.spatialAudioHubbleGain) this.spatialAudioHubbleGain.gain.setValueAtTime(0.00001, now);
      if (this.spatialAudioDesk01Gain) this.spatialAudioDesk01Gain.gain.setValueAtTime(0.00001, now);
      if (this.spatialAudioDesk02Gain) this.spatialAudioDesk02Gain.gain.setValueAtTime(0.00001, now);
      if (this.spatialAudioDesk03Gain) this.spatialAudioDesk03Gain.gain.setValueAtTime(0.00001, now);
    } catch (e) {}
  }

  resumeSpatialAudio() {
    try {
      this.updateSpatialAudioGains();
    } catch (e) {}
  }

  pause() {
    this.isPaused = true;
    this.pauseSpatialAudio();
  }

  resume() {
    this.isPaused = false;
    this.resumeSpatialAudio();
    this.lastTime = performance.now();
  }

  createNorthWallScienceTelemetryScreen() {
    const screenW = 4.8;
    const screenH = 2.6;

    // Bezel Frame (Dark titanium carbon casing)
    const frameGeo = new THREE.BoxGeometry(screenW + 0.22, screenH + 0.22, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 2.35, -6.95);
    this.scene.add(frameMesh);

    // Top Header Plate (NASA GSFC Astrophysics banner)
    const headerCanvas = document.createElement('canvas');
    headerCanvas.width = 1024;
    headerCanvas.height = 96;
    const hctx = headerCanvas.getContext('2d');
    hctx.fillStyle = '#090d16';
    hctx.fillRect(0, 0, 1024, 96);
    hctx.fillStyle = '#0284c7';
    hctx.fillRect(0, 0, 1024, 6);
    hctx.fillStyle = '#38bdf8';
    hctx.font = 'bold 26px monospace';
    hctx.fillText('★ NASA GSFC // ASTROPHYSICS SCIENCE OPERATIONS // HST OPTICAL TELEMETRY ★', 24, 42);
    hctx.fillStyle = '#94a3b8';
    hctx.font = '19px monospace';
    hctx.fillText('DETECTOR: WFPC2 / COSTAR OPTICAL AXIS // TARGET: M100 SPIRAL GALAXY', 24, 74);

    const headerTex = new THREE.CanvasTexture(headerCanvas);
    const headerGeo = new THREE.PlaneGeometry(screenW, 0.24);
    const headerMat = new THREE.MeshBasicMaterial({ map: headerTex });
    const headerMesh = new THREE.Mesh(headerGeo, headerMat);
    headerMesh.position.set(0, 2.35 + (screenH / 2) + 0.08, -6.89);
    this.scene.add(headerMesh);

    // Dedicated Dynamic Canvas for Live Screen
    this.scienceCanvas = document.createElement('canvas');
    this.scienceCanvas.width = 1024;
    this.scienceCanvas.height = 576;
    this.scienceCtx = this.scienceCanvas.getContext('2d');
    this.scienceTexture = new THREE.CanvasTexture(this.scienceCanvas);

    const screenGeo = new THREE.PlaneGeometry(screenW, screenH);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.scienceTexture });
    this.scienceScreenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.scienceScreenMesh.position.set(0, 2.35, -6.89);
    this.scene.add(this.scienceScreenMesh);

    // Load M100 Source Image for drawing
    this.telemetrySourceImg = new Image();
    this.telemetrySourceImg.src = 'assets/images/hubble_m100_telemetry.svg';
    this.telemetrySourceImg.onload = () => {
      this.updateNorthWallScienceScreen(window.getNasaGameState ? window.getNasaGameState() : null);
    };

    // Bottom Interaction Hint Plaque
    const hintCanvas = document.createElement('canvas');
    hintCanvas.width = 512;
    hintCanvas.height = 64;
    const pctx = hintCanvas.getContext('2d');
    pctx.fillStyle = '#0284c7';
    pctx.fillRect(0, 0, 512, 64);
    pctx.fillStyle = '#ffffff';
    pctx.font = 'bold 20px monospace';
    pctx.textAlign = 'center';
    pctx.fillText('[E] INSPECT OPTICAL WAVEFRONT TELEMETRY', 256, 40);

    const hintTex = new THREE.CanvasTexture(hintCanvas);
    const hintGeo = new THREE.PlaneGeometry(2.8, 0.24);
    const hintMat = new THREE.MeshBasicMaterial({ map: hintTex });
    const hintMesh = new THREE.Mesh(hintGeo, hintMat);
    hintMesh.position.set(0, 2.35 - (screenH / 2) - 0.12, -6.89);
    this.scene.add(hintMesh);
  }

  updateNorthWallScienceScreen(gameState) {
    if (!this.scienceCanvas || !this.scienceCtx || !this.scienceTexture) return;
    const ctx = this.scienceCtx;
    const w = this.scienceCanvas.width;
    const h = this.scienceCanvas.height;

    const gs = gameState || (window.getNasaGameState ? window.getNasaGameState() : {});

    // Compute progress factors
    const gyroOk = !!gs.subtask01Complete;
    const sadmOk = !!gs.subtask02Complete;
    const pcbOk = !!gs.subtaskE01Complete;
    const fgsOk = !!gs.subtaskE02Complete;
    const powerOk = !!gs.breakerMasterOn;

    let fwhm = 0.720;
    if (gyroOk) fwhm -= 0.210;
    if (sadmOk) fwhm -= 0.110;
    if (pcbOk) fwhm -= 0.160;
    if (fgsOk) fwhm -= 0.140;
    if (powerOk && gs.telemetryDiagRun) fwhm = 0.052;
    fwhm = Math.max(0.052, fwhm);

    const isNominal = fwhm <= 0.055;

    // 1. Clear background
    ctx.fillStyle = '#02050c';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw source image if loaded
    if (this.telemetrySourceImg && this.telemetrySourceImg.complete && this.telemetrySourceImg.naturalWidth > 0) {
      if (!isNominal) {
        ctx.save();
        const blurAmount = Math.max(1, Math.floor((fwhm - 0.05) * 16));
        ctx.filter = `blur(${blurAmount}px) contrast(120%)`;
        ctx.drawImage(this.telemetrySourceImg, 0, 0, w, h);
        ctx.restore();

        // Spherical aberration halo (defocused primary mirror edge reflection)
        const haloGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 280);
        haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        haloGrad.addColorStop(0.5, 'rgba(244, 63, 94, 0.18)');
        haloGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = haloGrad;
        ctx.fillRect(0, 0, w, h);

        // Gyro jitter displacement if gyros not mounted
        if (!gyroOk) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 6; i++) {
            const rx = 100 + Math.random() * (w - 200);
            const ry = 80 + Math.random() * (h - 160);
            ctx.beginPath();
            ctx.moveTo(rx - 8, ry);
            ctx.lineTo(rx + 8, ry + 2);
            ctx.stroke();
          }
        }

        // DF-224 scanline pixel dropout if damaged PCB
        if (!pcbOk) {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
          for (let y = 0; y < h; y += 8) {
            ctx.fillRect(0, y, w, 2);
          }
        }
      } else {
        ctx.drawImage(this.telemetrySourceImg, 0, 0, w, h);
      }
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 40, w - 80, h - 80);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '24px monospace';
      ctx.fillText('INITIALIZING HST SCIENCE OPTICAL BUS...', 100, h / 2);
    }

    // 3. Telemetry Overlay HUD Banner on Canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, h - 72, w - 40, 54);
    ctx.strokeStyle = isNominal ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, h - 72, w - 40, 54);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = isNominal ? '#10b981' : '#f59e0b';
    ctx.fillText(`FWHM RESOLUTION: ${fwhm.toFixed(3)}″`, 40, h - 38);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#e0f2fe';
    const statusText = isNominal 
      ? 'DIFFRACTION LIMITED [COSTAR / WFPC2 ALIGNED]' 
      : (powerOk ? 'AVIONICS ENERGIZED [CHECK-OUT PENDING]' : 'SPHERICAL ABERRATION DETECTED [REPAIR IN PROGRESS]');
    ctx.fillText(statusText, 380, h - 38);

    ctx.fillStyle = isNominal ? '#10b981' : '#38bdf8';
    ctx.fillText(isNominal ? 'STREHL: 0.88' : 'STREHL: 0.12', w - 180, h - 38);

    this.scienceTexture.needsUpdate = true;
  }

  setupSpatialAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioListener = new THREE.AudioListener();
      this.camera.add(this.audioListener);
      const ctx = this.audioListener.context;

      // 1. Hubble Central Positional Audio (Flywheel & Cryo-Loop Hum: 120Hz)
      this.hubbleSound = new THREE.PositionalAudio(this.audioListener);
      this.hubbleSound.setRefDistance(2.5);
      this.hubbleSound.setMaxDistance(14.0);
      this.hubbleSound.setRolloffFactor(1.1);

      const oscH = ctx.createOscillator();
      const gainH = ctx.createGain();
      oscH.type = 'triangle';
      oscH.frequency.setValueAtTime(120, ctx.currentTime);
      gainH.gain.setValueAtTime(0.04, ctx.currentTime);
      oscH.connect(gainH);
      this.hubbleSound.setNodeSource(gainH);
      oscH.start();

      const hubbleAnchor = new THREE.Object3D();
      hubbleAnchor.position.set(0, 1.8, 0);
      this.scene.add(hubbleAnchor);
      hubbleAnchor.add(this.hubbleSound);
      this.spatialAudioHubbleGain = gainH;

      // 2. Desk 01 (East Wall - Mechanical Drive Chatter: 340Hz)
      this.desk01Sound = new THREE.PositionalAudio(this.audioListener);
      this.desk01Sound.setRefDistance(2.2);
      this.desk01Sound.setMaxDistance(12.0);
      this.desk01Sound.setRolloffFactor(1.2);

      const oscD1 = ctx.createOscillator();
      const gainD1 = ctx.createGain();
      oscD1.type = 'sine';
      oscD1.frequency.setValueAtTime(340, ctx.currentTime);
      gainD1.gain.setValueAtTime(0.025, ctx.currentTime);
      oscD1.connect(gainD1);
      this.desk01Sound.setNodeSource(gainD1);
      oscD1.start();

      const d1Anchor = new THREE.Object3D();
      d1Anchor.position.set(4.8, 1.0, 0);
      this.scene.add(d1Anchor);
      d1Anchor.add(this.desk01Sound);
      this.spatialAudioDesk01Gain = gainD1;

      // 3. Desk 02 (West Wall - DC Transformer & CRT Oscillator: 60Hz + 1200Hz harmonic)
      this.desk02Sound = new THREE.PositionalAudio(this.audioListener);
      this.desk02Sound.setRefDistance(2.2);
      this.desk02Sound.setMaxDistance(12.0);
      this.desk02Sound.setRolloffFactor(1.2);

      const oscD2 = ctx.createOscillator();
      const gainD2 = ctx.createGain();
      oscD2.type = 'sawtooth';
      oscD2.frequency.setValueAtTime(60, ctx.currentTime);
      gainD2.gain.setValueAtTime(0.02, ctx.currentTime);
      oscD2.connect(gainD2);
      this.desk02Sound.setNodeSource(gainD2);
      oscD2.start();

      const d2Anchor = new THREE.Object3D();
      d2Anchor.position.set(-4.8, 1.0, 0);
      this.scene.add(d2Anchor);
      d2Anchor.add(this.desk02Sound);
      this.spatialAudioDesk02Gain = gainD2;

      // 4. Desk 03 (South Wall - High Frequency RF Telemetry Carrier & Data Pulse: 800Hz / 2400Hz)
      this.desk03Sound = new THREE.PositionalAudio(this.audioListener);
      this.desk03Sound.setRefDistance(2.2);
      this.desk03Sound.setMaxDistance(12.0);
      this.desk03Sound.setRolloffFactor(1.2);

      const oscD3 = ctx.createOscillator();
      const gainD3 = ctx.createGain();
      oscD3.type = 'sine';
      oscD3.frequency.setValueAtTime(800, ctx.currentTime);
      gainD3.gain.setValueAtTime(0.015, ctx.currentTime);
      oscD3.connect(gainD3);
      this.desk03Sound.setNodeSource(gainD3);
      oscD3.start();

      const d3Anchor = new THREE.Object3D();
      d3Anchor.position.set(0, 1.0, 6.2);
      this.scene.add(d3Anchor);
      d3Anchor.add(this.desk03Sound);
      this.spatialAudioDesk03Gain = gainD3;

      this.updateSpatialAudioGains();
    } catch (e) {
      console.warn('Spatial Audio initialization notice:', e);
    }
  }

  updateSpatialAudioGains() {
    const isMuted = window.isNasaAudioMuted ? window.isNasaAudioMuted() : false;
    const factor = isMuted ? 0.00001 : 1.0;
    const now = this.audioListener?.context?.currentTime || 0;

    if (this.spatialAudioHubbleGain && this.audioListener?.context) {
      this.spatialAudioHubbleGain.gain.setValueAtTime(0.04 * factor, now);
    }
    if (this.spatialAudioDesk01Gain && this.audioListener?.context) {
      this.spatialAudioDesk01Gain.gain.setValueAtTime(0.025 * factor, now);
    }
    if (this.spatialAudioDesk02Gain && this.audioListener?.context) {
      this.spatialAudioDesk02Gain.gain.setValueAtTime(0.02 * factor, now);
    }
    if (this.spatialAudioDesk03Gain && this.audioListener?.context) {
      this.spatialAudioDesk03Gain.gain.setValueAtTime(0.015 * factor, now);
    }
  }

  updateMissionVisuals(gameState) {
    if (typeof this.updateNorthWallScienceScreen === 'function') {
      this.updateNorthWallScienceScreen(gameState);
    }
    if (typeof this.updateSpatialAudioGains === 'function') {
      this.updateSpatialAudioGains();
    }
  }

  onWindowResize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // =========================================================================
  // MULTIPLAYER CLEANROOM ENGINEER AVATARS & STATE SYNCHRONIZATION
  // Matches reference: Industrial worker in safety vest & hard hat
  // =========================================================================
  createWorkerAvatarMesh(playerName) {
    const avatarGroup = new THREE.Group();

    // 1. Shaders & Materials
    const darkSuitMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark navy / charcoal industrial work suit
      roughness: 0.65,
      metalness: 0.15
    });

    const highVisVestMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Fluorescent Safety Orange
      roughness: 0.45,
      metalness: 0.1,
      emissive: 0xea580c,
      emissiveIntensity: 0.2
    });

    const reflectiveStripeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // High-visibility retro-reflective silver
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.35
    });

    const hardHatMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Industrial Safety Yellow Hard Hat
      roughness: 0.3,
      metalness: 0.2
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373, // Neck & head skin tone
      roughness: 0.7
    });

    const eyeShieldMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Protective cleanroom safety glasses / visor
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });

    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723, // Rugged leather safety work boots
      roughness: 0.85,
      metalness: 0.1
    });

    const badgeMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7 // NASA GSFC ID Badge
    });

    // --- Torso & Inner Work Shirt ---
    const torsoGeo = new THREE.BoxGeometry(0.42, 0.58, 0.26);
    const torsoMesh = new THREE.Mesh(torsoGeo, darkSuitMat);
    torsoMesh.position.set(0, 1.15, 0);
    torsoMesh.castShadow = true;
    avatarGroup.add(torsoMesh);

    // --- High-Vis Safety Vest ---
    const vestGeo = new THREE.BoxGeometry(0.44, 0.50, 0.28);
    const vestMesh = new THREE.Mesh(vestGeo, highVisVestMat);
    vestMesh.position.set(0, 1.18, 0);
    avatarGroup.add(vestMesh);

    // Retro-reflective horizontal stripes (Chest & Waist)
    const stripeChestGeo = new THREE.BoxGeometry(0.448, 0.045, 0.288);
    const stripeChestMesh = new THREE.Mesh(stripeChestGeo, reflectiveStripeMat);
    stripeChestMesh.position.set(0, 1.26, 0);
    avatarGroup.add(stripeChestMesh);

    const stripeWaistGeo = new THREE.BoxGeometry(0.448, 0.045, 0.288);
    const stripeWaistMesh = new THREE.Mesh(stripeWaistGeo, reflectiveStripeMat);
    stripeWaistMesh.position.set(0, 1.04, 0);
    avatarGroup.add(stripeWaistMesh);

    // Retro-reflective vertical shoulder straps
    [-0.12, 0.12].forEach((sx) => {
      const strapGeo = new THREE.BoxGeometry(0.055, 0.49, 0.288);
      const strapMesh = new THREE.Mesh(strapGeo, reflectiveStripeMat);
      strapMesh.position.set(sx, 1.18, 0);
      avatarGroup.add(strapMesh);
    });

    // NASA Security ID Badge on left chest
    const badgeGeo = new THREE.PlaneGeometry(0.08, 0.10);
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(-0.12, 1.28, 0.146);
    avatarGroup.add(badgeMesh);

    // --- Head, Neck & Protective Hard Hat ---
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.10, 12);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 1.50, 0);
    avatarGroup.add(neckMesh);

    const headGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 1.60, 0);
    avatarGroup.add(headMesh);

    // Hard Hat Crown (Dome)
    const hatGeo = new THREE.SphereGeometry(0.20, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const hatMesh = new THREE.Mesh(hatGeo, hardHatMat);
    hatMesh.position.set(0, 1.62, 0);
    avatarGroup.add(hatMesh);

    // Hard Hat Brim
    const brimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.025, 24);
    const brimMesh = new THREE.Mesh(brimGeo, hardHatMat);
    brimMesh.position.set(0, 1.62, 0);
    avatarGroup.add(brimMesh);

    // Hard Hat Reinforced Center Ridge
    const crestGeo = new THREE.BoxGeometry(0.045, 0.045, 0.36);
    const crestMesh = new THREE.Mesh(crestGeo, hardHatMat);
    crestMesh.position.set(0, 1.72, 0);
    avatarGroup.add(crestMesh);

    // Safety Goggles / Protective Visor
    const visorGeo = new THREE.BoxGeometry(0.24, 0.065, 0.10);
    const visorMesh = new THREE.Mesh(visorGeo, eyeShieldMat);
    visorMesh.position.set(0, 1.62, 0.12);
    avatarGroup.add(visorMesh);

    // --- Arms, Work Gloves & High-Vis Bands ---
    const armGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.46, 12);
    const gloveGeo = new THREE.BoxGeometry(0.085, 0.10, 0.09);
    const sleeveBandGeo = new THREE.CylinderGeometry(0.076, 0.076, 0.07, 12);

    [-0.27, 0.27].forEach((ax) => {
      // Upper arm / sleeve
      const arm = new THREE.Mesh(armGeo, darkSuitMat);
      arm.position.set(ax, 1.15, 0);
      avatarGroup.add(arm);

      // Fluorescent high-vis armband
      const sBand = new THREE.Mesh(sleeveBandGeo, highVisVestMat);
      sBand.position.set(ax, 1.22, 0);
      avatarGroup.add(sBand);

      // Heavy duty work gloves
      const glove = new THREE.Mesh(gloveGeo, hardHatMat);
      glove.position.set(ax, 0.88, 0);
      avatarGroup.add(glove);
    });

    // --- Trousers & Industrial Work Boots ---
    const legGeo = new THREE.CylinderGeometry(0.085, 0.09, 0.72, 12);
    const bootGeo = new THREE.BoxGeometry(0.13, 0.12, 0.26);
    const soleGeo = new THREE.BoxGeometry(0.14, 0.03, 0.27);
    const soleMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    [-0.13, 0.13].forEach((lx) => {
      // Trouser leg
      const leg = new THREE.Mesh(legGeo, darkSuitMat);
      leg.position.set(lx, 0.44, 0);
      avatarGroup.add(leg);

      // Boot body
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(lx, 0.07, 0.04);
      avatarGroup.add(boot);

      // Rugged rubber sole
      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.set(lx, 0.015, 0.04);
      avatarGroup.add(sole);
    });

    // --- Floating 3D Billboard Nameplate Canvas ---
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 512;
    nameCanvas.height = 128;
    const nctx = nameCanvas.getContext('2d');

    // Nameplate background card
    nctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
    nctx.fillRect(8, 16, 512 - 16, 128 - 32);

    // Glowing border
    nctx.strokeStyle = '#f97316';
    nctx.lineWidth = 4;
    nctx.strokeRect(8, 16, 512 - 16, 128 - 32);

    // Cleanroom tech label
    nctx.fillStyle = '#94a3b8';
    nctx.font = 'bold 20px "Tektur", monospace';
    nctx.textAlign = 'center';
    nctx.fillText('GSFC CLEANROOM ENGINEER', 256, 44);

    // Player name
    nctx.fillStyle = '#00f0ff';
    nctx.font = 'bold 42px "Tektur", monospace';
    nctx.fillText(playerName || 'Engineer', 256, 92);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameGeo = new THREE.PlaneGeometry(0.92, 0.23);
    const nameMat = new THREE.MeshBasicMaterial({ map: nameTex, transparent: true });
    const nameMesh = new THREE.Mesh(nameGeo, nameMat);
    nameMesh.position.set(0, 2.08, 0);
    avatarGroup.add(nameMesh);

    return {
      avatarGroup,
      nameplate: nameMesh
    };
  }

  // --- Mechanical Department Step-By-Step Objective Waypoint & Beacon ---
  createMechanicalObjectiveHighlight() {
    if (this.mechObjectiveGroup) return;

    const group = new THREE.Group();
    group.position.set(4.8, 1.15, -0.2); // Start at Desk 01 Terminal

    // Pulsing cyan-gold ring beacon
    const ringGeo = new THREE.RingGeometry(0.35, 0.45, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.02;
    group.add(ringMesh);

    // Glowing waypoint diamond beacon
    const diamondGeo = new THREE.OctahedronGeometry(0.12);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.95
    });
    const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
    diamondMesh.position.y = 0.48;
    group.add(diamondMesh);

    // Floating billboard objective text tag
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    this.mechTagCanvas = canvas;
    this.mechTagCtx = canvas.getContext('2d');
    this.mechTagTex = new THREE.CanvasTexture(canvas);

    const tagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.32),
      new THREE.MeshBasicMaterial({ map: this.mechTagTex, transparent: true })
    );
    tagMesh.position.y = 0.78;
    group.add(tagMesh);

    this.scene.add(group);
    this.mechObjectiveGroup = group;
    this.mechDiamondMesh = diamondMesh;
    this.mechRingMesh = ringMesh;
    this.mechTagMesh = tagMesh;
    this.lastMechStep = -1;
  }

  updateMechanicalObjectiveHighlight(time, delta) {
    if (!this.mechObjectiveGroup) return;

    const gs = window.getNasaGameState ? window.getNasaGameState() : null;
    if (!gs) return;

    const isElec = gs.activeDept === 'electronic';
    const isNet = gs.activeDept === 'network';
    let stepKey = '';
    let targetX = 0, targetY = 1.15, targetZ = 0;
    let label = '';
    let sub = '';
    let colorHex = '#38bdf8';
    let ringColor = 0x38bdf8;

    if (isNet) {
      // --- NETWORK & COMMUNICATION DEPARTMENT (DESK 03 - SOUTH WALL) OBJECTIVES ---
      const bothDone = gs.subtaskN01Complete && gs.subtaskN02Complete;
      const tdrssLinked = gs.tdrssLinkEstablished;
      const commDiag = gs.commTelemetryRun;

      if (!gs.netCheckedIn) {
        stepKey = 'net_1';
        targetX = -0.6; targetY = 1.15; targetZ = 5.9;
        label = '[DESK 03] STEP 1: CHECK IN';
        sub = 'Press [E] at Desk 03 Network Terminal';
        colorHex = '#10b981';
        ringColor = 0x10b981;
      } else if (!bothDone) {
        stepKey = 'net_2';
        targetX = 1.8; targetY = 1.15; targetZ = 5.9;
        label = '[DESK 03] STEP 2: WORKBENCH';
        sub = 'Press [E] to realign HGA & splice fiber bus';
        colorHex = '#06b6d4';
        ringColor = 0x06b6d4;
      } else if (!tdrssLinked) {
        stepKey = 'net_3';
        targetX = -0.6; targetY = 1.15; targetZ = 5.9;
        label = '[DESK 03] STEP 3: TDRSS LINK';
        sub = 'Press [E] at Terminal & establish TDRSS link';
        colorHex = '#38bdf8';
        ringColor = 0x38bdf8;
      } else if (!commDiag) {
        stepKey = 'net_4';
        targetX = -0.6; targetY = 1.15; targetZ = 5.9;
        label = '[DESK 03] STEP 4: TELEMETRY DOWNLINK';
        sub = 'Run 4.096 Mbps Science Downlink Check';
        colorHex = '#fbbf24';
        ringColor = 0xfbbf24;
      } else {
        stepKey = 'net_5';
        targetX = -0.6; targetY = 1.15; targetZ = 5.9;
        label = '[DESK 03] STEP 5: CHECK OUT';
        sub = 'Click Check-Out to certify Network Shift!';
        colorHex = '#10b981';
        ringColor = 0x10b981;
      }
    } else if (isElec) {
      // --- ELECTRONIC DEPARTMENT (DESK 02) OBJECTIVES ---
      const bothDone = gs.subtaskE01Complete && gs.subtaskE02Complete;
      const breakerOn = gs.breakerMasterOn || (window.electronicsWorkbenchInstance?.breakerMasterOn);
      const diagRun = gs.telemetryDiagRun;

      if (!gs.elecCheckedIn) {
        stepKey = 'elec_1';
        targetX = -4.8; targetY = 1.15; targetZ = -0.2;
        label = '[DESK 02] STEP 1: CHECK IN';
        sub = 'Press [E] at Desk 02 Electrical Terminal';
        colorHex = '#a855f7';
        ringColor = 0xa855f7;
      } else if (!bothDone) {
        stepKey = 'elec_2';
        targetX = -4.8; targetY = 1.15; targetZ = 1.8;
        label = '[DESK 02] STEP 2: WORKBENCH';
        sub = 'Press [E] to repair DF-224 & calibrate FGS';
        colorHex = '#06b6d4';
        ringColor = 0x06b6d4;
      } else if (!breakerOn) {
        stepKey = 'elec_3';
        targetX = -4.8; targetY = 1.15; targetZ = 1.8;
        label = '[DESK 02] STEP 3: ENERGIZE BREAKER';
        sub = 'Flip safety cover & toggle Breaker switch ON';
        colorHex = '#f59e0b';
        ringColor = 0xf59e0b;
      } else if (!diagRun) {
        stepKey = 'elec_4';
        targetX = -4.8; targetY = 1.15; targetZ = -0.2;
        label = '[DESK 02] STEP 4: RUN TELEMETRY';
        sub = 'Press [E] at Terminal & Run Telemetry Diagnostic';
        colorHex = '#38bdf8';
        ringColor = 0x38bdf8;
      } else {
        stepKey = 'elec_5';
        targetX = -4.8; targetY = 1.15; targetZ = -0.2;
        label = '[DESK 02] STEP 5: CHECK OUT';
        sub = 'Click Check-Out to complete Electronic Shift!';
        colorHex = '#10b981';
        ringColor = 0x10b981;
      }
    } else {
      // --- MECHANICAL DEPARTMENT (DESK 01) OBJECTIVES ---
      const hasTools = !!(gs.purchased?.['pgt'] || gs.inventory?.['pgt']);
      if (!gs.isCheckedIn) {
        stepKey = 'mech_1';
        targetX = 4.8; targetY = 1.15; targetZ = -0.2;
        label = '[DESK 01] STEP 1: CHECK IN';
        sub = 'Press [E] at Desk 01 Computer Terminal';
        colorHex = '#38bdf8';
        ringColor = 0x38bdf8;
      } else if (!hasTools) {
        stepKey = 'mech_2';
        targetX = 4.8; targetY = 1.12; targetZ = -1.3;
        label = '[DESK 01] STEP 2: PROCURE TOOLS';
        sub = 'Press [E] at Desk 01 Laptop Marketplace';
        colorHex = '#fbbf24';
        ringColor = 0xfbbf24;
      } else if (!gs.subtask01Complete || !gs.subtask02Complete) {
        stepKey = 'mech_3';
        targetX = 0.0; targetY = 1.45; targetZ = 0.0;
        label = '[DESK 01] STEP 3: SERVICE HUBBLE';
        sub = 'Approach Hubble Table & repair components';
        colorHex = '#f59e0b';
        ringColor = 0xf59e0b;
      } else {
        stepKey = 'mech_4';
        targetX = 4.8; targetY = 1.15; targetZ = -0.2;
        label = '[DESK 01] STEP 4: CHECK OUT';
        sub = 'Return to Desk 01 Terminal to archive logs';
        colorHex = '#10b981';
        ringColor = 0x10b981;
      }
    }

    // Re-draw text badge on step transition
    if (this.lastMechStep !== stepKey) {
      this.lastMechStep = stepKey;
      const ctx = this.mechTagCtx;
      ctx.clearRect(0, 0, 512, 128);

      ctx.fillStyle = 'rgba(10, 15, 30, 0.92)';
      ctx.roundRect ? ctx.roundRect(10, 10, 492, 108, 14) : ctx.fillRect(10, 10, 492, 108);
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = colorHex;
      ctx.stroke();

      ctx.fillStyle = colorHex;
      ctx.font = 'bold 28px "Tektur", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, 256, 50);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 18px "Tektur", sans-serif';
      ctx.fillText(sub, 256, 90);

      this.mechTagTex.needsUpdate = true;
      if (this.mechRingMesh) this.mechRingMesh.material.color.setHex(ringColor);
      if (this.mechDiamondMesh) this.mechDiamondMesh.material.color.setHex(ringColor);
    }

    // Smoothly lerp beacon position
    this.mechObjectiveGroup.position.x += (targetX - this.mechObjectiveGroup.position.x) * 0.1;
    this.mechObjectiveGroup.position.y += (targetY - this.mechObjectiveGroup.position.y) * 0.1;
    this.mechObjectiveGroup.position.z += (targetZ - this.mechObjectiveGroup.position.z) * 0.1;

    // Pulse animation
    const pulse = 0.75 + Math.sin(time * 0.005) * 0.25;
    if (this.mechDiamondMesh) {
      this.mechDiamondMesh.rotation.y += delta * 1.5;
      this.mechDiamondMesh.rotation.x = Math.sin(time * 0.003) * 0.3;
      this.mechDiamondMesh.scale.set(pulse, pulse, pulse);
    }
    if (this.mechTagMesh) {
      this.mechTagMesh.quaternion.copy(this.camera.quaternion);
    }
  }

  // --- Real 3D Humanoid Character Avatar for Remote Players ---
  createRealisticRemoteAvatar(socketId, pData, rData, retries = 0) {
    if (rData && rData.disposed) return;
    const gltfLoaderClass = window.THREE?.GLTFLoader || THREE.GLTFLoader;
    if (typeof gltfLoaderClass === 'undefined' || (!window.AVATAR_GLB_DATA && retries < 80)) {
      setTimeout(() => this.createRealisticRemoteAvatar(socketId, pData, rData, retries + 1), 100);
      return;
    }

    // Determine avatar preset (boy_1, boy_2, girl_1, girl_2)
    let avatarId = pData.avatarId;
    if (!avatarId && window.AvatarSystem) {
      const localId = (window.gameState && window.gameState.localAvatarId) || 'girl_1';
      avatarId = window.AvatarSystem.assignAvatarForPeer([localId]);
    }
    const preset = window.AvatarSystem ? window.AvatarSystem.getPreset(avatarId) : {
      role: 'GSFC CLEANROOM ASTRONAUT',
      badgeColor: '#38bdf8',
      accentColor: '#38bdf8',
      suitTrimColor: 0x0284c7,
      modelType: 'female'
    };
    rData.avatarId = preset.id;
    rData.preset = preset;

    // 1. Floating Billboard Nameplate styled with preset colors
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 512;
    nameCanvas.height = 128;
    const nctx = nameCanvas.getContext('2d');
    nctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    nctx.roundRect ? nctx.roundRect(16, 16, 480, 96, 16) : nctx.fillRect(16, 16, 480, 96);
    nctx.fill();
    nctx.lineWidth = 4;
    nctx.strokeStyle = preset.accentColor || '#38bdf8';
    nctx.stroke();

    nctx.fillStyle = preset.badgeColor || '#94a3b8';
    nctx.font = 'bold 20px "Tektur", monospace';
    nctx.textAlign = 'center';
    nctx.fillText(preset.role || 'GSFC CLEANROOM ASTRONAUT', 256, 46);

    nctx.fillStyle = preset.accentColor || '#38bdf8';
    nctx.font = 'bold 36px "Tektur", monospace';
    nctx.fillText(pData.name || preset.defaultName || 'Remote Astronaut', 256, 90);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameGeo = new THREE.PlaneGeometry(0.92, 0.23);
    const nameMat = new THREE.MeshBasicMaterial({ map: nameTex, transparent: true });
    const nameMesh = new THREE.Mesh(nameGeo, nameMat);
    nameMesh.position.set(0, 2.05, 0);

    const loader = new gltfLoaderClass();
    const onParsed = (gltf) => {
      if (rData.disposed) return;
      const model = gltf.scene;
      model.scale.set(1.0, 1.0, 1.0);
      const bones = {};
      const inits = {};

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = false;
          if (child.material) {
            child.material = child.material.clone();
            if (preset.suitTrimColor && (child.name.includes('Top') || child.name.includes('Headwear') || child.name.includes('Bottom'))) {
              child.material.emissive = new THREE.Color(preset.suitTrimColor);
              child.material.emissiveIntensity = 0.24;
            }
          }
        }
        if (child.isBone) {
          const name = child.name;
          if (name === 'Head') bones.head = child;
          else if (name === 'Neck') bones.neck = child;
          else if (name === 'LeftUpLeg') bones.leftUpLeg = child;
          else if (name === 'RightUpLeg') bones.rightUpLeg = child;
          else if (name === 'LeftLeg') bones.leftLeg = child;
          else if (name === 'RightLeg') bones.rightLeg = child;
          else if (name === 'LeftArm') bones.leftArm = child;
          else if (name === 'RightArm') bones.rightArm = child;
          else if (name === 'Hips') bones.hips = child;
          inits[name] = child.rotation.clone();
        }
      });

      if (this.scene && rData.mesh && rData.mesh !== model) {
        this.scene.remove(rData.mesh);
      }
      model.add(nameMesh);
      model.position.copy(rData.targetPos || new THREE.Vector3(pData.x || 0, 0, pData.z || 4.5));
      model.rotation.y = (rData.targetYaw || 0) + Math.PI;

      if (this.scene) {
        this.scene.add(model);
      }
      rData.mesh = model;
      rData.bones = bones;
      rData.initialBoneRot = inits;
      rData.nameplate = nameMesh;
      console.log(`[3D FACILITY] Spawned ${preset.gender.toUpperCase()} Avatar (${preset.id} - ${preset.role}) for ${pData.name} (${socketId})`);
    };

    if (window.AvatarSystem) {
      window.AvatarSystem.loadModelForPreset(preset, loader, onParsed, (err) => {
        console.warn('Failed parsing remote 3D avatar:', err);
      });
    } else {
      loader.load('3D-assets/nancy-wheeler/source/64de1345c603b299c004f2d6.glb', onParsed);
    }
  }

  addRemotePlayer(socketId, pData) {
    if (this.remotePlayers.has(socketId)) {
      this.removeRemotePlayer(socketId);
    }

    const spawnX = typeof pData.x === 'number' ? pData.x : 0;
    const spawnZ = typeof pData.z === 'number' ? pData.z : 4.5;
    const spawnYaw = typeof pData.yaw === 'number' ? pData.yaw : 0;

    // Immediately instantiate procedural worker avatar so peer is instantly visible on frame 1
    let initialMesh = null;
    let initialNameplate = null;
    try {
      const res = this.createWorkerAvatarMesh(pData.name || 'Remote Astronaut');
      initialMesh = res.avatarGroup;
      initialNameplate = res.nameplate;
      initialMesh.position.set(spawnX, 0, spawnZ);
      initialMesh.rotation.y = spawnYaw + Math.PI;
      if (this.scene) {
        this.scene.add(initialMesh);
      }
    } catch (e) {
      console.warn('[3D FACILITY] Procedural peer spawn fallback:', e);
    }

    const rData = {
      name: pData.name || 'Remote Astronaut',
      socketId: socketId,
      disposed: false,
      mesh: initialMesh,
      nameplate: initialNameplate,
      bones: null,
      initialBoneRot: null,
      targetPos: new THREE.Vector3(spawnX, 0, spawnZ),
      targetYaw: spawnYaw,
      targetPitch: pData.pitch || 0,
      walkCycle: 0,
      isMoving: false
    };

    this.remotePlayers.set(socketId, rData);
    this.createRealisticRemoteAvatar(socketId, pData, rData);
  }

  updateRemotePlayer(socketId, posData) {
    let rData = this.remotePlayers.get(socketId);
    if (!rData) {
      // Auto-spawn remote player on first packet reception if not spawned yet
      this.addRemotePlayer(socketId, {
        name: posData.name || 'Remote Astronaut',
        x: posData.x || 0,
        z: posData.z || 4.5,
        yaw: posData.yaw || 0
      });
      rData = this.remotePlayers.get(socketId);
      if (!rData) return;
    }

    if (rData.targetPos) {
      rData.targetPos.set(posData.x, 0, posData.z);
    }
    if (typeof posData.yaw === 'number') {
      rData.targetYaw = posData.yaw + Math.PI;
    }
    if (typeof posData.pitch === 'number') {
      rData.targetPitch = posData.pitch;
    }
    rData.isMoving = !!posData.isMoving;
  }

  removeRemotePlayer(socketId) {
    const rData = this.remotePlayers.get(socketId);
    if (!rData) return;

    rData.disposed = true;
    if (rData.mesh && this.scene) {
      this.scene.remove(rData.mesh);
    }
    this.remotePlayers.delete(socketId);
    console.log(`[3D FACILITY] Removed remote player (${socketId})`);
  }

  clearRemotePlayers() {
    if (!this.remotePlayers) return;
    for (const [sId, rData] of this.remotePlayers.entries()) {
      rData.disposed = true;
      if (rData.mesh && this.scene) {
        this.scene.remove(rData.mesh);
      }
    }
    this.remotePlayers.clear();
  }

  setRemotePlayerSpeaking(socketId, isSpeaking) {
    if (!this.remotePlayers) return;
    const rData = this.remotePlayers.get(socketId);
    if (!rData || !rData.nameplate) return;
    if (rData.nameplate.material) {
      if (isSpeaking) {
        rData.nameplate.material.color.setHex(0x10b981);
      } else {
        rData.nameplate.material.color.setHex(0xffffff);
      }
    }
  }

    // --- Load Local 3D Character Avatar (ReadyPlayerMe glTF Model) ---
  loadLocalAvatarModel(retries = 0) {
    if (!this.localAvatar) {
      try {
        this.spawnProceduralLocalAvatar();
      } catch (e) {
        console.warn('[3D FACILITY] Early procedural local avatar error:', e);
      }
    }

    const gltfLoaderClass = window.THREE?.GLTFLoader || THREE.GLTFLoader;
    const dracoLoaderClass = window.THREE?.DRACOLoader || THREE.DRACOLoader;

    if (typeof gltfLoaderClass === 'undefined') {
      setTimeout(() => this.loadLocalAvatarModel(retries), 80);
      return;
    }

    // Wait for in-memory 3D avatar GLB data (up to 80 retries = 8s)
    if (!window.AVATAR_GLB_DATA && retries < 80) {
      setTimeout(() => this.loadLocalAvatarModel(retries + 1), 100);
      return;
    }

    const loader = new gltfLoaderClass();
    if (typeof dracoLoaderClass !== 'undefined') {
      const dracoLoader = new dracoLoaderClass();
      const dracoPath = (window.location.protocol === 'file:')
        ? 'assets/js/draco/'
        : 'https://www.gstatic.com/draco/versioned/decoders/1.4.3/';
      dracoLoader.setDecoderPath(dracoPath);
      loader.setDRACOLoader(dracoLoader);
    }

    const onModelSuccess = (gltf) => {
      try {
        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Prevent skinned mesh culling
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => {
                  if (m) m.roughness = Math.max(0.3, m.roughness || 0.5);
                });
              } else {
                child.material.roughness = Math.max(0.3, child.material.roughness || 0.5);
              }
            }
          }
          if (child.isBone) {
            const name = child.name;
            if (name === 'Head') this.avatarBones.head = child;
            else if (name === 'Neck') this.avatarBones.neck = child;
            else if (name === 'LeftUpLeg') this.avatarBones.leftUpLeg = child;
            else if (name === 'RightUpLeg') this.avatarBones.rightUpLeg = child;
            else if (name === 'LeftLeg') this.avatarBones.leftLeg = child;
            else if (name === 'RightLeg') this.avatarBones.rightLeg = child;
            else if (name === 'LeftArm') this.avatarBones.leftArm = child;
            else if (name === 'RightArm') this.avatarBones.rightArm = child;
            else if (name === 'Spine' || name === 'Spine1') this.avatarBones.spine = child;
            else if (name === 'Hips') {
              this.avatarBones.hips = child;
              this.baseHipsY = child.position.y;
            }
            this.initialBoneRot[name] = child.rotation.clone();
          }
        });

        // Remove old or procedural avatar if present
        if (this.localAvatar && this.scene) {
          this.scene.remove(this.localAvatar);
        }

        this.localAvatar = model;
        this.localAvatar.position.set(this.player.pos.x, 0, this.player.pos.z);
        this.localAvatar.rotation.y = this.player.yaw + Math.PI;
        this.scene.add(this.localAvatar);
        console.log('[3D FACILITY] 3D Character Avatar loaded successfully!');
        this.updateCameraViewButtonUI();
      } catch (err) {
        console.error('[3D FACILITY] onModelSuccess error:', err);
      }
    };

    // Helper: decode base64 data to ArrayBuffer
    const parseBase64Data = (dataUri) => {
      try {
        if (!dataUri) return null;
        if (typeof window !== 'undefined') {
          if (!window.__CACHED_AVATAR_BUFFERS) window.__CACHED_AVATAR_BUFFERS = {};
          if (window.__CACHED_AVATAR_BUFFERS[dataUri]) {
            return window.__CACHED_AVATAR_BUFFERS[dataUri].slice(0);
          }
        }
        const base64Index = dataUri.indexOf('base64,');
        if (base64Index === -1) return null;
        const b64 = dataUri.substring(base64Index + 7);
        const binStr = window.atob(b64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
        if (typeof window !== 'undefined') {
          window.__CACHED_AVATAR_BUFFERS[dataUri] = bytes.buffer;
        }
        return bytes.buffer.slice(0);
      } catch (e) {
        console.warn('[3D FACILITY] Base64 decode failed:', e);
        return null;
      }
    };

    const localId = (window.gameState && window.gameState.localAvatarId) || 'boy_1';
    const preset = window.AvatarSystem ? window.AvatarSystem.getPreset(localId) : {
      id: 'boy_1', gender: 'male', role: 'GSFC FLIGHT COMMANDER', modelType: 'male', suitTrimColor: 0x0284c7
    };
    this.localAvatarPreset = preset;

    if (window.AvatarSystem) {
      window.AvatarSystem.loadModelForPreset(preset, loader, onModelSuccess, (err) => {
        console.warn('[3D FACILITY] Avatar load failed, falling back to network URLs:', err);
        this.loadAvatarFromNetwork(loader, onModelSuccess);
      });
      return;
    }

    // Fallback if AvatarSystem is undefined
    if (window.AVATAR_GLB_DATA) {
      const buffer = parseBase64Data(window.AVATAR_GLB_DATA);
      if (buffer) {
        loader.parse(buffer, '', (gltf) => onModelSuccess(gltf));
        return;
      }
    }
    this.loadAvatarFromNetwork(loader, onModelSuccess);
  }

  loadAvatarFromNetwork(loader, onModelSuccess) {
    const urls = [
      '3D-assets/nancy-wheeler/source/64de1345c603b299c004f2d6.glb',
      '3D-assets/free-avatar-for-iclone/source/Asfandyar.glb'
    ];

    const tryLoad = (idx) => {
      if (idx >= urls.length) {
        console.warn('[3D FACILITY] All avatar URLs failed, using procedural fallback.');
        if (!this.localAvatar) {
          this.spawnProceduralLocalAvatar();
        }
        return;
      }
      loader.load(
        urls[idx],
        (gltf) => onModelSuccess(gltf),
        undefined,
        (err) => {
          console.warn('[3D FACILITY] Failed loading ' + urls[idx] + ':', err);
          tryLoad(idx + 1);
        }
      );
    };

    tryLoad(0);
  }

  spawnProceduralLocalAvatar() {
    const { avatarGroup } = this.createWorkerAvatarMesh('You (Astronaut)');
    this.localAvatar = avatarGroup;
    this.localAvatar.position.set(this.player.pos.x, 0, this.player.pos.z);
    this.localAvatar.rotation.y = this.player.yaw + Math.PI;
    this.scene.add(this.localAvatar);
  }

  // --- View Toggle Controller ---
  toggleCameraMode() {
    this.setCameraMode(this.cameraMode === 'third_person' ? 'first_person' : 'third_person');
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'third_person') {
      this.cameraDistance = Math.max(1.8, this.cameraDistance);
      if (this.localAvatar) this.localAvatar.visible = true;
    } else {
      if (this.localAvatar) this.localAvatar.visible = false;
    }
    this.updateCameraViewButtonUI();
  }

  updateCameraViewButtonUI() {
    const btn = document.getElementById('btnToggleCameraView');
    const label = document.getElementById('btnToggleCameraViewText');
    if (btn) {
      btn.classList.toggle('first-person', this.cameraMode === 'first_person');
    }
    if (label) {
      label.textContent = this.cameraMode === 'third_person' ? '3RD PERSON [V]' : '1ST PERSON [V]';
    }
  }


  // =========================================================================
  // DESK NO. 03 (SOUTH WALL - NETWORK & COMMUNICATION DEPARTMENT)
  // =========================================================================
  createDesk03South() {
    const d = this.desk03Box;
    const width = d.maxX - d.minX; // 5.2m
    const length = d.maxZ - d.minZ; // 1.2m
    const height = d.height; // 0.88m
    const posX = d.minX + width / 2; // 0.0m
    const posZ = d.minZ + length / 2; // 6.2m

    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.35,
      metalness: 0.55
    });

    // Heavy main desktop slab
    const topGeo = new THREE.BoxGeometry(width, 0.08, length);
    const topMesh = new THREE.Mesh(topGeo, deskMat);
    topMesh.position.set(posX, height, posZ);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    this.scene.add(topMesh);

    // Modern chassis legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.75, roughness: 0.25 });
    const legGeo = new THREE.BoxGeometry(0.1, height, length - 0.1);
    const legLeft = new THREE.Mesh(legGeo, legMat);
    legLeft.position.set(d.minX + 0.06, height / 2, posZ);
    legLeft.castShadow = true;
    this.scene.add(legLeft);

    const legRight = new THREE.Mesh(legGeo, legMat);
    legRight.position.set(d.maxX - 0.06, height / 2, posZ);
    legRight.castShadow = true;
    this.scene.add(legRight);

    // Glowing Emerald/Cyan Fiber LED conduit strip along desk edge
    const stripGeo = new THREE.BoxGeometry(width - 0.2, 0.03, 0.03);
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.7
    });
    const stripMesh = new THREE.Mesh(stripGeo, stripMat);
    stripMesh.position.set(posX, height - 0.04, d.minZ + 0.04);
    this.scene.add(stripMesh);

    // South Wall Digital Plaque Signage
    this.createSouthWallDigitalSign(0, 2.3, 6.98);

    // Surface Props (Facing North toward room center)
    const deskY = height + 0.04;
    this.create3DLaptopNet(-1.8, deskY, 6.1);
    this.create3DComputerStationNet(-0.6, deskY, 6.1);
    this.create3DResearchPapersNet(0.6, deskY, 6.1);
    this.create3DCoffeeCup(-2.3, deskY, 6.1);
    this.create3DWorkbenchZoneNet(1.8, deskY, 6.1);

    // --- PHASE 02 NIO PROPS (Desk 03 - Network) ---
    this.create3DDualScreenMonitor(0.2, deskY, 6.4, Math.PI);
    this.create3DPenRackCircular(-1.2, deskY, 6.1);
    this.create3DExamPad(1.2, deskY, 6.1, Math.PI - 0.15);
    this.create3DSpreadPaperFiles(-2.0, deskY, 6.1, Math.PI + 0.2);
    this.create3DStandUpLabChair(-0.6, 0, 4.9, 0);
    this.loadDepartmentStlProp(2.4, deskY + 0.08, 6.1, '3D-assets/Radio dishes.stl', 0.0018, 0x06b6d4, { x: 0, y: Math.PI, z: 0 });

  }

  createSouthWallDigitalSign(posX, posY, posZ) {
    return this.createDepartmentWallText(
      'NETWORK & COMM DEPARTMENT',
      'DESK 03 [SOUTH WALL] // HGA S/KU-BAND & FIBER BUS',
      posX,
      posY,
      posZ,
      Math.PI
    );
  }

  create3DLaptopNet(x, y, z) {
    const group = new THREE.Group();
    const toughMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.35 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });

    // Rugged base chassis
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.30), toughMat);
    base.position.y = 0.01;
    group.add(base);

    // Corner rubber bumpers
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.024, 0.32), accentMat);
    bumper.position.y = 0.01;
    group.add(bumper);

    // Screen (Angled facing North toward viewer standing at Z=5.0)
    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0.02, 0.14);

    const screenLid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.016), toughMat);
    screenLid.position.set(0, 0.14, 0);
    screenGroup.add(screenLid);

    // Screen display (Emerald logistics canvas)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 340);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('GSFC NETWORK LOGISTICS [DESK 03]', 20, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('• RF Pneumatic Torque Wrench', 20, 95);
    ctx.fillText('• Laser Alignment Sight Module', 20, 135);
    ctx.fillText('• Fiber Stripper & Cleaver', 20, 175);
    ctx.fillText('• Gold RF Waveguide Coupler', 20, 215);
    ctx.fillText('• Fusion Splice Sleeve Modules', 20, 255);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('[PRESS E TO OPEN MARKETPLACE]', 20, 310);

    const tex = new THREE.CanvasTexture(canvas);
    const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.24), new THREE.MeshBasicMaterial({ map: tex }));
    screenFace.rotation.y = Math.PI; // Face North
    screenFace.position.set(0, 0.14, -0.01);
    screenGroup.add(screenFace);

    screenGroup.rotation.x = -0.22; // Tilted slightly forward
    group.add(screenGroup);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  create3DComputerStationNet(x, y, z) {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });

    // Dual Flat Monitor Stand
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, 0.25), metalMat);
    standBase.position.y = 0.008;
    group.add(standBase);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 16), metalMat);
    pole.position.set(0, 0.18, 0.05);
    group.add(pole);

    // Left Monitor: TDRSS Orbital Tracking
    const mCanvas1 = document.createElement('canvas');
    mCanvas1.width = 512;
    mCanvas1.height = 320;
    const mctx1 = mCanvas1.getContext('2d');
    mctx1.fillStyle = '#020617';
    mctx1.fillRect(0, 0, 512, 320);
    mctx1.strokeStyle = '#10b981';
    mctx1.lineWidth = 4;
    mctx1.strokeRect(4, 4, 504, 312);
    mctx1.fillStyle = '#10b981';
    mctx1.font = 'bold 22px monospace';
    mctx1.fillText('TDRSS ORBITAL TRACKING // GEO-41°W', 20, 40);
    mctx1.fillStyle = '#38bdf8';
    mctx1.font = '18px monospace';
    mctx1.fillText('HST ELEVATION: 42.8° | AZIMUTH: 184.2°', 20, 85);
    mctx1.fillText('CARRIER FREQUENCY: 15.003 GHz (KU)', 20, 125);
    mctx1.fillText('SIGNAL ATTENUATION: 0.018 dB/km', 20, 165);
    mctx1.fillStyle = '#a7f3d0';
    mctx1.fillText('STATUS: TELEMETRY READY FOR CHECK-IN', 20, 240);
    mctx1.fillStyle = '#065f46';
    mctx1.fillRect(20, 265, 472, 35);
    mctx1.fillStyle = '#ffffff';
    mctx1.font = 'bold 18px monospace';
    mctx1.fillText('[PRESS E TO ACCESS TERMINAL]', 65, 290);

    const mTex1 = new THREE.CanvasTexture(mCanvas1);
    const mon1 = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.30), new THREE.MeshBasicMaterial({ map: mTex1 }));
    mon1.rotation.y = Math.PI - 0.12;
    mon1.position.set(-0.25, 0.28, 0.02);
    group.add(mon1);

    // Right Monitor: High-Rate Science Data Link
    const mCanvas2 = document.createElement('canvas');
    mCanvas2.width = 512;
    mCanvas2.height = 320;
    const mctx2 = mCanvas2.getContext('2d');
    mctx2.fillStyle = '#020617';
    mctx2.fillRect(0, 0, 512, 320);
    mctx2.strokeStyle = '#0284c7';
    mctx2.lineWidth = 4;
    mctx2.strokeRect(4, 4, 504, 312);
    mctx2.fillStyle = '#38bdf8';
    mctx2.font = 'bold 22px monospace';
    mctx2.fillText('HIGH-RATE DATA TRANSMITTER [HRD]', 20, 40);
    mctx2.fillStyle = '#10b981';
    mctx2.font = '18px monospace';
    mctx2.fillText('THROUGHPUT: 4.096 Mbps BURST BUFFER', 20, 85);
    mctx2.fillText('SI-C&DH FIBER BUS: WAITING SPLICING', 20, 125);
    mctx2.fillText('TRANSMITTER TRANSCEIVER: REALIGNING', 20, 165);
    mctx2.fillStyle = '#fbbf24';
    mctx2.fillText('BER: 1.2e-6 [LOCK REQUIREMENT: <1e-8]', 20, 240);

    const mTex2 = new THREE.CanvasTexture(mCanvas2);
    const mon2 = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.30), new THREE.MeshBasicMaterial({ map: mTex2 }));
    mon2.rotation.y = Math.PI + 0.12;
    mon2.position.set(0.25, 0.28, 0.02);
    group.add(mon2);

    // Keyboard & Mouse
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.14), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }));
    kb.position.set(0, 0.006, -0.15);
    group.add(kb);

    const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.09), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 }));
    mouse.position.set(0.28, 0.01, -0.15);
    group.add(mouse);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  create3DResearchPapersNet(x, y, z) {
    const group = new THREE.Group();
    const folderMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.6 }); // Deep emerald technical folder

    const folder = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.44), folderMat);
    folder.position.y = 0.01;
    group.add(folder);

    // White paper label sheet on top
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 320);
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('GSFC TM-93-10492', 16, 32);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('HGA S/KU-BAND REALIGNMENT', 16, 68);
    ctx.fillText('& SI-C&DH FIBER SPLICING', 16, 92);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.fillText('1. Torque RF Coupler: 12 N-m', 16, 140);
    ctx.fillText('2. Laser Target: ±0.5° crosshair', 16, 170);
    ctx.fillText('3. Phase Delta: 0.0° sync lock', 16, 200);
    ctx.fillText('4. Strip & Cleave 90° glass core', 16, 230);
    ctx.fillText('5. Fusion Arc + 3s Oven seal', 16, 260);

    const tex = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.36), new THREE.MeshBasicMaterial({ map: tex }));
    label.rotation.x = -Math.PI / 2;
    label.position.set(0, 0.022, 0);
    group.add(label);

    group.rotation.y = 0.15;
    group.position.set(x, y, z);
    this.scene.add(group);
  }

  create3DWorkbenchZoneNet(x, y, z) {
    const group = new THREE.Group();

    // Dark technical workmat
    const matGeo = new THREE.BoxGeometry(0.95, 0.01, 0.65);
    const matMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4 });
    const matMesh = new THREE.Mesh(matGeo, matMat);
    matMesh.position.y = 0.005;
    group.add(matMesh);

    // Miniature Parabolic Dish Model on test rig
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });

    const dishBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    dishBase.position.set(-0.2, 0.025, 0);
    group.add(dishBase);

    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), goldMat);
    knuckle.position.set(-0.2, 0.07, 0);
    group.add(knuckle);

    const miniDish = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.4), dishMat);
    miniDish.rotation.x = -Math.PI / 2 + 0.3;
    miniDish.position.set(-0.2, 0.12, 0);
    group.add(miniDish);

    // Automated Fusion Splicer Box Prop
    const splicer = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.18), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.4 }));
    splicer.position.set(0.22, 0.065, 0);
    group.add(splicer);

    // Glowing blue inspection LED on splicer
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.8 }));
    led.position.set(0.22, 0.126, 0.05);
    group.add(led);

    group.position.set(x, y, z);
    this.scene.add(group);
  }


  // =========================================================================
  // PHASE 02: NIO DESK REALISM PROPS (Dual Screen, Pen Racks, Exam Pads, Chairs, STL)
  // =========================================================================
  create3DDualScreenMonitor(x, y, z, rotY = 0) {
    const group = new THREE.Group();
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const screenFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });

    // Heavy cast base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.22), darkMat);
    base.position.y = 0.008;
    group.add(base);

    // Center vertical post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.38, 16), darkMat);
    post.position.set(0, 0.19, -0.04);
    group.add(post);

    // Dual monitor crossbar
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.02), darkMat);
    crossbar.position.set(0, 0.32, -0.02);
    group.add(crossbar);

    // Monitor 1 (Left - angled)
    const m1Group = new THREE.Group();
    m1Group.position.set(-0.24, 0.32, 0);
    m1Group.rotation.y = 0.25;
    const m1Body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.016), screenFrameMat);
    m1Group.add(m1Body);
    const m1Screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.20),
      new THREE.MeshBasicMaterial({ color: 0x0369a1 })
    );
    m1Screen.position.z = 0.009;
    m1Group.add(m1Screen);
    group.add(m1Group);

    // Monitor 2 (Right - angled)
    const m2Group = new THREE.Group();
    m2Group.position.set(0.24, 0.32, 0);
    m2Group.rotation.y = -0.25;
    const m2Body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.016), screenFrameMat);
    m2Group.add(m2Body);
    const m2Screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.20),
      new THREE.MeshBasicMaterial({ color: 0x047857 })
    );
    m2Screen.position.z = 0.009;
    m2Group.add(m2Screen);
    group.add(m2Group);

    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);
  }

  create3DPenRackCircular(x, y, z) {
    const group = new THREE.Group();
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.25 });
    
    // Cylindrical pen cup
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.11, 24, 1, true), cupMat);
    cup.position.y = 0.055;
    group.add(cup);
    const cupBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.008, 24), cupMat);
    cupBottom.position.y = 0.004;
    group.add(cupBottom);

    // Colorful pens & markers standing inside
    const penColors = [0x2563eb, 0xdc2626, 0x16a34a, 0x000000, 0xf59e0b];
    penColors.forEach((col, idx) => {
      const pen = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.14, 12),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })
      );
      const angle = (idx / penColors.length) * Math.PI * 2;
      pen.position.set(Math.cos(angle) * 0.02, 0.08, Math.sin(angle) * 0.02);
      pen.rotation.z = (Math.random() - 0.5) * 0.25;
      pen.rotation.x = (Math.random() - 0.5) * 0.25;
      group.add(pen);
    });

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  create3DExamPad(x, y, z, rotY = 0) {
    const group = new THREE.Group();
    // Clipboard board (dark composite wood / acrylic)
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.008, 0.32), boardMat);
    board.position.y = 0.004;
    group.add(board);

    // Top metal clamp
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.016, 0.035), clampMat);
    clamp.position.set(0, 0.014, -0.135);
    group.add(clamp);

    // White paper pad
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.21, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
    );
    paper.rotation.x = -Math.PI / 2;
    paper.position.set(0, 0.009, 0.01);
    group.add(paper);

    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);
  }

  create3DSpreadPaperFiles(x, y, z, rotY = 0) {
    const group = new THREE.Group();
    const paperMat1 = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
    const paperMat2 = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });

    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.30), paperMat1);
    p1.rotation.x = -Math.PI / 2;
    p1.position.set(-0.06, 0.004, 0);
    p1.rotation.z = -0.15;
    group.add(p1);

    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.30), paperMat2);
    p2.rotation.x = -Math.PI / 2;
    p2.position.set(0.08, 0.006, 0.02);
    p2.rotation.z = 0.22;
    group.add(p2);

    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);
  }

  create3DStandUpLabChair(x, y, z, rotY = 0) {
    const group = new THREE.Group();
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const fabricMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });

    // 5-star base
    for (let i = 0; i < 5; i++) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.28), chromeMat);
      const angle = (i / 5) * Math.PI * 2;
      leg.position.set(Math.sin(angle) * 0.14, 0.04, Math.cos(angle) * 0.14);
      leg.rotation.y = angle;
      group.add(leg);
    }

    // Chrome central column / hydraulic piston
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.45, 16), chromeMat);
    post.position.y = 0.26;
    group.add(post);

    // Contoured seat cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.42), fabricMat);
    seat.position.set(0, 0.49, 0);
    group.add(seat);

    // Curved backrest upright spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.02), chromeMat);
    spine.position.set(0, 0.70, 0.20);
    group.add(spine);

    // Backrest cushion
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.28, 0.04), fabricMat);
    back.position.set(0, 0.75, 0.18);
    group.add(back);

    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);
  }

  loadDepartmentStlProp(x, y, z, stlPath, scale = 0.003, color = 0x94a3b8, rot = { x: 0, y: 0, z: 0 }) {
    if (typeof THREE.STLLoader === 'undefined') return;
    const loader = new THREE.STLLoader();
    loader.load(
      stlPath,
      (geo) => {
        geo.center();
        geo.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.8,
          roughness: 0.25
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(scale, scale, scale);
        mesh.position.set(x, y, z);
        mesh.rotation.set(rot.x, rot.y, rot.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
      },
      undefined,
      (err) => {
        console.warn('Could not load department STL prop:', stlPath, err);
      }
    );
  }

}

// Attach to global window object
window.FacilityFPSRoom = FacilityFPSRoom;
