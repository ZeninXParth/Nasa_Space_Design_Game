/**
 * Horizon-X | NASA Space Mission Design Game
 * Milestone M1: Lobby 3D Environment & Spatial Architecture
 * 
 * 3D FPS Room of GSFC Lobby (Hubble Space Telescope Facility Reception)
 * 
 * Key Architectural Dimensions:
 * - Width: 12.0m (X in [-6.0, 6.0])
 * - Depth: 10.0m (Z in [7.0, 17.0])
 * - Height: 4.2m (Y in [0.0, 4.2])
 * 
 * Materials:
 * - Floor: Base #F1FAEE with subtle technical floor grid lines
 * - Ceiling: Base #FAEDCD with two pendant white LED hanging luminaires
 * - Walls: Base #F8F3F0 modern clean matte architectural materials
 * 
 * Environmental Props (11 Procedural Assets from Phase 03 references):
 *  1. Circular desk with research papers (Circular-desk-lobby.jpeg)
 *  2. White leather sofa in reception seating area (Sofa-white-lobby-area.jpeg)
 *  3. Dual air conditioning units on upper West and South walls (Air-conditionor-lobby-room.jpeg)
 *  4. Corner-mounted security camera dome/housings (Security-cam-lobby-area.jpeg)
 *  5. Overhead hanging informational screen (Hanging-screen-on-lobby-area.jpeg)
 *  6. Modern registration desk on East wall (lobby-resistration-mordern-desk.jpeg)
 *  7. Curved ultrawide reception monitor prop on registration desk (Monitor-resistration-desk.jpeg)
 *  8. Gooseneck desktop microphone prop (Microphone-on-restration-desk.jpeg)
 *  9. Security access card terminal prop near South entrance (Key-card-check-machine.jpeg)
 * 10. South-East gateway corridor opening at X in [3.6, 5.4], Z = 7.0 connecting toward cleanroom entrance
 * 11. Double sliding transparent glass door prop (Slide-door-Transparent.jpeg)
 * 
 * Lifecycle Pattern:
 * constructor -> init -> setupLighting -> buildGeometry -> bindEvents -> start -> render -> update -> onResize -> stop -> destroy
 * 
 * Invariants:
 * - Attached globally: window.LobbyFPSRoom = LobbyFPSRoom (AGENTS.md Rule 1)
 */

