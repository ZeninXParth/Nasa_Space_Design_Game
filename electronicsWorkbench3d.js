/**
 * Horizon-X | NASA Space Mission Design Game
 * Electronics Workbench 3D: Desk No. 02 Interactive Station
 * 
 * Implements:
 * Task Suite 01: [SUB-TSK-E-01] DF-224 Main Computer Repair
 * - Step 1: Electrostatic Discharge (ESD) Safety Protocol (Wrist Strap attachment; spark & penalty if skipped)
 * - Step 2: Harness & Ribbon Cable Extraction (Precision Tweezers; unlatch safety tabs & drag cable)
 * - Step 3: Swapping the PCB Board (IC Extractor tool; lift scorched board, seat replacement flight PCB)
 * - Step 4: Re-cabling & Locking (Drag ribbon back into slot, press E / click to lock pins)
 * 
 * Task Suite 02: [SUB-TSK-E-02] Fine Guidance Sensor (FGS) Calibration
 * - Step 1: Multimeter Voltage Check (Digital Multimeter Probes: Red to Node A, Black to Node B -> reads 3.2V)
 * - Step 2: Potentiometer Tuning (Non-Conductive Screwdriver -> rotate screw until voltage rises to 5.0V ± 0.1V)
 * - Step 3: Signal Waveform Alignment (Interactive Oscilloscope: tune Frequency & Amplitude knobs to match yellow wave inside green reference template for 2s)
 * 
 * Phase 3: Master Power Circuit Breaker Panel
 * - Heavy transparent safety flip-cover + Master ON/OFF toggle switch + internal bay telemetry power-up sequence
 */

class ElectronicsWorkbench3D {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.onCompleteTask01 = options.onCompleteTask01 || null;
    this.onCompleteTask02 = options.onCompleteTask02 || null;
    this.onBreakerOn = options.onBreakerOn || null;
    this.onShock = options.onShock || null;

    // Active Task Mode: 'subtask01' (DF-224) or 'subtask02' (FGS)
    this.activeTask = options.initialTask || 'subtask01';

    // State for SUB-TSK-E-01 (DF-224)
    this.e01 = {
      wristStrapAttached: false,
      tabLeftUnlocked: false,
      tabRightUnlocked: false,
      ribbonExtracted: false,
      burntPcbRemoved: false,
      newPcbSeated: false,
      ribbonReconnected: false,
      pinsLocked: false,
      isComplete: false
    };

    // State for SUB-TSK-E-02 (FGS)
    this.e02 = {
      probeRedAttached: false,
      probeBlackAttached: false,
      currentVoltage: 3.20,
      targetVoltage: 5.00,
      voltageTuned: false,
      tuningActive: false,
      // Oscilloscope alignment
      scopeFrequency: 1.0,     // Target: ~2.5
      scopeAmplitude: 0.45,    // Target: ~1.2
      targetFrequency: 2.50,
      targetAmplitude: 1.20,
      alignmentTimer: 0,
      requiredHoldTime: 2.0,   // 2 continuous seconds
      waveLocked: false,
      isComplete: false
    };

    // Phase 3 Circuit Breaker
    this.breakerCoverOpen = false;
    this.breakerMasterOn = false;

    // Metrics for Scoring
    this.staticShockIncidents = 0;
    this.voltagePrecision = 0;

    // Audio & Three.js instances
    this.audioCtx = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveObjects = [];
    this.animId = null;

    // Waveform canvas & texture for Oscilloscope
    this.scopeCanvas = null;
    this.scopeCtx = null;
    this.scopeTexture = null;

    // Multimeter canvas & texture
    this.dmmCanvas = null;
    this.dmmCtx = null;
    this.dmmTexture = null;

    // Dynamic 3D Object References
    this.models = {};

