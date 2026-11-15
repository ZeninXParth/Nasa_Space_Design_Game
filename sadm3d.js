/**
 * SADM 3D: Task Suite 02 Interactive Assembly Station
 * Solar Array Drive Mechanism & Deployment Hinge
 *
 * Implements:
 * - Step 1: Servicing the Drive Latch (Hex Key insertion, circular/hold cranking motion, gear ratchet, heavy latch lock)
 * - Step 2: Thermal Damper Attachment (Gold composite clip, ghost outline hover, hold-to-compress, release snap)
 * - Step 3: Calibration Check (3D toggle switch flip, smooth non-slip gear rotation, amber -> solid green warning beacon)
 */

class Sadm3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.onCompleteCallback = options.onComplete || null;

    // State Machine
    this.currentStep = 1; // 1: Hex Key Latch Crank, 2: Thermal Damper Clip, 3: Calibration Switch
    this.isComplete = false;

    // Step 1: Drive Latch Hex Key
    this.hexKeyEquipped = false;
    this.hexKeyInserted = false;
    this.crankProgress = 0; // 0.0 to 1.0 (corresponds to 3 full revolutions = 1080 deg)
    this.targetRotations = 3.0;
    this.isCranking = false;
    this.latchLocked = false;
    this.lastRatchetStep = 0;
    this.crankHoldStartTime = 0;

    // Step 2: Thermal Damper Clip
    this.damperClipEquipped = false;
    this.clipCompressed = false;
    this.damperInstalled = false;
    this.hoveringOverHinge = false;

    // Step 3: Calibration Switch & Motor
    this.toggleSwitchFlipped = false;
    this.motorRunning = false;
    this.warningBeaconState = 'amber_blink'; // 'amber_blink' or 'green_solid'

    // Animation & Vibration
    this.clock = new THREE.Clock();
    this.jitterAmount = 0.035; // Vibrates/slips until latched and damped

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];

    // DOM UI Overlays
    this.ui = {};

    // Web Audio Synthesizer
    this.audioCtx = null;
    this.servoOsc = null;
    this.servoGain = null;
    this.lastRatchetSoundTime = 0;
    this.initAudio();

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
      console.warn("Web Audio not supported in Sadm3D", e);
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

  playRatchetClick() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();

    // Debounce to prevent audio buffer congestion on high-rate mouse dragging
    const nowMs = performance.now();
    if (nowMs - this.lastRatchetSoundTime < 35) return;
    this.lastRatchetSoundTime = nowMs;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.028);

      setTimeout(() => {
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
      }, 45);
    } catch (e) {}
  }

  playHeavyLatchLock() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();

    try {
      const now = this.audioCtx.currentTime;

      // Heavy mechanical dog-clutch impact
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(200, now);
      osc1.frequency.exponentialRampToValueAtTime(42, now + 0.22);

      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      setTimeout(() => {
        try { osc1.disconnect(); gain1.disconnect(); } catch (e) {}
      }, 250);

      // Resonant metallic latch chime (solid steel dog-latch lock)
      setTimeout(() => {
        if (this.isMuted() || !this.audioCtx) return;
        try {
          const t = this.audioCtx.currentTime;
          const osc2 = this.audioCtx.createOscillator();
          const gain2 = this.audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(780, t);
          osc2.frequency.exponentialRampToValueAtTime(520, t + 0.35);

          gain2.gain.setValueAtTime(0.14, t);
          gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

          osc2.connect(gain2);
          gain2.connect(this.audioCtx.destination);
          osc2.start(t);
          osc2.stop(t + 0.36);

          setTimeout(() => {
            try { osc2.disconnect(); gain2.disconnect(); } catch (e) {}
          }, 400);
        } catch (e) {}
      }, 60);
    } catch (e) {}
  }

  playClipSnap() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.07);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.075);

      setTimeout(() => {
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
      }, 100);

      // Secondary spring clamp resonance
      setTimeout(() => {
        if (this.isMuted() || !this.audioCtx) return;
        try {
          const t = this.audioCtx.currentTime;
          const osc2 = this.audioCtx.createOscillator();
          const gain2 = this.audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(920, t);
          gain2.gain.setValueAtTime(0.08, t);
          gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
          osc2.connect(gain2);
          gain2.connect(this.audioCtx.destination);
          osc2.start(t);
          osc2.stop(t + 0.13);

          setTimeout(() => {
            try { osc2.disconnect(); gain2.disconnect(); } catch (e) {}
          }, 150);
        } catch (e) {}
      }, 30);
    } catch (e) {}
  }

  playSwitchClick() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

      setTimeout(() => {
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
      }, 70);
    } catch (e) {}
  }

  playServoHum() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();

    // Cleanly stop any existing servo oscillation before starting a new one
    this.stopServoHum();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.7);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.7);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);

      this.servoOsc = osc;
      this.servoGain = gain;

      // Automatically fade out and stop after 2.2 seconds calibration run
      setTimeout(() => {
        this.stopServoHum();
      }, 2200);
    } catch (e) {}
  }

  stopServoHum() {
    if (!this.servoOsc) return;
    try {
      if (this.servoGain && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        this.servoGain.gain.setValueAtTime(this.servoGain.gain.value, now);
        this.servoGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      }
      const osc = this.servoOsc;
      setTimeout(() => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      }, 320);
    } catch (e) {}
    this.servoOsc = null;
    this.servoGain = null;
  }

  playVictoryFanfare() {
    if (this.isMuted() || !this.audioCtx) return;
    this.ensureAudio();

    // Silencing servo hum so the fanfare plays clean and crisp
    this.stopServoHum();

    try {
      const now = this.audioCtx.currentTime;
      const notes = [440.0, 554.37, 659.25, 880.0]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.11;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.45);

        setTimeout(() => {
          try { osc.disconnect(); gain.disconnect(); } catch (e) {}
        }, 550);
      });
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // INITIALIZATION & SCENE SETUP
  // -------------------------------------------------------------
  init() {
    if (!this.container) return;

    this.container.innerHTML = '';
    this.createDomOverlays();

    const width = this.container.clientWidth || 980;
    const height = this.container.clientHeight || 560;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06070a);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 4.8, 5.8);
    this.camera.lookAt(0, 0.5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // Procedural Models
    this.createWorkbenchSurface();
    this.createBenchClamps();
    this.createSadmMechanism();
    this.createHexKeyTool();
    this.createThermalDamperClip();
    this.createInteractiveHighlights();

    // Input events
    this.setupInputEvents();

    // Tool check & initial UI state
    this.checkRequiredTools();
    this.updateTaskPanel();

    // Render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Resize
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  setupLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xf8fafc, 1.4);
    dirLight.position.set(5, 9, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0008;
    this.scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x0284c7, 0.5);
    blueFill.position.set(-6, 3, -4);
    this.scene.add(blueFill);

    // Amber/Green Beacon Light on top of SADM
    this.beaconLight = new THREE.PointLight(0xf59e0b, 1.8, 6);
    this.beaconLight.position.set(0, 2.5, 0);
    this.scene.add(this.beaconLight);
  }

  createWorkbenchSurface() {
    const tableGeo = new THREE.PlaneGeometry(16, 12);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x0f141c,
      roughness: 0.85,
      metalness: 0.2
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.rotation.x = -Math.PI / 2;
    tableMesh.position.y = -0.01;
    tableMesh.receiveShadow = true;
    this.scene.add(tableMesh);

    const grid = new THREE.GridHelper(14, 28, 0x1e293b, 0x111827);
    grid.position.y = 0;
    this.scene.add(grid);
  }

  createBenchClamps() {
    const clampMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.3
    });

    [-1.8, 1.8].forEach((x) => {
      const clampGroup = new THREE.Group();
      clampGroup.position.set(x, 0, 0);

      // C-clamp base
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.8), clampMat);
      base.position.y = 0.2;
      base.castShadow = true;
      clampGroup.add(base);

      // Threaded clamp screw & handle
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), clampMat);
      screw.position.set(0, 0.5, 0.2);
      clampGroup.add(screw);

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), clampMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(0, 0.75, 0.2);
      clampGroup.add(handle);

      this.scene.add(clampGroup);
    });
  }

  createSadmMechanism() {
    this.sadmGroup = new THREE.Group();
    this.sadmGroup.position.set(0, 0.2, 0);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.2
    });

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.25
    });

    // 1. Massive Gearbox Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 2.2), metalMat);
    chassis.position.y = 0.3;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.sadmGroup.add(chassis);

    // Stenciled NASA label
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HST-SADM-02 // SOLAR ARRAY DRIVE', 256, 55);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '24px monospace';
    ctx.fillText('WARNING: LATCH BEFORE DEPLOYMENT', 256, 95);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
    const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.25), labelMat);
    labelPlane.position.set(0, 0.3, 1.11);
    this.sadmGroup.add(labelPlane);

    // 2. Central Motorized Drive Shaft & Spur Gear
    this.gearGroup = new THREE.Group();
    this.gearGroup.position.set(-0.6, 0.6, 0);

    // Main Gear Wheel Hub
    const gearHub = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.28, 32), steelMat);
    gearHub.castShadow = true;
    this.gearGroup.add(gearHub);

    // 24 Detailed Gear Teeth around the perimeter
    const toothGeo = new THREE.BoxGeometry(0.14, 0.28, 0.16);
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, steelMat);
      tooth.position.set(Math.cos(angle) * 1.02, 0, Math.sin(angle) * 1.02);
      tooth.rotation.y = -angle;
      this.gearGroup.add(tooth);
    }

    // Central Hex Key Socket (5mm Hexagon recess)
    const socketRing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.32, 16), bronzeMat);
    this.gearGroup.add(socketRing);

    const socketRecess = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 6), new THREE.MeshBasicMaterial({ color: 0x090d16 }));
    socketRecess.position.y = 0.02;
    socketRecess.userData = { isHexSocket: true };
    this.gearGroup.add(socketRecess);
    this.interactiveObjects.push(socketRecess);

    this.sadmGroup.add(this.gearGroup);

    // Secondary Pinion Gear (Meshes with main gear)
    this.pinionGroup = new THREE.Group();
    this.pinionGroup.position.set(-1.8, 0.6, 0);
    const pinionHub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.28, 16), bronzeMat);
    this.pinionGroup.add(pinionHub);
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.12), bronzeMat);
      tooth.position.set(Math.cos(angle) * 0.45, 0, Math.sin(angle) * 0.45);
      tooth.rotation.y = -angle;
      this.pinionGroup.add(tooth);
    }
    this.sadmGroup.add(this.pinionGroup);

    // 3. Bifurcated Solar Wing Deployment Hinge (Right Side)
    this.hingeGroup = new THREE.Group();
    this.hingeGroup.position.set(1.0, 0.6, 0);

    // Clevis lugs
    const clevisGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
    [-0.5, 0.5].forEach((z) => {
      const clevis = new THREE.Mesh(clevisGeo, metalMat);
      clevis.position.set(0, 0, z);
      this.hingeGroup.add(clevis);
    });

    // Central Hinge Tang
    const tang = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.55), metalMat);
    tang.position.set(0.3, 0, 0);
    this.hingeGroup.add(tang);

    // Cylindrical Hinge Pivot Pin Axis
    const pinGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.6, 24);
    this.hingeAxisPin = new THREE.Mesh(pinGeo, steelMat);
    this.hingeAxisPin.userData = { isHingeAxis: true };
    this.hingeGroup.add(this.hingeAxisPin);
    this.interactiveObjects.push(this.hingeAxisPin);

    // Ghost Outline for Thermal Damper Clip (Translucent cyan/gold)
    const ghostGeo = new THREE.TorusGeometry(0.24, 0.08, 16, 32, Math.PI * 1.5);
    this.ghostMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      wireframe: true
    });
    this.ghostDamper = new THREE.Mesh(ghostGeo, this.ghostMat);
    this.ghostDamper.rotation.x = Math.PI / 2;
    this.ghostDamper.position.set(0, 0, 0);
    this.ghostDamper.visible = false;
    this.hingeGroup.add(this.ghostDamper);

    // Permanent Installed Damper Clip (Hidden until Step 2 complete)
    const damperMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.3
    });
    this.installedDamperMesh = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.08, 16, 32, Math.PI * 1.6), damperMat);
    this.installedDamperMesh.rotation.x = Math.PI / 2;
    this.installedDamperMesh.visible = false;
    this.hingeGroup.add(this.installedDamperMesh);

    this.sadmGroup.add(this.hingeGroup);

    // 4. Telemetry Mast with Warning Beacon
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 12), metalMat);
    mast.position.set(0, 1.0, -0.7);
    this.sadmGroup.add(mast);

    const beaconGeo = new THREE.SphereGeometry(0.15, 16, 16);
    this.beaconMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.0,
      roughness: 0.2
    });
    this.beaconMesh = new THREE.Mesh(beaconGeo, this.beaconMat);
    this.beaconMesh.position.set(0, 1.45, -0.7);
    this.sadmGroup.add(this.beaconMesh);

    // 5. Calibration Toggle Switch (On Front/Side Plate)
    this.switchGroup = new THREE.Group();
    this.switchGroup.position.set(0.8, 0.45, 1.12);

    const switchBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.12), steelMat);
    this.switchGroup.add(switchBox);

    // Toggle switch lever (Tilted up initially)
    const leverGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8);
    this.switchLever = new THREE.Mesh(leverGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9 }));
    this.switchLever.position.set(0, 0.05, 0.08);
    this.switchLever.rotation.x = -Math.PI / 4; // Up position
    this.switchGroup.add(this.switchLever);

    this.switchGroup.userData = { isToggleSwitch: true };
    this.sadmGroup.add(this.switchGroup);
    this.interactiveObjects.push(this.switchGroup);

    // Large Holographic Completion Checkmark
    this.completionCheckmark = this.createCheckmarkSprite();
    this.completionCheckmark.scale.set(1.6, 1.6, 1);
    this.completionCheckmark.position.set(0, 2.4, 0);
    this.completionCheckmark.visible = false;
    this.sadmGroup.add(this.completionCheckmark);

    this.scene.add(this.sadmGroup);
  }

  createHexKeyTool() {
    this.hexKeyGroup = new THREE.Group();
    // Initially on tool tray at left
    this.hexKeyRestPos = new THREE.Vector3(-2.8, 0.15, 0.8);
    this.hexKeyGroup.position.copy(this.hexKeyRestPos);

    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.4, roughness: 0.4 });

    // Vertical Hex Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), shaftMat);
    shaft.position.y = 0.7;
    shaft.castShadow = true;
    this.hexKeyGroup.add(shaft);

    // Heavy T-handle Grip
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 16), gripMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.y = 1.4;
    handle.castShadow = true;
    this.hexKeyGroup.add(handle);

    this.hexKeyGroup.userData = { isHexKey: true };
    this.scene.add(this.hexKeyGroup);
    this.interactiveObjects.push(this.hexKeyGroup);
  }

  createThermalDamperClip() {
    this.damperToolGroup = new THREE.Group();
    this.damperRestPos = new THREE.Vector3(2.6, 0.15, 0.8);
    this.damperToolGroup.position.copy(this.damperRestPos);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.2
    });

    const clipGeo = new THREE.TorusGeometry(0.24, 0.08, 16, 32, Math.PI * 1.6);
    this.clipMesh = new THREE.Mesh(clipGeo, goldMat);
    this.clipMesh.rotation.x = Math.PI / 2;
    this.damperToolGroup.add(this.clipMesh);

    this.damperToolGroup.userData = { isDamperTool: true };
    this.scene.add(this.damperToolGroup);
    this.interactiveObjects.push(this.damperToolGroup);
  }

  createCheckmarkSprite() {
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
    return new THREE.Sprite(mat);
  }

  createInteractiveHighlights() {
    this.highlightsGroup = new THREE.Group();

    // Step 1: Hex Key Tool pulsing highlight ring
    const cyanRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.hexKeyHighlight = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 8, 24), cyanRingMat);
    this.hexKeyHighlight.rotation.x = Math.PI / 2;
    this.hexKeyHighlight.position.set(-2.8, 0.25, 0.8);
    this.highlightsGroup.add(this.hexKeyHighlight);

    // Step 1: Central motorized gear socket highlight
    this.gearSocketHighlight = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 8, 24), cyanRingMat.clone());
    this.gearSocketHighlight.rotation.x = Math.PI / 2;
    this.gearSocketHighlight.position.set(-0.6, 0.72, 0);
    this.highlightsGroup.add(this.gearSocketHighlight);

    // Step 2: Thermal Damper Clip highlight ring on table
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.damperClipHighlight = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.02, 8, 24), goldRingMat);
    this.damperClipHighlight.rotation.x = Math.PI / 2;
    this.damperClipHighlight.position.set(2.6, 0.25, 0.8);
    this.damperClipHighlight.visible = false;
    this.highlightsGroup.add(this.damperClipHighlight);

    // Step 2: Hinge Axis Joint Target Highlight
    this.hingeAxisHighlight = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.018, 8, 24), goldRingMat.clone());
    this.hingeAxisHighlight.rotation.x = Math.PI / 2;
    this.hingeAxisHighlight.position.set(0.8, 0.82, 0);
    this.hingeAxisHighlight.visible = false;
    this.highlightsGroup.add(this.hingeAxisHighlight);

    // Step 3: Toggle Switch Highlight Ring
    const greenRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.85
    });
    this.switchHighlight = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.015, 8, 24), greenRingMat);
    this.switchHighlight.position.set(-0.6, 0.25, 1.35);
    this.switchHighlight.visible = false;
    this.highlightsGroup.add(this.switchHighlight);

    this.scene.add(this.highlightsGroup);
  }

  checkRequiredTools() {
    let hasTools = true;
    if (typeof window.hasPurchasedTool === 'function') {
      hasTools = window.hasPurchasedTool('hex') && window.hasPurchasedTool('damper') && window.hasPurchasedTool('sadm');
    } else {
      const gs = window.getNasaGameState ? window.getNasaGameState() : null;
      if (gs && gs.inventory) {
        hasTools = !!(gs.inventory.hex && gs.inventory.damper && gs.inventory.sadm);
      }
    }

    if (this.ui && this.ui.reqBanner) {
      if (!hasTools) {
        this.ui.reqBanner.classList.remove('hidden');
      } else {
        this.ui.reqBanner.classList.add('hidden');
      }
    }
    return hasTools;
  }

  // -------------------------------------------------------------
  // DOM OVERLAYS & HUD
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // DOM OVERLAYS & HUD (Figma Node 414:69)
  // -------------------------------------------------------------
  createDomOverlays() {
    // 0. Requisition Alert Banner
    this.ui.reqBanner = document.createElement('div');
    this.ui.reqBanner.className = 'wb3d-requisition-banner hidden';
    this.ui.reqBanner.id = 'sadmReqBanner';
    this.ui.reqBanner.innerHTML = `
      <div class="wb3d-req-msg">⚠️ FLIGHT REQUISITION REQUIRED: Drive Latch Hex Key, Thermal Damper Clip &amp; SADM Module must be purchased from Laptop Marketplace.</div>
      <button class="wb3d-btn" id="sadmBtnGoMarket" style="margin-top: 8px; background: #0284c7; border: 1px solid #38bdf8; font-weight: 700;">OPEN LAPTOP MARKETPLACE</button>
    `;
    this.container.appendChild(this.ui.reqBanner);

    const btnGoMarket = this.ui.reqBanner.querySelector('#sadmBtnGoMarket');
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
    this.ui.toolShelf.id = 'sadmFigmaToolShelf';
    this.ui.toolShelf.innerHTML = `
      <div class="wb-figma-tool-card" id="cardToolSadmHex" data-tool="hex" title="5mm Drive Latch Hex Key [Hotkey H]">
        <div class="tool-img-box">
          <img src="assets/images/Drive Latch Hex Key.png" alt="5mm Hex Key">
        </div>
        <span class="tool-key-tag">H</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolSadmDamper" data-tool="clip" title="Thermal Damper Clip [Hotkey D]">
        <div class="tool-img-box">
          <img src="assets/images/Thermal Damper Clip.png" alt="Damper Clip">
        </div>
        <span class="tool-key-tag">D</span>
      </div>
    `;
    this.container.appendChild(this.ui.toolShelf);

    // Wire clicks on tool cards
    const cardHex = this.ui.toolShelf.querySelector('#cardToolSadmHex');
    const cardDamper = this.ui.toolShelf.querySelector('#cardToolSadmDamper');

    if (cardHex) {
      cardHex.addEventListener('click', () => {
        const hasHex = (typeof window.hasPurchasedTool === 'function') ? window.hasPurchasedTool('hex') : true;
        if (!hasHex) {
          this.showAlert("Warning : Please purchase 5mm Drive Latch Hex Key from Marketplace first!", true);
          this.playErrorBuzz();
          return;
        }
        this.equipHexKey();
      });
    }

    if (cardDamper) {
      cardDamper.addEventListener('click', () => {
        const hasDamper = (typeof window.hasPurchasedTool === 'function') ? window.hasPurchasedTool('damper') : true;
        if (!hasDamper) {
          this.showAlert("Warning : Please purchase Thermal Damper Clip from Marketplace first!", true);
          this.playErrorBuzz();
          return;
        }
        this.equipDamperClip();
      });
    }
  }

  updateTaskPanel() {
    if (!this.ui.taskPanel) return;

    let stepHeading = '';
    let stepLines = '';

    if (this.currentStep === 1) {
      stepHeading = 'Servicing the Drive Latch';
      const pct = Math.floor(this.crankProgress * 100);
      stepLines = `
        <div class="step-instruction-line">• Press [H] to Equip 5mm Drive Latch Hex Key</div>
        <div class="step-instruction-line">• Insert Hex Key into drive shaft socket &amp; crank clockwise</div>
        <div class="step-instruction-line">• Latch Engagement : <span class="step-count-badge">[ ${pct}% / 100% ]</span></div>
      `;
    } else if (this.currentStep === 2) {
      stepHeading = 'Thermal Damper Attachment';
      stepLines = `
        <div class="step-instruction-line">• Press [D] to Equip Cryo-rated Thermal Damper Clip</div>
        <div class="step-instruction-line">• Hover over hinge joint and click &amp; hold to compress clip</div>
        <div class="step-instruction-line">• Release to snap tight around bi-stem structural seam</div>
      `;
    } else if (this.currentStep === 3) {
      stepHeading = 'Synchronization Check';
      if (!this.toggleSwitchFlipped) {
        stepLines = `
          <div class="step-instruction-line">• Flip front toggle switch to verify synchronized rotation</div>
        `;
      } else {
        stepLines = `
          <div class="step-instruction-line" style="color: #10b981; font-weight: 700;">✓ Synchronized 360° solar tracking verified! Zero jitter confirmed.</div>
        `;
      }
    }

    if (this.isComplete) {
      stepHeading = 'SADM Assembly Complete!';
      stepLines = `<div class="step-instruction-line" style="color: #10b981; font-weight: 700;">✓ Solar Array Drive Mechanism serviced, stabilized, and verified!</div>`;
    }

    this.ui.taskPanel.innerHTML = `
      <div class="step-title-line">Step ${this.currentStep} : ${stepHeading}</div>
      ${stepLines}
    `;

    this.updateToolShelf();
  }

  updateToolShelf() {
    if (!this.ui.toolShelf) return;
    const cardHex = this.ui.toolShelf.querySelector('#cardToolSadmHex');
    const cardDamper = this.ui.toolShelf.querySelector('#cardToolSadmDamper');
    if (!cardHex || !cardDamper) return;

    const hasTool = (id) => {
      if (typeof window.hasPurchasedTool === 'function') return window.hasPurchasedTool(id);
      const gs = window.getNasaGameState ? window.getNasaGameState() : null;
      return !!(gs && gs.inventory && gs.inventory[id]);
    };

    const hasHex = hasTool('hex');
    const hasDamper = hasTool('damper');

    // Purchased vs Locked
    cardHex.classList.toggle('locked', !hasHex);
    cardDamper.classList.toggle('locked', !hasDamper);

    const tagHex = cardHex.querySelector('.tool-key-tag');
    const tagDamper = cardDamper.querySelector('.tool-key-tag');
    if (tagHex) tagHex.textContent = hasHex ? (this.hexKeyEquipped ? 'EQUIPPED' : 'H') : 'BUY';
    if (tagDamper) tagDamper.textContent = hasDamper ? (this.damperClipEquipped ? 'EQUIPPED' : 'D') : 'BUY';

    // Equipped state
    cardHex.classList.toggle('equipped', this.hexKeyEquipped);
    cardDamper.classList.toggle('equipped', this.damperClipEquipped);

    // SPECIFICATION: "if selected by task then glow of outline on tool"
    if (this.currentStep === 1) {
      cardHex.classList.add('task-selected-glow');
      cardDamper.classList.remove('task-selected-glow');
    } else if (this.currentStep === 2) {
      cardHex.classList.remove('task-selected-glow');
      cardDamper.classList.add('task-selected-glow');
    } else {
      cardHex.classList.remove('task-selected-glow');
      cardDamper.classList.remove('task-selected-glow');
    }
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

    // Keyboard shortcuts [H] and [C]
    this.keyHandler = (e) => {
      const modal = document.getElementById('modalWorkbench');
      if (modal && modal.classList.contains('hidden')) return;

      if (e.key === 'h' || e.key === 'H') {
        this.equipHexKey();
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'd' || e.key === 'D') {
        this.equipDamperClip();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  equipHexKey() {
    this.hexKeyEquipped = true;
    const chipHex = this.container.querySelector('#chipSadmHex');
    if (chipHex) chipHex.classList.add('active');
    if (window.nasaAudio && window.nasaAudio.playInstrumentEquipped) {
      window.nasaAudio.playInstrumentEquipped();
    }

    // If not inserted, insert into the socket
    if (!this.hexKeyInserted) {
      this.insertHexKey();
    }
  }

  insertHexKey() {
    this.hexKeyInserted = true;
    this.playRatchetClick();

    // Move hex key directly into the central gear socket
    const targetPos = new THREE.Vector3(-0.6, 0.65, 0);
    const startPos = this.hexKeyGroup.position.clone();
    const startTime = performance.now();

    const anim = () => {
      const p = (performance.now() - startTime) / 400;
      if (p < 1) {
        this.hexKeyGroup.position.lerpVectors(startPos, targetPos, p);
        requestAnimationFrame(anim);
      } else {
        this.hexKeyGroup.position.copy(targetPos);
        this.updateTaskPanel();
        this.showAlert("Hex Key inserted! Rotate or hold mouse to crank clockwise.");
      }
    };
    anim();
  }

  equipDamperClip() {
    this.damperClipEquipped = true;
    const chipDamper = this.container.querySelector('#chipSadmDamper');
    if (chipDamper) chipDamper.classList.add('active');
    if (window.nasaAudio && window.nasaAudio.playInstrumentEquipped) {
      window.nasaAudio.playInstrumentEquipped();
    }

    if (this.currentStep === 2) {
      this.ghostDamper.visible = true;
      this.showAlert("Thermal Damper Clip equipped! Hover over hinge joint and hold-release to snap.");
    }
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
    if (!this.checkRequiredTools()) {
      if (typeof window.showCenterCalmAlert === 'function') {
        window.showCenterCalmAlert("REQUISITION REQUIRED", "Purchase Drive Latch Hex Key, Thermal Damper Clip & SADM Module from Laptop Marketplace first!", "🛒");
      } else {
        this.showAlert("Required flight tools missing! Requisition them from the Laptop Marketplace.");
      }
      this.playErrorBuzz();
      return;
    }

    const hit = this.getPointerIntersection(event);
    if (!hit) return;

    let obj = hit.object;
    while (obj && (!obj.userData || Object.keys(obj.userData).length === 0) && obj.parent) {
      obj = obj.parent;
    }
    const data = obj.userData || {};

    // ----------------------------------------------------
    // STEP 1: HEX KEY INSERTION & CRANKING
    // ----------------------------------------------------
    if (this.currentStep === 1) {
      if (data.isHexKey || data.isHexSocket) {
        if (!this.hexKeyInserted) {
          this.equipHexKey();
        } else {
          this.isCranking = true;
          this.crankHoldStartTime = performance.now();
        }
        return;
      }
    }

    // ----------------------------------------------------
    // STEP 2: THERMAL DAMPER ATTACHMENT
    // ----------------------------------------------------
    if (this.currentStep === 2) {
      if (data.isDamperTool || data.isHingeAxis) {
        if (!this.damperClipEquipped) {
          this.equipDamperClip();
        }
        this.clipCompressed = true;
        if (this.clipMesh) this.clipMesh.scale.set(0.85, 0.85, 0.85); // visual compression
        return;
      }
    }

    // ----------------------------------------------------
    // STEP 3: CALIBRATION TOGGLE SWITCH
    // ----------------------------------------------------
    if (this.currentStep === 3) {
      if (data.isToggleSwitch) {
        this.flipCalibrationSwitch();
        return;
      }
    }
  }

  onPointerUp() {
    this.isCranking = false;

    // Step 2: Release clip to snap over hinge axis
    if (this.currentStep === 2 && this.clipCompressed) {
      this.clipCompressed = false;
      if (this.clipMesh) this.clipMesh.scale.set(1.0, 1.0, 1.0);

      if (this.hoveringOverHinge || this.damperClipEquipped) {
        this.installDamperClip();
      }
    }
  }

  onPointerMove(event) {
    const hit = this.getPointerIntersection(event);
    if (!hit) {
      this.hoveringOverHinge = false;
      return;
    }

    let obj = hit.object;
    while (obj && (!obj.userData || Object.keys(obj.userData).length === 0) && obj.parent) {
      obj = obj.parent;
    }
    const data = obj.userData || {};

    if (data.isHingeAxis) {
      this.hoveringOverHinge = true;
      if (this.currentStep === 2 && this.ghostDamper) {
        this.ghostDamper.visible = true;
      }
    } else {
      this.hoveringOverHinge = false;
    }

    // Circular mouse dragging during crank
    if (this.isCranking && this.currentStep === 1) {
      this.advanceCrank(0.04);
    }
  }

  advanceCrank(delta) {
    if (this.latchLocked) return;

    this.crankProgress = Math.min(1.0, this.crankProgress + delta);
    const totalAngle = this.crankProgress * this.targetRotations * Math.PI * 2;

    if (this.hexKeyGroup) {
      this.hexKeyGroup.rotation.y = totalAngle;
    }
    if (this.gearGroup) {
      this.gearGroup.rotation.y = totalAngle;
    }
    if (this.pinionGroup) {
      this.pinionGroup.rotation.y = -totalAngle * 2.4;
    }

    // Ratchet sound every ~15 degrees
    const currentStepIndex = Math.floor(totalAngle / (Math.PI / 12));
    if (currentStepIndex > this.lastRatchetStep) {
      this.lastRatchetStep = currentStepIndex;
      this.playRatchetClick();
    }

    // Update UI readout
    const pct = Math.floor(this.crankProgress * 100);
    const pctEl = this.container.querySelector('#sadmCrankPct');
    if (pctEl) pctEl.textContent = `${pct}%`;

    // 100% Locked!
    if (this.crankProgress >= 1.0 && !this.latchLocked) {
      this.latchLocked = true;
      this.isCranking = false;
      this.playHeavyLatchLock();

      const badge = this.container.querySelector('#sadmLatchBadge');
      if (badge) {
        badge.textContent = 'LOCKED';
        badge.className = 'pgt-status-badge active';
      }

      this.jitterAmount = 0.01; // reduced vibration
      this.showAlert("Heavy latch pawl engaged with gear tooth! Drive shaft locked into alignment.");

      setTimeout(() => {
        this.currentStep = 2;
        this.updateTaskPanel();
      }, 700);
    }
  }

  installDamperClip() {
    this.damperInstalled = true;
    this.playClipSnap();
    if (window.nasaAudio && window.nasaAudio.playPartFitted) {
      window.nasaAudio.playPartFitted();
    }

    // Hide tool on table and ghost, show permanent gold clip
    if (this.damperToolGroup) this.damperToolGroup.visible = false;
    if (this.ghostDamper) this.ghostDamper.visible = false;
    if (this.installedDamperMesh) this.installedDamperMesh.visible = true;

    // Eliminate all jitter
    this.jitterAmount = 0;

    this.showAlert("Thermal Damper Clip snapped tightly around hinge axis! Hinge stabilized.");

    setTimeout(() => {
      this.currentStep = 3;
      this.updateTaskPanel();
    }, 700);
  }

  flipCalibrationSwitch() {
    if (this.toggleSwitchFlipped) return;

    this.toggleSwitchFlipped = true;
    this.playSwitchClick();

    // Animate switch lever tilting down
    if (this.switchLever) {
      this.switchLever.rotation.x = Math.PI / 4; // Down/engaged position
    }

    // Start motor spin & servo hum
    this.motorRunning = true;
    this.playServoHum();

    // Turn warning beacon solid radiant green
    this.warningBeaconState = 'green_solid';
    if (this.beaconMat) {
      this.beaconMat.color.setHex(0x059669);
      this.beaconMat.emissive.setHex(0x10b981);
      this.beaconMat.emissiveIntensity = 1.2;
    }
    if (this.beaconLight) {
      this.beaconLight.color.setHex(0x10b981);
      this.beaconLight.intensity = 2.0;
    }

    setTimeout(() => {
      this.onSubtask02Completed();
    }, 1200);
  }

  onSubtask02Completed() {
    this.isComplete = true;
    this.playVictoryFanfare();

    if (this.completionCheckmark) {
      this.completionCheckmark.visible = true;
    }

    this.updateTaskPanel();

    if (window.DecisionManager && typeof window.DecisionManager.promptDecision === 'function') {
      window.DecisionManager.promptDecision('mech_task2', () => {
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

    // Pulse & visibility for all interactive highlights per step
    const tPulse = 1.0 + Math.sin(time * 5.0) * 0.12;
    if (this.hexKeyHighlight) {
      const showHex = (this.currentStep === 1 && !this.hexKeyEquipped && !this.hexKeyInserted);
      this.hexKeyHighlight.visible = showHex;
      if (showHex) {
        this.hexKeyHighlight.rotation.z += 0.03;
        this.hexKeyHighlight.scale.set(tPulse, tPulse, tPulse);
      }
    }
    if (this.gearSocketHighlight) {
      const showSocket = (this.currentStep === 1 && (!this.hexKeyInserted || !this.latchLocked));
      this.gearSocketHighlight.visible = showSocket;
      if (showSocket) {
        this.gearSocketHighlight.rotation.z += 0.02;
        this.gearSocketHighlight.scale.set(tPulse, tPulse, tPulse);
      }
    }
    if (this.damperClipHighlight) {
      const showDamper = (this.currentStep === 2 && !this.damperClipEquipped && !this.damperInstalled);
      this.damperClipHighlight.visible = showDamper;
      if (showDamper) {
        this.damperClipHighlight.rotation.z += 0.03;
        this.damperClipHighlight.scale.set(tPulse, tPulse, tPulse);
      }
    }
    if (this.hingeAxisHighlight) {
      const showAxis = (this.currentStep === 2 && !this.damperInstalled);
      this.hingeAxisHighlight.visible = showAxis;
      if (showAxis) {
        this.hingeAxisHighlight.rotation.z += 0.02;
        this.hingeAxisHighlight.scale.set(tPulse, tPulse, tPulse);
      }
    }
    if (this.switchHighlight) {
      const showSwitch = (this.currentStep === 3 && !this.toggleSwitchFlipped);
      this.switchHighlight.visible = showSwitch;
      if (showSwitch) {
        this.switchHighlight.rotation.z += 0.03;
        this.switchHighlight.scale.set(tPulse, tPulse, tPulse);
      }
    }

    // Jitter/slipping simulation while unlatched
    if (this.jitterAmount > 0 && this.sadmGroup) {
      this.sadmGroup.position.x = Math.sin(time * 30) * this.jitterAmount;
      this.sadmGroup.position.z = Math.cos(time * 25) * (this.jitterAmount * 0.6);
    } else if (this.sadmGroup) {
      this.sadmGroup.position.x = 0;
      this.sadmGroup.position.z = 0;
    }

    // Continuous hold-to-crank if mouse is held down
    if (this.isCranking && this.currentStep === 1) {
      this.advanceCrank(0.015);
    }

    // Step 2 Ghost pulse
    if (this.ghostDamper && this.ghostDamper.visible) {
      this.ghostMat.opacity = 0.4 + 0.3 * Math.sin(time * 6.0);
    }

    // Amber warning beacon blinking (at 3 Hz)
    if (this.warningBeaconState === 'amber_blink' && this.beaconMesh && this.beaconLight) {
      const blink = Math.sin(time * 8.0) > 0 ? 1.0 : 0.15;
      this.beaconMat.emissiveIntensity = blink * 1.2;
      this.beaconLight.intensity = blink * 1.8;
    }

    // Step 3 Motor running: gears spin smoothly and continuously without slipping!
    if (this.motorRunning) {
      const speed = 1.2;
      if (this.gearGroup) this.gearGroup.rotation.y += speed * 0.02;
      if (this.pinionGroup) this.pinionGroup.rotation.y -= speed * 0.02 * 2.4;
      if (this.hexKeyGroup && this.hexKeyInserted) this.hexKeyGroup.rotation.y += speed * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }

  getState() {
    return {
      currentStep: this.currentStep,
      isComplete: this.isComplete,
      crankProgress: this.crankProgress,
      latchLocked: this.latchLocked,
      damperInstalled: this.damperInstalled,
      toggleSwitchFlipped: this.toggleSwitchFlipped,
      motorRunning: this.motorRunning,
      warningBeaconState: this.warningBeaconState
    };
  }

  restoreState(s) {
    if (!s) return;
    this.currentStep = s.currentStep || this.currentStep;
    this.isComplete = !!s.isComplete;
    this.crankProgress = s.crankProgress || 0;
    this.latchLocked = !!s.latchLocked;
    this.damperInstalled = !!s.damperInstalled;
    this.toggleSwitchFlipped = !!s.toggleSwitchFlipped;
    this.motorRunning = !!s.motorRunning;
    this.warningBeaconState = s.warningBeaconState || this.warningBeaconState;

    if (this.latchLocked) {
      this.jitterAmount = 0.01;
      if (this.driveShaft) this.driveShaft.rotation.z = Math.PI * 2 * 3;
      if (this.hexKeyGroup) this.hexKeyGroup.visible = false;
    }

    if (this.damperInstalled) {
      this.jitterAmount = 0.0;
      if (this.damperToolGroup) this.damperToolGroup.visible = false;
      if (this.ghostDamper) this.ghostDamper.visible = false;
      if (this.installedDamperMesh) this.installedDamperMesh.visible = true;
    }

    if (this.toggleSwitchFlipped) {
      if (this.switchLever) {
        this.switchLever.rotation.x = Math.PI / 4;
      }
      if (this.beaconMat) {
        this.beaconMat.color.setHex(0x059669);
        this.beaconMat.emissive.setHex(0x10b981);
        this.beaconMat.emissiveIntensity = 1.2;
      }
      if (this.beaconLight) {
        this.beaconLight.color.setHex(0x10b981);
        this.beaconLight.intensity = 2.0;
      }
    }

    this.updateTaskPanel();
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
    window.removeEventListener('keydown', this.keyHandler);
    this.stopServoHum();
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
window.Sadm3D = Sadm3D;
