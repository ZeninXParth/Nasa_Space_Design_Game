/**
 * WORKBENCH 3D: Sub-Task 01 Interactive Assembly Station
 * Precision Alignment & Electronic Mating (Hubble RSU-02 Gyroscope)
 *
 * Implements:
 * - Step 1: Extraction & Tool Setup (PGT Reverse Mode, 4-bolt unbolting, Scrap Bin disposal)
 * - Step 2: Alignment Guide Pin Phase (Connector damage check shake, Pin installation on diagonal holes, Laser tracks)
 * - Step 3: Mounting & Torque Locking (Smooth slide-in, Mating clack sound, 30 N-m circular torque gauge, 4-bolt green checkmarks)
 */

class Workbench3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.onCompleteCallback = options.onComplete || null;

    // State Machine
    this.currentStep = 1; // 1: Unbolt & Scrap, 2: Guide Pins, 3: Mount & Torque
    this.isComplete = false;

    // PGT Wrench State
    this.pgtEquipped = false;
    this.pgtMode = 'REVERSE'; // 'REVERSE' or 'FORWARD'
    this.pgtTorqueSetting = 30.0; // N-m

    // Step 1 State: 4 Bolts unbolted, Gyro scrapped
    this.bolts = [
      { id: 0, pos: [-1.15, 0.28, -0.9], unbolted: false, torqued: false, mesh: null, progress: 0 },
      { id: 1, pos: [1.15, 0.28, -0.9], unbolted: false, torqued: false, mesh: null, progress: 0 },
      { id: 2, pos: [-1.15, 0.28, 0.9], unbolted: false, torqued: false, mesh: null, progress: 0 },
      { id: 3, pos: [1.15, 0.28, 0.9], unbolted: false, torqued: false, mesh: null, progress: 0 }
    ];
    this.damagedGyroScrapped = false;
    this.activeUnboltingIndex = null;
    this.unboltHoldStartTime = 0;

    // Step 2 State: Guide Pins
    this.guidePinsEquipped = false;
    this.guidePinsInstalled = [false, false]; // [diagonal 0: hole 0, diagonal 1: hole 3]
    this.guidePinMeshes = [];
    this.guideTrackLines = [];

    // Step 3 State: New Gyro Mounted & Torqued
    this.newGyroMounted = false;
    this.activeTorqueIndex = null;
    this.torqueHoldStartTime = 0;
    this.currentTorqueVal = 0;
    this.targetTorque = 30.0;
    this.torqueGaugeActive = false;

    // Animation & Shake
    this.shakeTimer = 0;
    this.animatingMeshes = [];

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.interactiveObjects = [];

    // Web Audio Synthesizer
    this.audioCtx = null;
    this.initAudio();

    // DOM UI Elements
    this.ui = {};

    this.init();
  }

  // -------------------------------------------------------------
  // AUDIO SYNTHESIZER (Aerospace Procedural Sounds)
  // -------------------------------------------------------------
  isMuted() {
    if (typeof window.isNasaAudioMuted === 'function') {
      return window.isNasaAudioMuted();
    }
    return false;
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio not supported in Workbench3D", e);
    }

    if (this.container) {
      this.container.addEventListener('pointerdown', () => this.ensureAudio(), { passive: true });
    }
  }

  ensureAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  playMotorSound(isReverse = true) {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isReverse ? 260 : 320, now);
    osc.frequency.linearRampToValueAtTime(isReverse ? 380 : 440, now + 0.3);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playPinScrewSound() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    const now = this.audioCtx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.06;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + i * 120, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  playScrapBinThud() {
    if (!this.audioCtx) return;
    this.ensureAudio();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playErrorBuzz() {
    if (!this.audioCtx) return;
    this.ensureAudio();
    const now = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(110, now);
    osc2.frequency.setValueAtTime(116, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  playMatingClack() {
    if (!this.audioCtx) return;
    this.ensureAudio();
    const now = this.audioCtx.currentTime;

    // Heavy mechanical solid clack
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Electronic mating chime (Gold pin connector handshake)
    setTimeout(() => {
      if (!this.audioCtx) return;
      const t = this.audioCtx.currentTime;
      const c1 = this.audioCtx.createOscillator();
      const c2 = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      c1.type = 'sine';
      c2.type = 'sine';
      c1.frequency.setValueAtTime(587.33, t); // D5
      c2.frequency.setValueAtTime(880.00, t + 0.08); // A5
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      c1.connect(g);
      c2.connect(g);
      g.connect(this.audioCtx.destination);
      c1.start(t);
      c1.stop(t + 0.15);
      c2.start(t + 0.08);
      c2.stop(t + 0.3);
    }, 120);
  }

  playTorqueClick() {
    if (!this.audioCtx) return;
    this.ensureAudio();
    const now = this.audioCtx.currentTime;
    // Calibrated double-click of aerospace torque wrench clutch
    [0, 0.05].forEach((offset) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now + offset);
      osc.frequency.exponentialRampToValueAtTime(500, now + offset + 0.03);
      gain.gain.setValueAtTime(0.22, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.03);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.04);
    });
  }

  playSweetSpotCue() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // High pitch A5 chime
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playVictoryFanfare() {
    if (!this.audioCtx) return;
    this.ensureAudio();
    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.11;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // -------------------------------------------------------------
  // INITIALIZATION & SCENE SETUP
  // -------------------------------------------------------------
  init() {
    if (!this.container) return;

    // Clean up any existing children or ghost overlays to prevent duplicate rendering!
    this.container.innerHTML = '';

    // Build DOM overlays (Task Panel, PGT HUD, Circular Gauge, Feedback Alert)
    this.createDomOverlays();

    // Setup Three.js Scene
    const width = this.container.clientWidth || 980;
    const height = this.container.clientHeight || 560;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06070a);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 5.6, 5.2);
    this.camera.lookAt(0, 0.3, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    // Build 3D Models
    this.setupLighting();
    this.createWorkbenchSurface();
    this.createHubbleBracket();
    this.createDamagedGyro();
    this.createBolts();
    this.createScrapBin();
    this.createReplacementGyro();
    this.createGuidePinsStand();
    this.createInteractiveHighlights();

    // Event Listeners
    this.setupInputEvents();

    // Initial tool verification & UI state
    this.checkRequiredTools();
    this.updateTaskPanel();
    this.updatePgtHudUI();

    // Animation Loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);

    // Resize Handler
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  setupLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xf0f6ff, 1.3);
    dirLight.position.set(4, 9, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 20;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    dirLight.shadow.bias = -0.0008;
    this.scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 0.45);
    blueFill.position.set(-6, 4, -4);
    this.scene.add(blueFill);

    // Cleanroom soft point light over bracket
    this.bracketLight = new THREE.PointLight(0xffffff, 0.8, 10);
    this.bracketLight.position.set(0, 3.2, 0);
    this.scene.add(this.bracketLight);
  }

  // -------------------------------------------------------------
  // 3D PROCEDURAL MODELS
  // -------------------------------------------------------------
  createWorkbenchSurface() {
    // ESD Anti-Static Table with genuine Work-bech-mat texture
    const tableGeo = new THREE.PlaneGeometry(16, 12);
    let tableTex = null;
    if (typeof THREE.TextureLoader !== 'undefined') {
      try {
        const texLoader = new THREE.TextureLoader();
        tableTex = texLoader.load('assets/images/Work-bech-mat.jpeg');
        if (tableTex && typeof THREE.RepeatWrapping !== 'undefined') {
          tableTex.wrapS = THREE.RepeatWrapping;
          tableTex.wrapT = THREE.RepeatWrapping;
          if (tableTex.repeat && tableTex.repeat.set) tableTex.repeat.set(2, 2);
        }
      } catch (e) {
        console.warn('Workbench3D: Mat texture load notice:', e);
      }
    }
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tableTex,
      roughness: 0.85,
      metalness: 0.2
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.rotation.x = -Math.PI / 2;
    tableMesh.position.y = -0.01;
    tableMesh.receiveShadow = true;
    this.scene.add(tableMesh);

    // Subtle Cleanroom Grid Overlay
    const grid = new THREE.GridHelper(14, 28, 0x1e293b, 0x111827);
    grid.position.y = 0;
    this.scene.add(grid);
  }

  createHubbleBracket() {
    this.bracketGroup = new THREE.Group();
    this.bracketGroup.position.set(0, 0, 0);

    // Aluminum alloy horizontal frame
    const baseGeo = new THREE.BoxGeometry(3.6, 0.35, 2.8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.25
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.175;
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    this.bracketGroup.add(baseMesh);

    // Outer mounting chamfered rim
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2
    });
    const rimGeo = new THREE.BoxGeometry(3.75, 0.08, 2.95);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = 0.38;
    this.bracketGroup.add(rimMesh);

    // Recessed central bay cavity (Where the Gyro canister sits)
    const cavityGeo = new THREE.BoxGeometry(2.3, 0.32, 1.8);
    const cavityMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1
    });
    const cavityMesh = new THREE.Mesh(cavityGeo, cavityMat);
    cavityMesh.position.y = 0.22;
    this.bracketGroup.add(cavityMesh);

    // Electrical Connector Receptacle at the bottom center (Gold Pins)
    const connBaseGeo = new THREE.BoxGeometry(1.2, 0.08, 0.6);
    const connMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const connBase = new THREE.Mesh(connBaseGeo, connMat);
    connBase.position.set(0, 0.1, 0);
    this.bracketGroup.add(connBase);

    // 8 Gold mating pins
    const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 12);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.3
    });
    for (let r = -1; r <= 1; r += 2) {
      for (let c = -3; c <= 3; c += 2) {
        const pin = new THREE.Mesh(pinGeo, goldMat);
        pin.position.set(c * 0.12, 0.16, r * 0.14);
        this.bracketGroup.add(pin);
      }
    }

    // 4 Corner Bolt Hole Collars (Silver Bevels)
    const holeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    this.boltHolePositions = [
      new THREE.Vector3(-1.15, 0.38, -0.9),
      new THREE.Vector3(1.15, 0.38, -0.9),
      new THREE.Vector3(-1.15, 0.38, 0.9),
      new THREE.Vector3(1.15, 0.38, 0.9)
    ];

    this.boltHolePositions.forEach((pos, idx) => {
      const collar = new THREE.Mesh(holeGeo, collarMat);
      collar.position.copy(pos);
      collar.userData = { isHoleCollar: true, holeIndex: idx };
      this.bracketGroup.add(collar);
      this.interactiveObjects.push(collar);
    });

    // Stenciled Bay Label
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HST BAY 2 - RSU-02 GYRO RECESS', 256, 55);
    ctx.font = '24px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('CAUTION: FLIGHT ELECTRICAL INTERFACE', 256, 95);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
    const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.25), labelMat);
    labelPlane.position.set(0, 0.22, 1.41);
    this.bracketGroup.add(labelPlane);

    this.scene.add(this.bracketGroup);
  }

  createDamagedGyro() {
    this.damagedGyroGroup = new THREE.Group();
    this.damagedGyroGroup.position.set(0, 0.35, 0);

    // Glowing Red Emissive Material (Damaged RSU-02)
    this.damagedMat = new THREE.MeshStandardMaterial({
      color: 0x3b0707,
      emissive: 0xef4444,
      emissiveIntensity: 0.85,
      metalness: 0.8,
      roughness: 0.3
    });

    const capMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.9,
      roughness: 0.25
    });

    // Central chassis mounting flange
    const flangeGeo = new THREE.BoxGeometry(2.1, 0.15, 1.65);
    const flangeMesh = new THREE.Mesh(flangeGeo, this.damagedMat);
    flangeMesh.castShadow = true;
    this.damagedGyroGroup.add(flangeMesh);

    // Dual Rate Gyroscope Cylinders (RSU-02 layout)
    const cylGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 24);
    const leftCyl = new THREE.Mesh(cylGeo, this.damagedMat);
    leftCyl.position.set(-0.5, 0.55, 0);
    leftCyl.castShadow = true;
    this.damagedGyroGroup.add(leftCyl);

    const rightCyl = new THREE.Mesh(cylGeo, this.damagedMat);
    rightCyl.position.set(0.5, 0.55, 0);
    rightCyl.castShadow = true;
    this.damagedGyroGroup.add(rightCyl);

    // Cooling fin collars
    const finGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.08, 24);
    [-0.5, 0.5].forEach((x) => {
      [0.3, 0.55, 0.8].forEach((y) => {
        const fin = new THREE.Mesh(finGeo, capMat);
        fin.position.set(x, y, 0);
        this.damagedGyroGroup.add(fin);
      });
      // Sensor domes
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
      dome.position.set(x, 1.1, 0);
      this.damagedGyroGroup.add(dome);
    });

    // Pulsing Red Warning Light
    this.warningLight = new THREE.PointLight(0xff0000, 1.5, 4);
    this.warningLight.position.set(0, 0.8, 0);
    this.damagedGyroGroup.add(this.warningLight);

    this.damagedGyroGroup.userData = { isDamagedGyro: true };
    this.scene.add(this.damagedGyroGroup);
    this.interactiveObjects.push(this.damagedGyroGroup);
  }

  createBolts() {
    this.boltGroup = new THREE.Group();

    const headGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.18, 6); // Hex bolt head
    const shankGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.35, 12);
    const boltMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.2
    });

    this.bolts.forEach((b, idx) => {
      const boltMeshGroup = new THREE.Group();
      boltMeshGroup.position.set(b.pos[0], b.pos[1], b.pos[2]);

      const head = new THREE.Mesh(headGeo, boltMat);
      head.position.y = 0.09;
      head.castShadow = true;
      boltMeshGroup.add(head);

      const shank = new THREE.Mesh(shankGeo, boltMat);
      shank.position.y = -0.15;
      boltMeshGroup.add(shank);

      // Checkmark mesh (hidden initially for Step 3)
      const checkMesh = this.createCheckmarkMesh();
      checkMesh.position.set(0, 0.4, 0);
      checkMesh.visible = false;
      boltMeshGroup.add(checkMesh);

      boltMeshGroup.userData = { isBolt: true, boltIndex: idx, checkMesh: checkMesh };
      b.mesh = boltMeshGroup;

      this.boltGroup.add(boltMeshGroup);
      this.interactiveObjects.push(boltMeshGroup);
    });

    this.scene.add(this.boltGroup);
  }

  createCheckmarkMesh() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(34, 66);
    ctx.lineTo(54, 88);
    ctx.lineTo(94, 42);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.4, 0.4, 1);
    return sprite;
  }

  createScrapBin() {
    this.scrapBinGroup = new THREE.Group();
    this.scrapBinGroup.position.set(-3.2, 0, -0.6);

    // Hexagonal Industrial Scrap Bin
    const binGeo = new THREE.CylinderGeometry(0.9, 0.75, 1.2, 6);
    const binMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.4
    });
    const binMesh = new THREE.Mesh(binGeo, binMat);
    binMesh.position.y = 0.6;
    binMesh.castShadow = true;
    binMesh.receiveShadow = true;
    this.scrapBinGroup.add(binMesh);

    // Hazard Rim (Yellow & Black stripes)
    const rimGeo = new THREE.TorusGeometry(0.92, 0.08, 8, 24);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0xd97706,
      emissiveIntensity: 0.3
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 1.2;
    this.scrapBinGroup.add(rimMesh);

    // Sign label
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#0f172a';
    sctx.fillRect(0, 0, 256, 128);
    sctx.strokeStyle = '#f59e0b';
    sctx.lineWidth = 6;
    sctx.strokeRect(4, 4, 248, 120);
    sctx.fillStyle = '#f59e0b';
    sctx.font = 'bold 32px monospace';
    sctx.textAlign = 'center';
    sctx.fillText('SCRAP BIN', 128, 55);
    sctx.font = '18px monospace';
    sctx.fillStyle = '#ffffff';
    sctx.fillText('HAZMAT DISPOSAL', 128, 90);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), signMat);
    signPlane.position.set(0, 0.7, 0.85);
    this.scrapBinGroup.add(signPlane);

    this.scrapBinGroup.userData = { isScrapBin: true };
    this.scene.add(this.scrapBinGroup);
    this.interactiveObjects.push(this.scrapBinGroup);
  }

  createReplacementGyro() {
    this.newGyroGroup = new THREE.Group();
    // Initially sits on the ESD Cleanroom Mat on the right
    this.newGyroMatPos = new THREE.Vector3(3.0, 0.28, 0.2);
    this.newGyroGroup.position.copy(this.newGyroMatPos);

    // Cleanroom Anti-Static Blue ESD Mat
    const matGeo = new THREE.PlaneGeometry(2.4, 2.0);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.6,
      metalness: 0.1
    });
    const esdMat = new THREE.Mesh(matGeo, matMat);
    esdMat.rotation.x = -Math.PI / 2;
    esdMat.position.set(3.0, 0.02, 0.2);
    esdMat.receiveShadow = true;
    this.scene.add(esdMat);

    // Pristine Aerospace Finish (Titanium + Gold Foil)
    const pristineMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.92,
      roughness: 0.15
    });

    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.2
    });

    // Flange
    const flange = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 1.65), pristineMat);
    flange.castShadow = true;
    this.newGyroGroup.add(flange);

    // Cylinders
    const cylGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 24);
    const leftCyl = new THREE.Mesh(cylGeo, pristineMat);
    leftCyl.position.set(-0.5, 0.55, 0);
    leftCyl.castShadow = true;
    this.newGyroGroup.add(leftCyl);

    const rightCyl = new THREE.Mesh(cylGeo, pristineMat);
    rightCyl.position.set(0.5, 0.55, 0);
    rightCyl.castShadow = true;
    this.newGyroGroup.add(rightCyl);

    // Gold thermal blankets around cylinders
    const blanketGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.5, 24);
    [-0.5, 0.5].forEach((x) => {
      const b = new THREE.Mesh(blanketGeo, goldFoilMat);
      b.position.set(x, 0.55, 0);
      this.newGyroGroup.add(b);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), pristineMat);
      dome.position.set(x, 1.1, 0);
      this.newGyroGroup.add(dome);
    });

    // Big holographic checkmark for completion
    this.moduleCompletionCheck = this.createCheckmarkMesh();
    this.moduleCompletionCheck.scale.set(1.5, 1.5, 1);
    this.moduleCompletionCheck.position.set(0, 2.0, 0);
    this.moduleCompletionCheck.visible = false;
    this.newGyroGroup.add(this.moduleCompletionCheck);

    this.newGyroGroup.userData = { isNewGyro: true };
    this.scene.add(this.newGyroGroup);
    this.interactiveObjects.push(this.newGyroGroup);
  }

  createGuidePinsStand() {
    this.guidePinStand = new THREE.Group();
    this.guidePinStand.position.set(1.8, 0.05, -1.6);

    const trayGeo = new THREE.BoxGeometry(0.8, 0.1, 1.2);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    this.guidePinStand.add(tray);

    // 2 Silver Guide Pins resting on the stand
    const pinGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.8, 16);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

    [-0.15, 0.15].forEach((x) => {
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.rotation.z = Math.PI / 2;
      pin.position.set(0, 0.1, x);
      this.guidePinStand.add(pin);
    });

    this.guidePinStand.userData = { isGuidePinStand: true };
    this.scene.add(this.guidePinStand);
    this.interactiveObjects.push(this.guidePinStand);
  }

  createInteractiveHighlights() {
    this.highlightsGroup = new THREE.Group();

    // 1. Step 1: 4 Bolt Unbolt Cyan Pulsing Rings
    this.boltHighlights = [];
    const boltRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });
    this.bolts.forEach((b) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.015, 8, 24), boltRingMat.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.set(b.pos[0], b.pos[1] + 0.18, b.pos[2]);
      this.highlightsGroup.add(ring);
      this.boltHighlights.push(ring);
    });

    // 2. Step 1: Scrap Bin Hazard Highlight Ring
    const binRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.9
    });
    this.scrapBinRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.03, 8, 32), binRingMat);
    this.scrapBinRing.rotation.x = Math.PI / 2;
    this.scrapBinRing.position.set(-3.2, 1.25, -0.6);
    this.scrapBinRing.visible = false;
    this.highlightsGroup.add(this.scrapBinRing);

    // 3. Step 2: Guide Pins Stand Highlight
    const standRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8
    });
    this.pinStandRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 8, 24), standRingMat);
    this.pinStandRing.rotation.x = Math.PI / 2;
    this.pinStandRing.position.set(1.8, 0.18, -1.6);
    this.pinStandRing.visible = false;
    this.highlightsGroup.add(this.pinStandRing);

    // 4. Step 2: Diagonal Bolt Hole Target Rings (Holes 0 & 3)
    this.diagonalPinHoles = [];
    [0, 3].forEach((hIdx) => {
      const hPos = this.boltHolePositions[hIdx];
      const diagRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 24), standRingMat.clone());
      diagRing.rotation.x = Math.PI / 2;
      diagRing.position.set(hPos.x, hPos.y + 0.05, hPos.z);
      diagRing.visible = false;
      this.highlightsGroup.add(diagRing);
      this.diagonalPinHoles.push({ holeIdx: hIdx, mesh: diagRing });
    });

    // 5. Step 3: Pristine Replacement Gyro Highlight
    const newGyroMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.newGyroRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.025, 8, 32), newGyroMat);
    this.newGyroRing.rotation.x = Math.PI / 2;
    this.newGyroRing.position.set(2.8, 0.25, 0);
    this.newGyroRing.visible = false;
    this.highlightsGroup.add(this.newGyroRing);

    // 6. Step 3: Bolt Torquing Green Target Rings
    this.boltTorqueHighlights = [];
    const torqueRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.bolts.forEach((b) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 24), torqueRingMat.clone());
      ring.rotation.x = Math.PI / 2;
      ring.position.set(b.pos[0], b.pos[1] + 0.38, b.pos[2]);
      ring.visible = false;
      this.highlightsGroup.add(ring);
      this.boltTorqueHighlights.push(ring);
    });

    this.scene.add(this.highlightsGroup);
  }

  checkRequiredTools() {
    let hasTools = true;
    const hasTool = (id) => {
      if (typeof window.hasPurchasedTool === 'function') {
        return window.hasPurchasedTool(id);
      }
      const gs = window.getNasaGameState ? window.getNasaGameState() : null;
      return !!(gs && gs.inventory && gs.inventory[id]);
    };

    // If step is already complete, tools aren't required
    if (this.isComplete) {
      hasTools = true;
    } else if (this.currentStep === 1) {
      hasTools = hasTool('pgt');
    } else if (this.currentStep === 2) {
      hasTools = hasTool('pins');
    } else if (this.currentStep === 3) {
      if (this.newGyroMounted) {
        hasTools = hasTool('pgt');
      } else {
        hasTools = hasTool('gyro') && hasTool('pgt');
      }
    }

    if (this.ui && this.ui.reqBanner) {
      if (!hasTools && !this.isComplete) {
        this.ui.reqBanner.classList.remove('hidden');
      } else {
        this.ui.reqBanner.classList.add('hidden');
      }
    }
    return hasTools;
  }

  // -------------------------------------------------------------
  // DOM OVERLAYS & HUD (Figma Node 414:69)
  // -------------------------------------------------------------
  createDomOverlays() {
    // 0. Requisition Alert Banner (if tools missing)
    this.ui.reqBanner = document.createElement('div');
    this.ui.reqBanner.className = 'wb3d-requisition-banner hidden';
    this.ui.reqBanner.id = 'wb3dReqBanner';
    this.ui.reqBanner.innerHTML = `
      <div class="wb3d-req-msg">⚠️ FLIGHT REQUISITION REQUIRED: Missing flight tools for current task step.</div>
      <button class="wb3d-btn" id="wb3dBtnGoMarket" style="margin-top: 8px; background: #0284c7; border: 1px solid #38bdf8; font-weight: 700;">OPEN LAPTOP MARKETPLACE</button>
    `;
    this.container.appendChild(this.ui.reqBanner);

    const btnGoMarket = this.ui.reqBanner.querySelector('#wb3dBtnGoMarket');
    if (btnGoMarket) {
      btnGoMarket.addEventListener('click', () => {
        const modalWb = document.getElementById('modalWorkbench');
        if (modalWb) modalWb.classList.add('hidden');
        if (typeof window.openFacilityModal === 'function') {
          window.openFacilityModal('laptop');
        }
      });
    }

    // 1. Task Progress Card (Top-Left of 3D Canvas, Figma 414:159)
    this.ui.taskPanel = document.createElement('div');
    this.ui.taskPanel.className = 'wb-figma-step-card';
    this.container.appendChild(this.ui.taskPanel);

    // 2. Right-Side Tools Shelf (Figma 414:161)
    this.ui.toolShelf = document.createElement('div');
    this.ui.toolShelf.className = 'wb-figma-tool-shelf';
    this.ui.toolShelf.id = 'wbFigmaToolShelf';
    this.ui.toolShelf.innerHTML = `
      <div class="wb-figma-tool-card" id="cardToolPgt" data-tool="pgt" title="PGT Computerized Torque Wrench [Hotkey P]">
        <div class="tool-img-box">
          <img src="assets/images/image 2.png" alt="PGT Wrench">
        </div>
        <span class="tool-key-tag">P</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolPins" data-tool="pins" title="Alignment Guide Pins [Hotkey A]">
        <div class="tool-img-box">
          <img src="assets/images/image 3.png" alt="Alignment Pins">
        </div>
        <span class="tool-key-tag">A</span>
      </div>
    `;
    this.container.appendChild(this.ui.toolShelf);

    // Wire clicks on tool cards
    const cardPgt = this.ui.toolShelf.querySelector('#cardToolPgt');
    const cardPins = this.ui.toolShelf.querySelector('#cardToolPins');

    if (cardPgt) {
      cardPgt.addEventListener('click', () => {
        const hasPgt = (typeof window.isToolOperational === 'function') ? window.isToolOperational('pgt') : ((typeof window.hasPurchasedTool === 'function') ? window.hasPurchasedTool('pgt') : true);
        if (!hasPgt) {
          this.showAlert("Warning : Please purchase PGT Wrench from Laptop Marketplace first!", true);
          this.playErrorBuzz();
          return;
        }
        this.togglePgtEquip();
      });
    }

    if (cardPins) {
      cardPins.addEventListener('click', () => {
        const hasPins = (typeof window.isToolOperational === 'function') ? window.isToolOperational('pins') : ((typeof window.hasPurchasedTool === 'function') ? window.hasPurchasedTool('pins') : true);
        if (!hasPins) {
          this.showAlert("Warning : Please purchase Alignment Guide Pins from Laptop Marketplace first!", true);
          this.playErrorBuzz();
          return;
        }
        this.equipGuidePins();
      });
    }

    // Wire lower footer mode buttons
    const btnModePrev = document.getElementById('btnWbModePrev');
    const btnModeNext = document.getElementById('btnWbModeNext');
    if (btnModePrev) btnModePrev.onclick = () => this.togglePgtMode();
    if (btnModeNext) btnModeNext.onclick = () => this.togglePgtMode();

    // 3. Circular Timing Gauge Overlay for Step 3 Torque Lock
    this.ui.circularGauge = document.createElement('div');
    this.ui.circularGauge.className = 'wb3d-circular-gauge-wrap hidden';
    this.ui.circularGauge.innerHTML = `
      <div class="gauge-card">
        <div class="gauge-title">PRECISION TORQUE LOCK</div>
        <svg class="gauge-svg" viewBox="0 0 160 160">
          <!-- Background track -->
          <circle cx="80" cy="80" r="65" class="gauge-track"></circle>
          <!-- Green Target Zone Arc (26.5 - 33.5 N-m) -->
          <circle cx="80" cy="80" r="65" class="gauge-target-zone"></circle>
          <!-- Animated fill bar -->
          <circle cx="80" cy="80" r="65" class="gauge-fill" id="gaugeFillCircle"></circle>
        </svg>
        <div class="gauge-readout">
          <span class="gauge-num" id="gaugeTorqueNum">0.0</span>
          <span class="gauge-unit">N·m</span>
        </div>
        <div class="gauge-hint" id="gaugeLiveStatus">HOLD [MOUSE or SPACE] &amp; RELEASE IN GREEN ZONE (30 N·m)</div>
        <button type="button" class="gauge-torque-btn" id="btnGaugeHoldTorque">⚡ HOLD TO TORQUE [SPACE / CLICK]</button>
      </div>
    `;
    this.container.appendChild(this.ui.circularGauge);

    this.ui.gaugeNum = this.ui.circularGauge.querySelector('#gaugeTorqueNum');
    this.ui.gaugeFill = this.ui.circularGauge.querySelector('#gaugeFillCircle');
    this.ui.gaugeHint = this.ui.circularGauge.querySelector('#gaugeLiveStatus');
    this.ui.gaugeBtn = this.ui.circularGauge.querySelector('#btnGaugeHoldTorque');

    if (this.ui.gaugeBtn) {
      this.ui.gaugeBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const nextBoltIdx = (this.activeTorqueIndex !== null) ? this.activeTorqueIndex : this.bolts.findIndex(b => !b.torqued);
        if (nextBoltIdx !== -1) {
          this.startTorqueGauge(nextBoltIdx);
        }
      });
      this.ui.gaugeBtn.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.finishTorqueGauge();
      });
      this.ui.gaugeBtn.addEventListener('pointerleave', (e) => {
        if (this.torqueGaugeActive) {
          this.finishTorqueGauge();
        }
      });
    }

    this.ui.circularGauge.addEventListener('pointerdown', (e) => {
      if (e.target === this.ui.gaugeBtn) return;
      e.stopPropagation();
      e.preventDefault();
      const nextBoltIdx = (this.activeTorqueIndex !== null) ? this.activeTorqueIndex : this.bolts.findIndex(b => !b.torqued);
      if (nextBoltIdx !== -1) {
        this.startTorqueGauge(nextBoltIdx);
      }
    });
    this.ui.circularGauge.addEventListener('pointerup', (e) => {
      if (e.target === this.ui.gaugeBtn) return;
      e.stopPropagation();
      e.preventDefault();
      this.finishTorqueGauge();
    });
  }

  updateTaskPanel() {
    if (!this.ui.taskPanel) return;

    let stepHeading = '';
    let stepLines = '';

    if (this.currentStep === 1) {
      stepHeading = 'Extraction & Tool Setup';
      const unboltedCount = this.bolts.filter(b => b.unbolted).length;
      let activePrompt = '';
      if (!this.toolEquipped || this.activeTool !== 'pgt') {
        activePrompt = 'Press [P] to Equip the PGT Tool';
      } else if (this.toolMode !== 'reverse') {
        activePrompt = 'Set Mode to [ Reverse | Unbolt ]';
      } else if (unboltedCount < 4) {
        activePrompt = `Click & Hold corner bolts to spin them out [ ${unboltedCount}/4 ]`;
      } else {
        activePrompt = 'Extract damaged Gyro Canister into Scrap Bin';
      }
      stepLines = `<div class="step-instruction-line active-micro-step">• ${activePrompt}</div>`;
    } else if (this.currentStep === 2) {
      stepHeading = 'Alignment Guide Pin Phase';
      const pinsCount = this.guidePinsInstalled.filter(p => p).length;
      let activePrompt = '';
      if (pinsCount < 2) {
        activePrompt = `Mount Alignment Guide Pins [ ${pinsCount}/2 ]`;
      } else {
        activePrompt = 'Mount replacement RSU-02 Gyro Canister';
      }
      stepLines = `<div class="step-instruction-line active-micro-step">• ${activePrompt}</div>`;
    } else if (this.currentStep === 3) {
      stepHeading = 'Mounting & Torque Locking';
      if (!this.newGyroMounted) {
        stepLines = `<div class="step-instruction-line active-micro-step">• Drag or click Pristine Gyro Canister onto guide pins to mate into port</div>`;
      } else {
        const torquedCount = this.bolts.filter(b => b.torqued).length;
        let activePrompt = '';
        if (!this.toolEquipped || this.toolMode !== 'forward') {
          activePrompt = 'Set Mode to [ Forward | Fasten ] & torque bolts to 14.5 N·m';
        } else if (torquedCount < 4) {
          activePrompt = `Hold [SPACE] or Click Bolt & release in green target zone (30 N·m) [ ${torquedCount}/4 ]`;
        } else {
          activePrompt = 'Subsystem Certified';
        }
        stepLines = `<div class="step-instruction-line active-micro-step">• ${activePrompt}</div>`;
      }
    }

    if (this.isComplete) {
      stepHeading = 'Subtask 01 Complete!';
      stepLines = `<div class="step-instruction-line" style="color: #10b981; font-weight: 700;">✓ RSU-02 Gyroscope perfectly aligned, electrically mated, and torqued to 30 N·m!</div>`;
    }

    this.ui.taskPanel.innerHTML = `
      <div class="step-title-line">Step ${this.currentStep} : ${stepHeading}</div>
      ${stepLines}
    `;

    this.updateToolShelf();
  }

  updateToolShelf() {
    if (!this.ui.toolShelf) return;
    const cardPgt = this.ui.toolShelf.querySelector('#cardToolPgt');
    const cardPins = this.ui.toolShelf.querySelector('#cardToolPins');
    if (!cardPgt || !cardPins) return;

    const hasTool = (id) => {
      if (typeof window.hasPurchasedTool === 'function') return window.hasPurchasedTool(id);
      const gs = window.getNasaGameState ? window.getNasaGameState() : null;
      return !!(gs && gs.inventory && gs.inventory[id]);
    };

    const hasPgt = hasTool('pgt');
    const hasPins = hasTool('pins');

    // Purchased vs Locked state
    cardPgt.classList.toggle('locked', !hasPgt);
    cardPins.classList.toggle('locked', !hasPins);

    const tagPgt = cardPgt.querySelector('.tool-key-tag');
    const tagPins = cardPins.querySelector('.tool-key-tag');
    if (tagPgt) tagPgt.textContent = hasPgt ? (this.pgtEquipped ? 'EQUIPPED' : 'P') : 'BUY';
    if (tagPins) tagPins.textContent = hasPins ? (this.guidePinsEquipped ? 'EQUIPPED' : 'A') : 'BUY';

    // Equipped state
    cardPgt.classList.toggle('equipped', this.pgtEquipped);
    cardPins.classList.toggle('equipped', this.guidePinsEquipped);

    // USER SPECIFICATION: "if selected by task then glow of outline on tool"
    if (this.currentStep === 1) {
      cardPgt.classList.add('task-selected-glow');
      cardPins.classList.remove('task-selected-glow');
    } else if (this.currentStep === 2) {
      cardPgt.classList.remove('task-selected-glow');
      cardPins.classList.add('task-selected-glow');
    } else if (this.currentStep === 3) {
      cardPgt.classList.add('task-selected-glow');
      cardPins.classList.remove('task-selected-glow');
    } else {
      cardPgt.classList.remove('task-selected-glow');
      cardPins.classList.remove('task-selected-glow');
    }
  }

  updatePgtHudUI() {
    const modeText = document.getElementById('wbFooterModeText');
    const torqueVal = document.getElementById('wbFooterTorqueVal');

    if (modeText) {
      if (this.pgtMode === 'REVERSE') {
        modeText.textContent = '[ Reverse | Unbolt ]';
        modeText.className = 'wb-mode-text mode-rev';
      } else {
        modeText.textContent = '[ Forward | Torque ]';
        modeText.className = 'wb-mode-text mode-fwd';
      }
    }

    if (torqueVal) {
      torqueVal.textContent = `${this.pgtTorqueSetting.toFixed(0)} N-m`;
    }

    this.updateToolShelf();
  }

  showAlert(message, isError = true) {
    const col = document.getElementById('wbLowerErrorCol');
    const msg = document.getElementById('wbLowerErrorMsg');
    const icon = document.getElementById('wbErrorIcon');

    if (msg) {
      msg.textContent = message;
    }
    if (col) {
      col.className = 'wb-figma-error-column';
      if (isError) {
        col.classList.add('error', 'shake');
        if (icon) icon.textContent = '⚠️';
        clearTimeout(this.errorShakeTimer);
        this.errorShakeTimer = setTimeout(() => col.classList.remove('shake'), 450);
      } else {
        col.classList.add('success');
        if (icon) icon.textContent = '✓';
      }
    }
  }

  // -------------------------------------------------------------
  // CONTROLS & INTERACTION
  // -------------------------------------------------------------
  setupInputEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    dom.addEventListener('pointerup', (e) => this.onPointerUp(e));
    dom.addEventListener('pointermove', (e) => this.onPointerMove(e));

    // Global pointerup to ensure torque releases are never missed anywhere on screen
    this.globalPointerUp = () => this.onPointerUp();
    window.addEventListener('pointerup', this.globalPointerUp);

    // Keyboard shortcuts [P], [A], and [SPACEBAR]
    this.keyHandler = (e) => {
      // Only process when workbench is visible
      const modal = document.getElementById('modalWorkbench');
      if (modal && modal.classList.contains('hidden')) return;

      if (e.key === 'p' || e.key === 'P') {
        this.togglePgtEquip();
      } else if (e.key === 'a' || e.key === 'A') {
        this.equipGuidePins();
      } else if (e.code === 'Space' && !e.repeat) {
        // Spacebar hold to torque bolt in Step 3!
        if (this.currentStep === 3 && this.newGyroMounted && !this.torqueGaugeActive) {
          const nextBoltIdx = this.bolts.findIndex(b => !b.torqued);
          if (nextBoltIdx !== -1) {
            e.preventDefault();
            this.startTorqueGauge(nextBoltIdx);
          }
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.keyUpHandler = (e) => {
      if (e.code === 'Space' && this.torqueGaugeActive) {
        e.preventDefault();
        this.finishTorqueGauge();
      }
    };
    window.addEventListener('keyup', this.keyUpHandler);
  }

  togglePgtEquip() {
    this.pgtEquipped = !this.pgtEquipped;
    this.updatePgtHudUI();
    this.updateTaskPanel();
    if (this.pgtEquipped) {
      if (window.nasaAudio && window.nasaAudio.playInstrumentEquipped) {
        window.nasaAudio.playInstrumentEquipped();
      } else {
        this.playMotorSound(this.pgtMode === 'REVERSE');
      }
    }
  }

  togglePgtMode() {
    this.pgtMode = this.pgtMode === 'REVERSE' ? 'FORWARD' : 'REVERSE';
    this.updatePgtHudUI();
    this.updateTaskPanel();
    this.playMotorSound(this.pgtMode === 'REVERSE');
  }

  equipGuidePins() {
    this.guidePinsEquipped = true;
    const chipPins = this.container.querySelector('#chipGuidePins');
    if (chipPins) chipPins.classList.add('active');
    if (window.nasaAudio && window.nasaAudio.playInstrumentEquipped) {
      window.nasaAudio.playInstrumentEquipped();
    }
    this.showAlert("Alignment Guide Pins equipped! Click diagonal holes on the bracket to install.");
  }

  getPointerIntersection(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);
    return intersects.length > 0 ? intersects[0] : null;
  }

  onPointerDown(event) {
    const bypassToolCheck = (this.currentStep === 3 && this.newGyroMounted);
    if (!bypassToolCheck && !this.checkRequiredTools()) {
      if (typeof window.showCenterCalmAlert === 'function') {
        window.showCenterCalmAlert("REQUISITION REQUIRED", "Purchase required tools from Laptop Marketplace first!", "🛒");
      } else {
        this.showAlert("Required flight tools missing! Requisition them from the Laptop Marketplace.");
      }
      this.playErrorBuzz();
      return;
    }

    const hit = this.getPointerIntersection(event);
    if (!hit) return;

    // Traverse upwards to find root object with userData
    let obj = hit.object;
    while (obj && (!obj.userData || Object.keys(obj.userData).length === 0) && obj.parent) {
      obj = obj.parent;
    }
    const data = obj.userData || {};

    // ----------------------------------------------------
    // STEP 1 INTERACTIONS: UNBOLT & SCRAP
    // ----------------------------------------------------
    if (this.currentStep === 1) {
      // Clicking a bolt
      if (data.isBolt !== undefined) {
        const bIdx = data.boltIndex;
        const bolt = this.bolts[bIdx];

        if (!this.pgtEquipped) {
          const hasPgt = (typeof window.hasPurchasedTool === 'function') ? window.hasPurchasedTool('pgt') : true;
          if (!hasPgt) {
            this.showAlert("Warning : Please purchase PGT Wrench from Laptop Marketplace first!", true);
          } else {
            this.showAlert("Warning : Please Select the tool first [Press P]", true);
          }
          this.playErrorBuzz();
          return;
        }

        if (this.pgtMode !== 'REVERSE') {
          this.showAlert("Warning : Set PGT Mode to [Reverse | Unbolt] first!", true);
          this.playErrorBuzz();
          return;
        }

        if (!bolt.unbolted) {
          bolt.unbolted = true;
          this.playMotorSound(true);
          this.animateBoltOut(bolt);
          this.updateTaskPanel();

          const allOut = this.bolts.every(b => b.unbolted);
          if (allOut) {
            this.showAlert("All 4 bolts extracted! Now click Damaged Gyro to drop it into the Scrap Bin.", false);
          }
        }
        return;
      }

      // Clicking Damaged Gyro after all 4 bolts are out
      if (data.isDamagedGyro) {
        const allUnbolted = this.bolts.every(b => b.unbolted);
        if (!allUnbolted) {
          this.showAlert("Click and remove all 4 bolts first before scrapping the module!", true);
          this.playErrorBuzz();
          return;
        }

        // Animate Damaged Gyro into Scrap Bin
        this.scrapDamagedGyro();
        return;
      }
    }

    // ----------------------------------------------------
    // STEP 2 INTERACTIONS: GUIDE PINS
    // ----------------------------------------------------
    if (this.currentStep === 2) {
      // Trying to click / drag new Gyro directly without guide pins
      if (data.isNewGyro) {
        this.triggerMissingPinsFailure();
        return;
      }

      // Clicking Guide Pin Stand to equip
      if (data.isGuidePinStand) {
        this.equipGuidePins();
        return;
      }

      // Clicking Bolt Holes to install pins
      if (data.isHoleCollar !== undefined || data.isBolt !== undefined) {
        const holeIdx = data.holeIndex !== undefined ? data.holeIndex : data.boltIndex;

        // Diagonal pair: Hole 0 (Top-Left) and Hole 3 (Bottom-Right)
        if (holeIdx === 0 || holeIdx === 3) {
          if (!this.guidePinsEquipped) {
            const hasPins = (typeof window.hasPurchasedTool === 'function') ? window.hasPurchasedTool('pins') : true;
            if (!hasPins) {
              this.showAlert("Warning : Please purchase Alignment Guide Pins from Laptop Marketplace first!", true);
            } else {
              this.showAlert("Warning : Please Select the tool first [Press A to Equip Guide Pins]", true);
            }
            this.playErrorBuzz();
            return;
          }

          const pinIdx = holeIdx === 0 ? 0 : 1;
          if (!this.guidePinsInstalled[pinIdx]) {
            this.installGuidePin(pinIdx, holeIdx);
          }
        } else {
          this.showAlert("Install guide pins in opposite diagonal holes (Top-Left & Bottom-Right)!", true);
          this.playErrorBuzz();
        }
        return;
      }
    }

    // ----------------------------------------------------
    // STEP 3 INTERACTIONS: MOUNT & TORQUE
    // ----------------------------------------------------
    if (this.currentStep === 3) {
      // Clicking New Gyro to Mount onto Pins
      if (data.isNewGyro && !this.newGyroMounted) {
        this.mountNewGyro();
        return;
      }

      // Clicking Bolt Holes to Torque Bolts Down
      if (this.newGyroMounted && (data.isHoleCollar !== undefined || data.isBolt !== undefined)) {
        const bIdx = data.boltIndex !== undefined ? data.boltIndex : data.holeIndex;
        const bolt = this.bolts[bIdx];

        if (!this.pgtEquipped) {
          this.showAlert("Warning : Please Select the tool first [Press P to Equip PGT]", true);
          this.playErrorBuzz();
          return;
        }

        if (this.pgtMode !== 'FORWARD') {
          this.showAlert("Warning : Set PGT Mode to [Forward | Torque : 30 N-m]!", true);
          this.playErrorBuzz();
          return;
        }

        if (!bolt.torqued) {
          this.startTorqueGauge(bIdx);
        }
        return;
      }
    }
  }

  onPointerUp() {
    this.activeUnboltingIndex = null;

    // Release torque gauge hold
    if (this.torqueGaugeActive) {
      this.finishTorqueGauge();
    }
  }

  onPointerMove() {
    // Subtle raycast hover feedback
  }

  // -------------------------------------------------------------
  // STEP 1 LOGIC & ANIMATIONS
  // -------------------------------------------------------------
  animateBoltOut(bolt) {
    const mesh = bolt.mesh;
    if (!mesh) return;

    this.playPinScrewSound();
    const startY = mesh.position.y;
    const targetY = startY + 0.65;
    const startTime = performance.now();

    const anim = () => {
      const p = (performance.now() - startTime) / 350;
      if (p < 1) {
        mesh.position.y = startY + (targetY - startY) * p;
        mesh.rotation.y += 0.4;
        requestAnimationFrame(anim);
      } else {
        mesh.position.y = targetY;
        mesh.visible = false; // Vanishes into parts tray
      }
    };
    anim();
  }

  scrapDamagedGyro() {
    this.damagedGyroScrapped = true;
    const gyro = this.damagedGyroGroup;
    const startPos = gyro.position.clone();
    const targetPos = new THREE.Vector3(-3.2, 0.9, -0.6); // Into Scrap Bin
    const startTime = performance.now();

    const anim = () => {
      const p = (performance.now() - startTime) / 600;
      if (p < 1) {
        // Parabolic arc into bin
        gyro.position.x = startPos.x + (targetPos.x - startPos.x) * p;
        gyro.position.z = startPos.z + (targetPos.z - startPos.z) * p;
        gyro.position.y = startPos.y + (targetPos.y - startPos.y) * p + Math.sin(p * Math.PI) * 1.2;
        gyro.rotation.z = p * 0.4;
        requestAnimationFrame(anim);
      } else {
        gyro.position.copy(targetPos);
        gyro.position.y = 0.2; // Inside bin
        gyro.scale.set(0.6, 0.6, 0.6);
        this.playScrapBinThud();

        // Advance to Step 2 smoothly
        this.currentStep = 2;
        this.updateTaskPanel();
      }
    };
    anim();
  }

  // -------------------------------------------------------------
  // STEP 2 LOGIC & ANIMATIONS (CRUCIAL GAME MECHANIC)
  // -------------------------------------------------------------
  triggerMissingPinsFailure() {
    // Violent red shake and error buzz
    this.playErrorBuzz();
    this.showAlert("Pins required to prevent connector damage!");

    this.shakeTimer = 0.45;
    const origPos = this.newGyroMatPos.clone();
    const startTime = performance.now();

    const shakeAnim = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.45) {
        const offset = Math.sin(elapsed * 45) * 0.12;
        this.newGyroGroup.position.x = origPos.x + offset;
        requestAnimationFrame(shakeAnim);
      } else {
        this.newGyroGroup.position.copy(origPos);
      }
    };
    shakeAnim();
  }

  installGuidePin(pinIdx, holeIdx) {
    this.guidePinsInstalled[pinIdx] = true;
    this.playPinScrewSound();

    const holePos = this.boltHolePositions[holeIdx];

    // Create 3D Guide Pin screwing into hole
    const pinGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.2, 16);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      metalness: 0.95,
      roughness: 0.1
    });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.set(holePos.x, holePos.y + 1.1, holePos.z);
    this.bracketGroup.add(pinMesh);
    this.guidePinMeshes.push(pinMesh);

    // Glowing vertical guide track line (Laser alignment beam)
    const trackGeo = new THREE.CylinderGeometry(0.015, 0.015, 3.5, 8);
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75
    });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(holePos.x, holePos.y + 1.75, holePos.z);
    this.bracketGroup.add(track);
    this.guideTrackLines.push(track);

    this.updateTaskPanel();

    // Check if both diagonal pins are installed
    if (this.guidePinsInstalled.every(p => p)) {
      setTimeout(() => {
        this.currentStep = 3;
        this.updateTaskPanel();
        this.showAlert("Guide Pins securely installed! Tracks active. Drag or click the new Gyro module to mate.");
      }, 500);
    }
  }

  // -------------------------------------------------------------
  // STEP 3 LOGIC & TIMING GAUGE
  // -------------------------------------------------------------
  mountNewGyro() {
    this.newGyroMounted = true;
    const gyro = this.newGyroGroup;
    const startPos = gyro.position.clone();
    const aboveBracketPos = new THREE.Vector3(0, 2.5, 0); // At top of guide pins
    const matedPos = new THREE.Vector3(0, 0.35, 0); // Fully mated in bay

    const startTime = performance.now();

    const anim = () => {
      const p = (performance.now() - startTime) / 900;
      if (p < 0.5) {
        // Arc over to above the guide pins
        const p1 = p * 2;
        gyro.position.x = startPos.x + (aboveBracketPos.x - startPos.x) * p1;
        gyro.position.z = startPos.z + (aboveBracketPos.z - startPos.z) * p1;
        gyro.position.y = startPos.y + (aboveBracketPos.y - startPos.y) * p1 + Math.sin(p1 * Math.PI) * 0.8;
        requestAnimationFrame(anim);
      } else if (p < 1.0) {
        // Slide smoothly down along the guide pins into the electrical connector
        const p2 = (p - 0.5) * 2;
        gyro.position.x = 0;
        gyro.position.z = 0;
        gyro.position.y = aboveBracketPos.y + (matedPos.y - aboveBracketPos.y) * p2;
        requestAnimationFrame(anim);
      } else {
        gyro.position.copy(matedPos);
        // Play solid mechanical "CLACK" and electronic mating chime
        this.playMatingClack();
        if (window.nasaAudio && window.nasaAudio.playPartFitted) {
          window.nasaAudio.playPartFitted();
        }

        // Restore bolts in holes ready to torque
        this.bolts.forEach((b) => {
          b.mesh.position.y = b.pos[1] + 0.35; // slightly raised waiting for torque
          b.mesh.visible = true;
        });

        this.updateTaskPanel();
        this.showAlert("Gyro successfully mated to flight connector! Set PGT to [FORWARD / 30 N·m] and torque bolts.");
      }
    };
    anim();
  }

  startTorqueGauge(boltIndex) {
    this.activeTorqueIndex = boltIndex;
    this.torqueGaugeActive = true;
    this.torqueHoldStartTime = performance.now();
    this.currentTorqueVal = 0;
    this.hasPlayedSweetSpotTone = false;

    if (this.ui.circularGauge) {
      this.ui.circularGauge.classList.remove('hidden');
    }
    if (this.ui.gaugeNum) this.ui.gaugeNum.textContent = '0.0';
    if (this.ui.gaugeFill) {
      this.ui.gaugeFill.style.strokeDashoffset = '408.4';
      this.ui.gaugeFill.style.stroke = '#38bdf8';
      this.ui.gaugeFill.style.filter = 'none';
    }
    if (this.ui.gaugeHint) {
      this.ui.gaugeHint.innerHTML = '<span style="color: #38bdf8; font-size: 11px;">HOLDING... REACHING GREEN ZONE (30 N·m)</span>';
    }
    this.playMotorSound(false);
  }

  finishTorqueGauge() {
    if (!this.torqueGaugeActive || this.activeTorqueIndex === null) return;

    this.torqueGaugeActive = false;
    if (this.ui.circularGauge) {
      this.ui.circularGauge.classList.add('hidden');
    }

    const bIdx = this.activeTorqueIndex;
    const bolt = this.bolts[bIdx];
    this.activeTorqueIndex = null;

    // Sweet Spot Green Zone: 26.5 N-m to 33.5 N-m (centered on 30.0 N-m)
    if (this.currentTorqueVal >= 26.5 && this.currentTorqueVal <= 33.5) {
      // Perfect Torque Lock!
      bolt.torqued = true;
      this.playTorqueClick();
      if (window.nasaAudio && window.nasaAudio.playPartFitted) {
        window.nasaAudio.playPartFitted();
      }

      // Bolt seats flush and displays checkmark
      if (bolt.mesh) {
        bolt.mesh.position.y = bolt.pos[1];
        const check = bolt.mesh.userData.checkMesh;
        if (check) check.visible = true;
      }

      this.updateTaskPanel();

      // Check if all 4 bolts are torqued down
      const allTorqued = this.bolts.every(b => b.torqued);
      if (allTorqued) {
        this.onSubtask01Completed();
      } else {
        const remaining = this.bolts.filter(b => !b.torqued).length;
        this.showAlert(`Bolt ${bIdx + 1} locked to ${this.currentTorqueVal.toFixed(1)} N·m! (${remaining} remaining)`);
      }
    } else if (this.currentTorqueVal < 26.5) {
      this.playErrorBuzz();
      this.showAlert(`Under-torqued (${this.currentTorqueVal.toFixed(1)} N·m). Hold until green zone (30 N·m)!`);
    } else {
      this.playErrorBuzz();
      this.showAlert(`Over-torqued (${this.currentTorqueVal.toFixed(1)} N·m). Risk of thread stripping! Release in green zone.`);
    }
  }

  onSubtask01Completed() {
    this.isComplete = true;
    this.playVictoryFanfare();

    // Show massive completion checkmark over module
    if (this.moduleCompletionCheck) {
      this.moduleCompletionCheck.visible = true;
    }

    this.updateTaskPanel();

    if (window.DecisionManager && typeof window.DecisionManager.promptDecision === 'function') {
      window.DecisionManager.promptDecision('mech_task1', () => {
        if (typeof this.onCompleteCallback === 'function') {
          this.onCompleteCallback();
        }
      });
    } else if (typeof this.onCompleteCallback === 'function') {
      this.onCompleteCallback();
    }
  }

  // -------------------------------------------------------------
  // RENDER LOOP & RESIZE
  // -------------------------------------------------------------
  animate() {
    this.animId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();

    // Pulse red emissive warning on damaged gyro if not scrapped
    if (!this.damagedGyroScrapped && this.damagedMat) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 6.0);
      this.damagedMat.emissiveIntensity = pulse;
      if (this.warningLight) this.warningLight.intensity = pulse * 1.5;
    }

    // Pulse cyan guide track beams
    if (this.guideTrackLines.length > 0) {
      const beamPulse = 0.5 + 0.3 * Math.sin(time * 4.0);
      this.guideTrackLines.forEach(l => {
        l.material.opacity = beamPulse;
      });
    }

    // --- Interactive Parts Highlights Pulse & Visibility per Step ---
    const tPulse = 1.0 + Math.sin(time * 5.0) * 0.12;
    const tOpacity = 0.65 + Math.sin(time * 5.0) * 0.25;

    // Step 1 highlights
    if (this.boltHighlights) {
      this.boltHighlights.forEach((ring, i) => {
        const isWaiting = (this.currentStep === 1 && !this.bolts[i].unbolted);
        ring.visible = isWaiting;
        if (isWaiting) {
          ring.rotation.z += 0.03;
          ring.scale.set(tPulse, tPulse, tPulse);
          ring.material.opacity = tOpacity;
        }
      });
    }
    if (this.scrapBinRing) {
      const allUnbolted = this.bolts.every(b => b.unbolted);
      const showBin = (this.currentStep === 1 && allUnbolted && !this.damagedGyroScrapped);
      this.scrapBinRing.visible = showBin;
      if (showBin) {
        this.scrapBinRing.rotation.z += 0.02;
        this.scrapBinRing.scale.set(tPulse, tPulse, tPulse);
      }
    }

    // Step 2 highlights
    if (this.pinStandRing) {
      const showPinStand = (this.currentStep === 2 && !this.guidePinsEquipped);
      this.pinStandRing.visible = showPinStand;
      if (showPinStand) {
        this.pinStandRing.rotation.z += 0.03;
        this.pinStandRing.scale.set(tPulse, tPulse, tPulse);
      }
    }
    if (this.diagonalPinHoles) {
      this.diagonalPinHoles.forEach((d) => {
        const pinIdx = d.holeIdx === 0 ? 0 : 1;
        const showHole = (this.currentStep === 2 && !this.guidePinsInstalled[pinIdx]);
        d.mesh.visible = showHole;
        if (showHole) {
          d.mesh.rotation.z += 0.03;
          d.mesh.scale.set(tPulse, tPulse, tPulse);
        }
      });
    }

    // Step 3 highlights
    if (this.newGyroRing) {
      const showNewGyro = (this.currentStep === 3 && !this.newGyroMounted);
      this.newGyroRing.visible = showNewGyro;
      if (showNewGyro) {
        this.newGyroRing.rotation.z += 0.02;
        this.newGyroRing.scale.set(tPulse, tPulse, tPulse);
      }
    }
    if (this.boltTorqueHighlights) {
      this.boltTorqueHighlights.forEach((ring, i) => {
        const showTorque = (this.currentStep === 3 && this.newGyroMounted && !this.bolts[i].torqued);
        ring.visible = showTorque;
        if (showTorque) {
          ring.rotation.z += 0.03;
          ring.scale.set(tPulse, tPulse, tPulse);
        }
      });
    }

    // Update Torque Gauge while mouse or space is held down
    if (this.torqueGaugeActive) {
      const elapsed = (performance.now() - this.torqueHoldStartTime) / 1000;
      // Reaches 30 N-m at ~1.85 seconds, maxes out at 45 N-m at ~2.8 seconds
      this.currentTorqueVal = Math.min(45, elapsed * 16.0);

      const numEl = (this.ui && this.ui.gaugeNum) ? this.ui.gaugeNum : this.container.querySelector('#gaugeTorqueNum');
      const fillEl = (this.ui && this.ui.gaugeFill) ? this.ui.gaugeFill : this.container.querySelector('#gaugeFillCircle');
      const hintEl = (this.ui && this.ui.gaugeHint) ? this.ui.gaugeHint : this.container.querySelector('#gaugeLiveStatus');

      if (numEl) numEl.textContent = this.currentTorqueVal.toFixed(1);

      // Sweet Spot Window: 26.5 N-m to 33.5 N-m (centered on 30.0 N-m)
      const inSweetSpot = (this.currentTorqueVal >= 26.5 && this.currentTorqueVal <= 33.5);

      if (inSweetSpot && !this.hasPlayedSweetSpotTone) {
        this.hasPlayedSweetSpotTone = true;
        this.playSweetSpotCue();
      }

      if (hintEl) {
        if (inSweetSpot) {
          hintEl.innerHTML = '<span style="color: #10b981; font-weight: 700; font-size: 13px; text-shadow: 0 0 10px #10b981;">★★★ RELEASE NOW! [30 N·m TARGET] ★★★</span>';
        } else if (this.currentTorqueVal > 33.5) {
          hintEl.innerHTML = '<span style="color: #ef4444; font-weight: 700; font-size: 12px;">⚠️ OVER-TORQUED! RELEASE TO RETRY</span>';
        } else {
          hintEl.innerHTML = '<span style="color: #38bdf8; font-size: 11px;">HOLDING... REACHING GREEN ZONE (30 N·m)</span>';
        }
      }

      if (fillEl) {
        // Circumference = 2 * PI * 65 ≈ 408.4
        const maxVal = 45.0;
        const pct = Math.min(1.0, this.currentTorqueVal / maxVal);
        const offset = 408.4 * (1 - pct);
        fillEl.style.strokeDashoffset = offset;

        // Change color dynamically
        if (inSweetSpot) {
          fillEl.style.stroke = '#10b981'; // Green
          fillEl.style.filter = 'drop-shadow(0 0 8px #10b981)';
        } else if (this.currentTorqueVal > 33.5) {
          fillEl.style.stroke = '#ef4444'; // Red
          fillEl.style.filter = 'drop-shadow(0 0 6px #ef4444)';
        } else {
          fillEl.style.stroke = '#38bdf8'; // Blue
          fillEl.style.filter = 'none';
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  getState() {
    return {
      currentStep: this.currentStep,
      isComplete: this.isComplete,
      pgtEquipped: this.pgtEquipped,
      pgtMode: this.pgtMode,
      pgtTorqueSetting: this.pgtTorqueSetting,
      bolts: this.bolts.map(b => ({ id: b.id, unbolted: b.unbolted, torqued: b.torqued })),
      damagedGyroScrapped: this.damagedGyroScrapped,
      guidePinsInstalled: [...this.guidePinsInstalled],
      newGyroMounted: this.newGyroMounted
    };
  }

  restoreState(s) {
    if (!s) return;
    this.currentStep = s.currentStep || this.currentStep;
    this.isComplete = !!s.isComplete;
    this.pgtEquipped = !!s.pgtEquipped;
    this.pgtMode = s.pgtMode || this.pgtMode;
    this.pgtTorqueSetting = s.pgtTorqueSetting !== undefined ? s.pgtTorqueSetting : 30.0;

    if (s.damagedGyroScrapped) {
      this.damagedGyroScrapped = true;
      if (this.damagedGyroGroup) {
        this.damagedGyroGroup.position.set(-3.2, 0.2, -0.6);
        this.damagedGyroGroup.scale.set(0.6, 0.6, 0.6);
      }
    }

    if (s.guidePinsInstalled && Array.isArray(s.guidePinsInstalled)) {
      s.guidePinsInstalled.forEach((installed, pinIdx) => {
        if (installed && !this.guidePinsInstalled[pinIdx]) {
          const holeIdx = pinIdx === 0 ? 0 : 3;
          this.installGuidePin(pinIdx, holeIdx);
        }
      });
    }

    if (s.newGyroMounted) {
      this.newGyroMounted = true;
      if (this.newGyroGroup) {
        this.newGyroGroup.position.set(0, 0.35, 0);
      }
    }

    if (s.bolts && Array.isArray(s.bolts)) {
      s.bolts.forEach((savedB, idx) => {
        if (this.bolts[idx]) {
          this.bolts[idx].unbolted = !!savedB.unbolted;
          this.bolts[idx].torqued = !!savedB.torqued;
          if (this.bolts[idx].mesh) {
            if (this.bolts[idx].unbolted && !s.newGyroMounted) {
              this.bolts[idx].mesh.visible = false;
            } else if (s.newGyroMounted) {
              this.bolts[idx].mesh.visible = true;
              if (this.bolts[idx].torqued) {
                this.bolts[idx].mesh.position.y = this.bolts[idx].pos[1];
                if (this.bolts[idx].mesh.userData && this.bolts[idx].mesh.userData.checkMesh) {
                  this.bolts[idx].mesh.userData.checkMesh.visible = true;
                }
              } else {
                this.bolts[idx].mesh.position.y = this.bolts[idx].pos[1] + 0.35;
              }
            }
          }
        }
      });
    }

    if (this.isComplete) {
      if (this.moduleCompletionCheck) {
        this.moduleCompletionCheck.visible = true;
      }
    }

    this.updateTaskPanel();
    this.updatePgtHudUI();
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    if (this.keyUpHandler) window.removeEventListener('keyup', this.keyUpHandler);
    if (this.globalPointerUp) window.removeEventListener('pointerup', this.globalPointerUp);
    if (this.renderer && this.renderer.domElement) {
      try { this.renderer.dispose(); } catch (e) {}
      this.renderer.domElement.remove();
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Attach globally
window.Workbench3D = Workbench3D;