function getTimestamp() {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

class LobbyFPSRoom {
  constructor(containerId = 'facilityCanvas', options = {}) {
    if (typeof containerId === 'object' && containerId !== null && !containerId.tagName) {
      options = containerId;
      containerId = 'facilityCanvas';
    }

    this.containerId = typeof containerId === 'string' ? containerId : (containerId?.id || 'facilityCanvas');
    this.container = typeof document !== 'undefined'
      ? (typeof containerId === 'string' ? document.getElementById(containerId) : containerId)
      : null;
    this.options = options || {};

    if (typeof window !== 'undefined') {
      window.lobbyRoomInstance = this;
    }

    // 1. Room Dimensions & Spatial Coordinates
    this.room = {
      width: 12.0,   // X: -6.0 to +6.0 (West to East)
      depth: 10.0,   // Z: 7.0 to 17.0 (North doorway to South back wall)
      height: 4.2,   // Y: 0.0 to 4.2 (Floor to Ceiling)
      minX: -6.0,
      maxX: 6.0,
      minZ: 7.0,
      maxZ: 17.0,
      minY: 0.0,
      maxY: 4.2
    };

    // Perimeter boundary cache
    this.perimeter = {
      minX: -6.0,
      maxX: 6.0,
      minZ: 7.0,
      maxZ: 17.0,
      height: 4.2
    };

    // Material Color Specifications
    this.floorColor = (this.options && this.options.floorColor) || '#F1FAEE';
    this.ceilingColor = (this.options && this.options.ceilingColor) || '#FAEDCD';
    this.wallColor = (this.options && this.options.wallColor) || '#F8F3F0';

    // 2. Gateway Corridor Opening (Connecting to Cleanroom, avoiding Desk 03)
    this.gateway = {
      minX: 3.6,
      maxX: 5.4,
      z: 7.0,
      width: 1.8,
      height: 2.8
    };

    // 3. AABB Collision Obstacles
    this.circularDeskBox = {
      name: 'circularDesk',
      minX: -3.55,
      maxX: -1.45,
      minZ: 10.95,
      maxZ: 13.05,
      height: 0.85
    };

    this.sofaBox = {
      name: 'sofa',
      minX: -5.9,
      maxX: -3.9,
      minZ: 10.5,
      maxZ: 13.5,
      height: 0.85
    };

    this.registrationDeskBox = {
      name: 'registrationDesk',
      minX: 3.8,
      maxX: 5.9,
      minZ: 10.2,
      maxZ: 13.8,
      height: 1.15
    };

    this.doorCollisionBox = {
      name: 'slidingDoor',
      minX: 3.6,
      maxX: 5.4,
      minZ: 6.85,
      maxZ: 7.15,
      height: 2.8
    };

    this.obstacles = [
      this.circularDeskBox,
      this.sofaBox,
      this.registrationDeskBox
    ];

    // 4. Player State & Spawn Calculation
    const pIndex = this.options.playerIndex !== undefined ? this.options.playerIndex : 0;
    const pCount = this.options.playerCount !== undefined ? this.options.playerCount : 1;
    const initialSpawn = this.getSpawnPosition(pIndex, pCount);

    this.player = {
      height: 1.7, // eye level in meters
      radius: 0.38, // bounding cylinder radius
      pos: { x: initialSpawn.x, y: initialSpawn.y, z: initialSpawn.z },
      vel: { x: 0, y: 0, z: 0 },
      yaw: initialSpawn.yaw,
      pitch: 0,
      speed: 3.8,
      sprintMult: 1.65,
      turnSpeed: 2.2
    };

    // Camera mode & navigation: Third Person character focus in Multiplayer by default
    const isMultiplayer = typeof window !== 'undefined' && ((window.gameState && window.gameState.isMultiplayer) || (window.multiplayerManager && window.multiplayerManager.isInRoom));
    this.cameraMode = this.options.cameraMode || (isMultiplayer ? 'third_person' : 'first_person');
    this.cameraDistance = 2.4;
    this.cameraHeightOffset = 1.95;
    this.localAvatar = null;
    this.avatarBones = {};
    this.initialBoneRot = {};
    this.walkCycle = 0;
    this.idleCycle = 0;
    this.baseHipsY = 0.95;
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      turnLeft: false,
      turnRight: false,
      sprint: false
    };

    // Interaction targets (3D coordinates + max activation distance)
    this.interactables = {
      monitor_lobby: {
        x: 4.85,
        y: 1.15,
        z: 12.0,
        maxDist: 2.2,
        label: '[E] Register at Reception Terminal'
      },
      keycard_scanner: {
        x: 3.3,
        y: 1.15,
        z: 7.3,
        maxDist: 2.2,
        label: '[E] Scan Keycard to Access Hubble Space Facility'
      }
    };
    this.activeInteractable = null;

    // Door State & Animation
    this.doorOpen = false;
    this.doorProgress = 0.0; // 0.0 = closed, 1.0 = fully open
    this.doorState = 'closed'; // 'closed' | 'opening' | 'open' | 'closing'
    this.doorHoldTimer = 0;
    this.doorCloseTimeout = null;
    this.hasCrossedIntoCleanroom = false;

    // Environmental props references map
    this.props = {};

    // Multiplayer remote astronaut peers in Lobby Lounge
    this.remotePlayers = new Map();

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animId = null;
    this.clock = null;
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = getTimestamp();
    this.boundResize = null;
    this.boundKeyDown = null;
    this.boundKeyUp = null;
    this.boundMouseMove = null;

    if (typeof window !== 'undefined') {
      window.lobbyRoomInstance = this;
    }

    // Initialize if container is available
    if (this.container) {
      this.init();
    } else {
      // In non-DOM/headless environments, build data structures
      this.initHeadless();
    }
  }

  // --- Spawn Position Calculation (Single & Multiplayer Staggered Grid) ---
  getSpawnPosition(playerIndex = 0, playerCount = 1) {
    const N = Math.max(1, playerCount);
    const k = Math.max(0, Math.min(playerIndex, N - 1));
    const spacing = 1.4; // 1.4m lateral spacing
    const x = (k - (N - 1) / 2) * spacing;

    return {
      x: Number(x.toFixed(2)),
      y: 1.7,
      z: 14.5,
      yaw: 0 // Facing North toward registration desk and gateway
    };
  }

  // --- Headless / Data Structure Initialization ---
  initHeadless() {
    const THREE = this.getThree();
    if (!THREE) return;
    this.scene = new THREE.Scene();
    this.setupLighting();
    this.buildGeometry();
  }

  getThree() {
    if (typeof window !== 'undefined' && window.THREE) return window.THREE;
    if (typeof global !== 'undefined' && global.THREE) return global.THREE;
    if (typeof THREE !== 'undefined') return THREE;
    return null;
  }

  // --- Primary Three.js Lifecycle Initialization ---
  init() {
    const THREE = this.getThree();
    if (!THREE) {
      console.warn('LobbyFPSRoom: Three.js library not detected.');
      return;
    }

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF1F5F9);

    const width = this.container?.clientWidth || 1280;
    const height = this.container?.clientHeight || 720;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    this.camera.position.set(this.player.pos.x, this.player.pos.y, this.player.pos.z);
    this.camera.rotation.order = 'YXZ';

    // 2. WebGL Renderer
    if (typeof THREE.WebGLRenderer === 'function') {
      try {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        if (this.renderer.setPixelRatio && typeof window !== 'undefined') {
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        }
        if (this.renderer.shadowMap) {
          this.renderer.shadowMap.enabled = true;
        }
        if (this.container && this.renderer.domElement) {
          this.container.appendChild(this.renderer.domElement);
        }
      } catch (err) {
        console.warn('LobbyFPSRoom: Renderer initialization fallback', err);
      }
    }

    // 3. Lighting Setup
    this.setupLighting();

    // 4. Build 3D Geometry (Floor, Ceiling, Walls, 11 Environmental Props)
    this.buildGeometry();

    // 5. Initialize Local Player Avatar (Third Person Character Focus)
    this.initLocalAvatar();

    // 6. Event Listeners & Controls
    this.bindEvents();
  }

  // --- Lighting Setup ---
  setupLighting() {
    const THREE = this.getThree();
    if (!THREE) return;

    const AmbientLight = THREE.AmbientLight || THREE.Object3D;
    const PointLight = THREE.PointLight || THREE.DirectionalLight || THREE.Object3D;
    const DirectionalLight = THREE.DirectionalLight || THREE.Object3D;

    // Ambient illumination (Cleanroom bright white ambiance)
    this.ambientLight = new AmbientLight(0xffffff, 0.72);
    this.scene.add(this.ambientLight);

    // Main directional illumination
    this.sunLight = new DirectionalLight(0xffffff, 0.65);
    this.sunLight.position.set(3, 4, 12);
    this.scene.add(this.sunLight);

    // Two White LED Hanging Light fixtures (Cleanroom luminaires)
    this.lightPendantLeft = new PointLight(0xffffff, 0.85, 12);
    this.lightPendantLeft.position.set(-2.5, 3.1, 12.0);
    this.scene.add(this.lightPendantLeft);

    this.lightPendantRight = new PointLight(0xffffff, 0.85, 12);
    this.lightPendantRight.position.set(2.5, 3.1, 12.0);
    this.scene.add(this.lightPendantRight);

    // Registration Desk Accent Downlight
    this.deskLight = new PointLight(0xffffff, 0.85, 8);
    this.deskLight.position.set(4.8, 3.2, 12.0);
    this.scene.add(this.deskLight);

    // Security Gateway Status Light
    this.gatewayLight = new PointLight(0x00f0ff, 0.5, 6);
    this.gatewayLight.position.set(4.5, 2.9, 7.2);
    this.scene.add(this.gatewayLight);
  }

  // --- Build Room Architecture & 11 Environmental Props ---
  buildGeometry() {
    this.buildFloor();
    this.buildCeiling();
    this.buildWalls();

    // 11 Specific Phase 03 Environmental Props
    this.buildCircularDesk();      // 1. Circular desk with research papers
    this.buildWhiteSofa();         // 2. White leather sofa in seating area
    this.buildAirConditioners();   // 3. Dual air conditioning units (West & South walls)
    this.buildSecurityCameras();   // 4. Corner-mounted security camera dome/housings
    this.buildHangingScreen();     // 5. Overhead hanging informational screen
    this.buildRegistrationDesk();  // 6. Modern registration desk on East wall
    this.buildRegistrationMonitor();// 7. Curved ultrawide reception monitor prop
    this.buildMicrophone();        // 8. Gooseneck desktop microphone prop
    this.buildKeycardTerminal();   // 9. Security access card terminal prop
    this.buildGatewayOpening();    // 10. South-East gateway corridor opening (Z = 7.0)
    this.buildSlidingDoors();      // 11. Double sliding transparent glass door prop
  }

  // --- 1. Floor (#F1FAEE with subtle grid lines) ---
  buildFloor() {
    const THREE = this.getThree();
    if (!THREE) return;

    const PlaneGeometry = THREE.PlaneGeometry || THREE.BoxGeometry;
    const MeshStandardMaterial = THREE.MeshStandardMaterial || THREE.Object3D;
    const GridHelper = THREE.GridHelper || THREE.Object3D;

    this.floorMaterial = new MeshStandardMaterial({
      color: 0x232832,
      roughness: 0.32,
      metalness: 0.18
    });

    const floorGeo = new PlaneGeometry(this.room.width, this.room.depth);
    this.floorMesh = new THREE.Mesh(floorGeo, this.floorMaterial);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, (this.room.minZ + this.room.maxZ) / 2); // Z = 12.0
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Technical Floor Grid Helper (1.0m spacing)
    if (typeof THREE.GridHelper === 'function') {
      const grid = new GridHelper(12, 10, 0x00A3E0, 0xC4D1E0);
      if (grid.material) {
        grid.material.opacity = 0.25;
        grid.material.transparent = true;
      }
      grid.position.set(0, 0.005, 12.0);
      this.scene.add(grid);
      this.floorGrid = grid;
    }
  }

  // --- 2. Ceiling (#FAEDCD with 2 hanging LED luminaires) ---
  buildCeiling() {
    const THREE = this.getThree();
    if (!THREE) return;

    const PlaneGeometry = THREE.PlaneGeometry || THREE.BoxGeometry;
    const MeshStandardMaterial = THREE.MeshStandardMaterial || THREE.Object3D;

    this.ceilingMaterial = new MeshStandardMaterial({
      color: 0xFAEDCD, // Cleanroom bright architectural ceiling
      roughness: 0.5,
      metalness: 0.05
    });

    const ceilingGeo = new PlaneGeometry(this.room.width, this.room.depth);
    this.ceilingMesh = new THREE.Mesh(ceilingGeo, this.ceilingMaterial);
    this.ceilingMesh.rotation.x = Math.PI / 2;
    this.ceilingMesh.position.set(0, this.room.height, 12.0);
    this.scene.add(this.ceilingMesh);

    // Two Hanging Pendant Light Fixtures (Phase_03/assets_phase03/Led-hangiing-light.jpeg)
    this.hangingLightFixtures = new THREE.Group();
    const positions = [
      { x: -2.5, z: 12.0 },
      { x: 2.5, z: 12.0 }
    ];

    positions.forEach(pos => {
      const fixtureGroup = new THREE.Group();
      fixtureGroup.position.set(pos.x, 0, pos.z);

      // Suspension cable
      const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 8);
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
      const cable = new THREE.Mesh(cableGeo, cableMat);
      cable.position.set(0, 3.7, 0);
      fixtureGroup.add(cable);

      // Bell housing luminaire shade
      const bellGeo = new THREE.CylinderGeometry(0.12, 0.36, 0.32, 16);
      const bellMat = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.6, roughness: 0.3 });
      const bell = new THREE.Mesh(bellGeo, bellMat);
      bell.position.set(0, 3.1, 0);
      fixtureGroup.add(bell);

      // Emissive downward diffuser disc
      const diffuserGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16);
      const diffuserMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.35
      });
      const diffuser = new THREE.Mesh(diffuserGeo, diffuserMat);
      diffuser.position.set(0, 2.94, 0);
      fixtureGroup.add(diffuser);

      this.hangingLightFixtures.add(fixtureGroup);
    });

    this.scene.add(this.hangingLightFixtures);
    this.props.hangingLightFixtures = this.hangingLightFixtures;
  }

  // --- 3. Walls (#F8F3F0 modern clean architectural materials) ---
  buildWalls() {
    const THREE = this.getThree();
    if (!THREE) return;

    const BoxGeometry = THREE.BoxGeometry || THREE.Object3D;
    const MeshStandardMaterial = THREE.MeshStandardMaterial || THREE.Object3D;

    this.wallMaterial = new MeshStandardMaterial({
      color: 0xF8F3F0, // Cleanroom bright architectural white wall
      roughness: 0.55,
      metalness: 0.05
    });

    const H = this.room.height;
    const wallThick = 0.2;

    // West Wall (X = -6.0, Z: 7.0 to 17.0)
    const westWallGeo = new BoxGeometry(wallThick, H, 10.0);
    this.westWall = new THREE.Mesh(westWallGeo, this.wallMaterial);
    this.westWall.position.set(-6.0 - wallThick / 2, H / 2, 12.0);
    this.westWall.receiveShadow = true;
    this.scene.add(this.westWall);

    // East Wall (X = +6.0, Z: 7.0 to 17.0)
    const eastWallGeo = new BoxGeometry(wallThick, H, 10.0);
    this.eastWall = new THREE.Mesh(eastWallGeo, this.wallMaterial);
    this.eastWall.position.set(6.0 + wallThick / 2, H / 2, 12.0);
    this.eastWall.receiveShadow = true;
    this.scene.add(this.eastWall);

    // South Wall / Outer Perimeter (Z = 17.0, X: -6.0 to 6.0)
    const southWallGeo = new BoxGeometry(12.0, H, wallThick);
    this.southWall = new THREE.Mesh(southWallGeo, this.wallMaterial);
    this.southWall.position.set(0, H / 2, 17.0 + wallThick / 2);
    this.southWall.receiveShadow = true;
    this.scene.add(this.southWall);

    // North Wall with Gateway Opening (Z = 7.0)
    // Left segment: X in [-6.0, 3.6] -> width = 9.6m
    const northLeftWidth = 3.6 - (-6.0); // 9.6
    const northLeftGeo = new BoxGeometry(northLeftWidth, H, wallThick);
    this.northLeftWall = new THREE.Mesh(northLeftGeo, this.wallMaterial);
    this.northLeftWall.position.set(-6.0 + northLeftWidth / 2, H / 2, 7.0 - wallThick / 2);
    this.scene.add(this.northLeftWall);

    // Right segment: X in [5.4, 6.0] -> width = 0.6m
    const northRightWidth = 6.0 - 5.4; // 0.6
    const northRightGeo = new BoxGeometry(northRightWidth, H, wallThick);
    this.northRightWall = new THREE.Mesh(northRightGeo, this.wallMaterial);
    this.northRightWall.position.set(5.4 + northRightWidth / 2, H / 2, 7.0 - wallThick / 2);
    this.scene.add(this.northRightWall);

    // Gateway Lintel over opening: X in [3.6, 5.4], Y in [2.8, 4.2] -> height = 1.4m
    const lintelHeight = H - this.gateway.height; // 4.2 - 2.8 = 1.4
    const lintelGeo = new BoxGeometry(this.gateway.width, lintelHeight, wallThick);
    this.northLintel = new THREE.Mesh(lintelGeo, this.wallMaterial);
    this.northLintel.position.set((3.6 + 5.4) / 2, this.gateway.height + lintelHeight / 2, 7.0 - wallThick / 2);
    this.scene.add(this.northLintel);

    // Architectural Trim / Baseboards along floor perimeter
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x014BAA, roughness: 0.35, metalness: 0.3 });
    const bbSouth = new THREE.Mesh(new BoxGeometry(12.0, 0.12, 0.04), baseboardMat);
    bbSouth.position.set(0, 0.06, 16.98);
    this.scene.add(bbSouth);

    const bbWest = new THREE.Mesh(new BoxGeometry(0.04, 0.12, 10.0), baseboardMat);
    bbWest.position.set(-5.98, 0.06, 12.0);
    this.scene.add(bbWest);

    const bbEast = new THREE.Mesh(new BoxGeometry(0.04, 0.12, 10.0), baseboardMat);
    bbEast.position.set(5.98, 0.06, 12.0);
    this.scene.add(bbEast);
  }

  // --- Prop 1: Circular Desk with Research Papers (Circular-desk-lobby.jpeg) ---
  buildCircularDesk() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    group.position.set(-2.5, 0, 12.0);

    // Circular pedestal tabletop
    const topGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.08, 32);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.35, metalness: 0.25 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.72;
    top.castShadow = true;
    group.add(top);

    // Brushed metal pedestal column & heavy base
    const colGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.68, 16);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });
    const col = new THREE.Mesh(colGeo, metalMat);
    col.position.y = 0.34;
    group.add(col);

    const baseGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 24);
    const base = new THREE.Mesh(baseGeo, metalMat);
    base.position.y = 0.02;
    group.add(base);

    // Research Papers & Blueprints scattered on top
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 });
    const blueprintMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });

    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.005, 0.42), paperMat);
    p1.position.set(-0.25, 0.765, 0.15);
    p1.rotation.y = 0.35;
    group.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.006, 0.45), blueprintMat);
    p2.position.set(0.2, 0.766, -0.1);
    p2.rotation.y = -0.55;
    group.add(p2);

    const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.004, 0.38), paperMat);
    p3.position.set(0.05, 0.768, 0.3);
    p3.rotation.y = 0.9;
    group.add(p3);

    this.scene.add(group);
    this.circularDeskProp = group;
    this.props.circularDesk = group;
  }

  // --- Prop 2: White Leather Sofa (Sofa-white-lobby-area.jpeg) ---
  buildWhiteSofa() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    group.position.set(-4.9, 0, 12.0);

    const whiteLeather = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.4,
      metalness: 0.05
    });
    const legMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.9,
      roughness: 0.15
    });

    // Sofa Base Chassis (Length: 2.4m, Depth: 0.9m, Height: 0.36m)
    const baseGeo = new THREE.BoxGeometry(0.85, 0.28, 2.4);
    const baseMesh = new THREE.Mesh(baseGeo, whiteLeather);
    baseMesh.position.y = 0.22;
    group.add(baseMesh);

    // 3 Individual Seat Cushions
    for (let i = 0; i < 3; i++) {
      const zOffset = (i - 1) * 0.75;
      const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.14, 0.72), whiteLeather);
      seatCushion.position.set(0.04, 0.43, zOffset);
      group.add(seatCushion);

      // Backrest Cushion
      const backCushion = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 0.72), whiteLeather);
      backCushion.position.set(-0.32, 0.68, zOffset);
      group.add(backCushion);
    }

    // Armrests on both sides
    const armrestGeo = new THREE.BoxGeometry(0.88, 0.32, 0.16);
    const armLeft = new THREE.Mesh(armrestGeo, whiteLeather);
    armLeft.position.set(0.02, 0.48, -1.2);
    group.add(armLeft);

    const armRight = new THREE.Mesh(armrestGeo, whiteLeather);
    armRight.position.set(0.02, 0.48, 1.2);
    group.add(armRight);

    // Brushed Chrome Block Legs
    const legGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const legPositions = [
      { x: -0.35, z: -1.15 },
      { x: 0.35, z: -1.15 },
      { x: -0.35, z: 1.15 },
      { x: 0.35, z: 1.15 }
    ];
    legPositions.forEach(lp => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lp.x, 0.04, lp.z);
      group.add(leg);
    });

    this.scene.add(group);
    this.sofaProp = group;
    this.props.sofa = group;
  }

  // --- Prop 3: Dual Air Conditioning Units (Air-conditionor-lobby-room.jpeg) ---
  buildAirConditioners() {
    const THREE = this.getThree();
    if (!THREE) return;

    this.airConditioners = [];

    const createACUnit = (posX, posY, posZ, rotY) => {
      const group = new THREE.Group();
      group.position.set(posX, posY, posZ);
      group.rotation.y = rotY;

      // Chassis body
      const acBodyGeo = new THREE.BoxGeometry(1.2, 0.36, 0.26);
      const acMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.1 });
      const acMesh = new THREE.Mesh(acBodyGeo, acMat);
      group.add(acMesh);

      // Louver vent line
      const ventGeo = new THREE.BoxGeometry(1.08, 0.03, 0.02);
      const ventMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.5 });
      const vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(0, -0.12, 0.135);
      group.add(vent);

      // Digital 26°C Display
      const dispGeo = new THREE.BoxGeometry(0.14, 0.08, 0.005);
      const dispMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.85
      });
      const disp = new THREE.Mesh(dispGeo, dispMat);
      disp.position.set(0.42, 0.02, 0.135);
      group.add(disp);

      this.scene.add(group);
      return group;
    };

    // Upper West Wall Unit
    this.airConditionerWestProp = createACUnit(-5.86, 3.4, 12.0, Math.PI / 2);
    // Upper South Wall Unit
    this.airConditionerSouthProp = createACUnit(0.0, 3.4, 16.86, Math.PI);

    this.airConditioners.push(this.airConditionerWestProp, this.airConditionerSouthProp);
    this.props.airConditioners = this.airConditioners;
  }

  // --- Prop 4: Corner-Mounted Security Cameras (Security-cam-lobby-area.jpeg) ---
  buildSecurityCameras() {
    const THREE = this.getThree();
    if (!THREE) return;

    this.securityCameras = [];
    const corners = [
      { x: -5.75, z: 7.25, yaw: Math.PI / 4 },    // NW
      { x: 5.75, z: 7.25, yaw: -Math.PI / 4 },   // NE
      { x: -5.75, z: 16.75, yaw: 3 * Math.PI / 4 }, // SW
      { x: 5.75, z: 16.75, yaw: -3 * Math.PI / 4 } // SE
    ];

    corners.forEach((c, idx) => {
      const group = new THREE.Group();
      group.position.set(c.x, 3.75, c.z);
      group.rotation.y = c.yaw;

      const metalMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.25 });

      // Wall Bracket
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.2), metalMat);
      group.add(bracket);

      // Camera body housing
      const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.24, 16);
      const camBody = new THREE.Mesh(bodyGeo, metalMat);
      camBody.rotation.x = Math.PI / 2 - 0.35; // Angled downwards into the lobby
      camBody.position.set(0, -0.06, 0.16);
      group.add(camBody);

      // Black optical glass lens
      const lensGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16);
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2 - 0.35;
      lens.position.set(0, -0.11, 0.28);
      group.add(lens);

      // Blinking / solid status LED
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 1.0
      });
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.015), ledMat);
      led.position.set(0.05, -0.04, 0.24);
      group.add(led);

      this.scene.add(group);
      this.securityCameras.push(group);
    });

    this.props.securityCameras = this.securityCameras;
  }

  // --- Prop 5: Overhead Hanging Informational Screen (Hanging-screen-on-lobby-area.jpeg) ---
  buildHangingScreen() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    group.position.set(0, 2.75, 11.0);

    // Two vertical ceiling suspension cables (from Y=4.2 to Y=2.75)
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
    const cableL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 8), cableMat);
    cableL.position.set(-0.85, 0.725, 0);
    group.add(cableL);

    const cableR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 8), cableMat);
    cableR.position.set(0.85, 0.725, 0);
    group.add(cableR);

    // Screen Housing / Frame (2.2m x 1.25m x 0.08m)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 });
    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.25, 0.08), frameMat);
    group.add(frameMesh);

    // Display Screen Face (Emissive Telemetry & GSFC Status)
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.65,
      roughness: 0.2
    });
    const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.15, 0.01), screenMat);
    screenMesh.position.set(0, 0, 0.045);
    group.add(screenMesh);

    this.scene.add(group);
    this.hangingScreenProp = group;
    this.props.hangingScreen = group;
  }

  // --- Prop 6: Modern Registration Desk on East Wall (lobby-resistration-mordern-desk.jpeg) ---
  buildRegistrationDesk() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    group.position.set(4.85, 0, 12.0);

    // White architectural curved desk body
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.1
    });

    const bodyGeo = new THREE.BoxGeometry(1.1, 1.05, 3.2);
    const bodyMesh = new THREE.Mesh(bodyGeo, deskMat);
    bodyMesh.position.y = 0.525;
    group.add(bodyMesh);

    // Warm Oak wood top counter ledge
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xbb9457,
      roughness: 0.45,
      metalness: 0.15
    });
    const topGeo = new THREE.BoxGeometry(1.2, 0.06, 3.3);
    const topMesh = new THREE.Mesh(topGeo, woodMat);
    topMesh.position.y = 1.08;
    group.add(topMesh);

    // Warm Underglow LED skirt strip (3000K golden underglow)
    const skirtMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.95
    });
    const skirtGeo = new THREE.BoxGeometry(1.14, 0.04, 3.24);
    const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
    skirtMesh.position.y = 0.03;
    group.add(skirtMesh);

    this.scene.add(group);
    this.registrationDeskProp = group;
    this.props.registrationDesk = group;
  }

  // --- Prop 7: Curved Ultrawide Reception Monitor (Monitor-resistration-desk.jpeg) ---
  buildRegistrationMonitor() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    // Positioned in center of registration desk
    group.position.set(4.85, 1.11, 12.0);
    group.rotation.y = -Math.PI / 2; // Facing West toward the lobby floor

    // Monitor stand and base
    const standMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.2 });
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), standMat);
    baseMesh.position.y = 0.01;
    group.add(baseMesh);

    const postMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.06), standMat);
    postMesh.position.set(0, 0.14, -0.06);
    group.add(postMesh);

    // Curved Ultrawide Display Panel (34" aspect ratio)
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
    const panelMesh = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.38, 0.04), panelMat);
    panelMesh.position.set(0, 0.24, 0);
    group.add(panelMesh);

    // Glowing screen face with registration prompt
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85
    });
    const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.005), screenMat);
    screenMesh.position.set(0, 0.24, 0.022);
    group.add(screenMesh);

    this.scene.add(group);
    this.registrationMonitorProp = group;
    this.props.registrationMonitor = group;
  }

  // --- Prop 8: Gooseneck Desktop Microphone (Microphone-on-restration-desk.jpeg) ---
  buildMicrophone() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    // Placed on East registration desk
    group.position.set(4.85, 1.11, 11.2);

    const micMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.5 });

    // Push-to-talk base
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.16), micMat);
    baseMesh.position.y = 0.015;
    group.add(baseMesh);

    // Flexible curved gooseneck
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 8), micMat);
    neckMesh.position.set(0, 0.14, 0);
    neckMesh.rotation.x = -0.25;
    group.add(neckMesh);

    // Foam pop filter head
    const headMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const headMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 12), headMat);
    headMesh.position.set(0, 0.28, -0.04);
    group.add(headMesh);

    this.scene.add(group);
    this.microphoneProp = group;
    this.props.microphone = group;
  }

  // --- Prop 9: Security Access Card Terminal (Key-card-check-machine.jpeg) ---
  buildKeycardTerminal() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    // Placed near the South-East gateway corridor opening (Z = 7.3)
    group.position.set(3.3, 0, 7.3);

    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });

    // Pedestal post
    const postMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 16), darkMat);
    postMesh.position.y = 0.55;
    group.add(postMesh);

    // Angled terminal head housing
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.14), darkMat);
    headMesh.position.set(0, 1.15, 0);
    headMesh.rotation.x = 0.35; // Angled facing the approaching player
    group.add(headMesh);

    // Backlit LCD PIN/Reader Screen
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.7
    });
    const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.005), screenMat);
    screenMesh.position.set(0, 1.22, 0.075);
    screenMesh.rotation.x = 0.35;
    group.add(screenMesh);

    // Status LED indicator (Default red for locked, shifts green upon authorization)
    this.terminalLedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.2
    });
    const ledMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.01, 12), this.terminalLedMat);
    ledMesh.position.set(0.07, 1.28, 0.075);
    ledMesh.rotation.x = 0.35;
    group.add(ledMesh);
    this.terminalLedMesh = ledMesh;

    this.scene.add(group);
    this.keycardTerminalProp = group;
    this.props.keycardTerminal = group;
  }

  // --- Prop 10: South-East Gateway Corridor Opening (X in [3.6, 5.4], Z = 7.0) ---
  buildGatewayOpening() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    group.position.set((3.6 + 5.4) / 2, 0, 7.0);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

    // Gateway casing frame: Left post, right post, and header lintel
    const postGeo = new THREE.BoxGeometry(0.08, this.gateway.height, 0.24);
    const postLeft = new THREE.Mesh(postGeo, frameMat);
    postLeft.position.set(-this.gateway.width / 2 + 0.04, this.gateway.height / 2, 0);
    group.add(postLeft);

    const postRight = new THREE.Mesh(postGeo, frameMat);
    postRight.position.set(this.gateway.width / 2 - 0.04, this.gateway.height / 2, 0);
    group.add(postRight);

    const headerGeo = new THREE.BoxGeometry(this.gateway.width, 0.08, 0.24);
    const headerMesh = new THREE.Mesh(headerGeo, frameMat);
    headerMesh.position.set(0, this.gateway.height - 0.04, 0);
    group.add(headerMesh);

    // Floor metallic threshold guide track
    const trackGeo = new THREE.BoxGeometry(this.gateway.width, 0.015, 0.16);
    const trackMesh = new THREE.Mesh(trackGeo, frameMat);
    trackMesh.position.set(0, 0.008, 0);
    group.add(trackMesh);

    this.scene.add(group);
    this.gatewayCorridorProp = group;
    this.props.gatewayCorridor = group;
  }

  // --- Prop 11: Double Sliding Transparent Glass Door (Slide-door-Transparent.jpeg) ---
  buildSlidingDoors() {
    const THREE = this.getThree();
    if (!THREE) return;

    const group = new THREE.Group();
    group.position.set(0, 0, 7.0);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xd0e8ec,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.85
    });

    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.75,
      roughness: 0.25
    });

    const panelW = this.gateway.width / 2; // 0.9m each panel
    const panelH = this.gateway.height - 0.08; // ~2.72m

    // Left Sliding Panel
    this.doorPanelLeft = new THREE.Group();
    this.doorPanelLeftClosedX = 3.6 + panelW / 2; // 4.05
    this.doorPanelLeftOpenX = 3.6 - panelW / 2 + 0.1; // slides West
    this.doorPanelLeft.position.set(this.doorPanelLeftClosedX, panelH / 2 + 0.02, 0);

    const glassL = new THREE.Mesh(new THREE.BoxGeometry(panelW - 0.04, panelH, 0.03), glassMat);
    this.doorPanelLeft.add(glassL);

    // Aluminum perimeter frame & bronze handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.8, roughness: 0.3 });
    const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.06), handleMat);
    handleL.position.set(panelW / 2 - 0.08, 0, 0);
    this.doorPanelLeft.add(handleL);
    group.add(this.doorPanelLeft);

    // Right Sliding Panel
    this.doorPanelRight = new THREE.Group();
    this.doorPanelRightClosedX = 5.4 - panelW / 2; // 4.95
    this.doorPanelRightOpenX = 5.4 + panelW / 2 - 0.1; // slides East
    this.doorPanelRight.position.set(this.doorPanelRightClosedX, panelH / 2 + 0.02, 0);

    const glassR = new THREE.Mesh(new THREE.BoxGeometry(panelW - 0.04, panelH, 0.03), glassMat);
    this.doorPanelRight.add(glassR);

    const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.06), handleMat);
    handleR.position.set(-panelW / 2 + 0.08, 0, 0);
    this.doorPanelRight.add(handleR);
    group.add(this.doorPanelRight);

    this.scene.add(group);
    this.slidingDoorProp = group;
    this.props.slidingDoor = group;
  }

  // --- Terminal Status LED Control (0x00FF88 Green / 0xFF2222 Red) ---
  setTerminalLedColor(hex) {
    if (this.terminalLedMat) {
      this.terminalLedMat.color.setHex(hex);
      this.terminalLedMat.emissive.setHex(hex);
    }
    this.terminalLedColor = hex;
  }

  // --- Door Sound Synthesizer (Pneumatic Pressure Whoosh) ---
  playPneumaticDoorSound(opening = true) {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = window.nasaAudioContext || new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const bufferSize = Math.floor(ctx.sampleRate * 0.45);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const now = ctx.currentTime;
      if (opening) {
        filter.frequency.setValueAtTime(320, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
      } else {
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(260, now + 0.4);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.45);
    } catch (e) {}
  }

  // --- Door Animation Controls ---
  openDoors(broadcast = true) {
    if (this.doorState === 'open' || this.doorState === 'opening') return;
    this.doorState = 'opening';
    this.doorOpen = true;
    this.setTerminalLedColor(0x00FF88); // Green authorized per M2 spec
    this.playPneumaticDoorSound(true);

    // Auto-close after 5.0 seconds per Worksheet §5.2
    if (this.doorCloseTimeout) {
      clearTimeout(this.doorCloseTimeout);
    }
    this.doorCloseTimeout = setTimeout(() => {
      this.closeDoors(true);
    }, 5000);

    if (broadcast && typeof window !== 'undefined' && window.multiplayerManager?.broadcastSync) {
      window.multiplayerManager.broadcastSync('SYNC_DOOR_TRIGGER', { state: 'open' });
    }
  }

  closeDoors(broadcast = true) {
    if (this.doorState === 'closed' || this.doorState === 'closing') return;
    this.doorState = 'closing';
    this.doorOpen = false;
    this.setTerminalLedColor(0xFF2222); // Red locked per M2 spec
    this.playPneumaticDoorSound(false);

    if (this.doorCloseTimeout) {
      clearTimeout(this.doorCloseTimeout);
      this.doorCloseTimeout = null;
    }

    if (broadcast && typeof window !== 'undefined' && window.multiplayerManager?.broadcastSync) {
      window.multiplayerManager.broadcastSync('SYNC_DOOR_TRIGGER', { state: 'closed' });
    }
  }

  toggleDoors() {
    if (this.doorOpen) this.closeDoors(true);
    else this.openDoors(true);
  }

  // --- Gateway Crossing & Cleanroom Entry Handoff ---
  onCrossCleanroomBoundary() {
    if (this.hasCrossedIntoCleanroom) return;
    this.hasCrossedIntoCleanroom = true;

    // Auto-close door behind player after 1.2s delay
    if (this.doorOpen) {
      if (this.doorCloseTimeout) clearTimeout(this.doorCloseTimeout);
      this.doorCloseTimeout = setTimeout(() => this.closeDoors(true), 1200);
    }

    if (typeof window !== 'undefined') {
      if (window.multiplayerManager?.broadcastSync) {
        window.multiplayerManager.broadcastSync('SYNC_AIRLOCK_TRANSITION', {
          sender: window.multiplayerManager.localPlayerName || 'Astronaut',
          timestamp: Date.now()
        });
      }
      if (window.gameState) {
        window.gameState.hasEnteredFacility = true;
      }
      const evt = (typeof CustomEvent !== 'undefined')
        ? new CustomEvent('cleanroomTransition', {
            detail: {
              x: this.player.pos.x,
              z: this.player.pos.z,
              timestamp: Date.now()
            }
          })
        : { type: 'cleanroomTransition', detail: { x: this.player.pos.x, z: this.player.pos.z, timestamp: Date.now() } };
      window.dispatchEvent(evt);
      if (typeof window.onCleanroomEntered === 'function') {
        window.onCleanroomEntered();
      }
    }
  }

  updateDoors(delta) {
    if (!this.doorPanelLeft || !this.doorPanelRight) return;

    const speed = 1.25; // opening duration ~0.8s
    if (this.doorState === 'opening') {
      this.doorProgress = Math.min(1.0, this.doorProgress + delta * speed);
      if (this.doorProgress >= 1.0) {
        this.doorState = 'open';
      }
    } else if (this.doorState === 'closing') {
      this.doorProgress = Math.max(0.0, this.doorProgress - delta * speed);
      if (this.doorProgress <= 0.0) {
        this.doorState = 'closed';
      }
    }

    // Quintic / smooth interpolation
    const t = this.doorProgress;
    const smoothT = t * t * (3 - 2 * t);

    this.doorPanelLeft.position.x = this.doorPanelLeftClosedX + (this.doorPanelLeftOpenX - this.doorPanelLeftClosedX) * smoothT;
    this.doorPanelRight.position.x = this.doorPanelRightClosedX + (this.doorPanelRightOpenX - this.doorPanelRightClosedX) * smoothT;
  }

  // --- Controls & Event Listeners ---
  bindEvents() {
    if (typeof window === 'undefined') return;

    this.boundKeyDown = (e) => this.onKeyDown(e);
    this.boundKeyUp = (e) => this.onKeyUp(e);
    this.boundResize = () => this.onResize();

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('resize', this.boundResize);

    // Pointer Lock change listener to hide/show click prompt
    this.boundPointerLockChange = () => {
      const lockPrompt = document.getElementById('hudLockPrompt');
      const canvas = this.renderer?.domElement;
      if (typeof document !== 'undefined' && document.pointerLockElement === canvas) {
        this.isLocked = true;
        if (lockPrompt) lockPrompt.style.opacity = '0';
      } else {
        this.isLocked = false;
        if (lockPrompt && !this.isMouseDown) lockPrompt.style.opacity = '1';
      }
    };
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);

    // Mouse Drag & 360 Look support (works both with pointer lock AND drag-to-look)
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    if (this.renderer?.domElement) {
      const canvas = this.renderer.domElement;

      this.boundCanvasClick = () => {
        const anyModalOpen = document.querySelector('.facility-modal-backdrop:not(.hidden)');
        if (!anyModalOpen && canvas.requestPointerLock) {
          try { canvas.requestPointerLock(); } catch (e) {}
        }
      };
      canvas.addEventListener('click', this.boundCanvasClick);

      this.boundMouseDown = (e) => {
        const anyModalOpen = document.querySelector('.facility-modal-backdrop:not(.hidden)');
        if (anyModalOpen) return;
        this.isMouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        const lockPrompt = document.getElementById('hudLockPrompt');
        if (lockPrompt) lockPrompt.style.opacity = '0';
      };
      canvas.addEventListener('mousedown', this.boundMouseDown);

      this.boundMouseUp = () => {
        this.isMouseDown = false;
        if (typeof document !== 'undefined' && document.pointerLockElement !== canvas) {
          const lockPrompt = document.getElementById('hudLockPrompt');
          if (lockPrompt) lockPrompt.style.opacity = '1';
        }
      };
      window.addEventListener('mouseup', this.boundMouseUp);

      this.boundMouseMove = (e) => this.onMouseMove(e);
      window.addEventListener('mousemove', this.boundMouseMove);
    }
  }

  onKeyDown(e) {
    const code = e.code;
    const key = (e.key || '').toLowerCase();
    if (code === 'KeyV' || key === 'v') {
      this.toggleCameraMode();
    }
    if (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup') this.keys.forward = true;
    if (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown') this.keys.backward = true;
    if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft') this.keys.left = true;
    if (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright') this.keys.right = true;
    if (code === 'KeyQ' || key === 'q') this.keys.turnLeft = true;
    if (code === 'KeyE' || key === 'e') {
      this.handleInteractKey();
    }
    if (e.shiftKey || code === 'ShiftLeft' || code === 'ShiftRight') {
      this.keys.sprint = true;
    }
  }

  onKeyUp(e) {
    const code = e.code;
    const key = (e.key || '').toLowerCase();
    if (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup') this.keys.forward = false;
    if (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown') this.keys.backward = false;
    if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft') this.keys.left = false;
    if (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright') this.keys.right = false;
    if (code === 'KeyQ' || key === 'q') this.keys.turnLeft = false;
    if (!e.shiftKey && (code === 'ShiftLeft' || code === 'ShiftRight')) {
      this.keys.sprint = false;
    }
  }

  onMouseMove(e) {
    const baseSens = 0.0022;
    const maxPitch = Math.PI / 2.5;
    const canvas = this.renderer?.domElement;

    if (typeof document !== 'undefined' && document.pointerLockElement === canvas) {
      this.player.yaw -= e.movementX * baseSens;
      this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch - e.movementY * baseSens));
    } else if (this.isMouseDown) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.player.yaw -= dx * baseSens;
      this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch - dy * baseSens));
    }
  }

  handleInteractKey() {
    if (!this.activeInteractable) return;
    const type = this.activeInteractable.type;

    if (type === 'monitor_lobby') {
      if (typeof window !== 'undefined' && typeof window.openLobbyRegistrationModal === 'function') {
        window.openLobbyRegistrationModal();
      }
    } else if (type === 'keycard_scanner') {
      if (typeof window !== 'undefined' && typeof window.verifyKeycardAccess === 'function') {
        window.verifyKeycardAccess();
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lobbyInteract', {
        detail: {
          type: this.activeInteractable.type,
          label: this.activeInteractable.label
        }
      }));
    }
  }

  toggleCameraMode(forcedMode = null) {
    if (forcedMode) {
      this.cameraMode = forcedMode;
    } else {
      this.cameraMode = (this.cameraMode === 'third_person') ? 'first_person' : 'third_person';
    }
    if (this.localAvatar) {
      this.localAvatar.visible = (this.cameraMode === 'third_person');
    }
    const btn = typeof document !== 'undefined' ? document.getElementById('btnToggleCameraView') : null;
    if (btn) {
      btn.classList.toggle('first-person', this.cameraMode === 'first_person');
      btn.title = this.cameraMode === 'third_person' ? 'Toggle Camera Mode [V] (Current: 3rd Person)' : 'Toggle Camera Mode [V] (Current: 1st Person)';
    }
  }

  // --- Collision Detection (Perimeter + Obstacles + Closed Doors) ---
  checkCollision(x, z) {
    const pad = this.player.radius;

    // 1. Perimeter Walls: West, East, South
    if (x < this.room.minX + pad || x > this.room.maxX - pad || z > this.room.maxZ - pad) {
      return true;
    }

    // 2. North Wall Boundary (Z = 7.0)
    if (z < this.room.minZ + pad) {
      // Check if crossing through the South-East gateway opening
      const inGatewayOpening = (x >= this.gateway.minX + pad && x <= this.gateway.maxX - pad);
      if (!inGatewayOpening) {
        return true; // North wall collision
      }

      // Inside gateway opening: check if sliding door is closed
      if (!this.doorOpen && this.doorProgress < 0.75) {
        return true; // Door collision barrier
      }
    }

    // 3. AABB Obstacles (Circular Desk, Sofa, Registration Desk)
    for (const obs of this.obstacles) {
      if (x >= (obs.minX - pad) && x <= (obs.maxX + pad) &&
          z >= (obs.minZ - pad) && z <= (obs.maxZ + pad)) {
        return true;
      }
    }

    return false;
  }

  // --- Movement, Locomotion & Collision Sliding Update ---
  update(delta) {
    const dt = Math.min(delta, 0.1);

    // Keyboard turning
    if (this.keys.turnLeft) this.player.yaw += this.player.turnSpeed * dt;
    if (this.keys.turnRight) this.player.yaw -= this.player.turnSpeed * dt;

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

      const forwardX = -Math.sin(this.player.yaw);
      const forwardZ = -Math.cos(this.player.yaw);
      const rightX = Math.cos(this.player.yaw);
      const rightZ = -Math.sin(this.player.yaw);

      const speed = currentSpeed * dt;
      this.player.vel.x = (forwardX * fwd + rightX * strafe) * speed;
      this.player.vel.z = (forwardZ * fwd + rightZ * strafe) * speed;
    } else {
      this.player.vel.x = 0;
      this.player.vel.z = 0;
    }

    // Axis-separated collision sliding
    const nextX = this.player.pos.x + this.player.vel.x;
    if (!this.checkCollision(nextX, this.player.pos.z)) {
      this.player.pos.x = nextX;
    }

    const nextZ = this.player.pos.z + this.player.vel.z;
    if (!this.checkCollision(this.player.pos.x, nextZ)) {
      this.player.pos.z = nextZ;
    }

    // Check cleanroom boundary crossing (Z <= 6.95 in South-East gateway)
    if (this.player.pos.z <= 6.95 && (this.player.pos.x >= this.gateway.minX && this.player.pos.x <= this.gateway.maxX)) {
      this.onCrossCleanroomBoundary();
    }

    // --- Local Character Avatar Position & Locomotion Animation ---
    if (this.localAvatar) {
      this.localAvatar.position.set(this.player.pos.x, 0, this.player.pos.z);
      this.localAvatar.rotation.y = this.player.yaw + Math.PI;

      // Head & Neck Pitch
      if (this.avatarBones.head) {
        const initHeadX = this.initialBoneRot['Head'] ? this.initialBoneRot['Head'].x : 0;
        this.avatarBones.head.rotation.x = initHeadX - this.player.pitch * 0.75;
      }
      if (this.avatarBones.neck) {
        const initNeckX = this.initialBoneRot['Neck'] ? this.initialBoneRot['Neck'].x : 0;
        this.avatarBones.neck.rotation.x = initNeckX - this.player.pitch * 0.25;
      }

      // Locomotion animations
      const isMoving = len > 0;
      if (isMoving) {
        this.walkCycle += dt * (this.keys.sprint ? 14 : 9.5);
        const stride = this.keys.sprint ? 0.62 : 0.42;
        const phase = Math.sin(this.walkCycle);
        const b = this.avatarBones;
        const inits = this.initialBoneRot;

        if (b.leftUpLeg) b.leftUpLeg.rotation.x = (inits['LeftUpLeg']?.x || 0) + phase * stride;
        if (b.rightUpLeg) b.rightUpLeg.rotation.x = (inits['RightUpLeg']?.x || 0) - phase * stride;
        if (b.leftLeg) b.leftLeg.rotation.x = (inits['LeftLeg']?.x || 0) + Math.max(0, -phase) * 0.55;
        if (b.rightLeg) b.rightLeg.rotation.x = (inits['RightLeg']?.x || 0) + Math.max(0, phase) * 0.55;

        const armStride = this.keys.sprint ? 0.45 : 0.28;
        if (b.leftArm) b.leftArm.rotation.x = (inits['LeftArm']?.x || 0) - phase * armStride;
        if (b.rightArm) b.rightArm.rotation.x = (inits['RightArm']?.x || 0) + phase * armStride;
        if (b.hips) b.hips.position.y = this.baseHipsY + Math.abs(Math.sin(this.walkCycle * 2)) * 0.025;
      } else {
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
      }
    }

    // Sync camera position & orientation (Third Person character focus vs First Person)
    if (this.camera) {
      if (this.cameraMode === 'third_person') {
        const pitchClamped = Math.max(-0.62, Math.min(0.65, this.player.pitch));
        const horizDist = this.cameraDistance * Math.cos(pitchClamped);
        const vertDist = this.cameraDistance * Math.sin(pitchClamped);

        const idealCamOffsetX = Math.sin(this.player.yaw) * horizDist;
        const idealCamOffsetZ = Math.cos(this.player.yaw) * horizDist;

        // Smooth camera ray collision zoom against room bounds [-5.5, 5.5] and [7.4, 16.6]
        let t = 1.0;
        if (idealCamOffsetX > 0.001) {
          t = Math.min(t, (5.5 - this.player.pos.x) / idealCamOffsetX);
        } else if (idealCamOffsetX < -0.001) {
          t = Math.min(t, (-5.5 - this.player.pos.x) / idealCamOffsetX);
        }
        if (idealCamOffsetZ > 0.001) {
          t = Math.min(t, (16.6 - this.player.pos.z) / idealCamOffsetZ);
        } else if (idealCamOffsetZ < -0.001) {
          t = Math.min(t, (7.4 - this.player.pos.z) / idealCamOffsetZ);
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
    }

    // Update door slide animation
    this.updateDoors(dt);

    // Proximity raycast / interaction checks
    this.checkInteractions();

    // Broadcast local player movement in Lobby
    if (typeof window !== 'undefined' && window.multiplayerManager && window.multiplayerManager.isInRoom) {
      const isMoving = len > 0;
      window.multiplayerManager.sendMovement({
        name: window.multiplayerManager.localPlayerName || 'Astronaut',
        x: this.player.pos.x,
        y: this.player.pos.y || 0,
        z: this.player.pos.z,
        yaw: this.player.yaw,
        pitch: this.player.pitch,
        isMoving: isMoving,
        inLobby: true,
        avatarId: (typeof window !== 'undefined' && window.gameState && window.gameState.localAvatarId) || 'boy_1'
      });
    }

    // Update remote players (interpolation, walking animation & billboard nameplates)
    this.updateRemotePlayers(dt);
  }

  // --- Interactable Proximity Check ---
  checkInteractions() {
    let closest = null;
    let minDist = Infinity;

    for (const [key, item] of Object.entries(this.interactables)) {
      const d = Math.hypot(this.player.pos.x - item.x, this.player.pos.z - item.z);
      if (d <= item.maxDist && d < minDist) {
        minDist = d;
        closest = { type: key, label: item.label, dist: d };
      }
    }

    this.activeInteractable = closest;
    if (typeof document !== 'undefined') {
      const promptEl = document.getElementById('facilityInteractPrompt') || document.getElementById('lobbyInteractPrompt');
      const labelEl = document.getElementById('facilityInteractLabel') || document.getElementById('lobbyInteractLabel') || document.getElementById('interactionPromptLabel');
      if (promptEl && labelEl) {
        if (closest) {
          promptEl.style.display = 'block';
          labelEl.textContent = closest.label;
        } else {
          promptEl.style.display = 'none';
        }
      }
    }
  }

  // --- Render Frame ---
  render() {
    if (!this.isRunning) return;
    this.animId = requestAnimationFrame(() => this.render());

    const now = getTimestamp();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (!this.isPaused) {
      this.update(delta);
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // --- Animation Loop Start ---
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = getTimestamp();

    // Auto-detect & spawn connected peer astronauts in multiplayer room
    if (typeof window !== 'undefined' && window.multiplayerManager && window.multiplayerManager.isInRoom && window.multiplayerManager.currentRoom) {
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
        y: this.player.pos.y || 0,
        z: this.player.pos.z,
        yaw: this.player.yaw,
        pitch: this.player.pitch,
        isMoving: false,
        inLobby: true,
        avatarId: (window.gameState && window.gameState.localAvatarId) || 'boy_1'
      });
    }

    this.render();
  }

  // --- Resize Handler ---
  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    if (this.camera.updateProjectionMatrix) {
      this.camera.updateProjectionMatrix();
    }
    if (this.renderer.setSize) {
      this.renderer.setSize(w, h);
    }
  }

  // --- Stop Animation Loop ---
  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (typeof document !== 'undefined' && typeof document.exitPointerLock === 'function' && document.pointerLockElement === this.renderer?.domElement) {
      document.exitPointerLock();
    }
  }

  // --- Clean Teardown & Destruction ---
  // --- Remote Player Management for Multiplayer Lobby ---
  addRemotePlayer(socketId, pData) {
    if (this.remotePlayers.has(socketId)) {
      this.removeRemotePlayer(socketId);
    }

    const spawnX = typeof pData.x === 'number' ? pData.x : 1.8;
    const spawnZ = typeof pData.z === 'number' ? pData.z : 12.0;
    const spawnYaw = typeof pData.yaw === 'number' ? pData.yaw : 0;

    let initialMesh = null;
    let initialNameplate = null;
    try {
      const res = this.createWorkerAvatarMesh(pData.name || 'Remote Astronaut');
      if (res && res.avatarGroup) {
        initialMesh = res.avatarGroup;
        initialNameplate = res.nameplate;
        initialMesh.position.set(spawnX, 0, spawnZ);
        initialMesh.rotation.y = spawnYaw + Math.PI;
        if (this.scene) {
          this.scene.add(initialMesh);
        }
      }
    } catch (e) {
      console.warn('[3D LOBBY] Procedural peer spawn fallback:', e);
    }

    const THREE = this.getThree();
    const rData = {
      name: pData.name || 'Remote Astronaut',
      socketId: socketId,
      disposed: false,
      mesh: initialMesh,
      nameplate: initialNameplate,
      bones: null,
      initialBoneRot: null,
      targetPos: (THREE && THREE.Vector3) ? new THREE.Vector3(spawnX, 0, spawnZ) : { x: spawnX, y: 0, z: spawnZ },
      targetYaw: spawnYaw,
      targetPitch: pData.pitch || 0,
      walkCycle: 0,
      isMoving: false
    };

    this.remotePlayers.set(socketId, rData);
    this.createRealisticRemoteAvatar(socketId, pData, rData);
    if (typeof window !== 'undefined' && typeof window.updateLobbyWaitingState === 'function') {
      window.updateLobbyWaitingState();
    }
  }

  updateRemotePlayer(socketId, posData) {
    let rData = this.remotePlayers.get(socketId);
    if (!rData) {
      this.addRemotePlayer(socketId, {
        name: posData.name || 'Remote Astronaut',
        x: posData.x || 1.8,
        z: posData.z || 12.0,
        yaw: posData.yaw || 0
      });
      rData = this.remotePlayers.get(socketId);
      if (!rData) return;
    }

    if (rData.targetPos && typeof rData.targetPos.set === 'function') {
      rData.targetPos.set(posData.x, 0, posData.z);
    } else if (rData.targetPos) {
      rData.targetPos.x = posData.x;
      rData.targetPos.z = posData.z;
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
    console.log(`[3D LOBBY] Removed remote player (${socketId})`);
    if (typeof window !== 'undefined' && typeof window.updateLobbyWaitingState === 'function') {
      window.updateLobbyWaitingState();
    }
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

  updateRemotePlayers(delta) {
    if (!this.remotePlayers || this.remotePlayers.size === 0) return;

    for (const [sId, rData] of this.remotePlayers.entries()) {
      if (rData.mesh && rData.targetPos && typeof rData.mesh.position?.lerp === 'function') {
        const prevX = rData.mesh.position.x;
        const prevZ = rData.mesh.position.z;

        rData.mesh.position.lerp(rData.targetPos, 0.22);
        let diffYaw = rData.targetYaw - rData.mesh.rotation.y;
        diffYaw = Math.atan2(Math.sin(diffYaw), Math.cos(diffYaw));
        rData.mesh.rotation.y += diffYaw * 0.22;

        if (rData.nameplate && this.camera) {
          rData.nameplate.quaternion.copy(this.camera.quaternion);
        }

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
        }
      }
    }
  }

  createRealisticRemoteAvatar(socketId, pData, rData, retries = 0) {
    if (rData && rData.disposed) return;
    const gltfLoaderClass = (typeof window !== 'undefined' && window.THREE?.GLTFLoader) || (typeof THREE !== 'undefined' && THREE.GLTFLoader);
    if (typeof gltfLoaderClass === 'undefined' || (typeof window !== 'undefined' && !window.AVATAR_GLB_DATA && retries < 80)) {
      setTimeout(() => this.createRealisticRemoteAvatar(socketId, pData, rData, retries + 1), 100);
      return;
    }

    if (typeof document === 'undefined') return;

    // Determine avatar preset (boy_1, boy_2, girl_1, girl_2)
    let avatarId = pData.avatarId;
    if (!avatarId && typeof window !== 'undefined' && window.AvatarSystem) {
      const localId = (window.gameState && window.gameState.localAvatarId) || 'girl_1';
      avatarId = window.AvatarSystem.assignAvatarForPeer([localId]);
    }
    const preset = (typeof window !== 'undefined' && window.AvatarSystem) ? window.AvatarSystem.getPreset(avatarId) : {
      role: 'GSFC CREW MEMBER',
      badgeColor: '#38bdf8',
      accentColor: '#38bdf8',
      suitTrimColor: 0x0284c7,
      modelType: 'female'
    };
    rData.avatarId = preset.id;
    rData.preset = preset;

    // Floating Nameplate
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 512;
    nameCanvas.height = 128;
    const nctx = nameCanvas.getContext('2d');
    nctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    nctx.roundRect ? nctx.roundRect(16, 16, 480, 96, 16) : nctx.fillRect(16, 16, 480, 96);
    nctx.fill();

    nctx.lineWidth = 4;
    nctx.strokeStyle = preset.accentColor || '#38bdf8';
    nctx.stroke();

    nctx.fillStyle = preset.badgeColor || '#94a3b8';
    nctx.font = 'bold 20px "Tektur", monospace';
    nctx.textAlign = 'center';
    nctx.fillText(preset.role || 'GSFC CREW MEMBER', 256, 46);

    nctx.fillStyle = preset.accentColor || '#38bdf8';
    nctx.font = 'bold 36px "Tektur", monospace';
    nctx.fillText(pData.name || preset.defaultName || 'Remote Astronaut', 256, 90);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameGeo = new THREE.PlaneGeometry(0.92, 0.23);
    const nameMat = new THREE.MeshBasicMaterial({ map: nameTex, transparent: true });
    const nameMesh = new THREE.Mesh(nameGeo, nameMat);
    nameMesh.position.set(0, 2.05, 0);

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
        for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
        if (typeof window !== 'undefined') {
          window.__CACHED_AVATAR_BUFFERS[dataUri] = bytes.buffer;
        }
        return bytes.buffer.slice(0);
      } catch (e) {
        return null;
      }
    };

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
          else if (name === 'LeftUpLeg') bones.leftUpLeg = child;
          else if (name === 'RightUpLeg') bones.rightUpLeg = child;
          else if (name === 'LeftLeg') bones.leftLeg = child;
          else if (name === 'RightLeg') bones.rightLeg = child;
          else if (name === 'LeftArm') bones.leftArm = child;
          else if (name === 'RightArm') bones.rightArm = child;
          inits[name] = child.rotation.clone();
        }
      });

      if (this.scene && rData.mesh && rData.mesh !== model) {
        this.scene.remove(rData.mesh);
      }
      model.add(nameMesh);
      const curPos = rData.targetPos || { x: pData.x || 1.8, y: 0, z: pData.z || 12.0 };
      model.position.set(curPos.x, 0, curPos.z);
      model.rotation.y = (rData.targetYaw || pData.yaw || 0) + Math.PI;

      if (this.scene) {
        this.scene.add(model);
      }
      rData.mesh = model;
      rData.bones = bones;
      rData.initialBoneRot = inits;
      rData.nameplate = nameMesh;
      console.log(`[3D LOBBY] Spawned ${preset.gender ? preset.gender.toUpperCase() : 'REAL'} Character Avatar (${preset.id}) for ${pData.name} (${socketId})`);
    };

    if (typeof window !== 'undefined' && window.AvatarSystem) {
      window.AvatarSystem.loadModelForPreset(preset, loader, onParsed, (err) => {
        console.warn('Failed parsing avatar in lobby:', err);
      });
      return;
    }

    if (typeof window !== 'undefined' && window.AVATAR_GLB_DATA) {
      const buf = parseBase64Data(window.AVATAR_GLB_DATA);
      if (buf) {
        loader.parse(buf, '', onParsed, (err) => console.warn('Failed parsing avatar in lobby:', err));
        return;
      }
    }

    loader.load('3D-assets/nancy-wheeler/source/64de1345c603b299c004f2d6.glb', onParsed);
  }

  // =========================================================================
  // Instant Procedural Worker Avatar for Frame-1 Zero-Delay Multiplayer Rendering
  // =========================================================================
  createWorkerAvatarMesh(playerName) {
    const THREE = this.getThree();
    if (!THREE) return null;

    const avatarGroup = new THREE.Group();

    // 1. Shaders & Materials
    const darkSuitMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.15
    });

    const highVisVestMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.45,
      metalness: 0.1,
      emissive: 0xea580c,
      emissiveIntensity: 0.2
    });

    const reflectiveStripeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.35
    });

    const hardHatMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.3,
      metalness: 0.2
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.7
    });

    const eyeShieldMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });

    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.85,
      metalness: 0.1
    });

    const badgeMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7
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
      const arm = new THREE.Mesh(armGeo, darkSuitMat);
      arm.position.set(ax, 1.15, 0);
      avatarGroup.add(arm);

      const sBand = new THREE.Mesh(sleeveBandGeo, highVisVestMat);
      sBand.position.set(ax, 1.22, 0);
      avatarGroup.add(sBand);

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
      const leg = new THREE.Mesh(legGeo, darkSuitMat);
      leg.position.set(lx, 0.44, 0);
      avatarGroup.add(leg);

      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(lx, 0.07, 0.04);
      avatarGroup.add(boot);

      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.set(lx, 0.015, 0.04);
      avatarGroup.add(sole);
    });

    // --- Floating 3D Billboard Nameplate Canvas ---
    let nameMesh = null;
    if (typeof document !== 'undefined') {
      const nameCanvas = document.createElement('canvas');
      nameCanvas.width = 512;
      nameCanvas.height = 128;
      const nctx = nameCanvas.getContext('2d');

      nctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
      nctx.fillRect(8, 16, 512 - 16, 128 - 32);

      nctx.strokeStyle = '#38bdf8';
      nctx.lineWidth = 4;
      nctx.strokeRect(8, 16, 512 - 16, 128 - 32);

      nctx.fillStyle = '#94a3b8';
      nctx.font = 'bold 20px "Tektur", monospace';
      nctx.textAlign = 'center';
      nctx.fillText('GSFC CREW MEMBER', 256, 44);

      nctx.fillStyle = '#38bdf8';
      nctx.font = 'bold 42px "Tektur", monospace';
      nctx.fillText(playerName || 'Astronaut', 256, 92);

      const nameTex = new THREE.CanvasTexture(nameCanvas);
      const nameGeo = new THREE.PlaneGeometry(0.92, 0.23);
      const nameMat = new THREE.MeshBasicMaterial({ map: nameTex, transparent: true });
      nameMesh = new THREE.Mesh(nameGeo, nameMat);
      nameMesh.position.set(0, 2.08, 0);
      avatarGroup.add(nameMesh);
    }

    return {
      avatarGroup,
      nameplate: nameMesh
    };
  }

  spawnProceduralLocalAvatar() {
    if (this.localAvatar && this.scene) {
      this.scene.remove(this.localAvatar);
    }
    const pName = (typeof window !== 'undefined' && window.multiplayerManager && window.multiplayerManager.localPlayerName) || 'You (Astronaut)';
    const res = this.createWorkerAvatarMesh(pName);
    if (res && res.avatarGroup) {
      this.localAvatar = res.avatarGroup;
      this.localAvatar.position.set(this.player.pos.x, 0, this.player.pos.z);
      this.localAvatar.rotation.y = this.player.yaw + Math.PI;
      this.localAvatar.visible = (this.cameraMode === 'third_person');
      if (this.scene) {
        this.scene.add(this.localAvatar);
      }
    }
  }

  // --- 3D Local Player Avatar Implementation for Third Person View ---
  initLocalAvatar(retries = 0) {
    if (!this.localAvatar) {
      try {
        this.spawnProceduralLocalAvatar();
      } catch (e) {
        console.warn('[3D LOBBY] Early procedural local avatar error:', e);
      }
    }

    const THREE = this.getThree();
    if (!THREE) return;
    const gltfLoaderClass = (typeof window !== 'undefined' && window.THREE?.GLTFLoader) || THREE.GLTFLoader;
    if (typeof gltfLoaderClass === 'undefined' && retries < 40) {
      setTimeout(() => this.initLocalAvatar(retries + 1), 100);
      return;
    }

    const localId = (typeof window !== 'undefined' && window.gameState && window.gameState.localAvatarId) || 'boy_1';
    const preset = (typeof window !== 'undefined' && window.AvatarSystem)
      ? window.AvatarSystem.getPreset(localId)
      : { id: 'boy_1', gender: 'male', role: 'GSFC FLIGHT COMMANDER', modelType: 'male', suitTrimColor: 0x0284c7 };

    const onModelSuccess = (gltf) => {
      try {
        const model = gltf.scene;
        model.scale.set(1.0, 1.0, 1.0);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
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

        if (this.localAvatar && this.scene) {
          this.scene.remove(this.localAvatar);
        }

        this.localAvatar = model;
        this.localAvatar.position.set(this.player.pos.x, 0, this.player.pos.z);
        this.localAvatar.rotation.y = this.player.yaw + Math.PI;
        this.localAvatar.visible = (this.cameraMode === 'third_person');
        if (this.scene) {
          this.scene.add(this.localAvatar);
        }
        console.log('[3D LOBBY] 3D Local Character Avatar loaded successfully!');
      } catch (err) {
        console.error('[3D LOBBY] onModelSuccess error:', err);
      }
    };

    if (typeof gltfLoaderClass !== 'undefined') {
      const loader = new gltfLoaderClass();
      if (typeof window !== 'undefined' && window.AvatarSystem) {
        window.AvatarSystem.loadModelForPreset(preset, loader, onModelSuccess, (err) => {
          this.loadAvatarFromFallback(loader, onModelSuccess);
        });
        return;
      }
      this.loadAvatarFromFallback(loader, onModelSuccess);
    }
  }

  loadAvatarFromFallback(loader, onModelSuccess) {
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
        for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
        if (typeof window !== 'undefined') {
          window.__CACHED_AVATAR_BUFFERS[dataUri] = bytes.buffer;
        }
        return bytes.buffer.slice(0);
      } catch (e) {
        return null;
      }
    };

    if (typeof window !== 'undefined' && window.AVATAR_GLB_DATA) {
      const buf = parseBase64Data(window.AVATAR_GLB_DATA);
      if (buf) {
        loader.parse(buf, '', onModelSuccess, (err) => console.warn('Failed parsing avatar in lobby:', err));
        return;
      }
    }

    loader.load('3D-assets/nancy-wheeler/source/64de1345c603b299c004f2d6.glb', onModelSuccess, undefined, (err) => {
      console.warn('Fallback GLB failed in lobby:', err);
    });
  }

  destroy() {
    this.stop();

    if (this.doorCloseTimeout) {
      clearTimeout(this.doorCloseTimeout);
      this.doorCloseTimeout = null;
    }
    if (typeof window !== 'undefined' && window.lobbyRoomInstance === this) {
      window.lobbyRoomInstance = null;
    }

    if (typeof window !== 'undefined') {
      if (this.boundResize) window.removeEventListener('resize', this.boundResize);
      if (this.boundKeyDown) window.removeEventListener('keydown', this.boundKeyDown);
      if (this.boundKeyUp) window.removeEventListener('keyup', this.boundKeyUp);
      if (this.boundMouseUp) window.removeEventListener('mouseup', this.boundMouseUp);
      if (this.boundMouseMove) window.removeEventListener('mousemove', this.boundMouseMove);
    }

    if (typeof document !== 'undefined' && this.boundPointerLockChange) {
      document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    }

    if (this.renderer?.domElement) {
      if (this.boundCanvasClick) this.renderer.domElement.removeEventListener('click', this.boundCanvasClick);
      if (this.boundMouseDown) this.renderer.domElement.removeEventListener('mousedown', this.boundMouseDown);
    }

    if (this.renderer) {
      if (this.renderer.dispose) {
        try { this.renderer.dispose(); } catch (e) {}
      }
      if (this.renderer.domElement?.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Attach globally per AGENTS.md Rule 1
if (typeof window !== 'undefined') {
  window.LobbyFPSRoom = LobbyFPSRoom;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LobbyFPSRoom };
}
