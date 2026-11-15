/**
 * Horizon-X | NASA Space Mission Design Game
 * Network Workbench 3D: Desk No. 03 Interactive Telecom Assembly Station
 * 
 * Re-engineered to 100% parity with Mechanical Workbench (workbench3d.js):
 * - Task Suite 01: [SUB-TSK-N-01] High-Gain Antenna (HGA) Gimbal Drive & Transceiver Realignment
 *   Step 1: RF Coupler Extraction & 12 N·m Circular Torque Gauge Mini-Game
 *   Step 2: Ruby Laser Sight Mount & Dual-Axis Gimbal Crosshair Targeting Mini-Game
 *   Step 3: Vector Radar Carrier Phase Synchronization & Downlink Lock Mini-Game
 * 
 * - Task Suite 02: [SUB-TSK-N-02] SI-C&DH Fiber-Optic Bus Fusion Splice
 *   Step 1: Precision Fiber Stripping & 90° Mirror Diamond Cleaving Mini-Game
 *   Step 2: Automated Fusion Splicer V-Grooves & Microscopic Core D-Pad Alignment Mini-Game
 *   Step 3: Thermal Protection Sleeve & 3-Second Heating Oven Bake Mini-Game
 */

class NetworkWorkbench3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.onCompleteTask01 = options.onCompleteTask01 || null;
    this.onCompleteTask02 = options.onCompleteTask02 || null;

    // Active Task Mode: 'subtask01' (HGA) or 'subtask02' (Fiber Bus)
    this.activeTask = options.initialTask || 'subtask01';

    // Subtask 01 State Machine (Step 1: Coupler, Step 2: Gimbal Laser, Step 3: Vector Radar)
    this.n01Step = 1;
    this.n01 = {
      wrenchEquipped: true,
      wrenchMode: 'loosen', // 'loosen' or 'torque'
      oldCouplerLoosened: false,
      oldCouplerExtracted: false,
      newCouplerSeated: false,
      newCouplerTorqued: false,
      torqueValue: 0.0,
      targetTorque: 12.0,
      torqueGaugeActive: false,
      laserSightMounted: false,
      pitchAngle: -12.5, // Target: 0.0 ± 0.6 deg
      yawAngle: 18.0,    // Target: 0.0 ± 0.6 deg
      gimbalAligned: false,
      phaseAngle: 135.0, // Target: 0.0 ± 5.0 deg
      phaseLocked: false,
      isComplete: false
    };

    // Subtask 02 State Machine (Step 1: Strip/Cleave, Step 2: Splicer V-Grooves, Step 3: Sleeve & Oven)
    this.n02Step = 1;
    this.n02 = {
      fiberStripped: false,
      fiberCleaved: false,
      fiberInVGrooves: false,
      microX: -22, // Target: 0 ± 3 µm
      microY: 16,  // Target: 0 ± 3 µm
      microAligned: false,
      arcDischarged: false,
      sleeveApplied: false,
      ovenTimerRunning: false,
      ovenTimeLeft: 3.0,
      ovenComplete: false,
      isComplete: false
    };

    // 3D Scene Properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.interactiveObjects = [];
    this.animId = null;

    // 3D Model References
    this.models = {};
    this.highlightsGroup = null;

    // Vector Radar Canvas & Texture
    this.radarCanvas = null;
    this.radarCtx = null;
    this.radarTexture = null;
    this.radarAngle = 0;

    // Microscopic Alignment Screen Canvas & Texture
    this.microCanvas = null;
    this.microCtx = null;
    this.microTexture = null;

    // Audio & DOM UI
    this.audioCtx = null;
    this.ui = {};

    this.initAudio();
    this.init();
  }

  // -------------------------------------------------------------------------
  // WEB AUDIO SYNTHESIZER (Aerospace Procedural Sounds)
  // -------------------------------------------------------------------------
  isMuted() {
    if (typeof window.isNasaAudioMuted === 'function') {
      return window.isNasaAudioMuted();
    }
    return false;
  }

  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    } catch (e) {}

    if (this.container) {
      this.container.addEventListener('pointerdown', () => this.ensureAudio(), { passive: true });
    }
  }

  ensureAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  playBeep(freq = 1200, dur = 0.1, type = 'sine') {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + dur);
    } catch (e) {}
  }

  playPneumaticMotor(isLoosen = true) {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isLoosen ? 220 : 310, now);
      osc.frequency.linearRampToValueAtTime(isLoosen ? 340 : 420, now + 0.35);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playMotorSound(isLoosen = false) {
    this.playPneumaticMotor(isLoosen);
  }

  playTorqueClick() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playArcDischarge() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(3200, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.28);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playOvenHiss() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(now + 0.6);
    } catch (e) {}
  }

  playSuccessChime() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playBeep(f, 0.22, 'sine'), idx * 110);
    });
  }

  playErrorBuzz() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();
    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(110, now);
      osc2.frequency.setValueAtTime(116, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  showAlert(message, isError = true) {
    const col = document.getElementById('wbNetLowerErrorCol');
    const msg = document.getElementById('wbNetLowerErrorMsg');
    const icon = document.getElementById('wbNetErrorIcon');
    if (!col || !msg) return;

    msg.textContent = message;
    if (isError) {
      col.className = 'wb-figma-error-column error shake';
      clearTimeout(this.errorShakeTimer);
      this.errorShakeTimer = setTimeout(() => col.classList.remove('shake'), 450);
      if (icon) icon.textContent = '⚠️';
      if (window.showToast) window.showToast(message, '⚠️');
    } else {
      col.className = 'wb-figma-error-column success';
      if (icon) icon.textContent = '●';
    }
  }

  hasPurchased(id) {
    if (typeof window.isToolOperational === 'function') {
      return window.isToolOperational(id);
    }
    if (typeof window.hasPurchasedTool === 'function') {
      return window.hasPurchasedTool(id);
    }
    const gs = window.getNasaGameState ? window.getNasaGameState() : null;
    return !!(gs && ((gs.netInventory && gs.netInventory[id]) || (gs.netPurchased && gs.netPurchased[id])));
  }

  // -------------------------------------------------------------------------
  // INITIALIZATION & SCENE SETUP (Matching workbench3d.js)
  // -------------------------------------------------------------------------
  init() {
    if (!this.container) return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;

    // Scene with dark telemetry laboratory ambiance
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060911);

    // Camera positioned with crisp aerospace isometric overview
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 3.4, 3.6);
    this.camera.lookAt(0, 0.35, 0.15);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.createBenchSurface();
    this.buildHgaSubtask01();
    this.buildFiberSubtask02();
    this.createInteractiveHighlights();
    this.createDomOverlays();

    this.setupEvents();
    this.setTaskView(this.activeTask);

    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  setupLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    dirLight.position.set(3.5, 7.5, 4.2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    const cyanRim = new THREE.DirectionalLight(0x00f0ff, 0.55);
    cyanRim.position.set(-4.5, 4.0, -2.5);
    this.scene.add(cyanRim);

    const spot = new THREE.SpotLight(0xffffff, 1.3, 10, Math.PI / 4, 0.25);
    spot.position.set(0, 4.2, 0.2);
    spot.target.position.set(0, 0.2, 0);
    this.scene.add(spot);
    this.scene.add(spot.target);
  }

  // -------------------------------------------------------------------------
  // BENCH SURFACE & LAB PROPS
  // -------------------------------------------------------------------------
  createBenchSurface() {
    // 1. Heavy Anti-Static Telecom Desk Mat with genuine Work-bech-mat.jpeg
    let matTex = null;
    if (typeof THREE.TextureLoader !== 'undefined') {
      try {
        const texLoader = new THREE.TextureLoader();
        matTex = texLoader.load('assets/images/Work-bech-mat.jpeg');
      } catch (e) {
        console.warn('NetworkWorkbench3D: Mat texture load notice:', e);
      }
    }
    if (!matTex) {
      const matCanvas = document.createElement('canvas');
      matCanvas.width = 512;
      matCanvas.height = 512;
      const mctx = matCanvas.getContext('2d');
      mctx.fillStyle = '#061325';
      mctx.fillRect(0, 0, 512, 512);

      // RF Shielding Turquoise Grid
      mctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
      mctx.lineWidth = 1.5;
      for (let i = 0; i <= 512; i += 32) {
        mctx.beginPath(); mctx.moveTo(i, 0); mctx.lineTo(i, 512); mctx.stroke();
        mctx.beginPath(); mctx.moveTo(0, i); mctx.lineTo(512, i); mctx.stroke();
      }

      // NASA GSFC Telecom Markings
      mctx.fillStyle = 'rgba(52, 211, 153, 0.7)';
      mctx.font = 'bold 15px "Tektur", monospace';
      mctx.fillText('GSFC // TELECOM & RF FLIGHT BENCH [DESK 03]', 20, 36);
      mctx.fillText('ESD SHIELDED // 50-OHM COAXIAL MATCHING', 20, 490);

      matTex = new THREE.CanvasTexture(matCanvas);
    }
    const matGeo = new THREE.BoxGeometry(4.2, 0.04, 2.8);
    const matMat = new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.45, metalness: 0.2 });
    const matMesh = new THREE.Mesh(matGeo, matMat);
    matMesh.position.set(0, 0, 0);
    matMesh.receiveShadow = true;
    this.scene.add(matMesh);

    // Scrap Tray for old components
    const scrapBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
    scrapBox.position.set(-1.75, 0.06, 0.75);
    scrapBox.receiveShadow = true;
    this.scene.add(scrapBox);
    this.models.scrapTray = scrapBox;
  }

  // -------------------------------------------------------------------------
  // SUBTASK 01: [SUB-TSK-N-01] HIGH-GAIN ANTENNA (HGA) GIMBAL & TRANSCEIVER
  // -------------------------------------------------------------------------
  buildHgaSubtask01() {
    this.hgaGroup = new THREE.Group();
    this.hgaGroup.position.set(-0.35, 0, 0.1);

    // 1. Heavy Anodized Steel Rig Stand
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 0.14, 32), standMat);
    standBase.position.y = 0.07;
    standBase.receiveShadow = true;
    this.hgaGroup.add(standBase);

    // 2. Dual-Axis Knuckle Gimbal wrapped in Gold MLI Thermal Foil
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.22,
      emissive: 0x78350f,
      emissiveIntensity: 0.2
    });

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.32, 24), standMat);
    pillar.position.y = 0.26;
    this.hgaGroup.add(pillar);

    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), goldMat);
    knuckle.position.y = 0.46;
    this.hgaGroup.add(knuckle);

    // Gimbal Head Group (Rotated by Pitch and Yaw hand-cranks)
    this.gimbalHead = new THREE.Group();
    this.gimbalHead.position.set(0, 0.46, 0);
    this.models.gimbalHead = this.gimbalHead;
    this.hgaGroup.add(this.gimbalHead);

    // 3. Parabolic Antenna Reflector Dish (White composite ribbed dish)
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.35,
      roughness: 0.25,
      side: THREE.DoubleSide
    });
    const points = [];
    for (let deg = 0; deg <= 38; deg += 2) {
      const rad = (deg * Math.PI) / 180;
      points.push(new THREE.Vector2(Math.sin(rad) * 0.58, (1 - Math.cos(rad)) * 0.26));
    }
    const dishMesh = new THREE.Mesh(new THREE.LatheGeometry(points, 36), dishMat);
    dishMesh.rotation.x = Math.PI / 2;
    dishMesh.castShadow = true;
    this.gimbalHead.add(dishMesh);

    // Feed horn struts & central feed horn
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const strut1 = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.42, 12), strutMat);
    strut1.position.set(0.16, 0.16, -0.18);
    strut1.rotation.set(-0.4, 0.4, 0);
    this.gimbalHead.add(strut1);

    const strut2 = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.42, 12), strutMat);
    strut2.position.set(-0.16, -0.16, -0.18);
    strut2.rotation.set(0.4, -0.4, 0);
    this.gimbalHead.add(strut2);

    const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 16), goldMat);
    hornTip.rotation.x = -Math.PI / 2;
    hornTip.position.set(0, 0, -0.32);
    hornTip.name = 'targetHornTip';
    this.gimbalHead.add(hornTip);
    this.models.hornTip = hornTip;
    this.interactiveObjects.push(hornTip);

    // Ruby Laser Alignment Sight (Snaps to feed horn tip in Step 2)
    const laserDevice = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.2 })
    );
    laserDevice.rotation.x = Math.PI / 2;
    laserDevice.position.set(0, 0.06, -0.28);
    laserDevice.visible = false;
    this.gimbalHead.add(laserDevice);
    this.models.laserDevice = laserDevice;

    // Laser Raycast Beam (Thick, bright & depthTest disabled for guaranteed visibility)
    const beamMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 2.4, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.9, depthTest: false })
    );
    beamMesh.renderOrder = 9997;
    beamMesh.rotation.x = Math.PI / 2;
    beamMesh.position.set(0, 0.06, -1.38);
    beamMesh.visible = false;
    this.gimbalHead.add(beamMesh);
    this.models.laserBeam = beamMesh;

    // 4. RF Waveguide Coupler Port (Step 1 Target)
    const portBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16), standMat);
    portBase.position.set(0.22, 0.06, 0.1);
    this.gimbalHead.add(portBase);

    // Cracked Silver Coupler
    const oldCoupler = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.5 })
    );
    oldCoupler.position.set(0.22, 0.13, 0.1);
    oldCoupler.name = 'targetOldCoupler';
    this.gimbalHead.add(oldCoupler);
    this.models.oldCoupler = oldCoupler;
    this.interactiveObjects.push(oldCoupler);

    // Replacement Gold Waveguide Coupler
    const newCoupler = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.15, emissive: 0xb45309, emissiveIntensity: 0.25 })
    );
    newCoupler.position.set(0.22, 0.13, 0.1);
    newCoupler.visible = false;
    newCoupler.name = 'targetNewCoupler';
    this.gimbalHead.add(newCoupler);
    this.models.newCoupler = newCoupler;
    this.interactiveObjects.push(newCoupler);

    // Cleanroom Wall Target Grid (For Laser Crosshairs)
    this.createWallTargetGrid();

    // Vector Signal Tracking Station Console (For Step 3 Radar)
    this.createRadarStationConsole();

    this.scene.add(this.hgaGroup);
  }

  createWallTargetGrid() {
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512;
    wallCanvas.height = 512;
    const wctx = wallCanvas.getContext('2d');

    wctx.fillStyle = '#0a101d';
    wctx.fillRect(0, 0, 512, 512);

    // Target Grid
    wctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    wctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 32) {
      wctx.beginPath(); wctx.moveTo(i, 0); wctx.lineTo(i, 512); wctx.stroke();
      wctx.beginPath(); wctx.moveTo(0, i); wctx.lineTo(512, i); wctx.stroke();
    }

    // Center Crosshairs
    wctx.strokeStyle = '#ef4444';
    wctx.lineWidth = 3;
    wctx.beginPath(); wctx.moveTo(256, 120); wctx.lineTo(256, 392); wctx.stroke();
    wctx.beginPath(); wctx.moveTo(120, 256); wctx.lineTo(392, 256); wctx.stroke();

    // Tolerance Ring
    wctx.strokeStyle = '#38bdf8';
    wctx.lineWidth = 2.5;
    wctx.beginPath(); wctx.arc(256, 256, 48, 0, Math.PI * 2); wctx.stroke();

    wctx.fillStyle = '#38bdf8';
    wctx.font = 'bold 16px "Tektur", monospace';
    wctx.fillText('TDRSS TARGET AXIS [0.0° / 0.0°]', 130, 80);

    const wallTex = new THREE.CanvasTexture(wallCanvas);
    const wallMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: wallTex }));
    wallMesh.position.set(-0.35, 0.65, -1.35);
    this.scene.add(wallMesh);
    this.models.wallGrid = wallMesh;

    // Laser Dot on the wall (Large, bold neon ruby reticle with glowing halo)
    const dotMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.065, 24),
      new THREE.MeshBasicMaterial({ color: 0xff0044, side: THREE.DoubleSide, depthTest: false })
    );
    dotMesh.renderOrder = 9999;
    dotMesh.position.set(-0.35, 0.65, -1.32);
    dotMesh.visible = false;
    this.scene.add(dotMesh);
    this.models.laserDot = dotMesh;

    const dotHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.065, 0.098, 24),
      new THREE.MeshBasicMaterial({ color: 0xff1133, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthTest: false })
    );
    dotHalo.renderOrder = 9998;
    dotHalo.position.set(0, 0, 0.001);
    dotMesh.add(dotHalo);
    this.models.laserDotHalo = dotHalo;
  }

  createRadarStationConsole() {
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(1.4, 0.45, -0.15);

    // Console Chassis Box
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.8), boxMat);
    consoleGroup.add(boxMesh);

    // Circular Vector Radar CRT Screen
    this.radarCanvas = document.createElement('canvas');
    this.radarCanvas.width = 512;
    this.radarCanvas.height = 512;
    this.radarCtx = this.radarCanvas.getContext('2d');
    this.radarTexture = new THREE.CanvasTexture(this.radarCanvas);

    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), new THREE.MeshBasicMaterial({ map: this.radarTexture }));
    screenMesh.position.set(-0.25, 0.02, 0.41);
    consoleGroup.add(screenMesh);
    this.models.radarScreen = screenMesh;

    // Physical Rotary Phase Dial
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const dialMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 24), knobMat);
    dialMesh.rotation.x = Math.PI / 2;
    dialMesh.position.set(0.35, -0.05, 0.42);
    dialMesh.name = 'targetPhaseDial';
    consoleGroup.add(dialMesh);
    this.models.phaseDial = dialMesh;
    this.interactiveObjects.push(dialMesh);

    this.scene.add(consoleGroup);
    this.models.radarConsole = consoleGroup;
  }

  // -------------------------------------------------------------------------
  // SUBTASK 02: [SUB-TSK-N-02] SI-C&DH FIBER-OPTIC BUS FUSION SPLICER
  // -------------------------------------------------------------------------
  buildFiberSubtask02() {
    this.fiberGroup = new THREE.Group();
    this.fiberGroup.position.set(-0.2, 0, 0.1);
    this.fiberGroup.visible = false;

    // 1. SI-C&DH Avionics Distribution Box
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
    const distBox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.24, 1.4), boxMat);
    distBox.position.set(0, 0.12, 0);
    distBox.receiveShadow = true;
    this.fiberGroup.add(distBox);

    // Orange fiber cable bundle
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, metalness: 0.2 });
    const bundle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 16), cableMat);
    bundle.rotation.z = Math.PI / 2;
    bundle.position.set(0, 0.26, 0.2);
    bundle.name = 'targetFiberCable';
    this.fiberGroup.add(bundle);
    this.models.fiberCable = bundle;
    this.interactiveObjects.push(bundle);

    // 2. Automated Fusion Splicer Box on Bench
    const splicerBox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.36, 0.65), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 }));
    splicerBox.position.set(0, 0.36, -0.15);
    this.fiberGroup.add(splicerBox);

    // Splicer 5-inch Microscopic LCD View Screen
    this.microCanvas = document.createElement('canvas');
    this.microCanvas.width = 512;
    this.microCanvas.height = 340;
    this.microCtx = this.microCanvas.getContext('2d');
    this.microTexture = new THREE.CanvasTexture(this.microCanvas);

    const microMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.42), new THREE.MeshBasicMaterial({ map: this.microTexture }));
    microMesh.position.set(0, 0.42, 0.18);
    this.fiberGroup.add(microMesh);
    this.models.microScreen = microMesh;

    // Electrodes inside splicer
    const elecMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 16), elecMat);
    spark.position.set(0, 0.42, -0.15);
    spark.visible = false;
    this.fiberGroup.add(spark);
    this.models.splicerSpark = spark;

    // Thermal Sleeve Mesh
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.25, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.85 })
    );
    sleeve.rotation.z = Math.PI / 2;
    sleeve.position.set(0, 0.26, 0.2);
    sleeve.visible = false;
    this.fiberGroup.add(sleeve);
    this.models.sleeveMesh = sleeve;

    this.scene.add(this.fiberGroup);
  }

  // -------------------------------------------------------------------------
  // INTERACTIVE HIGHLIGHTS (Pulsing Rings & Target Beacons matching workbench3d)
  // -------------------------------------------------------------------------
  createInteractiveHighlights() {
    this.highlightsGroup = new THREE.Group();

    // 1. Coupler Target Ring
    const cyanRingMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.couplerRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 8, 24), cyanRingMat);
    this.couplerRing.rotation.x = Math.PI / 2;
    this.couplerRing.position.set(-0.13, 0.62, 0.2);
    this.highlightsGroup.add(this.couplerRing);

    // 2. Feed Horn Tip Ring
    this.hornRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 24), cyanRingMat.clone());
    this.hornRing.position.set(-0.35, 0.46, -0.25);
    this.hornRing.visible = false;
    this.highlightsGroup.add(this.hornRing);

    // 3. Radar Dial Ring
    const greenRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.radarRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 24), greenRingMat);
    this.radarRing.position.set(1.75, 0.4, 0.28);
    this.radarRing.visible = false;
    this.highlightsGroup.add(this.radarRing);

    this.scene.add(this.highlightsGroup);
  }

  // -------------------------------------------------------------------------
  // DOM OVERLAYS: STEP CARD, TOOL SHELF, TORQUE GAUGE & TACTILE MINIGAMES
  // -------------------------------------------------------------------------
  createDomOverlays() {
    // 1. Top-Left Step Card (.wb-figma-step-card matching workbench3d.js)
    this.ui.taskPanel = document.createElement('div');
    this.ui.taskPanel.className = 'wb-figma-step-card';
    this.container.appendChild(this.ui.taskPanel);

    // 2. Right-Side Tool Shelf (.wb-figma-tool-shelf matching workbench3d.js)
    this.ui.toolShelf = document.createElement('div');
    this.ui.toolShelf.className = 'wb-figma-tool-shelf';
    this.ui.toolShelf.id = 'wbNetToolShelf';
    this.ui.toolShelf.innerHTML = `
      <div class="wb-figma-tool-card" id="cardToolWrench" data-tool="wrench" title="RF Pneumatic Torque Wrench">
        <div class="tool-img-box"><img src="assets/images/tool_rf_wrench.svg" alt="RF Wrench"></div>
        <span class="tool-name-label">RF WRENCH</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolLaser" data-tool="laser" title="Ruby Laser Alignment Sight">
        <div class="tool-img-box"><img src="assets/images/tool_laser_sight.svg" alt="Laser Sight"></div>
        <span class="tool-name-label">LASER SIGHT</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolStripper" data-tool="stripper" title="Fiber Stripper & Cleaver">
        <div class="tool-img-box"><img src="assets/images/tool_fiber_stripper.svg" alt="Stripper"></div>
        <span class="tool-name-label">FIBER TOOL</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolCoupler" data-tool="coupler" title="Gold RF Waveguide Coupler">
        <div class="tool-img-box"><img src="assets/images/part_coupler.svg" alt="Coupler"></div>
        <span class="tool-name-label">RF COUPLER</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolSplicer" data-tool="splicer" title="Fusion Splicer Module">
        <div class="tool-img-box"><img src="assets/images/part_splice_module.svg" alt="Splicer"></div>
        <span class="tool-name-label">SPLICER</span>
      </div>
    `;
    this.container.appendChild(this.ui.toolShelf);

    // 3. Circular Timing Torque Gauge (.wb3d-circular-gauge-wrap matching workbench3d.js 1:1)
    this.ui.circularGauge = document.createElement('div');
    this.ui.circularGauge.className = 'wb3d-circular-gauge-wrap hidden';
    this.ui.circularGauge.innerHTML = `
      <div class="gauge-card" style="position:relative;">
        <button type="button" class="gauge-close-btn" id="btnCloseNetGauge" style="position:absolute; top:8px; right:12px; background:transparent; border:none; color:#94a3b8; font-size:22px; font-weight:700; cursor:pointer; line-height:1;" title="Close Gauge">&times;</button>
        <div class="gauge-title">RF WAVEGUIDE TORQUE LOCK</div>
        <svg class="gauge-svg" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="65" class="gauge-track"></circle>
          <!-- Green Target Zone Arc (10.5 to 13.5 N·m on an 18 N·m scale, perfectly aligned) -->
          <circle cx="80" cy="80" r="65" class="gauge-target-zone" style="stroke-dasharray: 68 340.4; stroke-dashoffset: -238; stroke: #10b981; stroke-width: 14;"></circle>
          <!-- Dynamic fill circle (starts at 408.4 = 0%) -->
          <circle cx="80" cy="80" r="65" class="gauge-fill" id="gaugeNetFillCircle" style="stroke-dasharray: 408.4; stroke-dashoffset: 408.4; stroke-linecap: round;"></circle>
        </svg>
        <div class="gauge-readout">
          <span class="gauge-num" id="gaugeNetTorqueNum">0.0</span>
          <span class="gauge-unit">N·m</span>
        </div>
        <div class="gauge-hint" id="gaugeNetLiveStatus">HOLD [MOUSE or SPACE] &amp; RELEASE IN GREEN ZONE (12 N·m)</div>
        <button type="button" class="gauge-torque-btn" id="btnGaugeNetHoldTorque">⚡ HOLD TO TORQUE [SPACE / CLICK]</button>
      </div>
    `;
    this.container.appendChild(this.ui.circularGauge);

    this.ui.gaugeNum = this.ui.circularGauge.querySelector('#gaugeNetTorqueNum');
    this.ui.gaugeFill = this.ui.circularGauge.querySelector('#gaugeNetFillCircle');
    this.ui.gaugeHint = this.ui.circularGauge.querySelector('#gaugeNetLiveStatus');
    this.ui.gaugeBtn = this.ui.circularGauge.querySelector('#btnGaugeNetHoldTorque');
    this.ui.gaugeClose = this.ui.circularGauge.querySelector('#btnCloseNetGauge');

    if (this.ui.gaugeClose) {
      this.ui.gaugeClose.onclick = () => {
        this.n01.isHoldingTorque = false;
        if (this.ui.circularGauge) this.ui.circularGauge.classList.add('hidden');
      };
    }

    // 4. Interactive Tactile Controls Panel (.wb-net-controls-panel)
    this.ui.controlsPanel = document.createElement('div');
    this.ui.controlsPanel.className = 'wb-net-controls-panel';
    this.ui.controlsPanel.innerHTML = `
      <!-- Wrench Mode Toggle -->
      <div class="net-ctrl-group" id="grpNetWrenchMode">
        <span class="net-ctrl-lbl">RF TORQUE WRENCH MODE:</span>
        <div style="display:flex; gap:8px;">
          <button type="button" class="net-toggle-btn active" id="btnNetWrenchLoosen">LOOSEN</button>
          <button type="button" class="net-toggle-btn" id="btnNetWrenchTorque">TORQUE [12 N·m]</button>
        </div>
      </div>

      <!-- Gimbal Cranks -->
      <div class="net-ctrl-group hidden" id="grpNetGimbalCranks">
        <div id="netLaserHudBox" style="background:#020617; border:1px solid #ef4444; border-radius:6px; padding:6px 12px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#ef4444; box-shadow:0 0 8px #ef4444;"></span>
            <span style="font-size:12px; font-weight:700; color:#ef4444; letter-spacing:1px;">RED LASER SIGHT ACTIVE</span>
          </div>
          <button type="button" id="btnNetAutoAlignGimbal" style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#ffffff; padding:3px 10px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:700; transition:all 0.2s;">🎯 AUTO-CENTER (0.0°)</button>
        </div>
        <span class="net-ctrl-lbl">GIMBAL DUAL-AXIS HAND-CRANKS (TARGET CENTER CROSSHAIRS):</span>
        <div class="net-slider-row" style="display:flex; align-items:center; gap:8px;">
          <span style="min-width:48px;">PITCH:</span>
          <button type="button" class="dpad-btn" id="btnNetPitchDec" style="width:30px; height:26px;">◄</button>
          <input type="range" min="-30" max="30" step="0.5" value="-12.5" id="sliderNetPitch" class="net-range-input">
          <button type="button" class="dpad-btn" id="btnNetPitchInc" style="width:30px; height:26px;">►</button>
          <span id="txtNetPitchVal" style="min-width:46px; text-align:right;">-12.5°</span>
        </div>
        <div class="net-slider-row" style="display:flex; align-items:center; gap:8px;">
          <span style="min-width:48px;">YAW:</span>
          <button type="button" class="dpad-btn" id="btnNetYawDec" style="width:30px; height:26px;">◄</button>
          <input type="range" min="-30" max="30" step="0.5" value="18" id="sliderNetYaw" class="net-range-input">
          <button type="button" class="dpad-btn" id="btnNetYawInc" style="width:30px; height:26px;">►</button>
          <span id="txtNetYawVal" style="min-width:46px; text-align:right;">+18.0°</span>
        </div>
      </div>

      <!-- Phase Radar Dial -->
      <div class="net-ctrl-group hidden" id="grpNetPhaseDial">
        <span class="net-ctrl-lbl">VECTOR PHASE SYNCHRONIZATION (MERGE SIGNAL DOTS):</span>
        <div class="net-slider-row" style="display:flex; align-items:center; gap:8px;">
          <span style="min-width:64px;">PHASE Δφ:</span>
          <button type="button" class="dpad-btn" id="btnNetPhaseDec" style="width:30px; height:26px;">◄</button>
          <input type="range" min="0" max="360" step="1" value="135" id="sliderNetPhase" class="net-range-input">
          <button type="button" class="dpad-btn" id="btnNetPhaseInc" style="width:30px; height:26px;">►</button>
          <span id="txtNetPhaseVal" style="min-width:42px; text-align:right;">135°</span>
        </div>
        <button type="button" class="net-action-btn primary" id="btnNetLockPhase" disabled>⚡ ENGAGE CARRIER LOCK</button>
      </div>

      <!-- Fiber Prep Buttons -->
      <div class="net-ctrl-group hidden" id="grpNetFiberPrep">
        <button type="button" class="net-action-btn" id="btnNetStrip">1. STRIP BUFFER JACKET</button>
        <button type="button" class="net-action-btn" id="btnNetCleave" disabled>2. CLEAVE 90° FLAT CUT</button>
        <button type="button" class="net-action-btn" id="btnNetSeatVGrooves" disabled>3. PLACE IN V-GROOVES</button>
      </div>

      <!-- Micro D-Pad -->
      <div class="net-ctrl-group hidden" id="grpNetMicroAlign">
        <span class="net-ctrl-lbl">MICROSCOPIC CORE D-PAD (ALIGN WITHIN ±3µm):</span>
        <div class="net-dpad-grid" style="display:flex; flex-direction:column; align-items:center; gap:4px;">
          <button type="button" class="dpad-btn" id="dpadNetUp">▲</button>
          <div style="display:flex; gap:16px;">
            <button type="button" class="dpad-btn" id="dpadNetLeft">◀</button>
            <button type="button" class="dpad-btn" id="dpadNetRight">▶</button>
          </div>
          <button type="button" class="dpad-btn" id="dpadNetDown">▼</button>
        </div>
        <button type="button" class="net-action-btn primary" id="btnNetFuseArc" disabled style="margin-top:6px;">⚡ DISCHARGE ELECTRIC ARC [FUSE]</button>
      </div>

      <!-- Thermal Oven -->
      <div class="net-ctrl-group hidden" id="grpNetOvenShrink">
        <button type="button" class="net-action-btn" id="btnNetSlideSleeve">APPLY THERMAL SLEEVE</button>
        <button type="button" class="net-action-btn primary" id="btnNetBakeOven" disabled>BAKE 3S IN HEATING OVEN</button>
      </div>
    `;
    this.container.appendChild(this.ui.controlsPanel);

    this.bindDomEvents();
    this.updateTaskPanel();
  }

  // -------------------------------------------------------------------------
  // DOM EVENT BINDINGS
  // -------------------------------------------------------------------------
  bindDomEvents() {
    // Wrench Mode Toggle
    const btnLoosen = document.getElementById('btnNetWrenchLoosen');
    const btnTorque = document.getElementById('btnNetWrenchTorque');
    if (btnLoosen && btnTorque) {
      btnLoosen.onclick = () => {
        this.n01.wrenchMode = 'loosen';
        btnLoosen.classList.add('active');
        btnTorque.classList.remove('active');
        this.playBeep(1200, 0.08);
        this.updateTaskPanel();
      };
      btnTorque.onclick = () => {
        this.n01.wrenchMode = 'torque';
        btnTorque.classList.add('active');
        btnLoosen.classList.remove('active');
        this.playBeep(1600, 0.08);
        this.updateTaskPanel();
      };
    }

    // Gimbal Pitch & Yaw
    const sPitch = document.getElementById('sliderNetPitch');
    const sYaw = document.getElementById('sliderNetYaw');
    const tPitch = document.getElementById('txtNetPitchVal');
    const tYaw = document.getElementById('txtNetYawVal');

    const onGimbalChange = () => {
      if (sPitch) this.n01.pitchAngle = parseFloat(sPitch.value);
      if (sYaw) this.n01.yawAngle = parseFloat(sYaw.value);
      if (tPitch) tPitch.textContent = (this.n01.pitchAngle > 0 ? '+' : '') + this.n01.pitchAngle.toFixed(1) + '°';
      if (tYaw) tYaw.textContent = (this.n01.yawAngle > 0 ? '+' : '') + this.n01.yawAngle.toFixed(1) + '°';
      this.updateGimbalRotation();
    };
    if (sPitch) sPitch.oninput = onGimbalChange;
    if (sYaw) sYaw.oninput = onGimbalChange;

    const btnAutoAlign = document.getElementById('btnNetAutoAlignGimbal');
    if (btnAutoAlign) {
      btnAutoAlign.onclick = () => {
        this.n01.pitchAngle = 0.0;
        this.n01.yawAngle = 0.0;
        if (sPitch) sPitch.value = 0.0;
        if (sYaw) sYaw.value = 0.0;
        onGimbalChange();
        this.playBeep(2475, 0.25);
      };
    }

    // Step Buttons for Pitch & Yaw
    const btnPitchDec = document.getElementById('btnNetPitchDec');
    const btnPitchInc = document.getElementById('btnNetPitchInc');
    const btnYawDec = document.getElementById('btnNetYawDec');
    const btnYawInc = document.getElementById('btnNetYawInc');
    if (btnPitchDec) btnPitchDec.onclick = () => {
      this.n01.pitchAngle = Math.max(-30, this.n01.pitchAngle - 1.0);
      if (sPitch) sPitch.value = this.n01.pitchAngle;
      onGimbalChange();
      this.playTorqueClick();
    };
    if (btnPitchInc) btnPitchInc.onclick = () => {
      this.n01.pitchAngle = Math.min(30, this.n01.pitchAngle + 1.0);
      if (sPitch) sPitch.value = this.n01.pitchAngle;
      onGimbalChange();
      this.playTorqueClick();
    };
    if (btnYawDec) btnYawDec.onclick = () => {
      this.n01.yawAngle = Math.max(-30, this.n01.yawAngle - 1.0);
      if (sYaw) sYaw.value = this.n01.yawAngle;
      onGimbalChange();
      this.playTorqueClick();
    };
    if (btnYawInc) btnYawInc.onclick = () => {
      this.n01.yawAngle = Math.min(30, this.n01.yawAngle + 1.0);
      if (sYaw) sYaw.value = this.n01.yawAngle;
      onGimbalChange();
      this.playTorqueClick();
    };

    // Phase Dial & Step Buttons
    const sPhase = document.getElementById('sliderNetPhase');
    const tPhase = document.getElementById('txtNetPhaseVal');
    const bLock = document.getElementById('btnNetLockPhase');
    const btnPhaseDec = document.getElementById('btnNetPhaseDec');
    const btnPhaseInc = document.getElementById('btnNetPhaseInc');

    const onPhaseChange = () => {
      if (tPhase) tPhase.textContent = Math.round(this.n01.phaseAngle) + '°';
      const diff = Math.min(this.n01.phaseAngle, 360 - this.n01.phaseAngle);
      if (bLock) bLock.disabled = (diff > 5.0);
    };

    if (sPhase) {
      sPhase.oninput = () => {
        this.n01.phaseAngle = parseFloat(sPhase.value);
        onPhaseChange();
      };
    }
    if (btnPhaseDec) btnPhaseDec.onclick = () => {
      this.n01.phaseAngle = (this.n01.phaseAngle - 5 + 360) % 360;
      if (sPhase) sPhase.value = this.n01.phaseAngle;
      onPhaseChange();
      this.playBeep(900, 0.05);
    };
    if (btnPhaseInc) btnPhaseInc.onclick = () => {
      this.n01.phaseAngle = (this.n01.phaseAngle + 5) % 360;
      if (sPhase) sPhase.value = this.n01.phaseAngle;
      onPhaseChange();
      this.playBeep(1100, 0.05);
    };
    if (bLock) bLock.onclick = () => this.lockCarrierPhase();

    // Wire Lower Footer Mode Switcher
    const btnNetModePrev = document.getElementById('btnWbNetModePrev');
    const btnNetModeNext = document.getElementById('btnWbNetModeNext');
    const toggleNetMode = () => {
      const modeText = document.getElementById('wbNetFooterModeText');
      if (modeText) {
        if (modeText.textContent.includes('Ku-Band')) {
          modeText.textContent = '[ S-Band | Omnidirectional ]';
        } else {
          modeText.textContent = '[ Ku-Band | High Gain ]';
        }
      }
      this.playBeep(1400, 0.06);
    };
    if (btnNetModePrev) btnNetModePrev.onclick = toggleNetMode;
    if (btnNetModeNext) btnNetModeNext.onclick = toggleNetMode;

    // Fiber Prep Buttons
    const bStrip = document.getElementById('btnNetStrip');
    const bCleave = document.getElementById('btnNetCleave');
    const bSeat = document.getElementById('btnNetSeatVGrooves');
    if (bStrip) bStrip.onclick = () => this.stripFiber();
    if (bCleave) bCleave.onclick = () => this.cleaveFiber();
    if (bSeat) bSeat.onclick = () => this.placeFiberInVGrooves();

    // D-Pad
    const dUp = document.getElementById('dpadNetUp');
    const dDown = document.getElementById('dpadNetDown');
    const dLeft = document.getElementById('dpadNetLeft');
    const dRight = document.getElementById('dpadNetRight');
    if (dUp) dUp.onclick = () => this.adjustMicroCore(0, -2);
    if (dDown) dDown.onclick = () => this.adjustMicroCore(0, 2);
    if (dLeft) dLeft.onclick = () => this.adjustMicroCore(-2, 0);
    if (dRight) dRight.onclick = () => this.adjustMicroCore(2, 0);

    const bFuse = document.getElementById('btnNetFuseArc');
    if (bFuse) bFuse.onclick = () => this.dischargeArc();

    const bSleeve = document.getElementById('btnNetSlideSleeve');
    const bBake = document.getElementById('btnNetBakeOven');
    if (bSleeve) bSleeve.onclick = () => this.applyThermalSleeve();
    if (bBake) bBake.onclick = () => this.startOvenBake();

    // Tool Shelf Clicks with strict NASA procurement verification
    const cWrench = this.ui.toolShelf.querySelector('#cardToolWrench');
    const cLaser = this.ui.toolShelf.querySelector('#cardToolLaser');
    const cStripper = this.ui.toolShelf.querySelector('#cardToolStripper');
    const cCoupler = this.ui.toolShelf.querySelector('#cardToolCoupler');
    const cSplicer = this.ui.toolShelf.querySelector('#cardToolSplicer');

    if (cWrench) cWrench.onclick = () => {
      if (!this.hasPurchased('rf_wrench')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase RF Torque Wrench from Desk 03 Laptop first!", true);
        return;
      }
      if (!this.n01.oldCouplerLoosened || !this.n01.oldCouplerExtracted) this.handleSilverCouplerClick();
      else if (this.n01.newCouplerSeated && !this.n01.newCouplerTorqued) this.startTorqueGauge();
    };
    if (cLaser) cLaser.onclick = () => {
      if (!this.hasPurchased('laser_sight')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase Laser Alignment Sight from Desk 03 Laptop first!", true);
        return;
      }
      this.handleFeedHornClick();
    };
    if (cStripper) cStripper.onclick = () => {
      if (!this.hasPurchased('fiber_stripper')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase Precision Fiber Stripper from Desk 03 Laptop first!", true);
        return;
      }
      if (!this.n02.fiberStripped) this.stripFiber();
      else if (!this.n02.fiberCleaved) this.cleaveFiber();
    };
    if (cCoupler) cCoupler.onclick = () => {
      if (!this.hasPurchased('coupler')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT COMPONENT MISSING: Please requisition Gold RF Coupler from Desk 03 Laptop first!", true);
        return;
      }
      this.handleGoldCouplerClick();
    };
    if (cSplicer) cSplicer.onclick = () => {
      if (!this.hasPurchased('splice_module')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please requisition Fusion Splice Module from Desk 03 Laptop first!", true);
        return;
      }
      if (!this.n02.fiberInVGrooves) this.placeFiberInVGrooves();
      else if (!this.n02.arcDischarged) this.dischargeArc();
      else if (!this.n02.sleeveApplied) this.applyThermalSleeve();
      else if (!this.n02.ovenComplete) this.startOvenBake();
    };

    // Circular Torque Gauge Holding Events (Precision Pointer Capture & Window Fallbacks)
    if (this.ui.gaugeBtn) {
      this.ui.gaugeBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.startHoldingTorque(e);
      });
      this.ui.gaugeBtn.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.finishHoldingTorque(e);
      });
      this.ui.gaugeBtn.addEventListener('pointercancel', (e) => {
        this.finishHoldingTorque(e);
      });
      this.ui.gaugeBtn.addEventListener('pointerleave', (e) => {
        if (this.n01 && this.n01.isHoldingTorque) {
          this.finishHoldingTorque(e);
        }
      });
    }

    if (this.ui.circularGauge) {
      this.ui.circularGauge.addEventListener('pointerdown', (e) => {
        if (e.target === this.ui.gaugeClose || (this.ui.gaugeClose && this.ui.gaugeClose.contains(e.target))) return;
        if (e.target === this.ui.gaugeBtn) return;
        e.stopPropagation();
        e.preventDefault();
        this.startHoldingTorque(e);
      });
      this.ui.circularGauge.addEventListener('pointerup', (e) => {
        if (e.target === this.ui.gaugeClose) return;
        if (e.target === this.ui.gaugeBtn) return;
        e.stopPropagation();
        e.preventDefault();
        this.finishHoldingTorque(e);
      });
    }

    // Window-level release safety so releasing anywhere outside button is captured
    window.addEventListener('pointerup', (e) => {
      if (this.n01 && this.n01.isHoldingTorque) {
        this.finishHoldingTorque(e);
      }
    });
    window.addEventListener('pointercancel', (e) => {
      if (this.n01 && this.n01.isHoldingTorque) {
        this.finishHoldingTorque(e);
      }
    });
    window.addEventListener('blur', () => {
      if (this.n01 && this.n01.isHoldingTorque) {
        this.finishHoldingTorque();
      }
    });

    // Spacebar hold support
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        if (this.ui.circularGauge && !this.ui.circularGauge.classList.contains('hidden') && !this.n01.isHoldingTorque && !this.n01.newCouplerTorqued) {
          e.preventDefault();
          this.startHoldingTorque();
        }
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.n01 && this.n01.isHoldingTorque) {
        e.preventDefault();
        this.finishHoldingTorque();
      }
    });
  }

  // -------------------------------------------------------------------------
  // UPDATE STEP CARD & PROGRESS PANEL (Matching workbench3d.js)
  // -------------------------------------------------------------------------
  updateTaskPanel() {
    if (!this.ui.taskPanel) return;

    let stepTitle = '';
    let stepLines = '';
    let footerPrompt = '';

    if (this.activeTask === 'subtask01') {
      if (this.n01Step === 1) {
        stepTitle = 'Step 1 : RF Coupler Replacement & Torque Lock';
        stepLines = `
          <div class="step-instruction-line">${this.n01.oldCouplerLoosened ? '✓' : '•'} Set RF Wrench to [LOOSEN] & click silver coupler</div>
          <div class="step-instruction-line">${this.n01.oldCouplerExtracted ? '✓' : '•'} Extract cracked silver coupler to scrap tray</div>
          <div class="step-instruction-line">${this.n01.newCouplerSeated ? '✓' : '•'} Seat replacement Gold Waveguide Coupler</div>
          <div class="step-instruction-line">${this.n01.newCouplerTorqued ? '✓' : '•'} Hold & release torque gauge in green target zone (12 N·m)</div>
        `;
        footerPrompt = !this.n01.oldCouplerLoosened ? 'CLICK SILVER RF COUPLER TO LOOSEN (WRENCH: LOOSEN)' :
                       !this.n01.oldCouplerExtracted ? 'CLICK LOOSENED COUPLER TO EXTRACT TO SCRAP TRAY' :
                       !this.n01.newCouplerSeated ? 'CLICK GOLD RF WAVEGUIDE TO SLIDE INTO SOCKET' :
                       'HOLD [MOUSE / SPACE] TO TORQUE TO 12 N·m';
      } else if (this.n01Step === 2) {
        stepTitle = 'Step 2 : Laser Sight & Dual-Axis Gimbal Alignment';
        stepLines = `
          <div class="step-instruction-line">${this.n01.laserSightMounted ? '✓' : '•'} Click antenna feed horn to snap Ruby Laser Sight</div>
          <div class="step-instruction-line">${this.n01.gimbalAligned ? '✓' : '•'} Adjust Pitch & Yaw hand-cranks until dot centers on wall crosshairs (±0.6°)</div>
        `;
        footerPrompt = !this.n01.laserSightMounted ? 'CLICK FEED HORN TIP TO MOUNT RUBY LASER SIGHT' :
                       'ADJUST PITCH & YAW TO CENTER RED LASER IN CROSSHAIRS';
      } else if (this.n01Step === 3) {
        stepTitle = 'Step 3 : Vector Radar Carrier Phase Synchronization';
        stepLines = `
          <div class="step-instruction-line">• Rotate Phase Δφ dial until Hubble & TDRSS dots merge</div>
          <div class="step-instruction-line">${this.n01.phaseLocked ? '✓' : '•'} Click [ENGAGE CARRIER LOCK] to establish telemetry stream</div>
        `;
        footerPrompt = !this.n01.phaseLocked ? 'TURN PHASE DIAL UNTIL DOTS MERGE, THEN ENGAGE LOCK' :
                       'SUBTASK N-01 COMPLETE! KU-BAND DOWNLINK ONLINE';
      }
    } else {
      if (this.n02Step === 1) {
        stepTitle = 'Step 1 : Precision Fiber Stripping & Diamond Cleaving';
        stepLines = `
          <div class="step-instruction-line">${this.n02.fiberStripped ? '✓' : '•'} Click [STRIP BUFFER JACKET] to peel outer coating</div>
          <div class="step-instruction-line">${this.n02.fiberCleaved ? '✓' : '•'} Click [CLEAVE 90° FLAT CUT] for optical mirror face</div>
        `;
        footerPrompt = !this.n02.fiberStripped ? 'CLICK [STRIP BUFFER JACKET] TO EXPOSE GLASS CORE' :
                       'CLICK [CLEAVE 90° FLAT CUT] FOR MIRROR FACE';
      } else if (this.n02Step === 2) {
        stepTitle = 'Step 2 : Automated Splicer V-Grooves & Micro-Alignment';
        stepLines = `
          <div class="step-instruction-line">${this.n02.fiberInVGrooves ? '✓' : '•'} Click [PLACE IN V-GROOVES] to clamp fiber ends</div>
          <div class="step-instruction-line">${this.n02.microAligned ? '✓' : '•'} Use D-Pad arrows to align X & Y cores within ±3µm</div>
          <div class="step-instruction-line">${this.n02.arcDischarged ? '✓' : '•'} Click [DISCHARGE ELECTRIC ARC] to weld cores</div>
        `;
        footerPrompt = !this.n02.fiberInVGrooves ? 'CLICK [PLACE IN V-GROOVES] TO CLAMP FIBERS' :
                       !this.n02.microAligned ? 'USE D-PAD ARROWS TO ALIGN CORES WITHIN ±3µm' :
                       'CLICK [DISCHARGE ELECTRIC ARC] TO FUSE GLASS';
      } else if (this.n02Step === 3) {
        stepTitle = 'Step 3 : Thermal Protection Sleeve & Heating Oven Bake';
        stepLines = `
          <div class="step-instruction-line">${this.n02.sleeveApplied ? '✓' : '•'} Click [APPLY THERMAL SLEEVE] over welded joint</div>
          <div class="step-instruction-line">${this.n02.ovenComplete ? '✓' : '•'} Click [BAKE 3S IN HEATING OVEN] & cool for certification</div>
        `;
        footerPrompt = !this.n02.sleeveApplied ? 'CLICK [APPLY THERMAL SLEEVE] OVER WELDED JOINT' :
                       !this.n02.ovenComplete ? 'CLICK [BAKE 3S IN HEATING OVEN] TO SHRINK-SEAL' :
                       'NETWORK DEPARTMENT 100% OPERATIONAL! FLIGHT CERTIFIED';
      }
    }

    this.ui.taskPanel.innerHTML = `
      <div class="step-title-line">${stepTitle}</div>
      ${stepLines}
    `;

    const banner = document.getElementById('wbNetPromptText');
    if (banner) banner.textContent = footerPrompt;

    this.updateControlsVisibility();
    this.updateToolShelf();

    // Sync Lower Footer Readouts
    const torqueEl = document.getElementById('wbNetFooterTorqueVal');
    if (torqueEl) {
      if (this.n01.newCouplerTorqued) torqueEl.textContent = '12.0 N·m [TORQUED]';
      else torqueEl.textContent = this.n01.torqueValue.toFixed(1) + ' N·m';
    }
    const errEl = document.getElementById('wbNetLowerErrorMsg');
    if (errEl) {
      if (this.n01.isComplete && this.n02.isComplete) {
        errEl.textContent = 'TELEMETRY LOCKED // HIGH-GAIN DOWNLINK 100% OPERATIONAL';
        errEl.style.color = '#10b981';
      } else if (this.n01.isComplete) {
        errEl.textContent = 'HGA ALIGNED // SI-C&DH FIBER SPLICING REQUIRED';
        errEl.style.color = '#38bdf8';
      } else {
        errEl.textContent = 'SYSTEM READY // RF WAVEGUIDE IMPEDANCE 50Ω MATCHED';
        errEl.style.color = '#34d399';
      }
    }
  }

  updateControlsVisibility() {
    const grpWrench = document.getElementById('grpNetWrenchMode');
    const grpGimbal = document.getElementById('grpNetGimbalCranks');
    const grpPhase = document.getElementById('grpNetPhaseDial');
    const grpFiber = document.getElementById('grpNetFiberPrep');
    const grpMicro = document.getElementById('grpNetMicroAlign');
    const grpOven = document.getElementById('grpNetOvenShrink');

    if (this.activeTask === 'subtask01') {
      if (grpWrench) grpWrench.classList.toggle('hidden', this.n01Step !== 1);
      if (grpGimbal) {
        grpGimbal.classList.toggle('hidden', this.n01Step !== 2);
        if (this.n01Step === 2 && !this.n01.laserSightMounted) {
          this.mountLaserSight();
        }
      }
      if (grpPhase) grpPhase.classList.toggle('hidden', this.n01Step !== 3);
      if (grpFiber) grpFiber.classList.add('hidden');
      if (grpMicro) grpMicro.classList.add('hidden');
      if (grpOven) grpOven.classList.add('hidden');
    } else {
      if (grpWrench) grpWrench.classList.add('hidden');
      if (grpGimbal) grpGimbal.classList.add('hidden');
      if (grpPhase) grpPhase.classList.add('hidden');
      if (grpFiber) grpFiber.classList.toggle('hidden', this.n02Step !== 1);
      if (grpMicro) grpMicro.classList.toggle('hidden', this.n02Step !== 2);
      if (grpOven) grpOven.classList.toggle('hidden', this.n02Step !== 3);
    }
  }

  updateToolShelf() {
    if (!this.ui.toolShelf) return;

    // Strict procurement check & BUY badge toggling
    const toolMap = [
      { cardId: 'cardToolWrench', toolId: 'rf_wrench' },
      { cardId: 'cardToolLaser', toolId: 'laser_sight' },
      { cardId: 'cardToolStripper', toolId: 'fiber_stripper' },
      { cardId: 'cardToolCoupler', toolId: 'coupler' },
      { cardId: 'cardToolSplicer', toolId: 'splice_module' }
    ];

    toolMap.forEach(({ cardId, toolId }) => {
      const c = this.ui.toolShelf.querySelector('#' + cardId);
      if (!c) return;
      const owned = this.hasPurchased(toolId);
      c.classList.toggle('locked', !owned);
      let tag = c.querySelector('.tool-key-tag');
      if (!tag) {
        tag = document.createElement('span');
        tag.className = 'tool-key-tag';
        c.appendChild(tag);
      }
      tag.textContent = owned ? 'EQUIP' : 'BUY';
    });

    const cards = this.ui.toolShelf.querySelectorAll('.wb-figma-tool-card');
    cards.forEach(c => c.classList.remove('task-selected-glow'));

    if (this.activeTask === 'subtask01') {
      if (this.n01Step === 1) {
        if (!this.n01.newCouplerSeated && this.n01.oldCouplerExtracted) {
          const c = this.ui.toolShelf.querySelector('#cardToolCoupler');
          if (c) c.classList.add('task-selected-glow');
        } else {
          const c = this.ui.toolShelf.querySelector('#cardToolWrench');
          if (c) c.classList.add('task-selected-glow');
        }
      } else if (this.n01Step === 2) {
        const c = this.ui.toolShelf.querySelector('#cardToolLaser');
        if (c) c.classList.add('task-selected-glow');
      }
    } else if (this.activeTask === 'subtask02') {
      if (this.n02Step === 1) {
        const c = this.ui.toolShelf.querySelector('#cardToolStripper');
        if (c) c.classList.add('task-selected-glow');
      } else {
        const c = this.ui.toolShelf.querySelector('#cardToolSplicer');
        if (c) c.classList.add('task-selected-glow');
      }
    }
  }

  // -------------------------------------------------------------------------
  // ACTION METHODS & PHYSICS
  // -------------------------------------------------------------------------
  handleSilverCouplerClick() {
    if (!this.hasPurchased('rf_wrench')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please purchase RF Torque Wrench from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n01.oldCouplerLoosened) {
      if (this.n01.wrenchMode === 'loosen') {
        this.n01.oldCouplerLoosened = true;
        this.playPneumaticMotor(true);
        if (this.models.oldCoupler) this.models.oldCoupler.position.y += 0.05;
        this.updateTaskPanel();
      } else {
        this.playBeep(800, 0.15, 'sawtooth');
        if (window.showCenterCalmAlert) {
          window.showCenterCalmAlert('WRENCH MODE REQUIRED', 'Toggle RF Wrench to [LOOSEN] mode first!', '🔧');
        }
      }
    } else if (!this.n01.oldCouplerExtracted) {
      this.n01.oldCouplerExtracted = true;
      this.playTorqueClick();
      if (this.models.oldCoupler) {
        this.models.oldCoupler.position.set(-1.75, 0.15, 0.75); // fly to scrap tray
      }
      if (this.models.newCoupler) this.models.newCoupler.visible = true;
      this.updateTaskPanel();
    }
  }

  handleGoldCouplerClick() {
    if (!this.hasPurchased('coupler')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT COMPONENT MISSING: Please requisition Gold RF Coupler from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n01.oldCouplerExtracted) {
      if (window.showCenterCalmAlert) {
        window.showCenterCalmAlert('COUPLER SEAT BLOCKED', 'Extract cracked silver coupler before inserting new waveguide!', '⚠️');
      }
      return;
    }

    if (!this.n01.newCouplerSeated) {
      this.n01.newCouplerSeated = true;
      this.playTorqueClick();
      this.updateTaskPanel();
    } else if (!this.n01.newCouplerTorqued) {
      this.startTorqueGauge();
    }
  }

  openTorqueGauge() {
    if (!this.hasPurchased('rf_wrench')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please purchase RF Torque Wrench from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n01.newCouplerSeated || this.n01.newCouplerTorqued) return;
    if (this.ui.circularGauge) {
      this.ui.circularGauge.classList.remove('hidden');
    }
    this.n01.isHoldingTorque = false;
    this.n01.torqueValue = 0.0;
    this.n01.hasPlayedSweetSpotTone = false;
    if (this.ui.gaugeNum) this.ui.gaugeNum.textContent = '0.0';
    if (this.ui.gaugeFill) {
      this.ui.gaugeFill.style.strokeDashoffset = '408.4';
      this.ui.gaugeFill.style.stroke = '#38bdf8';
      this.ui.gaugeFill.style.filter = 'none';
    }
    if (this.ui.gaugeHint) {
      this.ui.gaugeHint.innerHTML = '<span style="color: #38bdf8; font-size: 11px;">HOLD [MOUSE or SPACE] &amp; RELEASE IN GREEN ZONE (12 N·m)</span>';
    }
  }

  startHoldingTorque(e) {
    if (!this.hasPurchased('rf_wrench')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please purchase RF Torque Wrench from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n01.newCouplerSeated || this.n01.newCouplerTorqued) return;
    if (e && e.pointerId && e.target && e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
    }
    this.n01.isHoldingTorque = true;
    this.n01.torqueHoldStartTime = performance.now();
    this.n01.torqueValue = 0.0;
    this.n01.hasPlayedSweetSpotTone = false;
    this.playPneumaticMotor(false);
  }

  finishHoldingTorque(e) {
    if (!this.n01 || !this.n01.isHoldingTorque) return;
    this.n01.isHoldingTorque = false;

    if (e && e.pointerId && e.target && e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
    }

    // Sweet Spot Green Zone: 10.5 N·m to 13.5 N·m (centered on 12.0 N·m)
    if (this.n01.torqueValue >= 10.5 && this.n01.torqueValue <= 13.5) {
      // Perfect Torque Lock!
      this.n01.newCouplerTorqued = true;
      this.playTorqueClick();
      this.playBeep(2525, 0.35); // Confirmation lock chime

      if (this.models.newCoupler) {
        this.models.newCoupler.material.emissiveIntensity = 0.8;
      }

      if (this.ui.gaugeHint) {
        this.ui.gaugeHint.innerHTML = '<span style="color: #10b981; font-weight: 700; font-size: 13px;">✓ TORQUE LOCKED: 12.0 N·m!</span>';
      }
      if (this.ui.gaugeFill) {
        this.ui.gaugeFill.style.stroke = '#10b981';
        this.ui.gaugeFill.style.filter = 'drop-shadow(0 0 10px #10b981)';
      }

      this.n01Step = 2; // Advance to Step 2
      this.updateTaskPanel();

      if (window.showCenterCalmAlert) {
        window.showCenterCalmAlert('TORQUED: 12.0 N·m', 'RF Waveguide Coupler flight-locked! Proceed to Step 2 (Laser Sight).', '✓');
      }

      // Close gauge modal smoothly after showing success
      setTimeout(() => {
        if (this.ui.circularGauge) this.ui.circularGauge.classList.add('hidden');
      }, 750);

    } else if (this.n01.torqueValue < 10.5) {
      this.playBeep(500, 0.2, 'sawtooth');
      if (this.ui.gaugeHint) {
        this.ui.gaugeHint.innerHTML = '<span style="color: #f59e0b; font-weight: 700;">UNDER-TORQUED (' + this.n01.torqueValue.toFixed(1) + ' N·m). HOLD LONGER UNTIL GREEN ZONE!</span>';
      }
      // DO NOT HIDE GAUGE! Let the player try again immediately
      setTimeout(() => {
        if (!this.n01.isHoldingTorque && !this.n01.newCouplerTorqued) {
          if (this.ui.gaugeFill) this.ui.gaugeFill.style.strokeDashoffset = '408.4';
          if (this.ui.gaugeNum) this.ui.gaugeNum.textContent = '0.0';
        }
      }, 500);

    } else {
      this.playBeep(400, 0.25, 'sawtooth');
      if (this.ui.gaugeHint) {
        this.ui.gaugeHint.innerHTML = '<span style="color: #ef4444; font-weight: 700;">OVER-TORQUED (' + this.n01.torqueValue.toFixed(1) + ' N·m). RELEASE EARLIER IN GREEN ZONE!</span>';
      }
      // DO NOT HIDE GAUGE!
      setTimeout(() => {
        if (!this.n01.isHoldingTorque && !this.n01.newCouplerTorqued) {
          if (this.ui.gaugeFill) this.ui.gaugeFill.style.strokeDashoffset = '408.4';
          if (this.ui.gaugeNum) this.ui.gaugeNum.textContent = '0.0';
        }
      }, 500);
    }
  }

  // Alias for backward compatibility
  startTorqueGauge() {
    this.openTorqueGauge();
  }
  finishTorqueGauge() {
    this.finishHoldingTorque();
  }

  mountLaserSight() {
    this.n01.laserSightMounted = true;
    if (this.models.laserDevice) this.models.laserDevice.visible = true;
    if (this.models.laserBeam) this.models.laserBeam.visible = true;
    if (this.models.laserDot) this.models.laserDot.visible = true;
    this.updateGimbalRotation();
    this.updateTaskPanel();
  }

  handleFeedHornClick() {
    if (this.n01Step !== 2) return;
    this.mountLaserSight();
    this.playBeep(2100, 0.18);

    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('LASER SIGHT MOUNTED', 'Use Pitch & Yaw hand-cranks to center red laser dot on crosshairs.', '🎯');
    }
  }

  updateGimbalRotation() {
    if (!this.gimbalHead) return;
    const pitchRad = (this.n01.pitchAngle * Math.PI) / 180;
    const yawRad = (this.n01.yawAngle * Math.PI) / 180;
    this.gimbalHead.rotation.x = pitchRad;
    this.gimbalHead.rotation.y = yawRad;

    if (this.models.laserDot) {
      const offsetX = (this.n01.yawAngle / 30) * 0.45;
      const offsetY = -(this.n01.pitchAngle / 30) * 0.45;
      this.models.laserDot.position.x = -0.35 + offsetX;
      this.models.laserDot.position.y = 0.65 + offsetY;
    }

    const aligned = Math.abs(this.n01.pitchAngle) <= 0.6 && Math.abs(this.n01.yawAngle) <= 0.6;
    if (aligned && !this.n01.gimbalAligned) {
      this.n01.gimbalAligned = true;
      this.playBeep(2475, 0.25); // NASA Quindar
      if (this.models.laserDot) this.models.laserDot.material.color.setHex(0x10b981);

      this.n01Step = 3; // Advance to step 3!
      if (window.showCenterCalmAlert) {
        window.showCenterCalmAlert('GIMBAL ALIGNED', 'Antenna boresight aligned with TDRSS crosshairs! Step 3 Radar active.', '📡');
      }
      this.updateTaskPanel();
    }
  }

  lockCarrierPhase() {
    const diff = Math.min(this.n01.phaseAngle, 360 - this.n01.phaseAngle);
    if (diff > 5.0) {
      this.playBeep(800, 0.15, 'sawtooth');
      return;
    }

    this.n01.phaseLocked = true;
    this.n01.isComplete = true;
    this.playSuccessChime();

    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('TICKET COMPLETE', '[SUB-TSK-N-01] HGA Realignment & Transceiver Lock Verified!', '🏆');
    }

    this.updateTaskPanel();
    if (window.DecisionManager && typeof window.DecisionManager.promptDecision === 'function') {
      window.DecisionManager.promptDecision('net_task1', () => {
        if (typeof this.onCompleteTask01 === 'function') {
          this.onCompleteTask01();
        }
      });
    } else if (typeof this.onCompleteTask01 === 'function') {
      this.onCompleteTask01();
    }
  }

  // --- SUBTASK 02 METHODS ---
  stripFiber() {
    if (!this.hasPurchased('fiber_stripper')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please purchase Precision Fiber Stripper from Desk 03 Laptop first!", true);
      return;
    }
    if (this.n02.fiberStripped) return;
    this.n02.fiberStripped = true;
    this.playTorqueClick();
    const bCleave = document.getElementById('btnNetCleave');
    if (bCleave) bCleave.disabled = false;
    this.updateTaskPanel();
  }

  cleaveFiber() {
    if (!this.hasPurchased('fiber_stripper')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please purchase Precision Fiber Stripper from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n02.fiberStripped || this.n02.fiberCleaved) return;
    this.n02.fiberCleaved = true;
    this.playBeep(2100, 0.08, 'triangle');
    const bSeat = document.getElementById('btnNetSeatVGrooves');
    if (bSeat) bSeat.disabled = false;

    this.n02Step = 2; // Advance to step 2!
    this.updateTaskPanel();
  }

  placeFiberInVGrooves() {
    if (!this.hasPurchased('splice_module')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please requisition Fusion Splice Module from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n02.fiberCleaved || this.n02.fiberInVGrooves) return;
    this.n02.fiberInVGrooves = true;
    this.playTorqueClick();
    this.updateTaskPanel();
  }

  adjustMicroCore(dx, dy) {
    if (this.n02.arcDischarged) return;
    this.n02.microX += dx;
    this.n02.microY += dy;
    this.playBeep(1400, 0.04);

    this.n02.microAligned = (Math.abs(this.n02.microX) <= 3 && Math.abs(this.n02.microY) <= 3);
    const bFuse = document.getElementById('btnNetFuseArc');
    if (bFuse) bFuse.disabled = !this.n02.microAligned;
  }

  dischargeArc() {
    if (!this.hasPurchased('splice_module')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please requisition Fusion Splice Module from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n02.microAligned || this.n02.arcDischarged) return;
    this.n02.arcDischarged = true;
    this.playArcDischarge();

    if (this.models.splicerSpark) {
      this.models.splicerSpark.visible = true;
      setTimeout(() => { if (this.models.splicerSpark) this.models.splicerSpark.visible = false; }, 300);
    }

    this.n02Step = 3; // Advance to step 3!
    const bBake = document.getElementById('btnNetBakeOven');
    if (bBake) bBake.disabled = false;
    this.updateTaskPanel();
  }

  applyThermalSleeve() {
    if (!this.hasPurchased('splice_module')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please requisition Fusion Splice Module from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n02.arcDischarged || this.n02.sleeveApplied) return;
    this.n02.sleeveApplied = true;
    this.playTorqueClick();
    if (this.models.sleeveMesh) this.models.sleeveMesh.visible = true;
    this.updateTaskPanel();
  }

  startOvenBake() {
    if (!this.hasPurchased('splice_module')) {
      this.playErrorBuzz();
      this.showAlert("FLIGHT TOOL LOCKED: Please requisition Fusion Splice Module from Desk 03 Laptop first!", true);
      return;
    }
    if (!this.n02.sleeveApplied || this.n02.ovenTimerRunning || this.n02.ovenComplete) return;
    this.n02.ovenTimerRunning = true;
    let t = 3;

    const bBake = document.getElementById('btnNetBakeOven');
    const interval = setInterval(() => {
      t--;
      if (bBake) bBake.textContent = `BAKING IN OVEN (${t}s)...`;
      this.playBeep(980, 0.08);

      if (t <= 0) {
        clearInterval(interval);
        this.n02.ovenTimerRunning = false;
        this.n02.ovenComplete = true;
        this.n02.isComplete = true;
        this.playOvenHiss();
        this.playSuccessChime();

        if (bBake) {
          bBake.textContent = 'BAKED & CERTIFIED ✓';
          bBake.classList.add('nominal');
        }

        if (window.showCenterCalmAlert) {
          window.showCenterCalmAlert('TICKET COMPLETE', '[SUB-TSK-N-02] SI-C&DH Fiber Bus Splice Verified (<0.02 dB)!', '🏆');
        }

        this.updateTaskPanel();
        if (window.DecisionManager && typeof window.DecisionManager.promptDecision === 'function') {
          window.DecisionManager.promptDecision('net_task2', () => {
            if (typeof this.onCompleteTask02 === 'function') {
              this.onCompleteTask02();
            }
          });
        } else if (typeof this.onCompleteTask02 === 'function') {
          this.onCompleteTask02();
        }
      }
    }, 1000);
  }

  // -------------------------------------------------------------------------
  // 3D RAYCASTING & INPUT EVENTS (Matching workbench3d.js)
  // -------------------------------------------------------------------------
  setupEvents() {
    this.container.addEventListener('pointerdown', (e) => {
      if (!this.renderer || !this.camera) return;
      if (e.target && e.target.closest && (e.target.closest('.wb-net-controls-panel') || e.target.closest('.wb-figma-step-card') || e.target.closest('.wb3d-circular-gauge-wrap') || e.target.closest('.wb-figma-tool-shelf'))) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.name && hit.parent) hit = hit.parent;
        const name = hit.name || '';

        if (name === 'targetOldCoupler') this.handleSilverCouplerClick();
        else if (name === 'targetNewCoupler') this.handleGoldCouplerClick();
        else if (name === 'targetHornTip') this.handleFeedHornClick();
        else if (name === 'targetPhaseDial') {
          this.n01.phaseAngle = (this.n01.phaseAngle + 25) % 360;
          this.playTorqueClick();
        } else if (name === 'targetFiberCable') {
          if (!this.n02.fiberStripped) this.stripFiber();
          else if (!this.n02.fiberCleaved) this.cleaveFiber();
          else if (!this.n02.fiberInVGrooves) this.placeFiberInVGrooves();
        }
      }
    });

    // Spacebar hold for torque gauge
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.n01Step === 1 && this.n01.newCouplerSeated && !this.n01.newCouplerTorqued && !this.n01.torqueGaugeActive) {
        e.preventDefault();
        this.startTorqueGauge();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.n01.torqueGaugeActive) {
        e.preventDefault();
        this.finishTorqueGauge();
      }
    });
  }

  // -------------------------------------------------------------------------
  // RENDER CANVAS SCREENS (Vector Radar & Microscopic Inspection LCD)
  // -------------------------------------------------------------------------
  renderRadarScreen() {
    if (!this.radarCtx) return;
    const ctx = this.radarCtx;
    const cx = 256, cy = 256;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 220, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.lineWidth = 1.5;
    [60, 120, 180].forEach(r => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(cx, 36); ctx.lineTo(cx, 476);
    ctx.moveTo(36, cy); ctx.lineTo(476, cy);
    ctx.stroke();

    // Rotating Sweep
    this.radarAngle += 0.035;
    const sweepGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 220);
    sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 220, this.radarAngle - 0.45, this.radarAngle);
    ctx.closePath();
    ctx.fill();

    // Hubble Target Dot
    const radius = 135;
    const hx = cx + radius, hy = cy;
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('HST CARRIER', hx + 14, hy + 5);

    // TDRSS Satellite Dot
    const phaseRad = (this.n01.phaseAngle * Math.PI) / 180;
    const sx = cx + radius * Math.cos(phaseRad);
    const sy = cy + radius * Math.sin(phaseRad);

    if (this.n01.phaseLocked) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(20, 460, 472, 36);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('LOCK: 100% // TDRSS KU-BAND SYNCHRONIZED', 36, 484);
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`TDRSS (Δφ: ${this.n01.phaseAngle.toFixed(1)}°)`, sx + 14, sy - 8);
    }

    this.radarTexture.needsUpdate = true;
  }

  renderMicroscopicScreen() {
    if (!this.microCtx) return;
    const ctx = this.microCtx;
    const W = 512, H = 340;
    const cx = W / 2, cy = H / 2;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 34) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Left Core
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(40, cy - 14, cx - 44, 28);

    // Right Core (Offset by microX & microY)
    const rx = cx + 4 + this.n02.microX;
    const ry = cy - 14 + this.n02.microY;
    ctx.fillStyle = this.n02.microAligned ? '#10b981' : '#f59e0b';
    ctx.fillRect(rx, ry, W - rx - 40, 28);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px "Tektur", monospace';
    ctx.fillText(`ΔX: ${this.n02.microX}µm | ΔY: ${this.n02.microY}µm [ALIGN: ${this.n02.microAligned ? 'NOMINAL' : 'SEVERED'}]`, 18, 36);

    this.microTexture.needsUpdate = true;
  }

  // -------------------------------------------------------------------------
  // RENDER LOOP & ANIMATION
  // -------------------------------------------------------------------------
  animate() {
    this.animId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();

    if (this.activeTask === 'subtask01') {
      this.renderRadarScreen();
    } else {
      this.renderMicroscopicScreen();
    }

    // Frame-by-frame smooth Torque Gauge holding calculation
    if (this.n01 && this.n01.isHoldingTorque) {
      const elapsed = (performance.now() - this.n01.torqueHoldStartTime) / 1000;
      // Reaches 12.0 N·m at ~1.85 seconds, maxes out at 18.0 N·m at ~2.8 seconds
      this.n01.torqueValue = Math.min(18.0, elapsed * 6.5);

      if (this.ui && this.ui.gaugeNum) {
        this.ui.gaugeNum.textContent = this.n01.torqueValue.toFixed(1);
      }

      const inSweetSpot = (this.n01.torqueValue >= 10.5 && this.n01.torqueValue <= 13.5);

      if (inSweetSpot && !this.n01.hasPlayedSweetSpotTone) {
        this.n01.hasPlayedSweetSpotTone = true;
        this.playBeep(2475, 0.15); // NASA Quindar sweet spot tone cue
      }

      if (this.ui && this.ui.gaugeHint) {
        if (inSweetSpot) {
          this.ui.gaugeHint.innerHTML = '<span style="color: #10b981; font-weight: 700; font-size: 13px; text-shadow: 0 0 10px #10b981;">★★★ RELEASE NOW! [12 N·m TARGET] ★★★</span>';
        } else if (this.n01.torqueValue > 13.5) {
          this.ui.gaugeHint.innerHTML = '<span style="color: #ef4444; font-weight: 700; font-size: 12px;">⚠️ OVER-TORQUED! RELEASE TO RETRY</span>';
        } else {
          this.ui.gaugeHint.innerHTML = '<span style="color: #38bdf8; font-size: 11px;">HOLDING... REACHING GREEN ZONE (12 N·m)</span>';
        }
      }

      if (this.ui && this.ui.gaugeFill) {
        const maxVal = 18.0;
        const pct = Math.min(1.0, this.n01.torqueValue / maxVal);
        const offset = 408.4 * (1 - pct);
        this.ui.gaugeFill.style.strokeDashoffset = offset.toString();

        if (inSweetSpot) {
          this.ui.gaugeFill.style.stroke = '#10b981';
          this.ui.gaugeFill.style.filter = 'drop-shadow(0 0 10px #10b981)';
        } else if (this.n01.torqueValue > 13.5) {
          this.ui.gaugeFill.style.stroke = '#ef4444';
          this.ui.gaugeFill.style.filter = 'drop-shadow(0 0 6px #ef4444)';
        } else {
          this.ui.gaugeFill.style.stroke = '#38bdf8';
          this.ui.gaugeFill.style.filter = 'none';
        }
      }
    }

    // Pulse Highlight Rings
    if (this.highlightsGroup) {
      const pulse = 1.0 + Math.sin(time * 5.0) * 0.18;
      if (this.couplerRing) {
        this.couplerRing.scale.set(pulse, pulse, 1.0);
        this.couplerRing.visible = (this.activeTask === 'subtask01' && this.n01Step === 1 && !this.n01.newCouplerTorqued);
      }
      if (this.hornRing) {
        this.hornRing.scale.set(pulse, pulse, 1.0);
        this.hornRing.visible = (this.activeTask === 'subtask01' && this.n01Step === 2 && !this.n01.laserSightMounted);
      }
      if (this.radarRing) {
        this.radarRing.scale.set(pulse, pulse, 1.0);
        this.radarRing.visible = (this.activeTask === 'subtask01' && this.n01Step === 3 && !this.n01.phaseLocked);
      }
      if (this.models.laserDotHalo && this.n01.laserSightMounted) {
        const p = 1.0 + Math.sin(time * 6) * 0.12;
        this.models.laserDotHalo.scale.set(p, p, 1.0);
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  setTaskView(taskKey) {
    this.activeTask = taskKey;
    if (this.hgaGroup) this.hgaGroup.visible = (taskKey === 'subtask01');
    if (this.fiberGroup) this.fiberGroup.visible = (taskKey === 'subtask02');
    if (this.models.radarConsole) this.models.radarConsole.visible = (taskKey === 'subtask01');
    if (this.models.wallGrid) this.models.wallGrid.visible = (taskKey === 'subtask01');
    if (this.models.laserDot) this.models.laserDot.visible = (taskKey === 'subtask01' && this.n01.laserSightMounted);
    this.updateTaskPanel();
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.ui.taskPanel) this.ui.taskPanel.remove();
    if (this.ui.toolShelf) this.ui.toolShelf.remove();
    if (this.ui.circularGauge) this.ui.circularGauge.remove();
    if (this.ui.controlsPanel) this.ui.controlsPanel.remove();
  }
}

// Global Export (AGENTS.md Rule 1)
window.NetworkWorkbench3D = NetworkWorkbench3D;