    this.initAudio();
    this.init();
  }

  // -------------------------------------------------------------------------
  // WEB AUDIO SYNTHESIZER
  // -------------------------------------------------------------------------
  initAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {}
  }

  ensureAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  isMuted() {
    return typeof window.isNasaAudioMuted === 'function' ? window.isNasaAudioMuted() : false;
  }

  playSparkZap() {
    if (this.isMuted()) return;
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Noise burst for electric arc
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Alarm klaxon
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playGroundingSnap() {
    if (this.isMuted()) return;
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playProbeClick() {
    if (this.isMuted()) return;
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playPotClick() {
    if (this.isMuted()) return;
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playScopeLock() {
    if (this.isMuted()) return;
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Resonant dual-harmonic aerospace chime
    [659.25, 1046.50, 1318.51].forEach((freq, idx) => {
      const t = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  playBreakerSnap() {
    if (this.isMuted()) return;
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Heavy mechanical switch clack
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playPowerUpHum() {
    if (this.isMuted()) return;
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Deep power-up inverter hum rising from 60Hz to 240Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 1.2);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.1);
  }

  playErrorBuzz() {
    if (this.isMuted()) return;
    this.ensureAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(110, now);
    osc2.frequency.setValueAtTime(116, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  showAlert(message, isError = true) {
    const col = document.getElementById('wbElecLowerErrorCol');
    const msg = document.getElementById('wbElecLowerErrorMsg');
    const icon = document.getElementById('wbElecErrorIcon');
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
    return !!(gs && ((gs.elecInventory && gs.elecInventory[id]) || (gs.elecPurchased && gs.elecPurchased[id])));
  }

  // -------------------------------------------------------------------------
  // INITIALIZATION & SCENE SETUP
  // -------------------------------------------------------------------------
  init() {
    if (!this.container) return;
    this.container.innerHTML = '';

    // Create DOM Overlay Panels (Instruction HUD, Controls, Waveform HUD)
    this.createDomOverlays();

    const width = this.container.clientWidth || 980;
    const height = this.container.clientHeight || 560;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 3.6, 3.4);
    this.camera.lookAt(0, 0.30, 0.15);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.createStaticLabProps();
    this.createDF224ComputerModule();
    this.createFGSSensorModule();
    this.createMasterBreakerPanel();
    this.createGroundingWristStrap();
    this.createStepTargetBeacon();
    this.createMiniGamePanels();

    this.setupInputEvents();
    this.setTaskView(this.activeTask);

    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  setupLighting() {
    const amb = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    dirLight.position.set(3.5, 8.0, 4.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x0284c7, 0.5);
    blueFill.position.set(-5, 4, -3);
    this.scene.add(blueFill);

    this.benchSpot = new THREE.SpotLight(0xffffff, 1.4, 12, Math.PI / 4, 0.25);
    this.benchSpot.position.set(0, 4.0, 0);
    this.benchSpot.target.position.set(0, 0.2, 0);
    this.scene.add(this.benchSpot);
    this.scene.add(this.benchSpot.target);
  }

  // -------------------------------------------------------------------------
  // 3D STATIC LAB PROPS (ESD Mat, Power Supply, Oscilloscope, Cable Harness)
  // -------------------------------------------------------------------------
  createStaticLabProps() {
    // 1. Dark ESD Workbench Surface
    const benchGeo = new THREE.PlaneGeometry(16, 12);
    let benchTex = null;
    if (typeof THREE.TextureLoader !== 'undefined') {
      try {
        const texLoader = new THREE.TextureLoader();
        benchTex = texLoader.load('assets/images/Work-bech-mat.jpeg');
        if (benchTex && typeof THREE.RepeatWrapping !== 'undefined') {
          benchTex.wrapS = THREE.RepeatWrapping;
          benchTex.wrapT = THREE.RepeatWrapping;
          if (benchTex.repeat && benchTex.repeat.set) benchTex.repeat.set(2, 2);
        }
      } catch (e) {
        console.warn('ElectronicsWorkbench3D: Mat texture load notice:', e);
      }
    }
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: benchTex,
      roughness: 0.85,
      metalness: 0.2
    });
    const benchMesh = new THREE.Mesh(benchGeo, benchMat);
    benchMesh.rotation.x = -Math.PI / 2;
    benchMesh.position.y = -0.01;
    benchMesh.receiveShadow = true;
    this.scene.add(benchMesh);

    // 2. Light Blue / Turquoise Rubber ESD Anti-Static Mat
    const matCanvas = document.createElement('canvas');
    matCanvas.width = 512;
    matCanvas.height = 512;
    const mctx = matCanvas.getContext('2d');
    mctx.fillStyle = '#0284c7';
    mctx.fillRect(0, 0, 512, 512);
    mctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    mctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 64) {
      mctx.beginPath();
      mctx.moveTo(i, 0); mctx.lineTo(i, 512);
      mctx.moveTo(0, i); mctx.lineTo(512, i);
      mctx.stroke();
    }
    mctx.fillStyle = '#ffffff';
    mctx.font = '700 22px "Tektur", sans-serif';
    mctx.fillText('NASA GSFC // ESD PROTECTED ZONE', 30, 40);

    const matTex = new THREE.CanvasTexture(matCanvas);
    const esdMat = new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.65, metalness: 0.1 });
    const esdMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.8), esdMat);
    esdMesh.rotation.x = -Math.PI / 2;
    esdMesh.position.set(0, 0.005, 0.15);
    esdMesh.receiveShadow = true;
    this.scene.add(esdMesh);

    // ESD Grounding Snap on the corner of the mat
    const snapMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 }));
    snapMesh.position.set(-2.8, 0.02, -1.6);
    this.scene.add(snapMesh);

    // 3. Regulated DC Power Supply Unit (Top Left)
    const psuGroup = new THREE.Group();
    psuGroup.position.set(-2.0, 0.35, -1.3);
    const psuBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.9), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 }));
    psuGroup.add(psuBox);

    // Glowing 7-segment digital display for PSU (12.0 V / 3.5 A)
    const psuDispCanvas = document.createElement('canvas');
    psuDispCanvas.width = 256;
    psuDispCanvas.height = 128;
    const pctx = psuDispCanvas.getContext('2d');
    pctx.fillStyle = '#0f172a';
    pctx.fillRect(0, 0, 256, 128);
    pctx.fillStyle = '#10b981';
    pctx.font = '700 38px monospace';
    pctx.fillText('12.00 V', 20, 50);
    pctx.fillStyle = '#38bdf8';
    pctx.fillText(' 3.50 A', 20, 105);
    const psuDispMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.32), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(psuDispCanvas) }));
    psuDispMesh.position.set(-0.25, 0.08, 0.46);
    psuGroup.add(psuDispMesh);

    // PSU Banana Terminals (+ Red, - Black, GND Green)
    const termRed = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    termRed.rotation.x = Math.PI / 2;
    termRed.position.set(0.3, -0.15, 0.46);
    psuGroup.add(termRed);
    const termBlack = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    termBlack.rotation.x = Math.PI / 2;
    termBlack.position.set(0.42, -0.15, 0.46);
    psuGroup.add(termBlack);
    this.scene.add(psuGroup);

    // 4. Benchtop Digital Oscilloscope (Top Right)
    this.createBenchOscilloscope(1.8, 0.45, -1.2);

    // 5. Heavy Umbilical Telemetry Cable Harness running toward Hubble
    this.createHubbleTelemetryHarness();
  }

  createBenchOscilloscope(x, y, z) {
    const scopeGroup = new THREE.Group();
    scopeGroup.position.set(x, y, z);

    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.95), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.6 }));
    scopeGroup.add(bodyMesh);

    // Oscilloscope Screen Texture
    this.scopeCanvas = document.createElement('canvas');
    this.scopeCanvas.width = 512;
    this.scopeCanvas.height = 340;
    this.scopeCtx = this.scopeCanvas.getContext('2d');
    this.scopeTexture = new THREE.CanvasTexture(this.scopeCanvas);

    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.65), new THREE.MeshBasicMaterial({ map: this.scopeTexture }));
    screenMesh.position.set(-0.28, 0.05, 0.48);
    scopeGroup.add(screenMesh);
    this.models.scopeScreenMesh = screenMesh;

    // Physical Knobs: [Frequency] and [Amplitude]
    const knobMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });

    const freqKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16), knobMat);
    freqKnob.rotation.x = Math.PI / 2;
    freqKnob.position.set(0.52, 0.15, 0.48);
    freqKnob.name = 'knobFrequency';
    scopeGroup.add(freqKnob);
    this.models.freqKnob = freqKnob;
    this.interactiveObjects.push(freqKnob);

    const ampKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16), knobMat);
    ampKnob.rotation.x = Math.PI / 2;
    ampKnob.position.set(0.52, -0.15, 0.48);
    ampKnob.name = 'knobAmplitude';
    scopeGroup.add(ampKnob);
    this.models.ampKnob = ampKnob;
    this.interactiveObjects.push(ampKnob);

    // Knob Labels
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 256;
    const lctx = labelCanvas.getContext('2d');
    lctx.fillStyle = '#334155';
    lctx.fillRect(0, 0, 256, 256);
    lctx.fillStyle = '#38bdf8';
    lctx.font = '700 24px "Tektur", sans-serif';
    lctx.fillText('FREQ', 20, 80);
    lctx.fillText('AMP', 20, 210);
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.35), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(labelCanvas) }));
    labelMesh.position.set(0.72, 0.0, 0.48);
    scopeGroup.add(labelMesh);

    this.scene.add(scopeGroup);
    this.models.scopeGroup = scopeGroup;
    this.updateOscilloscopeDisplay(0);
  }

  updateOscilloscopeDisplay(time) {
    if (!this.scopeCtx || !this.scopeCanvas) return;
    const ctx = this.scopeCtx;
    const W = this.scopeCanvas.width;
    const H = this.scopeCanvas.height;

    // Dark grid background
    ctx.fillStyle = '#061325';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 34) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Top Telemetry Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 16px "Tektur", monospace';
    ctx.fillText('GSFC OSCILLOSCOPE // FGS SIGNAL CH-A', 15, 24);

    if (this.e02.waveLocked) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('STATUS: LOCKED // COHERENT (2.50 Hz / 1.20 V)', 15, 46);
    } else {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`STATUS: TUNING [F: ${this.e02.scopeFrequency.toFixed(2)} Hz | A: ${this.e02.scopeAmplitude.toFixed(2)} V]`, 15, 46);
    }

    const centerY = H / 2 + 15;

    // 1. Static Green Reference Template Wave Box / Outline
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const refFreq = this.e02.targetFrequency; // 2.5
    const refAmp = this.e02.targetAmplitude * 55; // pixels
    for (let x = 0; x <= W; x += 4) {
      const angle = (x / W) * Math.PI * 2 * refFreq;
      const y = centerY + Math.sin(angle) * refAmp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Live Waveform (Chaotic yellow with noise, until tuned)
    const isLocked = this.e02.waveLocked;
    ctx.strokeStyle = isLocked ? '#10b981' : '#facc15';
    ctx.lineWidth = isLocked ? 3.5 : 2.5;
    ctx.beginPath();

    const curFreq = this.e02.scopeFrequency;
    const curAmp = this.e02.scopeAmplitude * 55;
    const noiseAmp = isLocked ? 0 : 7.0;

    for (let x = 0; x <= W; x += 2) {
      const angle = (x / W) * Math.PI * 2 * curFreq + time * (isLocked ? 4 : 8);
      const jitter = Math.sin(x * 0.45 + time * 12) * noiseAmp;
      const y = centerY + Math.sin(angle) * curAmp + jitter;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Alignment Feedback Overlay
    if (!isLocked && this.e02.alignmentTimer > 0) {
      const pct = Math.min(100, Math.floor((this.e02.alignmentTimer / this.e02.requiredHoldTime) * 100));
      ctx.fillStyle = '#10b981';
      ctx.font = '700 18px "Tektur", sans-serif';
      ctx.fillText(`PHASE LOCKING: ${pct}% [HOLD STEADY]`, W / 2 - 140, H - 20);
    }

    this.scopeTexture.needsUpdate = true;
  }

  createHubbleTelemetryHarness() {
    // Umbilical heavy aerospace cable running from bench forward towards Hubble
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.8, 0.05, 0.5),
      new THREE.Vector3(-1.4, 0.03, 1.4),
      new THREE.Vector3(-0.2, 0.02, 2.5),
      new THREE.Vector3(2.2, 0.02, 4.0)
    ]);
    const cableGeo = new THREE.TubeGeometry(curve, 32, 0.045, 8, false);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
    const cableMesh = new THREE.Mesh(cableGeo, cableMat);
    this.scene.add(cableMesh);

    // Glowing telemetry pulse line along cable
    const glowGeo = new THREE.TubeGeometry(curve, 32, 0.015, 6, false);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(glowMesh);
    this.models.harnessGlow = glowMesh;
  }

  // -------------------------------------------------------------------------
  // TASK SUITE 01: [SUB-TSK-E-01] DF-224 MAIN COMPUTER REPAIR
  // -------------------------------------------------------------------------
  createDF224ComputerModule() {
    this.df224Group = new THREE.Group();
    this.df224Group.position.set(0, 0, 0.35);

    // Main Open Avionic Card Cage Chassis (Visible Internal Motherboard Bay)
    const bayMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
    const cavityMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 });

    // Chassis Bottom Floor
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 1.8), bayMat);
    bottom.position.y = 0.02;
    this.df224Group.add(bottom);

    // Chassis Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.38, 0.06), bayMat);
    backWall.position.set(0, 0.19, -0.87);
    this.df224Group.add(backWall);

    // Chassis Front Lip (Low profile so interior components are 100% visible)
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.06), bayMat);
    frontWall.position.set(0, 0.07, 0.87);
    this.df224Group.add(frontWall);

    // Chassis Left & Right Guide Walls
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 1.8), bayMat);
    leftWall.position.set(-1.17, 0.19, 0);
    this.df224Group.add(leftWall);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 1.8), bayMat);
    rightWall.position.set(1.17, 0.19, 0);
    this.df224Group.add(rightWall);

    // Gold Kapton thermal foil lining inside open cavity floor
    const cavityFloor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.01, 1.6), cavityMat);
    cavityFloor.position.set(0, 0.04, 0);
    this.df224Group.add(cavityFloor);

    // Motherboard backplane connector slot (where the PCB inserts)
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const slotMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.15), slotMat);
    slotMesh.position.set(0, 0.12, -0.45);
    this.df224Group.add(slotMesh);

    // Guide Rails (Left & Right)
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.85), railMat);
    railL.position.set(-0.68, 0.24, -0.05);
    this.df224Group.add(railL);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.85), railMat);
    railR.position.set(0.68, 0.24, -0.05);
    this.df224Group.add(railR);

    // 1. Damaged PCB with visible scorch marks & burnt components
    this.createDamagedPCB();

    // 2. New Replacement PCB (Ready on the side stand)
    this.createNewPCBStand();

    // 3. Aerospace Gold Data Ribbon Cable with Locking Tabs
    this.createRibbonCable();

    // NASA DF-224 Nameplate
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 256;
    nameCanvas.height = 64;
    const nctx = nameCanvas.getContext('2d');
    nctx.fillStyle = '#1e293b';
    nctx.fillRect(0, 0, 256, 64);
    nctx.fillStyle = '#38bdf8';
    nctx.font = '700 24px "Tektur", sans-serif';
    nctx.fillText('DF-224 CORE COMPUTER', 10, 42);
    const nameMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(nameCanvas) }));
    nameMesh.position.set(0, 0.07, 0.91);
    this.df224Group.add(nameMesh);

    this.scene.add(this.df224Group);
    this.models.df224Group = this.df224Group;
  }

  createDamagedPCB() {
    this.burntPcbGroup = new THREE.Group();
    this.burntPcbGroup.position.set(0, 0.26, -0.05);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Scorched blackened burnt circuit board
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 320);

    // Burn / scorch mark
    const rad = ctx.createRadialGradient(256, 160, 10, 256, 160, 160);
    rad.addColorStop(0, '#000000');
    rad.addColorStop(0.5, '#1c1917');
    rad.addColorStop(0.8, '#78350f');
    rad.addColorStop(1, 'transparent');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 512, 320);

    ctx.fillStyle = '#ef4444';
    ctx.font = '700 20px monospace';
    ctx.fillText('CRITICAL OVERHEAT // IC BLOWN', 80, 50);

    const pcbMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.6, metalness: 0.3 });
    const pcbMesh = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.02, 0.78), pcbMat);
    this.burntPcbGroup.add(pcbMesh);

    // Blown capacitor 3D meshes with charring
    const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 }));
    cap1.position.set(-0.2, 0.04, 0.1);
    this.burntPcbGroup.add(cap1);

    pcbMesh.name = 'targetBurntPcb';
    this.interactiveObjects.push(pcbMesh);
    this.models.burntPcbGroup = this.burntPcbGroup;
    this.df224Group.add(this.burntPcbGroup);
  }

  createNewPCBStand() {
    this.newPcbGroup = new THREE.Group();
    this.newPcbGroup.position.set(2.4, 0.25, 0.6); // Sits on ESD tray to the right

    // Clean green/gold flight PCB texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#047857';
    ctx.fillRect(0, 0, 512, 320);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    for (let x = 30; x <= 480; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x + 20, 300); ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 20px "Tektur", sans-serif';
    ctx.fillText('HST-DF224 REPLACEMENT // FLIGHT READY', 40, 50);

    const newPcbMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.4, metalness: 0.5 });
    const newPcbMesh = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.02, 0.78), newPcbMat);
    newPcbMesh.name = 'targetNewPcb';
    this.newPcbGroup.add(newPcbMesh);

    // Gold connector edge contacts
    const edge = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.025, 0.06), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95 }));
    edge.position.set(0, 0, -0.4);
    this.newPcbGroup.add(edge);

    this.interactiveObjects.push(newPcbMesh);
    this.models.newPcbGroup = this.newPcbGroup;
    this.scene.add(this.newPcbGroup);
  }

  createRibbonCable() {
    this.ribbonGroup = new THREE.Group();
    this.ribbonGroup.position.set(0, 0.28, 0.35);

    // Amber Kapton Data Ribbon
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.6 });
    const ribbonMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.015, 0.35), ribbonMat);
    ribbonMesh.name = 'targetRibbonCable';
    this.ribbonGroup.add(ribbonMesh);
    this.interactiveObjects.push(ribbonMesh);

    // Connector Header Box
    const headerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const headerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.08), headerMat);
    headerMesh.position.set(0, 0.02, -0.17);
    headerMesh.name = 'targetRibbonCable';
    this.ribbonGroup.add(headerMesh);
    this.interactiveObjects.push(headerMesh);

    // Left Locking Tab (Gold / Yellow)
    const tabMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });
    const tabL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), tabMat);
    tabL.position.set(-0.46, 0.04, -0.17);
    tabL.name = 'tabLeft';
    this.ribbonGroup.add(tabL);
    this.models.tabL = tabL;
    this.interactiveObjects.push(tabL);

    // Right Locking Tab
    const tabR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), tabMat);
    tabR.position.set(0.46, 0.04, -0.17);
    tabR.name = 'tabRight';
    this.ribbonGroup.add(tabR);
    this.models.tabR = tabR;
    this.interactiveObjects.push(tabR);

    this.df224Group.add(this.ribbonGroup);
    this.models.ribbonGroup = this.ribbonGroup;
  }

  // -------------------------------------------------------------------------
  // TASK SUITE 02: [SUB-TSK-E-02] FINE GUIDANCE SENSOR (FGS) MODULE
  // -------------------------------------------------------------------------
  createFGSSensorModule() {
    this.fgsGroup = new THREE.Group();
    this.fgsGroup.position.set(0, 0, 0.35);

    // Precision Aluminum Enclosure Box
    const fgsMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.6), fgsMat);
    boxMesh.position.y = 0.275;
    boxMesh.receiveShadow = true;
    boxMesh.castShadow = true;
    this.fgsGroup.add(boxMesh);

    // Optical Collimator Bezel
    const opticMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.1 }));
    opticMesh.position.set(-0.55, 0.58, 0.1);
    this.fgsGroup.add(opticMesh);

    // Exposed Metallic Test Points / Nodes
    // Node A (Red / Positive)
    const nodeAGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16);
    const nodeAMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.1 });
    const nodeA = new THREE.Mesh(nodeAGeo, nodeAMat);
    nodeA.position.set(0.25, 0.57, 0.2);
    nodeA.name = 'nodeA';
    this.fgsGroup.add(nodeA);
    this.models.nodeA = nodeA;
    this.interactiveObjects.push(nodeA);

    // Node B (Black / Negative)
    const nodeBMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const nodeB = new THREE.Mesh(nodeAGeo, nodeBMat);
    nodeB.position.set(0.65, 0.57, 0.2);
    nodeB.name = 'nodeB';
    this.fgsGroup.add(nodeB);
    this.models.nodeB = nodeB;
    this.interactiveObjects.push(nodeB);

    // Potentiometer Adjustment Screw (Between Nodes)
    const potGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.3 });
    const potScrew = new THREE.Mesh(potGeo, potMat);
    potScrew.position.set(0.45, 0.57, -0.15);
    potScrew.name = 'potScrew';
    this.fgsGroup.add(potScrew);
    this.models.potScrew = potScrew;
    this.interactiveObjects.push(potScrew);

    // Benchtop Digital Multimeter Display mounted directly beside nodes
    this.createMultimeterDisplay(0.45, 0.58, 0.55);

    this.scene.add(this.fgsGroup);
    this.models.fgsGroup = this.fgsGroup;
  }

  createMultimeterDisplay(x, y, z) {
    this.dmmCanvas = document.createElement('canvas');
    this.dmmCanvas.width = 300;
    this.dmmCanvas.height = 150;
    this.dmmCtx = this.dmmCanvas.getContext('2d');
    this.dmmTexture = new THREE.CanvasTexture(this.dmmCanvas);

    const dmmMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: this.dmmTexture }));
    dmmMesh.rotation.x = -Math.PI / 3;
    dmmMesh.position.set(x, y, z);
    this.fgsGroup.add(dmmMesh);

    this.updateMultimeterDisplay(this.e02.currentVoltage);
  }

  updateMultimeterDisplay(val) {
    if (!this.dmmCtx || !this.dmmCanvas) return;
    const ctx = this.dmmCtx;
    const W = this.dmmCanvas.width;
    const H = this.dmmCanvas.height;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px "Tektur", sans-serif';
    ctx.fillText('TRUE RMS MULTIMETER // DC VOLTS', 15, 28);

    // Value color: Red if incorrect (3.2V), Solid Green if tuned to 5.0V (±0.1V)
    const isNominal = Math.abs(val - 5.0) <= 0.1;
    ctx.fillStyle = isNominal ? '#10b981' : '#ef4444';
    ctx.font = '700 52px monospace';
    ctx.fillText(`${val.toFixed(2)} V`, 40, 95);

    ctx.fillStyle = isNominal ? '#10b981' : '#f59e0b';
    ctx.font = '600 15px "Tektur", sans-serif';
    ctx.fillText(isNominal ? 'NOMINAL: 5.00V [PASSED]' : 'REQUIREMENT: 5.00V (±0.1V)', 15, 132);

    this.dmmTexture.needsUpdate = true;
  }

  // -------------------------------------------------------------------------
  // GROUNDING WRIST STRAP (ESD SAFETY)
  // -------------------------------------------------------------------------
  createGroundingWristStrap() {
    this.strapGroup = new THREE.Group();
    // Placed in clear foreground view to the left of the computer chassis
    this.strapGroup.position.set(-1.15, 0.06, 0.45);

    // Blue elastic cuff band lying flat on the mat
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.2 });
    const bandMesh = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.038, 16, 32), bandMat);
    bandMesh.rotation.x = Math.PI / 2;
    bandMesh.name = 'targetWristStrap';
    this.strapGroup.add(bandMesh);
    this.interactiveObjects.push(bandMesh);
    this.models.wristStrap = bandMesh;

    // Metallic grounding snap stud on the cuff
    const snapMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 })
    );
    snapMesh.position.set(0, 0.035, 0);
    this.strapGroup.add(snapMesh);

    // Bright yellow alligator ground clip attached to the bench snap
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const clipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.14), clipMat);
    clipMesh.position.set(-0.35, 0.02, -0.4);
    clipMesh.name = 'targetWristStrap';
    this.strapGroup.add(clipMesh);
    this.interactiveObjects.push(clipMesh);

    // Coiled bright cyan grounding cable connecting cuff snap to clip
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.03, 0),
      new THREE.Vector3(-0.12, 0.06, -0.15),
      new THREE.Vector3(-0.25, 0.04, -0.28),
      new THREE.Vector3(-0.35, 0.02, -0.4)
    ]);
    const cableGeo = new THREE.TubeGeometry(curve, 24, 0.016, 8, false);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.3 });
    const cableMesh = new THREE.Mesh(cableGeo, cableMat);
    this.strapGroup.add(cableMesh);

    this.scene.add(this.strapGroup);
    this.models.strapGroup = this.strapGroup;
  }

  // -------------------------------------------------------------------------
  // PHASE 3: MASTER CIRCUIT BREAKER PANEL
  // -------------------------------------------------------------------------
  createMasterBreakerPanel() {
    this.breakerGroup = new THREE.Group();
    this.breakerGroup.position.set(-1.45, 0.22, 0.55);

    // Panel box
    const panelBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.3), new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 }));
    this.breakerGroup.add(panelBox);

    // Transparent Plastic Safety Flip Cover
    const coverGeo = new THREE.BoxGeometry(0.24, 0.32, 0.05);
    const coverMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.1, transmission: 0.85 });
    const coverMesh = new THREE.Mesh(coverGeo, coverMat);
    coverMesh.position.set(0, 0.05, 0.16);
    coverMesh.name = 'breakerCover';
    this.breakerGroup.add(coverMesh);
    this.models.breakerCover = coverMesh;
    this.interactiveObjects.push(coverMesh);

    // Master Toggle Switch Lever
    const leverGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12);
    const leverMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9 });
    const leverMesh = new THREE.Mesh(leverGeo, leverMat);
    leverMesh.rotation.x = -Math.PI / 4; // Default DOWN (OFF)
    leverMesh.position.set(0, 0.02, 0.15);
    leverMesh.name = 'breakerLever';
    this.breakerGroup.add(leverMesh);
    this.models.breakerLever = leverMesh;
    this.interactiveObjects.push(leverMesh);

    this.scene.add(this.breakerGroup);
    this.models.breakerGroup = this.breakerGroup;
  }

  // -------------------------------------------------------------------------
  // DOM OVERLAYS & UI CONTROLS
  // -------------------------------------------------------------------------
  createDomOverlays() {
    if (!this.ui) this.ui = {};

    // 1. Top-Left Step Card (.wb-figma-step-card matching Mechanical Workbench 1:1)
    this.ui.taskPanel = document.createElement('div');
    this.ui.taskPanel.className = 'wb-figma-step-card';
    this.container.appendChild(this.ui.taskPanel);

    // 2. Floating ESD Safety Status Pill (Top-Right of 3D Canvas)
    this.ui.esdPill = document.createElement('div');
    this.ui.esdPill.className = 'wb-elec-esd-pill ' + (this.e01.wristStrapAttached ? 'grounded' : 'ungrounded');
    this.ui.esdPill.id = 'wbEsdPill';
    this.ui.esdPill.innerHTML = `
      <span class="esd-dot"></span>
      <span id="wbEsdStatusText">${this.e01.wristStrapAttached ? 'ESD: GROUNDED (0.0V)' : 'ESD: UNGROUNDED (CLICK STRAP)'}</span>
    `;
    this.container.appendChild(this.ui.esdPill);

    if (this.ui.esdPill) {
      this.ui.esdPill.addEventListener('click', () => {
        if (!this.e01.wristStrapAttached) this.attachWristStrap();
      });
    }

    // 3. Lower footer mode switcher buttons
    const btnModePrev = document.getElementById('btnWbElecModePrev');
    const btnModeNext = document.getElementById('btnWbElecModeNext');
    const toggleElecMode = () => {
      const modeText = document.getElementById('wbElecFooterModeText');
      if (modeText) {
        if (modeText.textContent.includes('ESD Grounded')) {
          modeText.textContent = '[ 5V Power Rail | DMM ]';
        } else {
          modeText.textContent = this.e01.wristStrapAttached ? '[ ESD Grounded | 0.0V ]' : '[ ESD UNGROUNDED | 120V ]';
        }
      }
      this.playProbeClick();
    };
    if (btnModePrev) btnModePrev.onclick = toggleElecMode;
    if (btnModeNext) btnModeNext.onclick = toggleElecMode;
  }

  // -------------------------------------------------------------------------
  // TASK SWITCHING & VIEWPORT POSITIONING
  // -------------------------------------------------------------------------
  setTaskView(taskKey) {
    this.activeTask = taskKey;
    if (this.models.df224Group) {
      this.models.df224Group.visible = (taskKey === 'subtask01');
    }
    if (this.models.fgsGroup) {
      this.models.fgsGroup.visible = (taskKey === 'subtask02');
    }
    if (this.models.newPcbGroup) {
      this.models.newPcbGroup.visible = (taskKey === 'subtask01');
    }

    this.updateInstructionBanner();
  }

  updateInstructionBanner() {
    let msg = '';
    let stepTitle = '';
    let stepDesc = '';
    let toolIndex = 1;

    if (this.activeTask === 'subtask01') {
      if (!this.e01.wristStrapAttached) {
        msg = 'CLICK BLUE WRIST STRAP TO EQUALIZE ESD POTENTIAL';
        stepTitle = 'ID: [SUB-TSK-E-01] DF-224 CORE COMPUTER REPAIR';
        stepDesc = 'STEP 1: Electrostatic Discharge Protocol. Click the blue Grounding Wrist Strap on the mat to attach ground.';
        toolIndex = 1;
      } else if (!this.e01.tabLeftUnlocked) {
        msg = 'CLICK LEFT GOLD SAFETY TAB TO UNLATCH CONNECTOR';
        stepTitle = 'ID: [SUB-TSK-E-01] DF-224 CORE COMPUTER REPAIR';
        stepDesc = 'STEP 2A: Disengage Left Safety Tab. Click the gold tab on the left side of the Kapton ribbon header.';
        toolIndex = 2;
      } else if (!this.e01.tabRightUnlocked) {
        msg = 'CLICK RIGHT GOLD SAFETY TAB TO UNLATCH CONNECTOR';
        stepTitle = 'ID: [SUB-TSK-E-01] DF-224 CORE COMPUTER REPAIR';
        stepDesc = 'STEP 2B: Disengage Right Safety Tab. Click the gold tab on the right side of the Kapton ribbon header.';
        toolIndex = 2;
      } else if (!this.e01.ribbonExtracted) {
        msg = 'CLICK AMBER KAPTON RIBBON CABLE TO UNSEAT DATA HARNESS';
        stepTitle = 'ID: [SUB-TSK-E-01] DF-224 CORE COMPUTER REPAIR';
        stepDesc = 'STEP 3: Unseat Amber Kapton Ribbon Cable. Click the cable connector to extract it from the motherboard socket.';
        toolIndex = 2;
      } else if (!this.e01.burntPcbRemoved) {
        msg = 'CLICK SCORCHED CIRCUIT BOARD TO EXTRACT VIA IC EXTRACTOR';
        stepTitle = 'ID: [SUB-TSK-E-01] DF-224 CORE COMPUTER REPAIR';
        stepDesc = 'STEP 4: Remove Damaged PCB. Click the burnt circuit board to lift it out of the card guide rails into the scrap tray.';
        toolIndex = 3;
      } else if (!this.e01.newPcbSeated) {
        msg = 'CLICK GREEN FLIGHT REPLACEMENT PCB ON RIGHT TO SLIDE INTO SLOT';
        stepTitle = 'ID: [SUB-TSK-E-01] DF-224 CORE COMPUTER REPAIR';
        stepDesc = 'STEP 5: Insert Replacement PCB. Click the green HST-DF224 flight board on the right tray to align and seat into slot.';
        toolIndex = 6;
      } else if (!this.e01.ribbonReconnected) {
        msg = 'CLICK DATA RIBBON CABLE TO RE-SEAT INTO MOTHERBOARD HEADER';
        stepTitle = 'ID: [SUB-TSK-E-01] DF-224 CORE COMPUTER REPAIR';
        stepDesc = 'STEP 6: Re-seat Data Harness. Click the Kapton ribbon to slide it forward and mate with the new circuit board.';
        toolIndex = 7;
      } else if (!this.e01.pinsLocked) {
        msg = 'CLICK SAFETY TABS TO LOCK DATA HARNESS IN PLACE';
        stepTitle = 'ID: [SUB-TSK-E-01] DF-224 CORE COMPUTER REPAIR';
        stepDesc = 'STEP 7: Lock Safety Retainers. Click the gold locking tabs to clamp the connector shut.';
        toolIndex = 2;
      } else {
        msg = 'SUBTASK E-01 VERIFIED! PROCEED TO [SUB-TSK-E-02] FGS CALIBRATION TAB';
        stepTitle = 'ID: [SUB-TSK-E-01] COMPLETE';
        stepDesc = 'DF-224 Computer Repair Complete. Switch to [SUB-TSK-E-02] tab at the top to calibrate FGS sensors.';
      }
    } else if (this.activeTask === 'subtask02') {
      if (!this.e02.probeRedAttached) {
        msg = 'CLICK TEST POINT NODE A TO CONNECT RED (+) MULTIMETER PROBE';
        stepTitle = 'ID: [SUB-TSK-E-02] FGS ELECTRONICS CALIBRATION';
        stepDesc = 'STEP 1: Multimeter Setup. Click the red test lead (Node A) on the sensor module to connect positive probe.';
        toolIndex = 4;
      } else if (!this.e02.probeBlackAttached) {
        msg = 'CLICK TEST POINT NODE B TO CONNECT BLACK (-) GROUND PROBE';
        stepTitle = 'ID: [SUB-TSK-E-02] FGS ELECTRONICS CALIBRATION';
        stepDesc = 'STEP 2: Multimeter Setup. Click the black test lead (Node B) to ground the multimeter reference.';
        toolIndex = 4;
      } else if (!this.e02.voltageTuned) {
        msg = 'TUNE POTENTIOMETER SCREW TO REACH 5.00V (±0.05V)';
        stepTitle = 'ID: [SUB-TSK-E-02] FGS ELECTRONICS CALIBRATION';
        stepDesc = 'STEP 3: Voltage Trimming Mini-Game. Reading: 3.20V. Click the potentiometer screw or use on-screen trimmer to tune to 5.00V.';
        toolIndex = 5;
      } else if (!this.e02.waveLocked) {
        msg = 'CLICK OSCILLOSCOPE FREQ & AMP KNOBS TO ACHIEVE 100% PHASE LOCK';
        stepTitle = 'ID: [SUB-TSK-E-02] FGS ELECTRONICS CALIBRATION';
        stepDesc = 'STEP 4: Waveform Alignment Mini-Game. Click Frequency and Amplitude knobs on the oscilloscope until live wave locks onto reference template for 2s.';
      } else if (!this.breakerMasterOn) {
        msg = 'OPEN SAFETY COVER & FLIP MASTER CIRCUIT BREAKER TO ENERGIZE';
        stepTitle = 'ID: [SUB-TSK-E-02] FGS ELECTRONICS CALIBRATION';
        stepDesc = 'STEP 5: Power Energize. Click the transparent cover to open, then flip the red master circuit breaker switch to power on the telescope!';
      } else {
        msg = 'ELECTRONIC DEPARTMENT 100% OPERATIONAL! ALL AVIONICS VERIFIED';
        stepTitle = 'ELECTRONIC SYSTEMS NOMINAL';
        stepDesc = 'All avionics and fine guidance sensors flight-certified. Mission ready for assembly and checkout!';
      }
    }

    const banner = document.getElementById('wbElecPromptText');
    if (banner) banner.textContent = msg;

    const tEl = document.getElementById('wbElecTargetId');
    if (tEl && stepTitle) tEl.textContent = stepTitle;

    const dEl = document.getElementById('wbElecTaskDesc');
    if (dEl && stepDesc) dEl.textContent = stepDesc;

    // Legacy fallbacks
    const badge = document.getElementById('ticketBadge');
    if (badge && stepTitle) badge.textContent = stepTitle;
    const title = document.getElementById('ticketTitle');
    if (title && stepTitle) title.textContent = stepTitle;
    const inst = document.getElementById('ticketInstructions');
    if (inst && stepDesc) inst.textContent = stepDesc;

    // Highlight corresponding footer tool slot
    const modal = document.getElementById('modalElectronicsWorkbench');
    if (modal) {
      const tags = modal.querySelectorAll('.wb-req-tags .req-tag, .wb-figma-tools .wb-figma-tag');
      tags.forEach((tag, idx) => {
        tag.classList.toggle('task-selected-glow', idx === (toolIndex - 1));
      });
    }

    // Sync in-canvas mini-game panels
    this.updateMiniGamePanels();
    this.updateTaskPanel();
  }

  updateTaskPanel() {
    if (!this.ui || !this.ui.taskPanel) return;

    let stepTitle = '';
    let stepLines = '';
    let activeToolId = 'cardToolWrist';

    if (this.activeTask === 'subtask01') {
      if (!this.e01.wristStrapAttached) {
        stepTitle = 'Step 1 : Electrostatic Discharge Safety Protocol';
        stepLines = `
          <div class="step-instruction-line">• Equip ESD Wrist Strap from tool shelf or click on cleanroom table</div>
          <div class="step-instruction-line">• Operator chassis potential : <span class="step-count-badge" style="color: #ef4444;">UNGROUNDED [HIGH RISK]</span></div>
          <div class="step-instruction-line" style="color: #f59e0b; margin-top: 4px;">• Mandatory Class-100 ESD grounding protocol before touching flight electronics.</div>
        `;
        activeToolId = 'cardToolWrist';
      } else if (!this.e01.tabLeftUnlocked || !this.e01.tabRightUnlocked) {
        const unlatched = (this.e01.tabLeftUnlocked ? 1 : 0) + (this.e01.tabRightUnlocked ? 1 : 0);
        stepTitle = 'Step 2 : Connector Safety Tab Disengagement';
        stepLines = `
          <div class="step-instruction-line">• Equip Precision Tweezers from shelf or click gold clips</div>
          <div class="step-instruction-line">• Disengage gold locking tabs on ribbon header <span class="step-count-badge">[ ${unlatched}/2 ]</span></div>
          <div class="step-instruction-line" style="color: #10b981;">✓ ESD Grounded: 0.00 V. Safe to handle circuit card.</div>
        `;
        activeToolId = 'cardToolTweezers';
      } else if (!this.e01.ribbonExtracted) {
        stepTitle = 'Step 3 : Harness Extraction';
        stepLines = `
          <div class="step-instruction-line">• Click amber Kapton ribbon cable to extract data bus connector</div>
          <div class="step-instruction-line">• Unseat high-density gold pins from motherboard header socket</div>
        `;
        activeToolId = 'cardToolTweezers';
      } else if (!this.e01.burntPcbRemoved) {
        stepTitle = 'Step 4 : Damaged PCB Extraction';
        stepLines = `
          <div class="step-instruction-line">• Equip IC Extractor from tool shelf or click scorched card</div>
          <div class="step-instruction-line">• Lift damaged board from card rails into scrap container</div>
          <div class="step-instruction-line" style="color: #ef4444; margin-top: 4px;">• Scorched memory module in Socket B-04 showing dielectric breakdown.</div>
        `;
        activeToolId = 'cardToolExtractor';
      } else if (!this.e01.newPcbSeated) {
        stepTitle = 'Step 5 : Flight PCB Installation';
        stepLines = `
          <div class="step-instruction-line">• Click green HST-DF224 flight PCB on the right anti-static tray</div>
          <div class="step-instruction-line">• Align with card cage guide rails and seat into motherboard connector</div>
        `;
        activeToolId = 'cardToolPcb';
      } else if (!this.e01.ribbonReconnected) {
        stepTitle = 'Step 6 : Re-mate Data Ribbon Harness';
        stepLines = `
          <div class="step-instruction-line">• Click amber Kapton data ribbon to slide forward and mate</div>
          <div class="step-instruction-line">• Ensure zero pin-deflection before latching retainers</div>
        `;
        activeToolId = 'cardToolTweezers';
      } else if (!this.e01.pinsLocked) {
        stepTitle = 'Step 7 : Clamp Safety Retainers';
        stepLines = `
          <div class="step-instruction-line">• Click gold safety clips to lock data harness firmly in place</div>
          <div class="step-instruction-line">• Verify flight lock engagement</div>
        `;
        activeToolId = 'cardToolTweezers';
      } else {
        stepTitle = 'Subtask E-01 Complete!';
        stepLines = `
          <div class="step-instruction-line" style="color: #10b981; font-weight: 700;">✓ DF-224 Main Computer fully repaired, flight board seated and locked!</div>
          <div class="step-instruction-line">• Click [SUB-TSK-E-02] tab at top to calibrate FGS electronics.</div>
        `;
        activeToolId = null;
      }
    } else if (this.activeTask === 'subtask02') {
      if (!this.e02.probeRedAttached || !this.e02.probeBlackAttached) {
        const probesCount = (this.e02.probeRedAttached ? 1 : 0) + (this.e02.probeBlackAttached ? 1 : 0);
        stepTitle = 'Step 1 : Multimeter Test Lead Connection';
        stepLines = `
          <div class="step-instruction-line">• Equip Multimeter Probes from tool shelf</div>
          <div class="step-instruction-line">• Connect Red Probe (+) to Node A and Black Probe (-) to Node B <span class="step-count-badge">[ ${probesCount}/2 ]</span></div>
          <div class="step-instruction-line" style="color: #f59e0b; margin-top: 4px;">• Measures regulated 5V power bus before energizing sensor.</div>
        `;
        activeToolId = 'cardToolProbes';
      } else if (!this.e02.voltageTuned) {
        stepTitle = 'Step 2 : Voltage Trimmer Potentiometer Calibration';
        stepLines = `
          <div class="step-instruction-line">• Equip Tuning Screwdriver from shelf or use on-screen trimmer widget</div>
          <div class="step-instruction-line">• Current Reading : <span class="step-count-badge" style="color: #f59e0b;">${this.e02.currentVoltage.toFixed(2)} V</span> (Target : 5.00 V ±0.05)</div>
          <div class="step-instruction-line">• Adjust trimmer until voltage enters green nominal band</div>
        `;
        activeToolId = 'cardToolScrewdriver';
      } else if (!this.e02.waveLocked) {
        const holdPct = Math.min(100, Math.floor((this.e02.alignmentTimer / this.e02.requiredHoldTime) * 100));
        stepTitle = 'Step 3 : Dual-Beam Oscilloscope Waveform Alignment';
        stepLines = `
          <div class="step-instruction-line">• Use Oscilloscope Knobs widget to adjust Frequency and Amplitude</div>
          <div class="step-instruction-line">• Align live wave with cyan reference template</div>
          <div class="step-instruction-line">• Waveform Lock Hold : <span class="step-count-badge">[ ${holdPct}% ]</span></div>
        `;
        activeToolId = null;
      } else if (!this.breakerMasterOn) {
        stepTitle = 'Step 4 : Master Circuit Breaker Energize';
        stepLines = `
          <div class="step-instruction-line">• Click clear acrylic safety guard to flip open</div>
          <div class="step-instruction-line">• Flip Red Master Circuit Breaker switch to ENERGIZE telescope avionics!</div>
        `;
        activeToolId = null;
      } else {
        stepTitle = 'Subtask E-02 Complete!';
        stepLines = `
          <div class="step-instruction-line" style="color: #10b981; font-weight: 700;">✓ FGS Electronics nominal! All avionics channels flight-certified!</div>
        `;
        activeToolId = null;
      }
    }

    this.ui.taskPanel.innerHTML = `
      <div class="step-title-line">${stepTitle}</div>
      ${stepLines}
    `;

    // Highlight active tool card in tool shelf
    if (this.toolShelf) {
      const cards = this.toolShelf.querySelectorAll('.wb-figma-tool-card');
      cards.forEach(c => {
        c.classList.toggle('task-selected-glow', c.id === activeToolId);
      });
    }

    // Update lower footer elements if present
    const voltEl = document.getElementById('wbElecFooterVoltageVal');
    if (voltEl) voltEl.textContent = this.e02.currentVoltage.toFixed(2) + ' V';
    const modeEl = document.getElementById('wbElecFooterModeText');
    if (modeEl) {
      modeEl.textContent = this.e01.wristStrapAttached ? '[ ESD Grounded | 0.0V ]' : '[ ESD UNGROUNDED | 120V ]';
    }
    const errEl = document.getElementById('wbElecLowerErrorMsg');
    if (errEl) {
      if (!this.e01.wristStrapAttached) {
        errEl.textContent = 'WARNING: ESD STRAP DISCONNECTED // HIGH RISK OF CHIP DAMAGE';
        errEl.style.color = '#ef4444';
      } else if (this.e01.isComplete && this.e02.isComplete) {
        errEl.textContent = 'SYSTEM OPERATIONAL // ELECTRONIC BAY 100% NOMINAL';
        errEl.style.color = '#10b981';
      } else {
        errEl.textContent = 'SYSTEM READY // CLASS 100 ESD WORKSTATION GROUNDED';
        errEl.style.color = '#38bdf8';
      }
    }
  }

  // -------------------------------------------------------------------------
  // INTERACTION LOGIC (RAYCASTING & CLICKS)
  // -------------------------------------------------------------------------
    setupFooterToolListeners() {
    const modal = document.getElementById('modalElectronicsWorkbench');
    if (!modal) return;

    const tags = modal.querySelectorAll('.wb-figma-tools .wb-figma-tag');
    tags.forEach((tag, idx) => {
      tag.style.cursor = 'pointer';
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        // Remove active glow from other tags, add to this
        tags.forEach(t => t.classList.remove('task-selected-glow'));
        tag.classList.add('task-selected-glow');

        const text = tag.textContent.trim().toUpperCase();
        if (text.includes('WRIST') || text.includes('[1]')) {
          this.handleClickObject('targetWristStrap');
        } else if (text.includes('TWEEZERS') || text.includes('[2]')) {
          if (!this.e01.tabLeftUnlocked) this.unlockLeftTab();
          else if (!this.e01.tabRightUnlocked) this.unlockRightTab();
          else if (!this.e01.ribbonExtracted) this.extractRibbonCable();
        } else if (text.includes('EXTRACTOR') || text.includes('[3]')) {
          this.handleClickObject('targetBurntPcb');
        } else if (text.includes('PROBES') || text.includes('[4]')) {
          if (!this.e02.probeRedAttached) this.attachRedProbe();
          else if (!this.e02.probeBlackAttached) this.attachBlackProbe();
        } else if (text.includes('SCREWDRIVER') || text.includes('[5]')) {
          this.tuneVoltage(0.15);
        } else if (text.includes('FLIGHT PCB') || text.includes('PCB')) {
          this.handleClickObject('targetNewPcb');
        } else if (text.includes('RIBBON') || text.includes('DATA')) {
          this.handleClickObject('targetRibbonCable');
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // IN-CANVAS INTERACTIVE MINI-GAME PANELS (FGS Voltage Trimmer & Scope Knobs)
  // -------------------------------------------------------------------------
  createMiniGamePanels() {
    // 1. Right-side tool shelf inside 3D viewport (matching Mechanical Workbench)
    this.toolShelf = document.createElement('div');
    this.toolShelf.className = 'wb-figma-tool-shelf';
    this.toolShelf.id = 'wbElecToolShelf';
    this.toolShelf.innerHTML = `
      <div class="wb-figma-tool-card" id="cardToolWrist" title="ESD Grounding Wrist Strap">
        <div class="tool-img-box"><img src="assets/images/tool_wriststrap.svg" alt="Wrist Strap"></div>
        <span class="tool-name-label">WRIST STRAP</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolTweezers" title="Precision Tweezers">
        <div class="tool-img-box"><img src="assets/images/tool_tweezers.svg" alt="Tweezers"></div>
        <span class="tool-name-label">TWEEZERS</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolExtractor" title="IC Extractor Tool">
        <div class="tool-img-box"><img src="assets/images/tool_icextractor.svg" alt="IC Extractor"></div>
        <span class="tool-name-label">EXTRACTOR</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolProbes" title="Multimeter Probes">
        <div class="tool-img-box"><img src="assets/images/tool_probes.svg" alt="Probes"></div>
        <span class="tool-name-label">PROBES</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolScrewdriver" title="Tuning Screwdriver">
        <div class="tool-img-box"><img src="assets/images/tool_screwdriver.svg" alt="Screwdriver"></div>
        <span class="tool-name-label">TRIMMER</span>
      </div>
      <div class="wb-figma-tool-card" id="cardToolPcb" title="Replacement Flight PCB">
        <div class="tool-img-box"><img src="assets/images/part_pcb.svg" alt="Flight PCB"></div>
        <span class="tool-name-label">FLIGHT PCB</span>
      </div>
    `;
    this.container.appendChild(this.toolShelf);

    // Wire clicks on tool shelf cards with strict NASA procurement verification
    const cardWrist = this.toolShelf.querySelector('#cardToolWrist');
    const cardTweezers = this.toolShelf.querySelector('#cardToolTweezers');
    const cardExtractor = this.toolShelf.querySelector('#cardToolExtractor');
    const cardProbes = this.toolShelf.querySelector('#cardToolProbes');
    const cardScrewdriver = this.toolShelf.querySelector('#cardToolScrewdriver');
    const cardPcb = this.toolShelf.querySelector('#cardToolPcb');

    if (cardWrist) cardWrist.onclick = () => {
      if (!this.hasPurchased('wriststrap')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase ESD Wrist Strap from Desk 02 Laptop first!", true);
        return;
      }
      this.handleClickObject('targetWristStrap');
    };
    if (cardTweezers) cardTweezers.onclick = () => {
      if (!this.hasPurchased('tweezers')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase Precision Tweezers from Desk 02 Laptop first!", true);
        return;
      }
      if (!this.e01.tabLeftUnlocked) {
        this.unlockLeftTab();
      } else if (!this.e01.tabRightUnlocked) {
        this.unlockRightTab();
      } else if (!this.e01.ribbonExtracted) {
        this.extractRibbonCable();
      } else if (this.e01.newPcbSeated && !this.e01.ribbonReconnected) {
        this.reconnectRibbonCable();
      } else if (this.e01.ribbonReconnected && !this.e01.pinsLocked) {
        this.lockRibbonPins();
      }
    };
    if (cardExtractor) cardExtractor.onclick = () => {
      if (!this.hasPurchased('icextractor')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase IC Extractor from Desk 02 Laptop first!", true);
        return;
      }
      this.handleClickObject('targetBurntPcb');
    };
    if (cardProbes) cardProbes.onclick = () => {
      if (!this.hasPurchased('probes')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase Multimeter Probes from Desk 02 Laptop first!", true);
        return;
      }
      if (!this.e02.probeRedAttached) this.attachRedProbe();
      else if (!this.e02.probeBlackAttached) this.attachBlackProbe();
    };
    if (cardScrewdriver) cardScrewdriver.onclick = () => {
      if (!this.hasPurchased('screwdriver')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase Trimmer Screwdriver from Desk 02 Laptop first!", true);
        return;
      }
      this.tuneVoltage(0.15);
    };
    if (cardPcb) cardPcb.onclick = () => {
      if (!this.hasPurchased('pcb')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT COMPONENT MISSING: Please requisition Flight PCB from Desk 02 Laptop first!", true);
        return;
      }
      this.handleClickObject('targetNewPcb');
    };

    // 2. Interactive FGS Voltage Trimming Mini-Game Widget
    this.voltageTrimmerPanel = document.createElement('div');
    this.voltageTrimmerPanel.className = 'wb-elec-minigame-panel hidden';
    this.voltageTrimmerPanel.id = 'wbElecVoltageTrimmer';
    this.voltageTrimmerPanel.innerHTML = `
      <div class="elec-mini-card">
        <div class="elec-mini-title">⚡ FGS VOLTAGE REGULATOR CALIBRATION</div>
        <div class="elec-dmm-display">
          <span class="dmm-lbl">DMM READING:</span>
          <span class="dmm-voltage-digits" id="dmmDigits">3.20 V</span>
          <span class="dmm-target-lbl">(TARGET: 5.00 V ±0.05)</span>
        </div>
        <div class="elec-trim-controls">
          <button type="button" class="elec-btn-trim" id="btnTrimDown">◀ TUNE -0.15V</button>
          <button type="button" class="elec-btn-trim primary" id="btnTrimUp">TUNE +0.15V ▶</button>
        </div>
        <div class="elec-trim-hint">Rotate potentiometer screw until voltage enters 5.00V nominal band.</div>
      </div>
    `;
    this.container.appendChild(this.voltageTrimmerPanel);

    const btnTrimDown = this.voltageTrimmerPanel.querySelector('#btnTrimDown');
    const btnTrimUp = this.voltageTrimmerPanel.querySelector('#btnTrimUp');
    if (btnTrimDown) btnTrimDown.onclick = () => this.tuneVoltage(-0.15);
    if (btnTrimUp) btnTrimUp.onclick = () => this.tuneVoltage(0.15);

    // 3. Oscilloscope Interactive Knobs Panel
    this.scopeKnobsPanel = document.createElement('div');
    this.scopeKnobsPanel.className = 'wb-elec-minigame-panel hidden';
    this.scopeKnobsPanel.id = 'wbElecScopeKnobs';
    this.scopeKnobsPanel.innerHTML = `
      <div class="elec-mini-card">
        <div class="elec-mini-title">📡 OSCILLOSCOPE DUAL-BEAM SYNCHRONIZATION</div>
        <div class="scope-status-line">
          <span class="scope-lbl">STATUS:</span>
          <span class="scope-val" id="scopePhaseStatus" style="color: #facc15;">ALIGNING WAVEFORMS...</span>
        </div>
        <div class="scope-knobs-row">
          <div class="scope-knob-col">
            <span class="knob-label">FREQUENCY</span>
            <div class="knob-btn-pair">
              <button type="button" class="elec-knob-btn" id="btnFreqDown">-</button>
              <button type="button" class="elec-knob-btn" id="btnFreqUp">+</button>
            </div>
          </div>
          <div class="scope-knob-col">
            <span class="knob-label">AMPLITUDE</span>
            <div class="knob-btn-pair">
              <button type="button" class="elec-knob-btn" id="btnAmpDown">-</button>
              <button type="button" class="elec-knob-btn" id="btnAmpUp">+</button>
            </div>
          </div>
        </div>
        <div class="elec-trim-hint">Align live yellow wave with green template. Hold steady for 2 seconds.</div>
      </div>
    `;
    this.container.appendChild(this.scopeKnobsPanel);

    const btnFreqDown = this.scopeKnobsPanel.querySelector('#btnFreqDown');
    const btnFreqUp = this.scopeKnobsPanel.querySelector('#btnFreqUp');
    const btnAmpDown = this.scopeKnobsPanel.querySelector('#btnAmpDown');
    const btnAmpUp = this.scopeKnobsPanel.querySelector('#btnAmpUp');

    if (btnFreqDown) btnFreqDown.onclick = () => this.adjustScopeFrequency(-0.1);
    if (btnFreqUp) btnFreqUp.onclick = () => this.adjustScopeFrequency(0.1);
    if (btnAmpDown) btnAmpDown.onclick = () => this.adjustScopeAmplitude(-0.1);
    if (btnAmpUp) btnAmpUp.onclick = () => this.adjustScopeAmplitude(0.1);
  }

  updateMiniGamePanels() {
    // Sync digital multimeter digits
    const digitsEl = document.getElementById('dmmDigits');
    if (digitsEl && this.e02) {
      digitsEl.textContent = this.e02.currentVoltage.toFixed(2) + ' V';
      digitsEl.style.color = Math.abs(this.e02.currentVoltage - 5.0) <= 0.05 ? '#10b981' : '#f59e0b';
    }

    // Toggle Trimmer Panel visibility
    if (this.voltageTrimmerPanel) {
      const showTrimmer = (this.activeTask === 'subtask02' && this.e02.probeRedAttached && this.e02.probeBlackAttached && !this.e02.voltageTuned);
      this.voltageTrimmerPanel.classList.toggle('hidden', !showTrimmer);
    }

    // Toggle Scope Knobs Panel visibility
    if (this.scopeKnobsPanel) {
      const showScope = (this.activeTask === 'subtask02' && this.e02.voltageTuned && !this.e02.waveLocked);
      this.scopeKnobsPanel.classList.toggle('hidden', !showScope);
    }

    // Tool Procurement Validation & Shelf State
    if (this.toolShelf) {
      const toolMap = [
        { cardId: 'cardToolWrist', toolId: 'wriststrap' },
        { cardId: 'cardToolTweezers', toolId: 'tweezers' },
        { cardId: 'cardToolExtractor', toolId: 'icextractor' },
        { cardId: 'cardToolProbes', toolId: 'probes' },
        { cardId: 'cardToolScrewdriver', toolId: 'screwdriver' },
        { cardId: 'cardToolPcb', toolId: 'pcb' }
      ];

      toolMap.forEach(({ cardId, toolId }) => {
        const c = this.toolShelf.querySelector('#' + cardId);
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

      const cards = this.toolShelf.querySelectorAll('.wb-figma-tool-card');
      cards.forEach(c => c.classList.remove('task-selected-glow'));

      if (this.activeTask === 'subtask01') {
        if (!this.e01.wristStrapAttached) {
          const c = this.toolShelf.querySelector('#cardToolWrist');
          if (c) c.classList.add('task-selected-glow');
        } else if (!this.e01.ribbonExtracted || !this.e01.pinsLocked) {
          const c = this.toolShelf.querySelector('#cardToolTweezers');
          if (c) c.classList.add('task-selected-glow');
        } else if (!this.e01.burntPcbRemoved) {
          const c = this.toolShelf.querySelector('#cardToolExtractor');
          if (c) c.classList.add('task-selected-glow');
        } else if (!this.e01.newPcbSeated) {
          const c = this.toolShelf.querySelector('#cardToolPcb');
          if (c) c.classList.add('task-selected-glow');
        }
      } else if (this.activeTask === 'subtask02') {
        if (!this.e02.probeRedAttached || !this.e02.probeBlackAttached) {
          const c = this.toolShelf.querySelector('#cardToolProbes');
          if (c) c.classList.add('task-selected-glow');
        } else if (!this.e02.voltageTuned) {
          const c = this.toolShelf.querySelector('#cardToolScrewdriver');
          if (c) c.classList.add('task-selected-glow');
        }
      }
    }
  }

setupInputEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      this.ensureAudio();
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj && !hitObj.name && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        this.handleClickObject(hitObj.name || '');
      }
    });

    // Mouse wheel on potentiometer or knobs
    dom.addEventListener('wheel', (e) => {
      if (this.activeTask === 'subtask02') {
        const delta = Math.sign(e.deltaY) * -0.05;
        if (!this.e02.voltageTuned && (this.e02.probeRedAttached && this.e02.probeBlackAttached)) {
          this.tuneVoltage(delta);
        }
      }
    }, { passive: true });

    // Keyboard Shortcuts (1-5, E, Space)
    this.onKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      if (e.code === 'Digit1' || e.key === '1') {
        e.preventDefault();
        this.handleClickObject('targetWristStrap');
      } else if (e.code === 'Digit2' || e.key === '2') {
        e.preventDefault();
        if (this.activeTask === 'subtask01') {
          if (!this.e01.wristStrapAttached) {
            this.triggerStaticShockFailure();
          } else if (!this.e01.tabLeftUnlocked) {
            this.unlockLeftTab();
          } else if (!this.e01.tabRightUnlocked) {
            this.unlockRightTab();
          } else if (!this.e01.ribbonExtracted) {
            this.extractRibbonCable();
          }
        }
      } else if (e.code === 'Digit3' || e.key === '3') {
        e.preventDefault();
        if (this.activeTask === 'subtask01') {
          if (!this.e01.wristStrapAttached) {
            this.triggerStaticShockFailure();
          } else if (!this.e01.ribbonExtracted) {
            if (window.showCenterCalmAlert) window.showCenterCalmAlert('RIBBON ATTACHED', 'Extract Kapton data ribbon first!', '⚠️');
          } else if (!this.e01.burntPcbRemoved) {
            this.removeBurntPCB();
          }
        }
      } else if (e.code === 'Digit4' || e.key === '4') {
        e.preventDefault();
        if (this.activeTask === 'subtask02') {
          if (!this.e02.probeRedAttached) {
            this.attachRedProbe();
          } else if (!this.e02.probeBlackAttached) {
            this.attachBlackProbe();
          }
        }
      } else if (e.code === 'Digit5' || e.key === '5') {
        e.preventDefault();
        if (this.activeTask === 'subtask02') {
          this.tuneVoltage(0.15);
        }
      } else if (e.code === 'KeyE' || e.code === 'Space') {
        e.preventDefault();
        if (this.activeTask === 'subtask01') {
          if (this.e01.burntPcbRemoved && !this.e01.newPcbSeated) {
            this.seatNewPCB();
          } else if (this.e01.newPcbSeated && !this.e01.ribbonReconnected) {
            this.reconnectRibbonCable();
          } else if (this.e01.ribbonReconnected && !this.e01.pinsLocked) {
            this.lockRibbonPins();
          }
        } else if (this.activeTask === 'subtask02') {
          if (this.e02.isComplete && !this.breakerMasterOn) {
            if (!this.breakerCoverOpen) this.flipBreakerCover();
            else this.flipBreakerMaster();
          }
        }
      }
    };
    window.addEventListener('keydown', this.onKeyDown);

    // Setup footer tool click listeners
    this.setupFooterToolListeners();
  }

  handleClickObject(name) {
    // 1. ESD Grounding Wrist Strap
    if (name === 'targetWristStrap') {
      if (!this.hasPurchased('wriststrap')) {
        this.playErrorBuzz();
        this.showAlert("FLIGHT TOOL LOCKED: Please purchase ESD Wrist Strap from Desk 02 Laptop first!", true);
        return;
      }
      this.attachWristStrap();
      return;
    }

    // 2. Electrostatic Discharge (ESD) Safety Protocol Check
    if (this.activeTask === 'subtask01') {
      const isElectronicPart = ['targetBurntPcb', 'targetRibbonCable', 'tabLeft', 'tabRight', 'targetNewPcb'].includes(name);
      if (isElectronicPart && !this.e01.wristStrapAttached) {
        this.triggerStaticShockFailure();
        return;
      }
    }

    // --- TASK 01 WORKFLOWS ---
    if (this.activeTask === 'subtask01') {
      if (name === 'tabLeft') {
        if (!this.hasPurchased('tweezers')) {
          this.playErrorBuzz();
          this.showAlert("FLIGHT TOOL LOCKED: Please purchase Precision Tweezers from Desk 02 Laptop first!", true);
          return;
        }
        if (!this.e01.tabLeftUnlocked) {
          this.unlockLeftTab();
        } else if (this.e01.ribbonReconnected && !this.e01.pinsLocked) {
          this.lockRibbonPins();
        }
      } else if (name === 'tabRight') {
        if (!this.hasPurchased('tweezers')) {
          this.playErrorBuzz();
          this.showAlert("FLIGHT TOOL LOCKED: Please purchase Precision Tweezers from Desk 02 Laptop first!", true);
          return;
        }
        if (!this.e01.tabRightUnlocked) {
          this.unlockRightTab();
        } else if (this.e01.ribbonReconnected && !this.e01.pinsLocked) {
          this.lockRibbonPins();
        }
      } else if (name === 'targetRibbonCable') {
        if (!this.hasPurchased('tweezers')) {
          this.playErrorBuzz();
          this.showAlert("FLIGHT TOOL LOCKED: Please purchase Precision Tweezers from Desk 02 Laptop first!", true);
          return;
        }
        if (!this.e01.tabLeftUnlocked || !this.e01.tabRightUnlocked) {
          if (window.showCenterCalmAlert) {
            window.showCenterCalmAlert('CONNECTOR LOCKED', 'Unlock both left and right safety tabs before extracting the ribbon cable.', '🔒');
          }
          return;
        }
        if (!this.e01.ribbonExtracted) {
          this.extractRibbonCable();
        } else if (this.e01.newPcbSeated && !this.e01.ribbonReconnected) {
          this.reconnectRibbonCable();
        } else if (this.e01.ribbonReconnected && !this.e01.pinsLocked) {
          this.lockRibbonPins();
        }
      } else if (name === 'targetBurntPcb') {
        if (!this.hasPurchased('icextractor')) {
          this.playErrorBuzz();
          this.showAlert("FLIGHT TOOL LOCKED: Please purchase IC Extractor from Desk 02 Laptop first!", true);
          return;
        }
        if (!this.e01.ribbonExtracted) {
          if (window.showCenterCalmAlert) {
            window.showCenterCalmAlert('HARNESS ATTACHED', 'Extract the data ribbon cable first before lifting the circuit board.', '⚠️');
          }
          return;
        }
        this.removeBurntPCB();
      } else if (name === 'targetNewPcb') {
        if (!this.hasPurchased('pcb')) {
          this.playErrorBuzz();
          this.showAlert("FLIGHT COMPONENT MISSING: Please requisition Flight PCB from Desk 02 Laptop first!", true);
          return;
        }
        if (!this.e01.burntPcbRemoved) {
          if (window.showCenterCalmAlert) {
            window.showCenterCalmAlert('BAY OCCUPIED', 'Remove the burnt PCB from the slot before inserting replacement.', '⚠️');
          }
          return;
        }
        if (!this.e01.newPcbSeated) {
          this.seatNewPCB();
        } else if (this.e01.ribbonReconnected && !this.e01.pinsLocked) {
          this.lockRibbonPins();
        }
      }
    }

    // --- TASK 02 WORKFLOWS ---
    if (this.activeTask === 'subtask02') {
      if (name === 'nodeA') {
        if (!this.hasPurchased('probes')) {
          this.playErrorBuzz();
          this.showAlert("FLIGHT TOOL LOCKED: Please purchase Multimeter Probes from Desk 02 Laptop first!", true);
          return;
        }
        this.attachRedProbe();
      } else if (name === 'nodeB') {
        if (!this.hasPurchased('probes')) {
          this.playErrorBuzz();
          this.showAlert("FLIGHT TOOL LOCKED: Please purchase Multimeter Probes from Desk 02 Laptop first!", true);
          return;
        }
        this.attachBlackProbe();
      } else if (name === 'potScrew') {
        if (!this.hasPurchased('screwdriver')) {
          this.playErrorBuzz();
          this.showAlert("FLIGHT TOOL LOCKED: Please purchase Trimmer Screwdriver from Desk 02 Laptop first!", true);
          return;
        }
        if (!this.e02.probeRedAttached || !this.e02.probeBlackAttached) {
          if (window.showCenterCalmAlert) {
            window.showCenterCalmAlert('TEST LEADS REQUIRED', 'Connect multimeter probes to Node A and Node B before adjusting potentiometer.', '⚠️');
          }
          return;
        }
        this.tuneVoltage(0.15);
      } else if (name === 'knobFrequency') {
        this.adjustScopeFrequency();
      } else if (name === 'knobAmplitude') {
        this.adjustScopeAmplitude();
      }
    }

    // --- PHASE 3 BREAKER PANEL ---
    if (name === 'breakerCover') {
      this.flipBreakerCover();
    } else if (name === 'breakerLever') {
      this.flipBreakerMaster();
    }
  }

  // -------------------------------------------------------------------------
  // SUB-TSK-E-01 STEP METHODS
  // -------------------------------------------------------------------------
  attachWristStrap() {
    this.e01.wristStrapAttached = true;
    this.playGroundingSnap();

    const pill = document.getElementById('wbEsdPill');
    const text = document.getElementById('wbEsdStatusText');
    if (pill) {
      pill.classList.remove('ungrounded');
      pill.classList.add('grounded');
    }
    if (text) text.textContent = 'ESD: GROUNDED (ZERO POTENTIAL)';

    if (this.models.strapGroup) {
      this.models.strapGroup.position.set(-2.4, 0.45, 0.7);
    }

    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('ESD PROTOCOL SECURED', 'Grounding wrist strap attached. Zero potential equalized.', '🛡️');
    }
    this.updateInstructionBanner();
  }

  triggerStaticShockFailure() {
    this.staticShockIncidents++;
    this.playSparkZap();

    // Deduct credit penalty from game budget
    const gs = window.getNasaGameState ? window.getNasaGameState() : null;
    if (gs && gs.budget) {
      gs.budget = Math.max(0, gs.budget - 1500);
      const bEl = document.getElementById('hudTopBudget');
      if (bEl) bEl.textContent = gs.budget.toFixed(2);
    }

    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('STATIC SHOCK DISCHARGE!', 'Electrostatic spark damaged replacement ICs! Wrist strap is MANDATORY (-$1,500 credits).', '⚡');
    }
    if (typeof this.onShock === 'function') {
      this.onShock(this.staticShockIncidents);
    }
  }

  unlockLeftTab() {
    if (this.e01.tabLeftUnlocked) return;
    this.e01.tabLeftUnlocked = true;
    this.playProbeClick();
    if (this.models.tabL) {
      this.models.tabL.rotation.y = -Math.PI / 4;
      this.models.tabL.position.x = -0.52;
    }
    this.updateInstructionBanner();
  }

  unlockRightTab() {
    if (this.e01.tabRightUnlocked) return;
    this.e01.tabRightUnlocked = true;
    this.playProbeClick();
    if (this.models.tabR) {
      this.models.tabR.rotation.y = Math.PI / 4;
      this.models.tabR.position.x = 0.52;
    }
    this.updateInstructionBanner();
  }

  extractRibbonCable() {
    this.e01.ribbonExtracted = true;
    this.playProbeClick();
    if (this.models.ribbonGroup) {
      // Animate cable backward
      this.models.ribbonGroup.position.z = 0.65;
    }
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('RIBBON EXTRACTED', 'Data harness safely unseated from damaged PCB socket.', '🔌');
    }
    this.updateInstructionBanner();
  }

  removeBurntPCB() {
    this.e01.burntPcbRemoved = true;
    this.playGroundingSnap();
    if (this.models.burntPcbGroup) {
      this.models.burntPcbGroup.position.set(-2.4, 0.25, 0.6); // Move to scrap tray
    }
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('DAMAGED PCB REMOVED', 'Burnt circuit board extracted via IC Extractor tool.', '📦');
    }
    this.updateInstructionBanner();
  }

  seatNewPCB() {
    this.e01.newPcbSeated = true;
    if (window.nasaAudio && window.nasaAudio.playPartFitted) {
      window.nasaAudio.playPartFitted();
    } else {
      this.playGroundingSnap();
    }

    if (this.models.newPcbGroup) {
      this.models.newPcbGroup.position.set(0, 0.26, -0.05); // Seated in slot!
    }
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('NEW PCB MATED', 'Flight replacement PCB locked firmly into motherboard guide rails.', '✅');
    }
    this.updateInstructionBanner();
  }

  reconnectRibbonCable() {
    this.e01.ribbonReconnected = true;
    this.playProbeClick();
    if (this.models.ribbonGroup) {
      this.models.ribbonGroup.position.z = 0.35; // Back into slot
    }
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('HARNESS SEATED', 'Press [E] or click locking pins to secure the data connector.', '🔒');
    }
    this.updateInstructionBanner();
  }

  lockRibbonPins() {
    this.e01.pinsLocked = true;
    this.e01.isComplete = true;
    if (this.models.tabL) {
      this.models.tabL.rotation.y = 0;
      this.models.tabL.position.x = -0.46;
    }
    if (this.models.tabR) {
      this.models.tabR.rotation.y = 0;
      this.models.tabR.position.x = 0.46;
    }

    if (window.nasaAudio && window.nasaAudio.playSuccessChime) {
      window.nasaAudio.playSuccessChime();
    }

    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('TICKET COMPLETE', '[SUB-TSK-E-01] DF-224 Main Computer Repair verified!', '🏆');
    }

    if (window.DecisionManager && typeof window.DecisionManager.promptDecision === 'function') {
      window.DecisionManager.promptDecision('elec_task1', () => {
        if (typeof this.onCompleteTask01 === 'function') {
          this.onCompleteTask01();
        }
      });
    } else if (typeof this.onCompleteTask01 === 'function') {
      this.onCompleteTask01();
    }
    this.updateInstructionBanner();
  }

  // -------------------------------------------------------------------------
  // SUB-TSK-E-02 STEP METHODS (FGS)
  // -------------------------------------------------------------------------
  attachRedProbe() {
    this.e02.probeRedAttached = true;
    this.playProbeClick();
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('PROBE A CONTACT', 'Red (+) Multimeter Probe connected to Node A.', '🔴');
    }
    this.checkProbesAttached();
  }

  attachBlackProbe() {
    this.e02.probeBlackAttached = true;
    this.playProbeClick();
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('PROBE B CONTACT', 'Black (-) Multimeter Probe connected to Node B.', '⚫');
    }
    this.checkProbesAttached();
  }

  checkProbesAttached() {
    if (this.e02.probeRedAttached && this.e02.probeBlackAttached) {
      this.updateMultimeterDisplay(this.e02.currentVoltage);
      if (window.showCenterCalmAlert) {
        window.showCenterCalmAlert('UNDER-VOLTAGE DETECTED', 'Reading: 3.20 V. Research notes require 5.00 V. Adjust potentiometer screw.', '⚠️');
      }
    }
    this.updateInstructionBanner();
  }

  tuneVoltage(delta) {
    if (this.e02.voltageTuned) return;
    this.playPotClick();

    this.e02.currentVoltage = Math.min(5.4, Math.max(3.2, this.e02.currentVoltage + delta));
    this.updateMultimeterDisplay(this.e02.currentVoltage);

    if (this.models.potScrew) {
      this.models.potScrew.rotation.y += 0.25;
    }

    // Check tolerance: 5.0V ± 0.1V (4.90 to 5.10)
    if (Math.abs(this.e02.currentVoltage - 5.00) <= 0.10) {
      this.e02.voltageTuned = true;
      this.voltagePrecision = 100 - Math.abs(this.e02.currentVoltage - 5.00) * 100;
      if (window.nasaAudio && window.nasaAudio.playSuccessChime) {
        window.nasaAudio.playSuccessChime();
      }
      if (window.showCenterCalmAlert) {
        window.showCenterCalmAlert('VOLTAGE STABILIZED', `Sensor rail calibrated to ${this.e02.currentVoltage.toFixed(2)} V! Proceed to Scope Waveform Alignment.`, '⚡');
      }
      this.updateInstructionBanner();
    }
  }

  adjustScopeFrequency() {
    if (this.e02.waveLocked) return;
    this.playPotClick();
    this.e02.scopeFrequency = Math.min(4.0, this.e02.scopeFrequency + 0.3);
    if (this.e02.scopeFrequency >= 3.8) this.e02.scopeFrequency = 1.0;
    if (this.models.freqKnob) {
      this.models.freqKnob.rotation.z += 0.3;
    }
  }

  adjustScopeAmplitude() {
    if (this.e02.waveLocked) return;
    this.playPotClick();
    this.e02.scopeAmplitude = Math.min(1.8, this.e02.scopeAmplitude + 0.15);
    if (this.e02.scopeAmplitude >= 1.7) this.e02.scopeAmplitude = 0.45;
    if (this.models.ampKnob) {
      this.models.ampKnob.rotation.z += 0.3;
    }
  }

  checkWaveformAlignment(delta) {
    if (this.e02.waveLocked) return;

    const freqDiff = Math.abs(this.e02.scopeFrequency - this.e02.targetFrequency);
    const ampDiff = Math.abs(this.e02.scopeAmplitude - this.e02.targetAmplitude);

    // Tolerance threshold
    if (freqDiff <= 0.25 && ampDiff <= 0.15) {
      this.e02.alignmentTimer += delta;
      if (this.e02.alignmentTimer >= this.e02.requiredHoldTime) {
        this.e02.waveLocked = true;
        this.e02.isComplete = true;
        this.playScopeLock();
        if (window.showCenterCalmAlert) {
          window.showCenterCalmAlert('SIGNAL LOCKED', '[SUB-TSK-E-02] FGS Telemetry Coherent! Flip master circuit breaker.', '🏆');
        }
        if (window.DecisionManager && typeof window.DecisionManager.promptDecision === 'function') {
          window.DecisionManager.promptDecision('elec_task2', () => {
            if (typeof this.onCompleteTask02 === 'function') {
              this.onCompleteTask02();
            }
          });
        } else if (typeof this.onCompleteTask02 === 'function') {
          this.onCompleteTask02();
        }
        this.updateInstructionBanner();
      }
    } else {
      this.e02.alignmentTimer = Math.max(0, this.e02.alignmentTimer - delta * 2);
    }
  }

  // -------------------------------------------------------------------------
  // PHASE 3: BREAKER POWER ON
  // -------------------------------------------------------------------------
  flipBreakerCover() {
    this.breakerCoverOpen = !this.breakerCoverOpen;
    this.playBreakerSnap();
    if (this.models.breakerCover) {
      this.models.breakerCover.rotation.x = this.breakerCoverOpen ? Math.PI / 1.5 : 0;
      this.models.breakerCover.position.y = this.breakerCoverOpen ? 0.25 : 0.05;
    }
  }

  flipBreakerMaster() {
    if (!this.breakerCoverOpen) {
      if (window.showCenterCalmAlert) {
        window.showCenterCalmAlert('COVER CLOSED', 'Flip the transparent plastic safety cover up before toggling master switch.', '🛡️');
      }
      return;
    }

    if (!this.e01.isComplete || !this.e02.isComplete) {
      if (window.showCenterCalmAlert) {
        window.showCenterCalmAlert('SAFETY INTERLOCK', 'Both [SUB-TSK-E-01] and [SUB-TSK-E-02] must be completed before applying power!', '⚠️');
      }
      return;
    }

    this.breakerMasterOn = true;
    this.playBreakerSnap();
    this.playPowerUpHum();

    if (this.models.breakerLever) {
      this.models.breakerLever.rotation.x = Math.PI / 4; // UP (ON)
    }

    if (typeof this.onBreakerOn === 'function') {
      this.onBreakerOn();
    }

    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert('SYSTEM POWERED ON', 'Telescope avionics bay hums to life! Return to Computer Terminal to sign off telemetry.', '🚀');
    }
  }

  // -------------------------------------------------------------------------
  // ANIMATION & RESIZE
  // -------------------------------------------------------------------------
  animate() {
    this.animId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.updateOscilloscopeDisplay(time);
    this.updateStepTargetBeacon(time);
    this.checkWaveformAlignment(delta);

    // Animate telemetry umbilical glow pulse
    if (this.models.harnessGlow) {
      this.models.harnessGlow.material.color.setHSL((time * 0.1) % 1, 0.8, 0.5);
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }


  // -------------------------------------------------------------------------
  // STEP TARGET HIGHLIGHTER BEACON (Pulsing Arrow & Ring on Active Component)
  // -------------------------------------------------------------------------
  createStepTargetBeacon() {
    this.beaconGroup = new THREE.Group();

    // Ground ring
    const ringGeo = new THREE.RingGeometry(0.12, 0.18, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.beaconRing = new THREE.Mesh(ringGeo, ringMat);
    this.beaconRing.rotation.x = -Math.PI / 2;
    this.beaconGroup.add(this.beaconRing);

    // Hovering arrow
    const arrowGeo = new THREE.ConeGeometry(0.065, 0.16, 16);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });
    this.beaconArrow = new THREE.Mesh(arrowGeo, arrowMat);
    this.beaconArrow.rotation.x = Math.PI; // point down
    this.beaconArrow.position.y = 0.32;
    this.beaconGroup.add(this.beaconArrow);

    this.scene.add(this.beaconGroup);
  }

  updateStepTargetBeacon(time) {
    if (!this.beaconGroup) return;

    let targetPos = null;
    let beaconColor = 0x00f0ff;

    if (this.activeTask === 'subtask01') {
      if (!this.e01.wristStrapAttached) {
        // Step 1: Grounding wrist strap
        targetPos = new THREE.Vector3(-1.15, 0.22, 0.45);
        beaconColor = 0x38bdf8;
      } else if (!this.e01.tabLeftUnlocked) {
        // Step 2A: Left ribbon locking tab
        targetPos = new THREE.Vector3(-0.52, 0.40, 0.22);
        beaconColor = 0xfacc15;
      } else if (!this.e01.tabRightUnlocked) {
        // Step 2B: Right ribbon locking tab
        targetPos = new THREE.Vector3(0.52, 0.40, 0.22);
        beaconColor = 0xfacc15;
      } else if (!this.e01.ribbonExtracted) {
        // Step 3: Ribbon cable harness connector
        targetPos = new THREE.Vector3(0, 0.42, 0.32);
        beaconColor = 0x10b981;
      } else if (!this.e01.burntPcbRemoved) {
        // Step 4: Burnt PCB
        targetPos = new THREE.Vector3(0, 0.44, -0.05);
        beaconColor = 0xef4444;
      } else if (!this.e01.newPcbSeated) {
        // Step 5: Empty PCB slot for replacement
        targetPos = new THREE.Vector3(0, 0.38, -0.05);
        beaconColor = 0x10b981;
      } else if (!this.e01.ribbonReconnected) {
        // Step 6: Ribbon reconnect
        targetPos = new THREE.Vector3(0, 0.40, 0.28);
        beaconColor = 0x00f0ff;
      } else if (!this.e01.pinsLocked) {
        // Step 7: Lock tabs (Centered directly over the gold locking tabs on ribbon header)
        targetPos = new THREE.Vector3(0, 0.36, 0.53);
        beaconColor = 0xfacc15;
      }
    } else if (this.activeTask === 'subtask02') {
      if (!this.e02.probeRedAttached) {
        targetPos = new THREE.Vector3(-0.16, 0.48, 0.12);
        beaconColor = 0xef4444;
      } else if (!this.e02.probeBlackAttached) {
        targetPos = new THREE.Vector3(0.16, 0.48, 0.12);
        beaconColor = 0x38bdf8;
      } else if (!this.e02.voltageTuned) {
        targetPos = new THREE.Vector3(0, 0.44, 0.30);
        beaconColor = 0xfacc15;
      } else if (!this.e02.waveLocked) {
        targetPos = new THREE.Vector3(1.3, 0.55, 0.18);
        beaconColor = 0x10b981;
      } else if (!this.breakerMasterOn) {
        targetPos = new THREE.Vector3(-1.45, 0.32, 0.55);
        beaconColor = 0xef4444;
      }
    }

    if (targetPos) {
      this.beaconGroup.visible = true;
      this.beaconGroup.position.copy(targetPos);

      // Pulsing scale & opacity
      const pulse = 1.0 + Math.sin(time * 5.5) * 0.22;
      this.beaconRing.scale.set(pulse, pulse, 1.0);
      this.beaconRing.material.color.setHex(beaconColor);
      this.beaconRing.material.opacity = 0.5 + Math.sin(time * 5.5) * 0.4;

      this.beaconArrow.position.y = 0.28 + Math.sin(time * 6.5) * 0.05;
      this.beaconArrow.material.color.setHex(beaconColor);
    } else {
      this.beaconGroup.visible = false;
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getState() {
    return {
      activeTask: this.activeTask,
      e01: { ...this.e01 },
      e02: { ...this.e02 },
      breakerCoverOpen: this.breakerCoverOpen,
      breakerMasterOn: this.breakerMasterOn,
      staticShockIncidents: this.staticShockIncidents,
      voltagePrecision: this.voltagePrecision
    };
  }

  restoreState(state) {
    if (!state) return;
    if (state.activeTask) this.setTaskView(state.activeTask);
    if (state.e01) {
      Object.assign(this.e01, state.e01);
      if (this.e01.wristStrapAttached && this.models.wristStrap) {
        this.models.wristStrap.material.color.setHex(0x10b981);
      }
      if (this.e01.tabLeftUnlocked && this.models.tabL) {
        this.models.tabL.rotation.y = -Math.PI / 4;
        this.models.tabL.position.x = -0.52;
      }
      if (this.e01.tabRightUnlocked && this.models.tabR) {
        this.models.tabR.rotation.y = Math.PI / 4;
        this.models.tabR.position.x = 0.52;
      }
      if (this.e01.ribbonExtracted && this.models.ribbonCable) {
        this.models.ribbonCable.position.z = -0.55;
      }
      if (this.e01.burntPcbRemoved && this.models.burntPcb) {
        this.models.burntPcb.position.y = 1.2;
        this.models.burntPcb.visible = false;
      }
      if (this.e01.newPcbSeated && this.models.newPcbGroup) {
        this.models.newPcbGroup.position.set(0, 0.45, 0.1);
      }
      if (this.e01.ribbonReconnected && this.models.ribbonCable) {
        this.models.ribbonCable.position.z = 0.1;
      }
      if (this.e01.pinsLocked) {
        if (this.models.pinL) this.models.pinL.position.y = 0.44;
        if (this.models.pinR) this.models.pinR.position.y = 0.44;
      }
    }
    if (state.e02) {
      Object.assign(this.e02, state.e02);
      if (this.e02.probeRedAttached && this.models.probeRedMesh) {
        this.models.probeRedMesh.position.set(-0.35, 0.44, 0.35);
      }
      if (this.e02.probeBlackAttached && this.models.probeBlackMesh) {
        this.models.probeBlackMesh.position.set(0.35, 0.44, 0.35);
      }
      if (this.e02.waveLocked && this.models.scopeScreen) {
        this.models.scopeScreen.material.color.setHex(0x10b981);
      }
    }
    if (state.breakerCoverOpen) {
      this.breakerCoverOpen = true;
      if (this.models.breakerCover) this.models.breakerCover.rotation.x = -Math.PI * 0.7;
    }
    if (state.breakerMasterOn) {
      this.breakerMasterOn = true;
      if (this.models.breakerLever) this.models.breakerLever.rotation.x = Math.PI / 4;
    }
    if (state.staticShockIncidents !== undefined) this.staticShockIncidents = state.staticShockIncidents;
    if (state.voltagePrecision !== undefined) this.voltagePrecision = state.voltagePrecision;
    this.updateInstructionBanner();
  }

  destroy() {
    if (this.onKeyDown) window.removeEventListener('keydown', this.onKeyDown);
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

window.ElectronicsWorkbench3D = ElectronicsWorkbench3D;
